// TokenService (CRC): issues and verifies 15-minute access JWTs and rotates 7-day refresh tokens.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { prisma } from './prisma.js';
import { RequestError } from './http.js';

export const accessTokenLifetimeSeconds = 15 * 60;
export const refreshTokenLifetimeSeconds = 7 * 24 * 60 * 60;

const jwtHeader = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function jwtSecret() {
  const secret = process.env.JWT_SECRET ?? '';
  if (secret.length < 32) throw new Error('JWT_SECRET must be set to at least 32 characters.');
  return secret;
}

function sign(unsignedToken) {
  return createHmac('sha256', jwtSecret()).update(unsignedToken).digest('base64url');
}

function hashRefreshToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function assertTokenConfiguration() {
  jwtSecret();
}

export function issueAccessToken(user, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);
  const payload = base64Url(JSON.stringify({
    sub: user.id,
    role: user.role,
    iat: issuedAt,
    exp: issuedAt + accessTokenLifetimeSeconds
  }));
  const unsignedToken = `${jwtHeader}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken)}`;
}

// Returns { userId, role } or throws 401. Only HS256 tokens signed with our secret are accepted.
export function verifyAccessToken(token, now = Date.now()) {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature || header !== jwtHeader) throw new RequestError(401, 'signInRequired');

  const expectedSignature = Buffer.from(sign(`${header}.${payload}`));
  const givenSignature = Buffer.from(signature);
  if (expectedSignature.length !== givenSignature.length || !timingSafeEqual(expectedSignature, givenSignature)) {
    throw new RequestError(401, 'signInRequired');
  }

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw new RequestError(401, 'signInRequired');
  }
  if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number' || claims.exp * 1000 <= now) {
    throw new RequestError(401, 'tokenExpired');
  }
  return { userId: claims.sub, role: claims.role };
}

export async function issueRefreshToken(userId, database = prisma) {
  const token = randomBytes(32).toString('base64url');
  const record = await database.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(token),
      expiresAt: new Date(Date.now() + refreshTokenLifetimeSeconds * 1000)
    }
  });
  return { token, record };
}

// Exchanges a valid refresh token for a new one. Reusing an already-rotated token revokes the
// whole family for that user, because it means the token was copied.
export async function rotateRefreshToken(token) {
  const now = new Date();
  const existing = token
    ? await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(token) } })
    : null;
  if (!existing || existing.expiresAt <= now) throw new RequestError(401, 'sessionExpired');
  if (existing.revokedAt) {
    await revokeAllRefreshTokens(existing.userId);
    throw new RequestError(401, 'sessionExpired');
  }

  return prisma.$transaction(async (transaction) => {
    const { token: nextToken, record } = await issueRefreshToken(existing.userId, transaction);
    // The conditional update fails if a parallel request already rotated this token.
    const { count } = await transaction.refreshToken.updateMany({
      where: { id: existing.id, revokedAt: null },
      data: { revokedAt: now, replacedById: record.id }
    });
    if (count !== 1) throw new RequestError(401, 'sessionExpired');
    return { userId: existing.userId, token: nextToken };
  });
}

export async function revokeRefreshToken(token) {
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(token), revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export async function revokeAllRefreshTokens(userId) {
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}
