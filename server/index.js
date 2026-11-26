// API gateway: routes, AuthMiddleware, and the auth rate limit. Business rules live in the services.
import { createServer } from 'node:http';
import {
  RequestError,
  clientAddress,
  readBearerToken,
  readCookie,
  readJsonBody,
  sendEmpty,
  sendJson,
  serializeCookie
} from './http.js';
import { prisma } from './prisma.js';
import { createRateLimiter } from './rateLimiter.js';
import { assertTokenConfiguration, accessTokenLifetimeSeconds, refreshTokenLifetimeSeconds, verifyAccessToken } from './tokenService.js';
import * as authService from './authService.js';
import { assignSubject, currentSubject, listCurriculumSubjects, resolveSubject, toPublicSubject } from './subjectService.js';
import { validateLessonRequest, validateRegistration, validateSignIn, validateSubjectInput } from '../shared/validation.js';
import { buildLessonModules } from '../shared/lessonTemplates.js';

const refreshCookieName = 'ta_refresh';
// The refresh token is only sent to the auth routes and never readable by page scripts.
const refreshCookiePath = '/api/auth';
const secureCookies = process.env.COOKIE_SECURE === 'true';
const authRateLimit = createRateLimiter({ limit: 100, windowMs: 60 * 1000 });

function refreshCookie(token, maxAgeSeconds) {
  return serializeCookie(refreshCookieName, token, { maxAgeSeconds, path: refreshCookiePath, secure: secureCookies });
}

async function toPublicUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    subject: toPublicSubject(await currentSubject(user.id))
  };
}

// The refresh token travels only in the HttpOnly cookie; the access token goes to page memory.
async function sendSession(response, status, { accessToken, refreshToken, user }) {
  sendJson(
    response,
    status,
    { accessToken, accessTokenExpiresIn: accessTokenLifetimeSeconds, user: await toPublicUser(user) },
    { 'Set-Cookie': refreshCookie(refreshToken, refreshTokenLifetimeSeconds) }
  );
}

function throwOnFieldErrors(fieldErrors) {
  if (Object.keys(fieldErrors).length > 0) throw new RequestError(400, 'checkFields', { fieldErrors });
}

// AuthMiddleware (CRC): verify the Bearer access token and load the active user.
async function requireUser(request) {
  const token = readBearerToken(request);
  if (!token) throw new RequestError(401, 'signInRequired');
  const { userId } = verifyAccessToken(token);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new RequestError(401, 'signInRequired');
  if (!user.isActive) throw new RequestError(403, 'accountDisabled');
  return user;
}

const routes = {
  'POST /api/auth/register': async (request, response) => {
    const { values, fieldErrors } = validateRegistration(await readJsonBody(request));
    throwOnFieldErrors(fieldErrors);
    await sendSession(response, 201, await authService.register(values));
  },

  'POST /api/auth/login': async (request, response) => {
    const { values, fieldErrors } = validateSignIn(await readJsonBody(request));
    throwOnFieldErrors(fieldErrors);
    await sendSession(response, 200, await authService.login(values));
  },

  'POST /api/auth/refresh': async (request, response) => {
    try {
      await sendSession(response, 200, await authService.refresh(readCookie(request, refreshCookieName)));
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) {
        error.headers = { 'Set-Cookie': refreshCookie('', 0) };
      }
      throw error;
    }
  },

  'POST /api/auth/logout': async (request, response) => {
    await authService.logout(readCookie(request, refreshCookieName));
    sendEmpty(response, 204, { 'Set-Cookie': refreshCookie('', 0) });
  },

  'GET /api/me': async (request, response) => {
    sendJson(response, 200, { user: await toPublicUser(await requireUser(request)) });
  },

  'GET /api/subjects': async (request, response) => {
    await requireUser(request);
    sendJson(response, 200, { subjects: await listCurriculumSubjects() });
  },

  'PUT /api/me/subject': async (request, response) => {
    const user = await requireUser(request);
    const { value, error } = validateSubjectInput((await readJsonBody(request)).subject);
    if (error) throw new RequestError(400, 'checkFields', { fieldErrors: { subject: error } });
    const subject = await resolveSubject(value);
    await assignSubject(user.id, subject.id);
    sendJson(response, 200, { user: await toPublicUser(user) });
  },

  // Builds the plan in the requested language and remembers the subject for the teacher.
  'POST /api/lesson-plans/generate': async (request, response) => {
    const user = await requireUser(request);
    const { values, fieldErrors } = validateLessonRequest(await readJsonBody(request));
    throwOnFieldErrors(fieldErrors);
    const subject = await resolveSubject(values.subject);
    await assignSubject(user.id, subject.id);
    sendJson(response, 200, {
      modules: buildLessonModules({ ...values, subject }),
      subject: toPublicSubject(subject),
      user: await toPublicUser(user)
    });
  }
};

export function createApiServer() {
  return createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const route = routes[`${request.method} ${pathname}`];
    try {
      if (pathname.startsWith('/api/auth/')) {
        const { allowed, retryAfterSeconds } = authRateLimit(clientAddress(request));
        if (!allowed) throw new RequestError(429, 'tooManyRequests', { headers: { 'Retry-After': String(retryAfterSeconds) } });
      }
      if (!route) throw new RequestError(404, 'notFound');
      await route(request, response);
    } catch (error) {
      if (error instanceof RequestError) {
        sendJson(response, error.status, { error: error.message, fieldErrors: error.fieldErrors }, error.headers);
      } else {
        console.error(error);
        sendJson(response, 500, { error: 'serverError' });
      }
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set. Copy .env.example to .env first.');
  assertTokenConfiguration();
  await prisma.$connect();
  const port = Number(process.env.API_PORT ?? 3001);
  createApiServer().listen(port, '127.0.0.1', () => {
    console.log(`Teacher Assistant API listening on http://127.0.0.1:${port}`);
  });
}
