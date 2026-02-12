export type SupabaseConfig = {
  url: string;
  anonKey: string;
  configured: boolean;
};

type EnvRecord = Record<string, unknown>;

function readEnv(name: string): string {
  // Vite (browser/dev) expone variables en `import.meta.env`.
  const metaEnv = (import.meta as any)?.env as EnvRecord | undefined;
  const fromVite = metaEnv?.[name];
  if (typeof fromVite === "string") return fromVite;

  // Node (tests/scripts): usamos `process.env` sin depender de @types/node.
  const proc = (globalThis as any).process as { env?: Record<string, string | undefined> } | undefined;
  const fromNode = proc?.env?.[name];
  if (typeof fromNode === "string") return fromNode;

  return "";
}

export function getSupabaseConfig(): SupabaseConfig {
  const rawUrl = readEnv("VITE_SUPABASE_URL");
  const rawAnonKey = readEnv("VITE_SUPABASE_ANON_KEY");

  const url = rawUrl.trim().replace(/\/$/, "");
  const anonKey = rawAnonKey.trim();

  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey),
  };
}
