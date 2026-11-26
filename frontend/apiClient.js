// ApiClient (CRC): HTTP transport to /api/*. Keeps the access token in memory only; the refresh
// token lives in an HttpOnly cookie the page cannot read.
let accessToken = '';
let refreshInFlight = null;
let handleSessionExpired = () => {};

export function onSessionExpired(handler) {
  handleSessionExpired = handler;
}

function apiError(code, status, fieldErrors = {}) {
  return Object.assign(new Error(code), { code, status, fieldErrors });
}

async function send(path, { method = 'GET', body, withAuth = true } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (withAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw apiError('cannotReachServer', 0);
  }
  if (response.status === 204) return {};
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw apiError(payload.error ?? 'unknown', response.status, payload.fieldErrors);
  return payload;
}

function storeSession(payload) {
  accessToken = payload.accessToken ?? '';
  return payload;
}

// Several requests may hit 401 at once; they all wait for one refresh so the rotated
// refresh token is used exactly once.
export function refreshSession() {
  refreshInFlight ??= send('/api/auth/refresh', { method: 'POST', withAuth: false })
    .then(storeSession)
    .catch((error) => {
      accessToken = '';
      throw error;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

// Authenticated request. On 401 it refreshes once and retries; if that fails, the session is over.
export async function apiRequest(path, options = {}) {
  try {
    return await send(path, options);
  } catch (error) {
    if (error.status !== 401) throw error;
  }
  try {
    await refreshSession();
  } catch (refreshError) {
    if (refreshError.status === 401) {
      handleSessionExpired();
      throw apiError('sessionExpired', 401);
    }
    throw refreshError;
  }
  return send(path, options);
}

export async function register(values) {
  return storeSession(await send('/api/auth/register', { method: 'POST', body: values, withAuth: false }));
}

export async function signIn(values) {
  return storeSession(await send('/api/auth/login', { method: 'POST', body: values, withAuth: false }));
}

export async function signOut() {
  try {
    await send('/api/auth/logout', { method: 'POST', withAuth: false });
  } finally {
    accessToken = '';
  }
}
