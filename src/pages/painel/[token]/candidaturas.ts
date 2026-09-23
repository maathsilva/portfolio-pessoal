import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { PANEL_COOKIE, hasValidSession, isValidToken } from '../../../lib/panel-auth';
import { PLATFORMS, REF_PATTERN, STATUSES, suggestRef, type Platform, type Status } from '../../../lib/job-parse';
import { ResolveError, resolveJob } from '../../../lib/job-resolver';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
const fail = (error: string, status = 400) => json({ ok: false, error }, status);

const text = (v: unknown, min: number, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  return s.length >= min && s.length <= max ? s : null;
};

function validUrl(v: unknown): string | null {
  if (typeof v !== 'string' || v.length > 500) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

function appliedAt(v: unknown): string {
  const now = Date.now();
  const t = typeof v === 'string' ? Date.parse(v) : NaN;
  // Anything absurd (unparseable, before 2020, more than a day ahead) falls back to "now".
  return Number.isFinite(t) && t >= Date.UTC(2020, 0, 1) && t <= now + 86_400_000 ? new Date(t).toISOString() : new Date(now).toISOString();
}

export const POST: APIRoute = async ({ params, cookies, request }) => {
  if (!isValidToken(params.token) || !hasValidSession(cookies.get(PANEL_COOKIE)?.value)) {
    return new Response('Not found', { status: 404 });
  }
  // JSON only: a cross-site page cannot send this content type without a CORS preflight, which we never grant.
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return fail('Tipo de conteúdo inválido.', 415);

  const raw = await request.text();
  if (raw.length > 4096) return fail('Requisição grande demais.', 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail('Requisição inválida.');
  }

  const sb = getSupabaseAdmin();

  try {
    switch (body.action) {
      case 'resolve': {
        const link = typeof body.url === 'string' ? body.url.slice(0, 600) : '';
        const job = await resolveJob(link);
        const [refs, dup] = await Promise.all([
          sb.from('applications').select('ref'),
          sb.from('applications').select('id, ref, company, title').eq('job_url', job.url).limit(1),
        ]);
        if (refs.error) throw new Error(refs.error.message);
        const taken = new Set((refs.data ?? []).map((r) => r.ref as string));
        return json({
          ok: true,
          job,
          ref: suggestRef(job.company, job.title, taken),
          duplicate: dup.data?.[0] ?? null,
        });
      }

      case 'save': {
        const company = text(body.company, 1, 80);
        const title = text(body.title, 1, 120);
        const jobUrl = validUrl(body.job_url);
        const ref = typeof body.ref === 'string' ? body.ref.trim().toLowerCase() : '';
        const platform = body.platform as Platform;
        const status = ((body.status as Status) ?? 'enviada') as Status;
        if (!company) return fail('Informe a empresa (até 80 caracteres).');
        if (!title) return fail('Informe o cargo (até 120 caracteres).');
        if (!jobUrl) return fail('O link da vaga não é válido.');
        if (!REF_PATTERN.test(ref)) return fail('O nome do link deve ter letras minúsculas, números, hífen ou underline (até 40).');
        if (!PLATFORMS.includes(platform)) return fail('Plataforma inválida.');
        if (!STATUSES.includes(status)) return fail('Status inválido.');

        const { data, error } = await sb
          .from('applications')
          .insert({ company, title, platform, job_url: jobUrl, ref, status, applied_at: appliedAt(body.applied_at) })
          .select('id, ref')
          .single();
        if (error) {
          if (error.code === '23505') return fail('Já existe uma candidatura com esse nome de link. Escolha outro.', 409);
          throw new Error(error.message);
        }
        return json({ ok: true, id: data.id, ref: data.ref });
      }

      case 'status': {
        const id = Number(body.id);
        if (!Number.isInteger(id) || !STATUSES.includes(body.status as Status)) return fail('Dados inválidos.');
        const { error } = await sb.from('applications').update({ status: body.status }).eq('id', id);
        if (error) throw new Error(error.message);
        return json({ ok: true });
      }

      case 'delete': {
        const id = Number(body.id);
        if (!Number.isInteger(id)) return fail('Dados inválidos.');
        const { error } = await sb.from('applications').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return json({ ok: true });
      }

      default:
        return fail('Ação desconhecida.');
    }
  } catch (e) {
    if (e instanceof ResolveError) return fail(e.message, 422);
    console.error('[applications]', e instanceof Error ? e.message : e);
    return fail('Não foi possível concluir agora. Tente novamente.', 500);
  }
};
