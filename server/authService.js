// AuthService (CRC): registration, credential checks, login throttling, and logout.
import bcrypt from 'bcryptjs';
import { prisma, isUniqueViolation } from './prisma.js';
import { RequestError } from './http.js';
import { issueAccessToken, issueRefreshToken, revokeRefreshToken, rotateRefreshToken } from './tokenService.js';

const bcryptCost = 12;
const maxFailedAttempts = 5;
const failureWindowMs = 15 * 60 * 1000;
const lockDurationMs = 15 * 60 * 1000;
// Compared against when the email is unknown, so both paths spend the same bcrypt time.
const unknownUserHash = bcrypt.hashSync('unknown-user-placeholder', bcryptCost);

async function issueTokenPair(user) {
  const { token: refreshToken } = await issueRefreshToken(user.id);
  return { accessToken: issueAccessToken(user), refreshToken, user };
}

export async function register({ firstName, lastName, email, password }) {
  const passwordHash = await bcrypt.hash(password, bcryptCost);
  try {
    const user = await prisma.user.create({ data: { firstName, lastName, email, passwordHash, role: 'TEACHER' } });
    return issueTokenPair(user);
  } catch (error) {
    if (isUniqueViolation(error)) throw new RequestError(409, 'emailTaken', { fieldErrors: { email: 'emailTaken' } });
    throw error;
  }
}

function lockedResponse(lockedUntil) {
  const retryAfterSeconds = Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000));
  return new RequestError(423, 'accountLocked', { headers: { 'Retry-After': String(retryAfterSeconds) } });
}

// Counts a failed attempt inside the 15-minute window and locks the account at the fifth one.
async function recordFailedLogin(user, now) {
  const windowExpired = !user.lastFailedLoginAt || now - user.lastFailedLoginAt.getTime() > failureWindowMs;
  const lockExpired = user.lockedUntil && user.lockedUntil.getTime() <= now;
  const failedLoginAttempts = (windowExpired || lockExpired ? 0 : user.failedLoginAttempts) + 1;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts,
      lastFailedLoginAt: new Date(now),
      lockedUntil: failedLoginAttempts >= maxFailedAttempts ? new Date(now + lockDurationMs) : null
    }
  });
}

export async function login({ email, password }) {
  const now = Date.now();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await bcrypt.compare(password, unknownUserHash);
    throw new RequestError(401, 'wrongCredentials');
  }
  if (user.lockedUntil && user.lockedUntil.getTime() > now) throw lockedResponse(user.lockedUntil);

  if (!(await bcrypt.compare(password, user.passwordHash))) {
    await recordFailedLogin(user, now);
    throw new RequestError(401, 'wrongCredentials');
  }
  if (!user.isActive) throw new RequestError(403, 'accountDisabled');

  const signedInUser = await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lastFailedLoginAt: null, lockedUntil: null }
  });
  return issueTokenPair(signedInUser);
}

export async function refresh(refreshToken) {
  const { userId, token } = await rotateRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    await revokeRefreshToken(token);
    throw new RequestError(401, 'sessionExpired');
  }
  return { accessToken: issueAccessToken(user), refreshToken: token, user };
}

export async function logout(refreshToken) {
  await revokeRefreshToken(refreshToken);
}
