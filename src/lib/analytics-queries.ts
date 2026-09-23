import { getSupabaseAdmin } from './supabase';

export interface Overview {
  total_pageviews: number;
  unique_total: number;
  unique_today: number;
  unique_7d: number;
  unique_30d: number;
  returning_visitors: number;
}
export interface DailyPoint {
  day: string;
  pageviews: number;
  unique_visitors: number;
}
export interface Ranked {
  label: string;
  count: number;
}
export interface RecentVisit {
  path: string;
  referrer: string | null;
  country: string | null;
  device: string | null;
  created_at: string;
}

export interface DashboardData {
  overview: Overview;
  daily: DailyPoint[];
  paths: Ranked[];
  referrers: Ranked[];
  ctas: Ranked[];
  countries: Ranked[];
  devices: Ranked[];
  recent: RecentVisit[];
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }, name: string): T {
  if (res.error) throw new Error(`${name}: ${res.error.message}`);
  return res.data as T;
}

const ranked = (rows: any[], key: string): Ranked[] =>
  rows.map((r) => ({ label: String(r[key]), count: Number(r.count) }));

export async function getDashboardData(days = 30): Promise<DashboardData> {
  const sb = getSupabaseAdmin();
  const [overview, daily, paths, referrers, ctas, countries, devices, recent] = await Promise.all([
    sb.rpc('analytics_overview'),
    sb.rpc('analytics_daily', { days }),
    sb.rpc('analytics_top_paths', { result_limit: 8 }),
    sb.rpc('analytics_top_referrers', { result_limit: 8 }),
    sb.rpc('analytics_cta_counts'),
    sb.rpc('analytics_countries', { result_limit: 8 }),
    sb.rpc('analytics_devices'),
    sb.rpc('analytics_recent', { result_limit: 30 }),
  ]);

  const o = unwrap<any[]>(overview as any, 'overview')[0] ?? {};
  return {
    overview: {
      total_pageviews: Number(o.total_pageviews ?? 0),
      unique_total: Number(o.unique_total ?? 0),
      unique_today: Number(o.unique_today ?? 0),
      unique_7d: Number(o.unique_7d ?? 0),
      unique_30d: Number(o.unique_30d ?? 0),
      returning_visitors: Number(o.returning_visitors ?? 0),
    },
    daily: unwrap<any[]>(daily as any, 'daily').map((r) => ({
      day: String(r.day),
      pageviews: Number(r.pageviews),
      unique_visitors: Number(r.unique_visitors),
    })),
    paths: ranked(unwrap<any[]>(paths as any, 'paths'), 'path'),
    referrers: ranked(unwrap<any[]>(referrers as any, 'referrers'), 'referrer'),
    ctas: ranked(unwrap<any[]>(ctas as any, 'ctas'), 'cta'),
    countries: ranked(unwrap<any[]>(countries as any, 'countries'), 'country'),
    devices: ranked(unwrap<any[]>(devices as any, 'devices'), 'device'),
    recent: unwrap<RecentVisit[]>(recent as any, 'recent'),
  };
}
