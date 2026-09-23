// Reads server-side config at runtime (process.env on Vercel), falling back to
// the values Astro/Vite loads from .env in local development.
export function env(name: string): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  return fromProcess ?? ((import.meta.env as Record<string, string | undefined>)[name] || undefined);
}
