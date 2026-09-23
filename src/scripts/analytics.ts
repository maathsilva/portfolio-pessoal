// First-party, cookie-free analytics. Everything here is best-effort and must
// never throw or block the page: any failure just means one missing data point.

const HOSTS = new Set(['matheussilvabaptista.online', 'www.matheussilvabaptista.online']);
const URLS = { view: '/api/v', event: '/api/e', pulse: '/api/p' };

type Campaign = { ref?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string };

function enabled(): boolean {
  try {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === '1' || nav.doNotTrack === 'yes' || nav.globalPrivacyControl) return false;
    // Only the real site records data; previews and localhost stay silent
    // unless explicitly enabled for testing.
    return HOSTS.has(location.hostname) || localStorage.getItem('analytics_debug') === '1';
  } catch {
    return false;
  }
}

function uuid(): string {
  try {
    if (crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // fall through
  }
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// sessionStorage lives only as long as the tab: it groups one visit and remembers
// the campaign tag, and is never used to recognise a person across visits.
const ss = {
  get(k: string): string | null {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string): void {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      // storage unavailable: nothing to do
    }
  },
};

function loadCampaign(): Campaign {
  const params = new URLSearchParams(location.search);
  const fresh: Campaign = {};
  const ref = params.get('ref');
  if (ref) fresh.ref = ref.trim().toLowerCase().slice(0, 40);
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign'] as const) {
    const v = params.get(k);
    if (v) fresh[k] = v.slice(0, 60);
  }
  if (Object.keys(fresh).length) {
    ss.set('campaign', JSON.stringify(fresh));
    return fresh;
  }
  try {
    return JSON.parse(ss.get('campaign') ?? '{}') as Campaign;
  } catch {
    return {};
  }
}

function post(url: string, payload: unknown): void {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(url, body)) return;
  } catch {
    // fall back to fetch
  }
  fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {});
}

function start(): void {
  if (!enabled()) return;

  let sid = ss.get('sid');
  if (!sid) {
    sid = uuid();
    ss.set('sid', sid);
  }
  const campaign = loadCampaign();
  const vid = uuid();

  post(URLS.view, {
    vid,
    sid,
    path: location.pathname,
    referrer: document.referrer,
    ...campaign,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang: navigator.language,
    vw: window.innerWidth,
  });

  const event = (name: string) => post(URLS.event, { name, sid, path: location.pathname, ref: campaign.ref });

  // ---- contact / project clicks (data-cta on contact buttons, data-track on project cards)
  const onClick = (e: MouseEvent) => {
    if (e instanceof MouseEvent && e.type === 'auxclick' && e.button !== 1) return;
    const el = (e.target as Element | null)?.closest?.('[data-cta],[data-track]');
    const name = el?.getAttribute('data-cta') || el?.getAttribute('data-track');
    if (name) event(name);
  };
  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);

  // ---- "projects section seen", once per page view
  const projects = document.getElementById('projetos');
  if (projects && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          event('secao:projetos');
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(projects);
  }

  // ---- engagement: active time, scroll depth and Core Web Vitals
  let activeMs = 0;
  let since: number | null = document.visibilityState === 'visible' ? performance.now() : null;
  let maxScroll = 0;
  let lcp: number | undefined;
  let cls = 0;
  let inp: number | undefined;

  const measureScroll = () => {
    const doc = document.documentElement;
    const pct = ((window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1)) * 100;
    maxScroll = Math.max(maxScroll, Math.min(100, Math.round(pct)));
  };
  measureScroll();
  let raf = 0;
  window.addEventListener(
    'scroll',
    () => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          measureScroll();
        });
      }
    },
    { passive: true }
  );

  const observe = (type: string, cb: (entries: PerformanceEntryList) => void, extra: object = {}) => {
    try {
      new PerformanceObserver((list) => cb(list.getEntries())).observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
    } catch {
      // entry type not supported by this browser
    }
  };
  observe('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1];
    if (last) lcp = last.startTime;
  });
  let windowValue = 0;
  let windowStart = 0;
  let lastShift = 0;
  observe('layout-shift', (entries) => {
    for (const entry of entries as unknown as { value: number; startTime: number; hadRecentInput: boolean }[]) {
      if (entry.hadRecentInput) continue;
      if (entry.startTime - lastShift > 1000 || entry.startTime - windowStart > 5000) {
        windowValue = 0;
        windowStart = entry.startTime;
      }
      lastShift = entry.startTime;
      windowValue += entry.value;
      cls = Math.max(cls, windowValue);
    }
  });
  observe(
    'event',
    (entries) => {
      for (const entry of entries as unknown as { duration: number; interactionId?: number }[]) {
        if (entry.interactionId) inp = Math.max(inp ?? 0, entry.duration);
      }
    },
    { durationThreshold: 40 }
  );

  const flush = () => {
    if (since !== null) {
      activeMs += performance.now() - since;
      since = document.visibilityState === 'visible' ? performance.now() : null;
    }
    measureScroll();
    post(URLS.pulse, {
      vid,
      s: Math.round(activeMs / 1000),
      m: maxScroll,
      lcp: lcp !== undefined ? Math.round(lcp) : undefined,
      cls: Math.round(cls * 1000) / 1000,
      inp: inp !== undefined ? Math.round(inp) : undefined,
    });
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
      since = null;
    } else {
      since = performance.now();
    }
  });
  window.addEventListener('pagehide', flush);
}

try {
  start();
} catch {
  // analytics must never affect the page
}
