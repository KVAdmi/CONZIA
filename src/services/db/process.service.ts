import { supabase } from "../../lib/supabaseClient";
import { getSupabaseConfig } from "../supabase/config";

export type ProcessRow = {
  id: number;
  user_uuid: string;
  estado: string;
  day_index: number;
  last_session_id: number | null;
  updated_at: string;
  created_at: string;
};

/**
 * Obtiene o crea un proceso activo para el usuario.
 * Si ya existe un proceso con estado 'activo', lo retorna.
 * Si no existe, crea uno nuevo.
 */
export async function getOrCreateActiveProcess(userUuid: string): Promise<ProcessRow> {
  const config = getSupabaseConfig();
  
  if (!config.configured) {
    console.warn("[Process] Supabase no configurado. Retornando proceso mock.");
    // Retorna un proceso mock en modo local
    return {
      id: -1,
      user_uuid: userUuid,
      estado: "activo",
      day_index: 1,
      last_session_id: null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  }

  try {
    // Buscar proceso activo existente
    const { data: existingProcesses, error: selectError } = await supabase
      .from("processes")
      .select("*")
      .eq("user_uuid", userUuid)
      .eq("estado", "activo")
      .order("created_at", { ascending: false })
      .limit(1);

    if (selectError) {
      console.warn("[Process] Error al buscar proceso:", selectError);
      throw new Error(`Error al buscar proceso: ${selectError.message}`);
    }

    if (existingProcesses && existingProcesses.length > 0) {
      return existingProcesses[0] as ProcessRow;
    }

    // No existe, crear uno nuevo
    const { data: newProcess, error: insertError } = await supabase
      .from("processes")
      .insert({
        user_uuid: userUuid,
        estado: "activo",
        day_index: 1,
      } as any)
      .select()
      .single();

    if (insertError) {
      console.warn("[Process] Error al crear proceso:", insertError);
      throw new Error(`Error al crear proceso: ${insertError.message}`);
    }

    return newProcess as ProcessRow;
  } catch (error) {
    console.warn("[Process] Error inesperado:", error);
    throw error;
  }
}

/**
 * Actualiza el last_session_id de un proceso
 */
export async function updateProcessLastSession(
  processId: number,
  sessionId: number
): Promise<void> {
  const config = getSupabaseConfig();
  
  if (!config.configured) {
    console.warn("[Process] Supabase no configurado. Saltando actualización.");
    return;
  }

  try {
    const updateData = {
      last_session_id: sessionId,
      updated_at: new Date().toISOString(),
    };
    const { error } = await (supabase.from("processes").update as any)(updateData).eq("id", processId);

    if (error) {
      console.warn("[Process] Error al actualizar last_session_id:", error);
      throw new Error(`Error al actualizar proceso: ${error.message}`);
    }
  } catch (error) {
    console.warn("[Process] Error inesperado al actualizar:", error);
    throw error;
  }
}
