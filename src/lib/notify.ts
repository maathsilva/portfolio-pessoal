import { env } from './env';
import { site } from '../data/site';

export interface EmailMessage {
  subject: string;
  html: string;
  text: string;
}

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// No RESEND_API_KEY => notifications are simply off. Never throws.
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const key = env('RESEND_API_KEY');
  if (!key) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env('ALERT_FROM') ?? 'Portfólio <onboarding@resend.dev>',
        to: [env('ALERT_TO') ?? site.email],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error('[notify] resend rejected the message:', res.status, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[notify] send failed:', e instanceof Error ? e.message : e);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const wrap = (title: string, rows: [string, string][]): string => `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
  <h2 style="font-size:18px;margin:0 0 16px">${esc(title)}</h2>
  <table style="border-collapse:collapse;width:100%;font-size:14px">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:8px 12px 8px 0;color:#6b6b6b;border-bottom:1px solid #eee;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>${esc(v)}</strong></td></tr>`
      )
      .join('')}
  </table>
</div>`;

const plain = (title: string, rows: [string, string][]): string =>
  `${title}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n`;

// ------------------------------------------------------------ contact alert
export interface ContactAlertContext {
  name: string;
  path: string;
  country: string | null;
  region: string | null;
  city: string | null;
  device: string;
  browser: string;
  os: string;
}

const ACTION_LABEL: Record<string, string> = {
  curriculo: 'Currículo baixado',
  whatsapp: 'Clique no WhatsApp',
  email: 'Clique no e-mail',
};

export function contactAlert(ctx: ContactAlertContext): EmailMessage {
  const action = ACTION_LABEL[ctx.name] ?? ctx.name;
  const place = [ctx.city, ctx.region, ctx.country].filter(Boolean).join(', ') || 'Local desconhecido';
  const when = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());

  const rows: [string, string][] = [
    ['Ação', action],
    ['Página', ctx.path],
    ['Local', place],
    ['Dispositivo', `${ctx.device === 'mobile' ? 'Celular' : 'Computador'} · ${ctx.browser} · ${ctx.os}`],
    ['Quando', when],
  ];
  const subject = `${action} (${place})`;
  return { subject, html: wrap(action, rows), text: plain(action, rows) };
}

// ------------------------------------------------------------- weekly digest
export interface WeeklyDigest {
  visitors: number;
  visitors_prev: number;
  pageviews: number;
  contact_clicks: number;
  top_project: string | null;
  top_source: string | null;
}

export function digestEmail(d: WeeklyDigest): EmailMessage {
  const change =
    d.visitors_prev > 0
      ? `${d.visitors >= d.visitors_prev ? '+' : ''}${Math.round(((d.visitors - d.visitors_prev) / d.visitors_prev) * 100)}% vs. semana anterior`
      : d.visitors > 0
        ? 'sem semana anterior para comparar'
        : '—';
  const rows: [string, string][] = [
    ['Visitantes únicos', `${d.visitors} (${change})`],
    ['Pageviews', String(d.pageviews)],
    ['Contatos diretos (currículo, WhatsApp, e-mail)', String(d.contact_clicks)],
    ['Principal origem', d.top_source ?? 'Direto'],
    ['Projeto mais clicado', d.top_project ?? '—'],
  ];
  const title = 'Resumo semanal do portfólio (últimos 7 dias)';
  return {
    subject: `Resumo semanal: ${d.visitors} visitante${d.visitors === 1 ? '' : 's'}, ${d.contact_clicks} contato${d.contact_clicks === 1 ? '' : 's'}`,
    html: wrap(title, rows),
    text: plain(title, rows),
  };
}
