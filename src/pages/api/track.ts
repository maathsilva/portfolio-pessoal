import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';
import { hashIp, getClientIp, getCountry, getDevice } from '../../lib/analytics-server';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const path = typeof body.path === 'string' ? body.path.slice(0, 200) : '/';
    const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 300) || null : null;

    const ip = getClientIp(request);
    const ip_hash = hashIp(ip);
    const country = getCountry(request);
    const device = getDevice(request);

    const supabase = getSupabaseAdmin();
    await supabase.from('page_views').insert({ ip_hash, path, referrer, country, device });

    return new Response(null, { status: 204 });
  } catch {
    // Analytics must never break the site for a visitor.
    return new Response(null, { status: 204 });
  }
};
