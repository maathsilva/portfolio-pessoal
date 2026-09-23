import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabase';

export type Period = 1 | 7 | 30 | 90;
export const PERIODS: { value: Period; label: string }[] = [
  { value: 1, label: 'Hoje' },
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
];
export const parsePeriod = (v: string | null): Period => {
  const n = Number(v);
  return (PERIODS.some((p) => p.value === n) ? n : 30) as Period;
};

export interface Overview {
  unique_visitors: number;
  pageviews: number;
  new_visitors: number;
  returning_visitors: number;
  contact_clicks: number;
  avg_seconds: number | null;
  deep_scroll_pct: number | null;
  pages_per_session: number | null;
  last_view_at: string | null;
  unique_all_time: number;
}
export interface SeriesPoint {
  bucket: string;
  pageviews: number;
  unique_visitors: number;
}
export interface Ranked {
  label: string;
  hits: number;
  visitors: number;
}
export interface ProjectRow {
  slug: string;
  clicks: number;
  click_visitors: number;
  page_views: number;
  avg_seconds: number | null;
}
export interface EngagementRow {
  path: string;
  views: number;
  avg_seconds: number | null;
  avg_scroll: number | null;
  deep_pct: number | null;
}
export interface Vitals {
  samples: number;
  lcp_p75: number | null;
  cls_p75: number | null;
  inp_p75: number | null;
}
export interface RecentVisit {
  created_at: string;
  path: string;
  ref: string | null;
  referrer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
}

export const TOP_DIMENSIONS = ['path', 'referrer', 'city', 'country', 'device', 'browser', 'os', 'language', 'local_hour'] as const;
export type TopDimension = (typeof TOP_DIMENSIONS)[number];
export const CONTACT_EVENTS = ['curriculo', 'whatsapp', 'email', 'github', 'linkedin'];

export interface DashboardData {
  overview: Overview | null;
  series: SeriesPoint[];
  tops: Record<TopDimension, Ranked[]>;
  contacts: Ranked[];
  projects: ProjectRow[];
  sectionVisitors: number;
  engagement: EngagementRow[];
  vitals: Vitals | null;
  recent: RecentVisit[];
  /** Human-readable problems; the panel still renders whatever did load. */
  errors: string[];
  /** True when nothing at all could be read (e.g. the Supabase project is paused). */
  databaseDown: boolean;
}

const n = (v: unknown): number => Number(v ?? 0);
const nn = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

async function call<T>(sb: SupabaseClient, errors: string[], label: string, fn: string, args: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await sb.rpc(fn, args);
  if (error) {
    errors.push(`${label}: ${error.message}`);
    return null;
  }
  return data as T;
}

const rankedRows = (rows: any[] | null): Ranked[] =>
  (rows ?? []).map((r) => ({ label: String(r.label), hits: n(r.hits), visitors: n(r.visitors) }));

export async function getDashboardData(days: Period): Promise<DashboardData> {
  const sb = getSupabaseAdmin();
  const errors: string[] = [];
  const p_days = days;

  const [overview, series, contacts, projects, section, engagement, vitals, recent, ...tops] = await Promise.all([
    call<any[]>(sb, errors, 'Resumo', 'stats_overview', { p_days }),
    call<any[]>(sb, errors, 'Gráfico', 'stats_series', { p_days }),
    call<any[]>(sb, errors, 'Contatos', 'stats_events', { p_days, p_names: CONTACT_EVENTS }),
    call<any[]>(sb, errors, 'Projetos', 'stats_projects', { p_days }),
    call<number>(sb, errors, 'Funil de projetos', 'stats_section_visitors', { p_days }),
    call<any[]>(sb, errors, 'Engajamento', 'stats_engagement', { p_days, p_limit: 8 }),
    call<any[]>(sb, errors, 'Web Vitals', 'stats_vitals', { p_days }),
    call<any[]>(sb, errors, 'Últimos acessos', 'stats_recent', { p_limit: 30 }),
    ...TOP_DIMENSIONS.map((dim) =>
      call<any[]>(sb, errors, `Ranking (${dim})`, 'stats_top', { p_days, p_dim: dim, p_limit: dim === 'local_hour' ? 24 : 8 })
    ),
  ]);

  const o = overview?.[0];
  const v = vitals?.[0];

  return {
    overview: o
      ? {
          unique_visitors: n(o.unique_visitors),
          pageviews: n(o.pageviews),
          new_visitors: n(o.new_visitors),
          returning_visitors: n(o.returning_visitors),
          contact_clicks: n(o.contact_clicks),
          avg_seconds: nn(o.avg_seconds),
          deep_scroll_pct: nn(o.deep_scroll_pct),
          pages_per_session: nn(o.pages_per_session),
          last_view_at: o.last_view_at ?? null,
          unique_all_time: n(o.unique_all_time),
        }
      : null,
    series: (series ?? []).map((r) => ({ bucket: String(r.bucket), pageviews: n(r.pageviews), unique_visitors: n(r.unique_visitors) })),
    tops: Object.fromEntries(TOP_DIMENSIONS.map((dim, i) => [dim, rankedRows(tops[i])])) as Record<TopDimension, Ranked[]>,
    contacts: rankedRows(contacts),
    projects: (projects ?? []).map((r) => ({
      slug: String(r.slug),
      clicks: n(r.clicks),
      click_visitors: n(r.click_visitors),
      page_views: n(r.page_views),
      avg_seconds: nn(r.avg_seconds),
    })),
    sectionVisitors: n(section),
    engagement: (engagement ?? []).map((r) => ({
      path: String(r.path),
      views: n(r.views),
      avg_seconds: nn(r.avg_seconds),
      avg_scroll: nn(r.avg_scroll),
      deep_pct: nn(r.deep_pct),
    })),
    vitals: v ? { samples: n(v.samples), lcp_p75: nn(v.lcp_p75), cls_p75: nn(v.cls_p75), inp_p75: nn(v.inp_p75) } : null,
    recent: (recent ?? []) as RecentVisit[],
    errors,
    databaseDown: !o && !series,
  };
}
