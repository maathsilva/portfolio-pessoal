import crypto from 'node:crypto';
import { env } from './env';
import { getSupabaseAdmin } from './supabase';

export const PANEL_COOKIE = 'painel_auth';

const MAX_FAILURES_PER_IP = 5;
const MAX_FAILURES_GLOBAL = 30;
const LOCKOUT_MINUTES = 15;

function hmac(value: string): Buffer {
  const salt = env('IP_HASH_SALT');
  if (!salt) throw new Error('Missing IP_HASH_SALT');
  return crypto.createHmac('sha256', salt).update(value).digest();
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isValidToken(candidate: string | undefined): boolean {
  const expected = env('DASHBOARD_TOKEN');
  if (!expected || !candidate) return false;
  return safeEqual(hmac(`token:${candidate}`), hmac(`token:${expected}`));
}

export function isValidPassword(candidate: string): boolean {
  const expected = env('DASHBOARD_PASSWORD');
  if (!expected) return false;
  return safeEqual(hmac(`pw:${candidate}`), hmac(`pw:${expected}`));
}

// The cookie stores a derived value, never the password itself. Changing the
// password (or the salt) invalidates every existing session.
export function sessionCookieValue(): string {
  return hmac(`session:${env('DASHBOARD_PASSWORD') ?? ''}`).toString('hex');
}

export function hasValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  return safeEqual(Buffer.from(cookieValue), Buffer.from(sessionCookieValue()));
}

// ------------------------------------------------------ brute-force protection
// Throws if the database cannot be reached: the caller fails closed.
export async function loginLockedOut(ipHash: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60_000).toISOString();
  const [mine, all] = await Promise.all([
    sb.from('panel_login_attempts').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since),
    sb.from('panel_login_attempts').select('id', { count: 'exact', head: true }).gte('created_at', since),
  ]);
  if (mine.error || all.error) throw new Error('login attempt lookup failed');
  return (mine.count ?? 0) >= MAX_FAILURES_PER_IP || (all.count ?? 0) >= MAX_FAILURES_GLOBAL;
}

export async function recordFailedLogin(ipHash: string): Promise<void> {
  await getSupabaseAdmin().from('panel_login_attempts').insert({ ip_hash: ipHash });
}

export const LOCKOUT_MESSAGE = `Muitas tentativas. Tente novamente em ${LOCKOUT_MINUTES} minutos.`;
