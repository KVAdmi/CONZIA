export type SupabaseConfig = {
  url: string;
  anonKey: string;
  configured: boolean;
};

export function getSupabaseConfig(): SupabaseConfig {
  const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
  const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

  const url = rawUrl.trim().replace(/\/$/, "");
  const anonKey = rawAnonKey.trim();

  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey),
  };
}

