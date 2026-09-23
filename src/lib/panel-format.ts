const nf = new Intl.NumberFormat('pt-BR');

export const fmt = (v: number | null | undefined): string => (v === null || v === undefined ? '—' : nf.format(v));

export function duration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}min ${String(seconds % 60).padStart(2, '0')}s`;
}

export const CTA_NAMES: Record<string, string> = {
  curriculo: 'Currículo',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  github: 'GitHub',
  linkedin: 'LinkedIn',
};

export const DEVICE_NAMES: Record<string, string> = { mobile: 'Celular', desktop: 'Computador' };

let regions: Intl.DisplayNames | null = null;
let languages: Intl.DisplayNames | null = null;
try {
  regions = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
  languages = new Intl.DisplayNames(['pt-BR'], { type: 'language' });
} catch {
  // very old runtimes: fall back to the raw codes
}

export function countryName(code: string | null | undefined): string {
  if (!code || code === 'Desconhecido') return 'Desconhecido';
  try {
    return regions?.of(code) ?? code;
  } catch {
    return code;
  }
}

export function languageName(code: string | null | undefined): string {
  if (!code || code === 'Desconhecido') return 'Desconhecido';
  try {
    const name = languages?.of(code) ?? code;
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return code;
  }
}

export const originName = (label: string): string => (label === '(direto)' ? 'Direto' : label);

export const projectName = (slug: string): string => {
  const name = slug.replace(/^projeto-/, '');
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const time = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });
export const formatTime = (iso: string | Date): string => time.format(typeof iso === 'string' ? new Date(iso) : iso);

export function timeAgo(iso: string | null): string {
  if (!iso) return 'nunca';
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'agora há pouco';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return `há ${Math.floor(s / 86400)} d`;
}

export type Rating = 'Bom' | 'Atenção' | 'Ruim';
// Thresholds are Google's published Core Web Vitals bands.
export const rate = (value: number | null, good: number, poor: number): Rating | null =>
  value === null ? null : value <= good ? 'Bom' : value <= poor ? 'Atenção' : 'Ruim';

// "12 min depois", "3 h depois", "2 d depois" between two ISO timestamps.
export function delay(fromIso: string, toIso: string): string {
  const minutes = Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000);
  if (minutes < 0) return 'antes do envio';
  if (minutes < 60) return `${minutes} min depois`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours} h depois` : `${Math.round(hours / 24)} d depois`;
}
