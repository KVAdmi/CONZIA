import { supabase } from "../../lib/supabaseClient";
import { getSupabaseConfig } from "../supabase/config";

export type SessionRow = {
  id: number;
  user_uuid: string;
  process_id: number;
  puerta: string;
  arquetipo: string | null;
  status: string;
  started_at: string;
  closed_at: string | null;
  summary: Record<string, unknown> | null;
  created_at: string;
};

export type StartSessionParams = {
  userUuid: string;
  processId: number;
  puerta: string;
  arquetipo?: string | null;
};

/**
 * Crea una nueva sesión con status 'open'
 */
export async function startSession(params: StartSessionParams): Promise<SessionRow> {
  const config = getSupabaseConfig();
  
  if (!config.configured) {
    console.warn("[Session] Supabase no configurado. Retornando sesión mock.");
    return {
      id: -1,
      user_uuid: params.userUuid,
      process_id: params.processId,
      puerta: params.puerta,
      arquetipo: params.arquetipo ?? null,
      status: "open",
      started_at: new Date().toISOString(),
      closed_at: null,
      summary: null,
      created_at: new Date().toISOString(),
    };
  }

  try {
    const { data: newSession, error } = await supabase
      .from("sessions")
      .insert({
        user_uuid: params.userUuid,
        process_id: params.processId,
        puerta: params.puerta,
        arquetipo: params.arquetipo ?? null,
        status: "open",
        started_at: new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (error) {
      console.warn("[Session] Error al crear sesión:", error);
      throw new Error(`Error al crear sesión: ${error.message}`);
    }

    return newSession as SessionRow;
  } catch (error) {
    console.warn("[Session] Error inesperado:", error);
    throw error;
  }
}

export type CloseSessionParams = {
  sessionId: number;
  summary?: Record<string, unknown>;
};

/**
 * Cierra una sesión (status = 'closed', closed_at = now, summary opcional)
 */
export async function closeSession(params: CloseSessionParams): Promise<void> {
  const config = getSupabaseConfig();
  
  if (!config.configured) {
    console.warn("[Session] Supabase no configurado. Saltando cierre de sesión.");
    return;
  }

  try {
    const updateData = {
      status: "closed",
      closed_at: new Date().toISOString(),
      summary: params.summary ?? null,
    };
    const { error } = await (supabase.from("sessions").update as any)(updateData).eq("id", params.sessionId);

    if (error) {
      console.warn("[Session] Error al cerrar sesión:", error);
      throw new Error(`Error al cerrar sesión: ${error.message}`);
    }
  } catch (error) {
    console.warn("[Session] Error inesperado al cerrar:", error);
    throw error;
  }
}

/**
 * Obtiene la última sesión de un usuario en una puerta específica
 */
export async function getLastSessionForDoor(
  userUuid: string,
  puerta: string
): Promise<SessionRow | null> {
  const config = getSupabaseConfig();
  
  if (!config.configured) {
    console.warn("[Session] Supabase no configurado.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_uuid", userUuid)
      .eq("puerta", puerta)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.warn("[Session] Error al buscar sesión:", error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0] as SessionRow;
    }

    return null;
  } catch (error) {
    console.warn("[Session] Error inesperado:", error);
    return null;
  }
}
