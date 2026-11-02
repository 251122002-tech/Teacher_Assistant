PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tblUser (
    UserID INTEGER PRIMARY KEY,
    FName TEXT NOT NULL,
    LName TEXT NOT NULL,
    Subject TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tblDate (
    UserID INTEGER PRIMARY KEY,
    Year INTEGER NOT NULL,
    Month INTEGER NOT NULL,
    Day INTEGER NOT NULL,
    FOREIGN KEY (UserID) REFERENCES tblUser (UserID)
);

CREATE TABLE IF NOT EXISTS tblClass (
    UserID INTEGER PRIMARY KEY,
    ClassID INTEGER NOT NULL,
    ClassName TEXT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES tblUser (UserID)
);

BEGIN TRANSACTION;

INSERT OR IGNORE INTO tblUser (UserID, FName, LName, Subject) VALUES
    (1, 'Ainur', 'Abisheva', 'Mathematics'),
    (2, 'Dias', 'Saparov', 'Physics'),
    (3, 'Aigerim', 'Nurgaliyeva', 'Kazakh Language'),
    (4, 'Nursultan', 'Beketov', 'History'),
    (5, 'Madina', 'Orazbayeva', 'Biology'),
    (6, 'Arman', 'Zhaksylykov', 'Informatics'),
    (7, 'Dana', 'Tolegen', 'English'),
    (8, 'Yerlan', 'Iskakov', 'Geography'),
    (9, 'Zhanar', 'Omarova', 'Chemistry'),
    (10, 'Alibek', 'Kasymov', 'Primary Education');

INSERT OR IGNORE INTO tblDate (UserID, Year, Month, Day) VALUES
    (1, 2026, 9, 1),
    (2, 2026, 9, 2),
    (3, 2026, 9, 3),
    (4, 2026, 9, 4),
    (5, 2026, 9, 5),
    (6, 2026, 9, 6),
    (7, 2026, 9, 7),
    (8, 2026, 9, 8),
    (9, 2026, 9, 9),
    (10, 2026, 9, 10);

INSERT OR IGNORE INTO tblClass (UserID, ClassID, ClassName) VALUES
    (1, 101, '5A'),
    (2, 102, '6B'),
    (3, 103, '7A'),
    (4, 104, '8B'),
    (5, 105, '9A'),
    (6, 106, '10B'),
    (7, 107, '5B'),
    (8, 108, '6A'),
    (9, 109, '7B'),
    (10, 110, '4A');

COMMIT;
