import type { APIRoute } from 'astro';
import { env } from '../../../lib/env';
import { constantTimeEqual } from '../../../lib/security';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { digestEmail, sendEmail, type WeeklyDigest } from '../../../lib/notify';

export const prerender = false;

const RETENTION_MONTHS = 12;

// Runs once a day (see vercel.json). Vercel authenticates cron calls with
// `Authorization: Bearer $CRON_SECRET`; without the secret configured, the
// endpoint stays closed.
export const GET: APIRoute = async ({ request, url }) => {
  const secret = env('CRON_SECRET');
  const auth = request.headers.get('authorization') ?? '';
  if (!secret || !constantTimeEqual(auth, `Bearer ${secret}`)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sb = getSupabaseAdmin();
  const result: Record<string, unknown> = {};
  let failed = false;

  const purge = await sb.rpc('purge_old_data', { p_months: RETENTION_MONTHS });
  if (purge.error) {
    failed = true;
    result.purge = { error: purge.error.message };
  } else {
    result.purge = purge.data;
  }

  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date());
  if (weekday === 'Mon' || url.searchParams.get('digest') === '1') {
    const digest = await sb.rpc('stats_weekly_digest');
    if (digest.error) {
      failed = true;
      result.digest = { error: digest.error.message };
    } else {
      result.digest = (await sendEmail(digestEmail(digest.data as WeeklyDigest))) ? 'sent' : 'skipped (email not configured)';
    }
  }

  return Response.json({ ok: !failed, ...result }, { status: failed ? 500 : 200, headers: { 'Cache-Control': 'no-store' } });
};
