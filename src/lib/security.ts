import crypto from 'node:crypto';

// Constant-time string comparison (hashing first makes lengths equal).
export function constantTimeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}
