import crypto from 'node:crypto';

export const PANEL_COOKIE = 'painel_auth';

function hmac(value: string): Buffer {
  const salt = import.meta.env.IP_HASH_SALT;
  if (!salt) throw new Error('Missing IP_HASH_SALT');
  return crypto.createHmac('sha256', salt).update(value).digest();
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isValidToken(candidate: string | undefined): boolean {
  const expected = import.meta.env.DASHBOARD_TOKEN;
  if (!expected || !candidate) return false;
  return safeEqual(hmac(`token:${candidate}`), hmac(`token:${expected}`));
}

export function isValidPassword(candidate: string): boolean {
  const expected = import.meta.env.DASHBOARD_PASSWORD;
  if (!expected) return false;
  return safeEqual(hmac(`pw:${candidate}`), hmac(`pw:${expected}`));
}

// The cookie stores a derived value, never the password itself.
export function sessionCookieValue(): string {
  const expected = import.meta.env.DASHBOARD_PASSWORD ?? '';
  return hmac(`session:${expected}`).toString('hex');
}

export function hasValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  return safeEqual(Buffer.from(cookieValue), Buffer.from(sessionCookieValue()));
}
