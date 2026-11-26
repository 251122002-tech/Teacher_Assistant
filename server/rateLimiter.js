// Fixed one-minute window per client address (NFR-S5: at most 100 requests per minute on /api/auth/*).
// Kept in memory, so limits reset when the server restarts and are not shared between processes.
export function createRateLimiter({ limit, windowMs }) {
  const windows = new Map();

  return function consume(clientKey, now = Date.now()) {
    const current = windows.get(clientKey);
    if (!current || now >= current.resetAt) {
      windows.set(clientKey, { count: 1, resetAt: now + windowMs });
      if (windows.size > 10_000) {
        for (const [key, window] of windows) if (now >= window.resetAt) windows.delete(key);
      }
      return { allowed: true };
    }
    current.count += 1;
    return current.count <= limit
      ? { allowed: true }
      : { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  };
}
