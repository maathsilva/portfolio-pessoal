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
