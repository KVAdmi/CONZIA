import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "../services/supabase/config";

// Cliente Supabase singleton - usamos tipado genérico para flexibilidad
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  
  if (!config.configured) {
    console.warn("[Supabase] No configurado. Usando modo local/demo.");
    // Retornamos un cliente con URL/key vacíos que no funcionará,
    // pero evita romper el código que lo use
    supabaseInstance = createClient("", "");
    return supabaseInstance;
  }

  supabaseInstance = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}

// Export directo para facilitar imports
export const supabase = getSupabase();
