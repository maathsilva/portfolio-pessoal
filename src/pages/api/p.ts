import type { APIRoute } from 'astro';
import { handlePulse } from '../../lib/analytics-ingest';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  await handlePulse(request, cookies);
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
};
