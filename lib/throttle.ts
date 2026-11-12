/**
 * Best-effort login throttle (in-memory). On Vercel each serverless instance has its own memory,
 * so this slows down guessing but is not a hard guarantee. See README "Security notes".
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 8;
const WINDOW_MS = 15 * 60 * 1000;

export function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) return false;
  return entry.count >= LIMIT;
}

export function recordFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(key: string) {
  attempts.delete(key);
}
