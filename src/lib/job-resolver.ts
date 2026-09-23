import dns from 'node:dns/promises';
import net from 'node:net';
import {
  detectPlatform,
  fromUrl,
  isPrivateAddress,
  normalizeJobUrl,
  parseHtml,
  type Platform,
} from './job-parse';

// A user-facing error: the message is safe to show in the panel.
export class ResolveError extends Error {}

export interface ResolvedJob {
  url: string;
  platform: Platform;
  company: string;
  title: string;
  /** True when the page itself was read (never for LinkedIn). */
  fetched: boolean;
  /** Something the user should double-check, in Portuguese. */
  note: string | null;
}

const MAX_HTML_BYTES = 400_000;
const FETCH_TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 3;

// Refuses anything that is not a plain public web address, so this feature can never be
// used to reach internal services (SSRF). The tool is owner-only, but it still fails safe.
async function assertPublic(url: URL): Promise<void> {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new ResolveError('Use um link que comece com http:// ou https://.');
  if (url.username || url.password) throw new ResolveError('O link não pode conter usuário ou senha.');
  if (url.port && url.port !== '80' && url.port !== '443') throw new ResolveError('Endereço não permitido.');

  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (net.isIP(host) || host === 'localhost' || !host.includes('.') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new ResolveError('Use o endereço público da vaga, não um IP ou endereço interno.');
  }
  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch {
    throw new ResolveError('Não consegui encontrar esse endereço. Confira o link.');
  }
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) throw new ResolveError('Endereço não permitido.');
}

async function readLimited(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  reader.cancel().catch(() => {});
  return new TextDecoder('utf-8').decode(Buffer.concat(chunks.map((c) => Buffer.from(c))).subarray(0, MAX_HTML_BYTES));
}

// One polite, user-initiated request for a public page (like a link preview).
// Redirects are followed manually so every hop is re-validated.
async function fetchPublicHtml(start: URL): Promise<string | null> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; PortfolioJobPreview/1.0)',
          accept: 'text/html',
          'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
      });
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        if (!location) return null;
        url = new URL(location, url);
        continue;
      }
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('text/html')) return null;
      return await readLimited(res);
    } catch (e) {
      if (e instanceof ResolveError) throw e;
      return null; // timeout, TLS or network error: fall back to what the link itself tells us
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function resolveJob(rawUrl: string): Promise<ResolvedJob> {
  let input: URL;
  try {
    input = new URL(rawUrl.trim());
  } catch {
    throw new ResolveError('Esse link não parece válido.');
  }
  await assertPublic(input);

  const platform = detectPlatform(input.hostname);
  const fromLink = fromUrl(input);
  const url = normalizeJobUrl(input);

  let page: ReturnType<typeof parseHtml> = {};
  let fetched = false;
  if (platform !== 'linkedin' && (!fromLink.title || !fromLink.company)) {
    const html = await fetchPublicHtml(new URL(url));
    if (html) {
      fetched = true;
      page = parseHtml(html);
    }
  }

  // Structured data from the page beats a guess from the link; a page-title guess loses to the link.
  const company = (page.company && !page.companyGuessed ? page.company : fromLink.company ?? page.company) ?? '';
  const title = fromLink.title ?? page.title ?? '';

  let note: string | null = null;
  if (platform === 'linkedin') {
    note = 'O LinkedIn não permite leitura automática da página, então usei só o que está no link. Confira os campos.';
  } else if (!title || !company) {
    note = fetched ? 'Não encontrei todos os dados na página. Complete o que faltar.' : 'Não consegui ler a página da vaga. Preencha o que faltar.';
  } else if (page.companyGuessed && !fromLink.company) {
    note = 'A empresa foi deduzida do título da página. Confira.';
  }

  return { url, platform, company, title, fetched, note };
}
