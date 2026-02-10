import { supabase } from "../../lib/supabaseClient";
import { getSupabaseConfig } from "../supabase/config";

export type EntryRow = {
  id: number;
  user_uuid: string;
  session_id: number;
  kind: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type AddEntryParams = {
  userUuid: string;
  sessionId: number;
  kind: string;
  payload: Record<string, unknown>;
};

/**
 * Inserta una nueva entrada (entry) en una sesión
 */
export async function addEntry(params: AddEntryParams): Promise<EntryRow> {
  const config = getSupabaseConfig();
  
  if (!config.configured) {
    console.warn("[Entry] Supabase no configurado. Retornando entry mock.");
    return {
      id: -1,
      user_uuid: params.userUuid,
      session_id: params.sessionId,
      kind: params.kind,
      payload: params.payload,
      created_at: new Date().toISOString(),
    };
  }

  try {
    const { data: newEntry, error } = await supabase
      .from("entries")
      .insert({
        user_uuid: params.userUuid,
        session_id: params.sessionId,
        kind: params.kind,
        payload: params.payload,
      } as any)
      .select()
      .single();

    if (error) {
      console.warn("[Entry] Error al insertar entrada:", error);
      throw new Error(`Error al insertar entrada: ${error.message}`);
    }

    return newEntry as EntryRow;
  } catch (error) {
    console.warn("[Entry] Error inesperado:", error);
    throw error;
  }
}

/**
 * Inserta múltiples entradas en batch
 */
export async function addEntries(entries: AddEntryParams[]): Promise<EntryRow[]> {
  const config = getSupabaseConfig();
  
  if (!config.configured) {
    console.warn("[Entry] Supabase no configurado. Retornando entries mock.");
    return entries.map((e, idx) => ({
      id: -(idx + 1),
      user_uuid: e.userUuid,
      session_id: e.sessionId,
      kind: e.kind,
      payload: e.payload,
      created_at: new Date().toISOString(),
    }));
  }

  try {
    const { data: newEntries, error } = await supabase
      .from("entries")
      .insert(
        entries.map((e) => ({
          user_uuid: e.userUuid,
          session_id: e.sessionId,
          kind: e.kind,
          payload: e.payload,
        })) as any
      )
      .select();

    if (error) {
      console.warn("[Entry] Error al insertar entradas:", error);
      throw new Error(`Error al insertar entradas: ${error.message}`);
    }

    return (newEntries ?? []) as EntryRow[];
  } catch (error) {
    console.warn("[Entry] Error inesperado:", error);
    throw error;
  }
}

/**
 * Obtiene todas las entries de una sesión
 */
export async function getEntriesBySession(sessionId: number): Promise<EntryRow[]> {
  const config = getSupabaseConfig();
  
  if (!config.configured) {
    console.warn("[Entry] Supabase no configurado.");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("[Entry] Error al obtener entradas:", error);
      return [];
    }

    return (data ?? []) as EntryRow[];
  } catch (error) {
    console.warn("[Entry] Error inesperado:", error);
    return [];
  }
}
