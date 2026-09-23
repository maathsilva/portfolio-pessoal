import { waitUntil } from '@vercel/functions';
import { getSupabaseAdmin } from './supabase';
import {
  getClientIp,
  getDevice,
  getGeo,
  hashIp,
  hourInTimezone,
  parseUserAgent,
  rateLimited,
  shouldSkipTracking,
} from './analytics-server';
import { contactAlert, sendEmail } from './notify';

type Cookies = { has(name: string): boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REF = /^[a-z0-9][a-z0-9_-]{0,39}$/;
const UTM = /^[\w .+-]{1,60}$/;
const LANG = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}$/;
const TZ = /^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+){0,2}$/;
const EVENT = /^(curriculo|whatsapp|email|github|linkedin|secao:projetos|projeto:[a-z0-9-]{1,60})$/;
const ALERT_EVENTS = new Set(['curriculo', 'whatsapp', 'email']);
const HOUR = 3_600_000;

// ------------------------------------------------------------ input hygiene
// Everything below comes from an untrusted client: validate, clamp, or drop.
const str = (v: unknown, max: number): string | undefined => (typeof v === 'string' ? v.slice(0, max) : undefined);

function pick(v: unknown, re: RegExp, max: number, lower = false): string | null {
  const s = str(v, max)?.trim();
  if (!s) return null;
  const t = lower ? s.toLowerCase() : s;
  return re.test(t) ? t : null;
}

function num(v: unknown, min: number, max: number, decimals = 0): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const f = 10 ** decimals;
  return Math.round(Math.min(max, Math.max(min, v)) * f) / f;
}

function cleanPath(v: unknown): string | null {
  const s = str(v, 200);
  if (!s || !s.startsWith('/')) return null;
  const path = s.split(/[?#]/)[0] || '/';
  return path.startsWith('/painel') || path.startsWith('/api') ? null : path;
}

// Keep only origin + path: query strings can carry personal data (e.g. search terms).
function cleanReferrer(v: unknown): string | null {
  const s = str(v, 400);
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return (u.origin + u.pathname).slice(0, 300);
  } catch {
    return null;
  }
}

async function readBody(request: Request, max = 2048): Promise<Record<string, unknown> | null> {
  if (Number(request.headers.get('content-length') ?? 0) > max) return null;
  const text = await request.text();
  if (text.length > max) return null;
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const logError = (what: string, e: unknown) =>
  console.error(`[analytics] ${what}:`, e instanceof Error ? e.message : e);

// ------------------------------------------------------------------- handlers
// Analytics must never break the site: every handler swallows its own errors.
export async function handleView(request: Request, cookies: Cookies): Promise<void> {
  try {
    if (shouldSkipTracking(request, cookies)) return;
    const body = await readBody(request);
    if (!body) return;
    const path = cleanPath(body.path);
    if (!path) return;

    const ipHash = hashIp(getClientIp(request));
    if (rateLimited(`v:${ipHash}`, 120, HOUR)) return;

    const ua = request.headers.get('user-agent') ?? '';
    const geo = getGeo(request);
    const timezone = pick(body.tz, TZ, 64) ?? geo.timezone;
    const language =
      pick(body.lang, LANG, 16) ?? pick(request.headers.get('accept-language')?.split(',')[0]?.split(';')[0], LANG, 16);
    const { browser, os } = parseUserAgent(ua);

    const { error } = await getSupabaseAdmin().from('page_views').insert({
      ip_hash: ipHash,
      path,
      referrer: cleanReferrer(body.referrer),
      view_id: pick(body.vid, UUID, 36),
      session_id: pick(body.sid, UUID, 36),
      ref: pick(body.ref, REF, 40, true),
      utm_source: pick(body.utm_source, UTM, 60),
      utm_medium: pick(body.utm_medium, UTM, 60),
      utm_campaign: pick(body.utm_campaign, UTM, 60),
      country: geo.country,
      region: geo.region,
      city: geo.city,
      timezone,
      local_hour: hourInTimezone(timezone),
      language,
      browser,
      os,
      device: getDevice(ua),
      viewport_w: num(body.vw, 0, 10000),
    });
    // 23505 = duplicate view_id (a retried beacon): expected and harmless.
    if (error && error.code !== '23505') logError('view insert', error.message);
  } catch (e) {
    logError('view', e);
  }
}

export async function handleEvent(request: Request, cookies: Cookies): Promise<void> {
  try {
    if (shouldSkipTracking(request, cookies)) return;
    const body = await readBody(request);
    if (!body) return;
    const name = pick(body.name, EVENT, 80);
    if (!name) return;

    const ipHash = hashIp(getClientIp(request));
    if (rateLimited(`e:${ipHash}`, 60, HOUR)) return;

    const path = cleanPath(body.path) ?? '/';
    const ref = pick(body.ref, REF, 40, true);
    const sb = getSupabaseAdmin();

    // Alert at most once per visitor+action per hour, so a double click never spams the inbox.
    let sendAlert = false;
    if (ALERT_EVENTS.has(name)) {
      const since = new Date(Date.now() - HOUR).toISOString();
      const { data } = await sb.from('events').select('id').eq('ip_hash', ipHash).eq('name', name).gte('created_at', since).limit(1);
      sendAlert = (data?.length ?? 0) === 0;
    }

    const { error } = await sb.from('events').insert({
      ip_hash: ipHash,
      name,
      path,
      ref,
      session_id: pick(body.sid, UUID, 36),
    });
    if (error) {
      logError('event insert', error.message);
      return;
    }

    if (sendAlert) {
      const ua = request.headers.get('user-agent') ?? '';
      const geo = getGeo(request);
      const { browser, os } = parseUserAgent(ua);
      const job = sendEmail(
        contactAlert({ name, ref, path, country: geo.country, region: geo.region, city: geo.city, device: getDevice(ua), browser, os })
      ).catch(() => false);
      try {
        waitUntil(job);
      } catch {
        // Outside Vercel (local dev) the promise simply runs in the background.
      }
    }
  } catch (e) {
    logError('event', e);
  }
}

export async function handlePulse(request: Request, cookies: Cookies): Promise<void> {
  try {
    if (shouldSkipTracking(request, cookies)) return;
    const body = await readBody(request);
    if (!body) return;
    const viewId = pick(body.vid, UUID, 36);
    if (!viewId) return;

    if (rateLimited(`p:${hashIp(getClientIp(request))}`, 300, HOUR)) return;

    const { error } = await getSupabaseAdmin().rpc('record_pulse', {
      p_view_id: viewId,
      p_seconds: num(body.s, 0, 3600),
      p_scroll: num(body.m, 0, 100),
      p_lcp: num(body.lcp, 0, 120000),
      p_cls: num(body.cls, 0, 99.999, 3),
      p_inp: num(body.inp, 0, 60000),
    });
    if (error) logError('pulse', error.message);
  } catch (e) {
    logError('pulse', e);
  }
}
