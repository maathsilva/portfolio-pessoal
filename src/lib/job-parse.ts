// Pure helpers (no network, no framework imports) that turn a job link or a job
// page into { company, title } and a unique ?ref= tag. Kept dependency-free so
// they can be unit-tested with plain Node.

export type Platform =
  | 'linkedin' | 'gupy' | 'indeed' | 'catho' | 'infojobs' | 'vagas' | 'greenhouse' | 'lever' | 'workday' | 'outro';

export const PLATFORMS: Platform[] = ['linkedin', 'gupy', 'indeed', 'catho', 'infojobs', 'vagas', 'greenhouse', 'lever', 'workday', 'outro'];

export const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: 'LinkedIn', gupy: 'Gupy', indeed: 'Indeed', catho: 'Catho', infojobs: 'InfoJobs', vagas: 'Vagas.com',
  greenhouse: 'Greenhouse', lever: 'Lever', workday: 'Workday', outro: 'Outro',
};

export const STATUSES = ['enviada', 'entrevista', 'oferta', 'recusada'] as const;
export type Status = (typeof STATUSES)[number];

export const REF_PATTERN = /^[a-z0-9][a-z0-9_-]{0,39}$/;

export function detectPlatform(host: string): Platform {
  const h = host.toLowerCase();
  const is = (d: string) => h === d || h.endsWith('.' + d);
  if (is('linkedin.com')) return 'linkedin';
  if (is('gupy.io')) return 'gupy';
  if (is('indeed.com') || is('indeed.com.br')) return 'indeed';
  if (is('catho.com.br')) return 'catho';
  if (is('infojobs.com.br')) return 'infojobs';
  if (is('vagas.com.br')) return 'vagas';
  if (is('greenhouse.io')) return 'greenhouse';
  if (is('lever.co')) return 'lever';
  if (is('myworkdayjobs.com')) return 'workday';
  return 'outro';
}

// ---------------------------------------------------------------- text helpers
const SMALL_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'a', 'o', 'as', 'os', 'of', 'and', 'the', 'at', 'in', 'for']);

export function humanize(slug: string): string {
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    // keep the raw slug
  }
  const words = s.replace(/[-_+]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  return words
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Whole words only, up to `max` characters ("analista-de-dados-senior" -> "analista-de-dados").
function shortSlug(s: string, max: number): string {
  let out = '';
  for (const word of slugify(s).split('-').filter(Boolean)) {
    const next = out ? `${out}-${word}` : word;
    if (next.length > max) break;
    out = next;
  }
  return out;
}

const LEVEL_WORDS = /\b(j[uú]nior|jr|pleno|pl|s[eê]nior|sr|i{1,3}|iv|v)\b/gi;

export function suggestRef(company: string, title: string, taken: Set<string>): string {
  const c = shortSlug(company, 16);
  const t = shortSlug(title.replace(LEVEL_WORDS, ' '), 20);
  let base = [c, t].filter(Boolean).join('-').slice(0, 36).replace(/-+$/, '');
  if (!base) base = 'vaga';
  let ref = base;
  for (let n = 2; taken.has(ref); n++) {
    const suffix = `-${n}`;
    ref = base.slice(0, 40 - suffix.length) + suffix;
  }
  return ref;
}

// ---------------------------------------------------------------- URL parsing
export function normalizeJobUrl(input: URL): string {
  const url = new URL(input.toString());
  url.hash = '';
  const platform = detectPlatform(url.hostname);

  if (platform === 'linkedin') {
    const id = url.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d{6,})/)?.[1] ?? url.searchParams.get('currentJobId');
    if (id && /^\d{6,}$/.test(id)) return `https://www.linkedin.com/jobs/view/${id}/`;
  }
  if (platform === 'gupy') {
    const id = url.pathname.match(/^\/jobs\/(\d+)/)?.[1];
    if (id) return `${url.protocol}//${url.host}/jobs/${id}`;
  }
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|trk|tracking|fbclid$|gclid$|refid$|ref$)/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

export interface Extracted {
  title?: string;
  company?: string;
  /** True when the company is a guess (e.g. taken from a page title) and worth double-checking. */
  companyGuessed?: boolean;
}

export function fromUrl(url: URL): Extracted {
  const host = url.hostname.toLowerCase();
  const platform = detectPlatform(host);

  if (platform === 'linkedin') {
    const slug = url.pathname.match(/\/jobs\/view\/([^/?]+?)-?(\d{6,})\/?$/)?.[1];
    if (!slug || /^\d+$/.test(slug)) return {};
    const at = slug.lastIndexOf('-at-');
    if (at > 0) return { title: humanize(slug.slice(0, at)), company: humanize(slug.slice(at + 4)) };
    return { title: humanize(slug) };
  }
  if (platform === 'gupy') {
    const sub = host.match(/^([a-z0-9-]+)\.gupy\.io$/)?.[1];
    if (sub && !['portal', 'app', 'www', 'api', 'careers', 'vagas', 'candidate'].includes(sub)) return { company: humanize(sub) };
    return {};
  }
  if (platform === 'greenhouse' || platform === 'lever') {
    const first = url.pathname.split('/').filter(Boolean)[0];
    return first && !/^\d+$/.test(first) && first !== 'embed' ? { company: humanize(first) } : {};
  }
  if (platform === 'workday') {
    const sub = host.match(/^([a-z0-9-]+)\.wd\d+\.myworkdayjobs\.com$/)?.[1];
    return sub ? { company: humanize(sub) } : {};
  }
  return {};
}

// ---------------------------------------------------------------- HTML parsing
function decodeEntities(s: string): string {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : match;
    }
    return named[e.toLowerCase()] ?? match;
  });
}

const clean = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const s = decodeEntities(v).replace(/\s+/g, ' ').trim().slice(0, max);
  return s || undefined;
};

function findJobPosting(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return null;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const type = obj['@type'];
    if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) return obj;
    if (obj['@graph']) return findJobPosting(obj['@graph']);
  }
  return null;
}

const SITE_SUFFIX = /^(gupy|linkedin|indeed|catho|infojobs|vagas(\.com)?|glassdoor|greenhouse|lever|workday|carreiras|vagas de emprego)$/i;

function metaContent(html: string, property: string): string | undefined {
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i'));
  return (a ?? b)?.[1];
}

export function parseHtml(rawHtml: string): Extracted {
  const html = rawHtml.slice(0, 400_000);

  // 1) Structured data (schema.org JobPosting): the most reliable source.
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const posting = findJobPosting(JSON.parse(m[1]));
      if (!posting) continue;
      const org = posting['hiringOrganization'];
      const company = clean(typeof org === 'string' ? org : (org as Record<string, unknown> | undefined)?.['name'], 80);
      const title = clean(posting['title'], 120);
      if (title || company) return { title, company };
    } catch {
      // malformed JSON-LD: try the next block
    }
  }

  // 2) Open Graph / <title>: "Cargo | Empresa | Gupy" style strings.
  const raw = clean(metaContent(html, 'og:title'), 200) ?? clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1], 200);
  if (!raw) return {};
  const parts = raw.split(/\s+[|–—-]\s+/).map((p) => p.trim()).filter((p) => p && !SITE_SUFFIX.test(p));
  if (!parts.length) return {};
  return { title: parts[0].slice(0, 120), company: parts[1]?.slice(0, 80), companyGuessed: parts.length > 1 };
}

// ---------------------------------------------------------------- SSRF guard
export function isPrivateAddress(ip: string): boolean {
  const addr = ip.toLowerCase();
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateAddress(mapped[1]);

  const v4 = addr.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  // IPv6: loopback, unspecified, unique-local (fc00::/7), link-local (fe80::/10), multicast
  return addr === '::1' || addr === '::' || /^f[cd]/.test(addr) || /^fe[89ab]/.test(addr) || /^ff/.test(addr);
}
