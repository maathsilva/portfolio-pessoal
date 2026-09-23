import crypto from 'node:crypto';
import { env } from './env';

export const IGNORE_COOKIE = 'ignorar_visitas';

// ---------------------------------------------------------------- identity
export function hashIp(ip: string): string {
  const salt = env('IP_HASH_SALT');
  if (!salt) throw new Error('Missing IP_HASH_SALT');
  return crypto.createHmac('sha256', salt).update(ip).digest('hex');
}

export function getClientIp(request: Request): string {
  // Vercel overwrites x-forwarded-for with "client, proxy1, ...".
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

// ---------------------------------------------------------------- geo
const cap = (v: string | null | undefined, n = 80): string | null => {
  const s = (v ?? '').trim().slice(0, n);
  return s || null;
};

function decode(v: string | null): string | null {
  if (!v) return null;
  try {
    return cap(decodeURIComponent(v));
  } catch {
    return cap(v);
  }
}

// Vercel's edge adds these headers to every request — no external geo service.
export function getGeo(request: Request) {
  const h = request.headers;
  return {
    country: cap(h.get('x-vercel-ip-country'), 2),
    region: decode(h.get('x-vercel-ip-country-region')),
    city: decode(h.get('x-vercel-ip-city')),
    timezone: cap(h.get('x-vercel-ip-timezone'), 64),
  };
}

export function hourInTimezone(timezone: string | null): number | null {
  if (!timezone) return null;
  try {
    const h = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: timezone }).format(new Date());
    const n = Number(h);
    return Number.isInteger(n) && n >= 0 && n < 24 ? n : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- user agent
export function getDevice(ua: string): 'mobile' | 'desktop' {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop';
}

// Major families only (no versions): fewer buckets and less fingerprinting surface.
export function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = 'Outro';
  if (/LinkedInApp/i.test(ua)) browser = 'LinkedIn (app)';
  else if (/FBAN|FBAV/i.test(ua)) browser = 'Facebook (app)';
  else if (/Instagram/i.test(ua)) browser = 'Instagram (app)';
  else if (/EdgA?\/|Edge\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';

  let os = 'Outro';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  return { browser, os };
}

// ---------------------------------------------------------------- filtering
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|monitor|uptime|curl|wget|python|httpx|axios|node-fetch|go-http|java\/|scrapy|facebookexternalhit|whatsapp|telegram|discord|embedly/i;

export function isBot(request: Request): boolean {
  const ua = request.headers.get('user-agent') ?? '';
  return !ua || BOT_PATTERN.test(ua);
}

// Skip bots and the site owner's own browser (cookie set from the private panel).
export function shouldSkipTracking(request: Request, cookies: { has(name: string): boolean }): boolean {
  return cookies.has(IGNORE_COOKIE) || isBot(request);
}

// ---------------------------------------------------------------- rate limit
// Best-effort, per serverless instance: blunts floods without an extra DB round trip.
const buckets = new Map<string, { n: number; resetAt: number }>();

export function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { n: 1, resetAt: now + windowMs });
    return false;
  }
  b.n += 1;
  return b.n > limit;
}
