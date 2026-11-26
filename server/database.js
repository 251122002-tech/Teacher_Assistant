import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const defaultDatabasePath = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'teacher-assistant.db');

// Tables follow the project ERD (tblUser, tblDate, tblClass). Email and PasswordHash are added to
// tblUser so a teacher can sign in, and tblSession keeps sign-ins valid across server restarts.
const schema = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS tblUser (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    FName TEXT NOT NULL,
    LName TEXT NOT NULL,
    Email TEXT NOT NULL UNIQUE,
    PasswordHash TEXT NOT NULL,
    Subject TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tblDate (
    UserID INTEGER PRIMARY KEY REFERENCES tblUser(UserID) ON DELETE CASCADE,
    Year INTEGER NOT NULL,
    Month INTEGER NOT NULL,
    Day INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tblClass (
    UserID INTEGER PRIMARY KEY REFERENCES tblUser(UserID) ON DELETE CASCADE,
    ClassID INTEGER NOT NULL,
    ClassName TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tblSession (
    Token TEXT PRIMARY KEY,
    UserID INTEGER NOT NULL REFERENCES tblUser(UserID) ON DELETE CASCADE,
    ExpiresAt INTEGER NOT NULL
  );
`;

export function openDatabase(databasePath = process.env.DATABASE_PATH ?? defaultDatabasePath) {
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec(schema);

  const statements = {
    insertUser: database.prepare(
      'INSERT INTO tblUser (FName, LName, Email, PasswordHash, Subject) VALUES (?, ?, ?, ?, ?)'
    ),
    insertJoinDate: database.prepare('INSERT INTO tblDate (UserID, Year, Month, Day) VALUES (?, ?, ?, ?)'),
    findUserByEmail: database.prepare('SELECT * FROM tblUser WHERE Email = ?'),
    findUserById: database.prepare('SELECT * FROM tblUser WHERE UserID = ?'),
    updateSubject: database.prepare('UPDATE tblUser SET Subject = ? WHERE UserID = ?'),
    insertSession: database.prepare('INSERT INTO tblSession (Token, UserID, ExpiresAt) VALUES (?, ?, ?)'),
    findSession: database.prepare('SELECT UserID, ExpiresAt FROM tblSession WHERE Token = ?'),
    deleteSession: database.prepare('DELETE FROM tblSession WHERE Token = ?'),
    deleteExpiredSessions: database.prepare('DELETE FROM tblSession WHERE ExpiresAt <= ?')
  };

  return {
    createUser({ firstName, lastName, email, passwordHash, subject }, joinedAt = new Date()) {
      database.exec('BEGIN');
      try {
        const { lastInsertRowid } = statements.insertUser.run(firstName, lastName, email, passwordHash, subject);
        const userId = Number(lastInsertRowid);
        statements.insertJoinDate.run(userId, joinedAt.getFullYear(), joinedAt.getMonth() + 1, joinedAt.getDate());
        database.exec('COMMIT');
        return statements.findUserById.get(userId);
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
    findUserByEmail: (email) => statements.findUserByEmail.get(email),
    findUserById: (userId) => statements.findUserById.get(userId),
    updateSubject: (userId, subject) => statements.updateSubject.run(subject, userId),
    createSession: (token, userId, expiresAt) => statements.insertSession.run(token, userId, expiresAt),
    findSession: (token) => statements.findSession.get(token),
    deleteSession: (token) => statements.deleteSession.run(token),
    deleteExpiredSessions: (now) => statements.deleteExpiredSessions.run(now),
    close: () => database.close()
  };
}
