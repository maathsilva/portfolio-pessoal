import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';
import { hashIp, getClientIp, shouldSkipTracking } from '../../lib/analytics-server';

export const prerender = false;

const ALLOWED_CTAS = new Set(['curriculo', 'whatsapp', 'github', 'linkedin', 'email']);

export const POST: APIRoute = async ({ request, cookies }) => {
  if (shouldSkipTracking(request, cookies)) return new Response(null, { status: 204 });
  try {
    const body = await request.json();
    const cta = typeof body.cta === 'string' ? body.cta : '';
    if (!ALLOWED_CTAS.has(cta)) {
      return new Response(null, { status: 204 });
    }

    const ip_hash = hashIp(getClientIp(request));
    const supabase = getSupabaseAdmin();
    await supabase.from('cta_clicks').insert({ ip_hash, cta });

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
};
