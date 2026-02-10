import { supabase } from "../../lib/supabaseClient";
import { getSupabaseConfig } from "../supabase/config";

export type UsuarioProfile = {
  uuid: string;
  email?: string;
  apodo?: string;
  tz?: string;
  country?: string;
  tema_base?: string;
  costo_dominante?: string;
  arquetipo_dominante?: string;
  arquetipo_secundario?: string;
  confianza?: number;
  estilo_conduccion?: string;
  archetype_scores?: Record<string, number>;
  dominant_archetype?: string;
  shadow_archetype?: string;
  shadow_traits?: Array<{ trait: string; origin_probable?: string; status?: string }>;
  shadow_mirror_text?: string;
  radar_completed_at?: string;
  registration_done?: boolean;
};

/**
 * Actualiza el perfil del usuario en la tabla usuarios
 */
export async function updateUsuarioProfile(profile: UsuarioProfile): Promise<boolean> {
  const config = getSupabaseConfig();
  
  if (!config.configured) {
    console.warn("[Usuario] Supabase no configurado. Saltando actualización de perfil.");
    return false;
  }

  try {
    const updateData = {
      email: profile.email,
      apodo: profile.apodo,
      tz: profile.tz,
      country: profile.country,
      tema_base: profile.tema_base,
      costo_dominante: profile.costo_dominante,
      arquetipo_dominante: profile.arquetipo_dominante,
      arquetipo_secundario: profile.arquetipo_secundario,
      confianza: profile.confianza,
      estilo_conduccion: profile.estilo_conduccion,
      archetype_scores: profile.archetype_scores,
      dominant_archetype: profile.dominant_archetype,
      shadow_archetype: profile.shadow_archetype,
      shadow_traits: profile.shadow_traits,
      shadow_mirror_text: profile.shadow_mirror_text,
      radar_completed_at: profile.radar_completed_at,
      registration_done: profile.registration_done,
      actualizado_en: new Date().toISOString(),
    };

    const { error } = await (supabase.from("usuarios").update as any)(updateData).eq("uuid", profile.uuid);

    if (error) {
      console.warn("[Usuario] Error al actualizar perfil:", error);
      return false;
    }

    console.info("[Usuario] ✓ Perfil actualizado");
    return true;
  } catch (error) {
    console.warn("[Usuario] Error inesperado al actualizar perfil:", error);
    return false;
  }
}

/**
 * Obtiene el perfil del usuario desde la tabla usuarios
 */
export async function getUsuarioProfile(userUuid: string): Promise<UsuarioProfile | null> {
  const config = getSupabaseConfig();
  
  if (!config.configured) {
    console.warn("[Usuario] Supabase no configurado.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("uuid", userUuid)
      .single();

    if (error) {
      console.warn("[Usuario] Error al obtener perfil:", error);
      return null;
    }

    return data as UsuarioProfile;
  } catch (error) {
    console.warn("[Usuario] Error inesperado:", error);
    return null;
  }
}
