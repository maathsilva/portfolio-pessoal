import type { APIRoute } from 'astro';
import { handleEvent } from '../../lib/analytics-ingest';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  await handleEvent(request, cookies);
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
};
