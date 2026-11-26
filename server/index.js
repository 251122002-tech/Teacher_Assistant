import { createServer } from 'node:http';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { openDatabase } from './database.js';
import { validateLessonRequest, validateRegistration, validateSignIn, validateSubject } from '../shared/validation.js';
import { buildLessonModules } from '../shared/lessonTemplates.js';

const scryptAsync = promisify(scrypt);
const sessionCookieName = 'ta_session';
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const maxBodyBytes = 10_000;

// `code` is a stable error code; the frontend shows it as text in the chosen language.
class RequestError extends Error {
  constructor(status, code, fieldErrors = undefined) {
    super(code);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [saltHex, keyHex] = storedHash.split(':');
  const storedKey = Buffer.from(keyHex, 'hex');
  const derivedKey = await scryptAsync(password, Buffer.from(saltHex, 'hex'), storedKey.length);
  return timingSafeEqual(storedKey, derivedKey);
}

function toPublicUser(userRow) {
  return {
    id: userRow.UserID,
    firstName: userRow.FName,
    lastName: userRow.LName,
    email: userRow.Email,
    subject: userRow.Subject
  };
}

function readCookie(request, name) {
  const cookieHeader = request.headers.cookie ?? '';
  for (const cookiePart of cookieHeader.split(';')) {
    const [cookieName, ...valueParts] = cookiePart.trim().split('=');
    if (cookieName === name) return valueParts.join('=');
  }
  return '';
}

function sessionCookie(token, maxAgeSeconds) {
  return `${sessionCookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}

async function readJsonBody(request) {
  if (!(request.headers['content-type'] ?? '').startsWith('application/json')) {
    throw new RequestError(415, 'jsonRequired');
  }
  let rawBody = '';
  for await (const chunk of request) {
    rawBody += chunk;
    if (rawBody.length > maxBodyBytes) throw new RequestError(413, 'requestTooLarge');
  }
  try {
    const parsedBody = JSON.parse(rawBody || '{}');
    if (parsedBody === null || typeof parsedBody !== 'object') throw new Error('Not an object');
    return parsedBody;
  } catch {
    throw new RequestError(400, 'invalidJson');
  }
}

function sendJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders });
  response.end(JSON.stringify(payload));
}

export function createApiServer(database) {
  function startSession(userId) {
    const token = randomBytes(32).toString('hex');
    database.createSession(token, userId, Date.now() + sessionLifetimeMs);
    return sessionCookie(token, sessionLifetimeMs / 1000);
  }

  function requireUser(request) {
    const token = readCookie(request, sessionCookieName);
    const session = token ? database.findSession(token) : undefined;
    if (!session || session.ExpiresAt <= Date.now()) {
      if (session) database.deleteSession(token);
      throw new RequestError(401, 'signInRequired');
    }
    const userRow = database.findUserById(session.UserID);
    if (!userRow) throw new RequestError(401, 'signInRequired');
    return userRow;
  }

  const routes = {
    'POST /api/register': async (request, response) => {
      const { values: registration, fieldErrors } = validateRegistration(await readJsonBody(request));
      if (Object.keys(fieldErrors).length > 0) throw new RequestError(400, 'checkFields', fieldErrors);
      if (database.findUserByEmail(registration.email)) {
        throw new RequestError(409, 'emailTaken', { email: 'emailTaken' });
      }
      // The subject is chosen later in the lesson planner, so new accounts start without one.
      const userRow = database.createUser({
        ...registration,
        subject: '',
        passwordHash: await hashPassword(registration.password)
      });
      sendJson(response, 201, { user: toPublicUser(userRow) }, { 'Set-Cookie': startSession(userRow.UserID) });
    },

    'POST /api/login': async (request, response) => {
      const { values: { email, password }, fieldErrors } = validateSignIn(await readJsonBody(request));
      if (Object.keys(fieldErrors).length > 0) throw new RequestError(400, 'checkFields', fieldErrors);

      const userRow = database.findUserByEmail(email);
      if (!userRow || !(await verifyPassword(password, userRow.PasswordHash))) {
        throw new RequestError(401, 'wrongCredentials');
      }
      sendJson(response, 200, { user: toPublicUser(userRow) }, { 'Set-Cookie': startSession(userRow.UserID) });
    },

    'POST /api/logout': async (request, response) => {
      const token = readCookie(request, sessionCookieName);
      if (token) database.deleteSession(token);
      sendJson(response, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
    },

    'GET /api/me': async (request, response) => {
      sendJson(response, 200, { user: toPublicUser(requireUser(request)) });
    },

    'PUT /api/me/subject': async (request, response) => {
      const userRow = requireUser(request);
      const body = await readJsonBody(request);
      const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
      const subjectError = validateSubject(subject);
      if (subjectError) throw new RequestError(400, subjectError, { subject: subjectError });
      database.updateSubject(userRow.UserID, subject);
      sendJson(response, 200, { user: toPublicUser(database.findUserById(userRow.UserID)) });
    },

    // Builds the plan in the requested language and remembers the subject on the account.
    'POST /api/lesson-plans/generate': async (request, response) => {
      const userRow = requireUser(request);
      const { values, fieldErrors } = validateLessonRequest(await readJsonBody(request));
      if (Object.keys(fieldErrors).length > 0) throw new RequestError(400, 'checkFields', fieldErrors);
      if (values.subject !== userRow.Subject) database.updateSubject(userRow.UserID, values.subject);
      sendJson(response, 200, {
        modules: buildLessonModules(values),
        user: toPublicUser(database.findUserById(userRow.UserID))
      });
    }
  };

  return createServer(async (request, response) => {
    const route = routes[`${request.method} ${new URL(request.url, 'http://localhost').pathname}`];
    try {
      if (!route) throw new RequestError(404, 'notFound');
      await route(request, response);
    } catch (error) {
      if (error instanceof RequestError) {
        sendJson(response, error.status, { error: error.message, fieldErrors: error.fieldErrors });
      } else {
        console.error(error);
        sendJson(response, 500, { error: 'serverError' });
      }
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const database = openDatabase();
  database.deleteExpiredSessions(Date.now());
  const port = Number(process.env.API_PORT ?? 3001);
  createApiServer(database).listen(port, '127.0.0.1', () => {
    console.log(`Teacher Assistant API listening on http://127.0.0.1:${port}`);
  });
}
