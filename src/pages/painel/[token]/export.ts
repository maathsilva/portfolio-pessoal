import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { PANEL_COOKIE, hasValidSession, isValidToken } from '../../../lib/panel-auth';
import { parsePeriod } from '../../../lib/analytics-queries';

export const prerender = false;

// The hashed IP is deliberately not exported.
const DATASETS = {
  visitas: {
    table: 'page_views',
    columns: [
      'created_at', 'path', 'referrer', 'country', 'region', 'city',
      'timezone', 'local_hour', 'language', 'device', 'browser', 'os', 'viewport_w', 'seconds', 'max_scroll', 'lcp_ms', 'cls', 'inp_ms',
    ],
  },
  eventos: { table: 'events', columns: ['created_at', 'name', 'path'] },
} as const;

const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request
const MAX_ROWS = 20000;

// Values such as path come from visitors: neutralise spreadsheet formulas (CSV injection).
function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET: APIRoute = async ({ params, cookies, url }) => {
  if (!isValidToken(params.token) || !hasValidSession(cookies.get(PANEL_COOKIE)?.value)) {
    return new Response('Not found', { status: 404 });
  }

  const kind = url.searchParams.get('tipo') === 'eventos' ? 'eventos' : 'visitas';
  const days = parsePeriod(url.searchParams.get('p'));
  const { table, columns } = DATASETS[kind];
  const sb = getSupabaseAdmin();

  const start = await sb.rpc('period_start', { p_days: days });
  if (start.error || !start.data) return new Response('Erro ao consultar o banco de dados.', { status: 500 });

  const rows: Record<string, unknown>[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await sb
      .from(table)
      .select(columns.join(','))
      .gte('created_at', start.data as string)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return new Response('Erro ao consultar o banco de dados.', { status: 500 });
    const batch = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  const lines = [columns.join(','), ...rows.map((r) => columns.map((c) => cell(r[c])).join(','))];
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response('﻿' + lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${kind}-${days}d-${stamp}.csv"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
};
