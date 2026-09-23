import crypto from 'node:crypto';

export function hashIp(ip: string): string {
  const salt = import.meta.env.IP_HASH_SALT;
  if (!salt) throw new Error('Missing IP_HASH_SALT');
  return crypto.createHmac('sha256', salt).update(ip).digest('hex');
}

export function getClientIp(request: Request): string {
  // Vercel sets x-forwarded-for as "client, proxy1, proxy2, ...".
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export function getCountry(request: Request): string | null {
  // Vercel's Edge Network adds this header to every request, no external
  // geolocation service needed.
  return request.headers.get('x-vercel-ip-country');
}

export function getDevice(request: Request): 'mobile' | 'desktop' {
  const ua = request.headers.get('user-agent') ?? '';
  return /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
}

export const IGNORE_COOKIE = 'ignorar_visitas';

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
