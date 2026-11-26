// HTTP helpers shared by every route: JSON bodies, JSON responses, cookies, and typed errors.
const maxBodyBytes = 10_000;

// `code` is a stable error code; the frontend shows it as text in the chosen language.
export class RequestError extends Error {
  constructor(status, code, { fieldErrors, headers } = {}) {
    super(code);
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.headers = headers;
  }
}

export async function readJsonBody(request) {
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

export function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
  response.end(JSON.stringify(payload));
}

export function sendEmpty(response, status, headers = {}) {
  response.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  response.end();
}

export function readCookie(request, name) {
  const cookieHeader = request.headers.cookie ?? '';
  for (const cookiePart of cookieHeader.split(';')) {
    const [cookieName, ...valueParts] = cookiePart.trim().split('=');
    if (cookieName === name) return valueParts.join('=');
  }
  return '';
}

export function serializeCookie(name, value, { maxAgeSeconds, path, secure }) {
  const attributes = [`${name}=${value}`, 'HttpOnly', 'SameSite=Strict', `Path=${path}`, `Max-Age=${maxAgeSeconds}`];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

export function readBearerToken(request) {
  const [scheme, token] = (request.headers.authorization ?? '').split(' ');
  return scheme === 'Bearer' && token ? token : '';
}

export function clientAddress(request) {
  return request.socket.remoteAddress ?? 'unknown';
}
