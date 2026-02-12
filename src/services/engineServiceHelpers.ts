/**
 * FUNCIONES HELPER PARA LAS PÁGINAS V2
 * Funciones simplificadas para usar en las páginas
 */

import { select, insert } from "./supabase/client";
import type { ConziaDesahogoAnalysis } from "../types/models";

// =====================================================
// OBTENER ESTADO DEL PROGRAMA
// =====================================================

export async function getUserProgramStatus(
  userId: string,
  accessToken: string
): Promise<{
  current_month: number;
  days_in_program: number;
  program_start_date: string;
} | null> {
  try {
    const result = await select<{
      profile_id: string;
      current_month: number;
      days_in_program: number;
      program_start_date: string;
    }>("user_program_status", {
      eq: { profile_id: userId },
      accessToken,
    });

    if (!result.ok || result.data.length === 0) {
      return null;
    }

    return result.data[0];
  } catch (error) {
    console.error("Error getting user program status:", error);
    return null;
  }
}

// =====================================================
// GUARDAR ENTRADA DE DESAHOGO
// =====================================================

export async function saveDesahogoEntry(
  userId: string,
  text: string,
  analysis: ConziaDesahogoAnalysis,
  accessToken: string
): Promise<void> {
  try {
    const entry = {
      profile_id: userId,
      text,
      emotion: analysis.emotion,
      reflection: analysis.reflection,
      pattern_tag: analysis.pattern_tag || null,
      created_at: new Date().toISOString(),
    };

    await insert("desahogo_entries", entry, { accessToken });
  } catch (error) {
    console.error("Error saving desahogo entry:", error);
    throw error;
  }
}

// =====================================================
// OBTENER MÉTRICAS DE ARQUETIPOS
// =====================================================

export async function getLatestArchetypeMetrics(
  userId: string,
  accessToken: string
): Promise<{
  guerrero: number;
  rey: number;
  amante: number;
  mago: number;
  dominant_archetype: string;
  shadow_archetype: string;
  balance_index: number;
} | null> {
  try {
    const result = await select<{
      guerrero_score: number;
      rey_score: number;
      amante_score: number;
      mago_score: number;
      dominant_archetype: string;
      shadow_archetype: string;
      balance_index: number;
    }>("archetype_metrics", {
      select: "guerrero_score,rey_score,amante_score,mago_score,dominant_archetype,shadow_archetype,balance_index",
      eq: { profile_id: userId },
      order: { column: "created_at", ascending: false },
      limit: 1,
      accessToken,
    });

    if (!result.ok || result.data.length === 0) {
      return null;
    }

    const metrics = result.data[0];
    return {
      guerrero: metrics.guerrero_score,
      rey: metrics.rey_score,
      amante: metrics.amante_score,
      mago: metrics.mago_score,
      dominant_archetype: metrics.dominant_archetype,
      shadow_archetype: metrics.shadow_archetype,
      balance_index: metrics.balance_index,
    };
  } catch (error) {
    console.error("Error getting archetype metrics:", error);
    return null;
  }
}

// =====================================================
// OBTENER MÉTRICAS DE RESISTENCIA
// =====================================================

export async function getLatestResistanceMetrics(
  userId: string,
  accessToken: string
): Promise<{
  resistance_index: number;
  resistance_level: string;
  surface_language: number;
  repetition_rate: number;
  challenge_avoidance: number;
  emotional_flatness: number;
  inactivity_days: number;
  session_abandonment_rate: number;
  avg_entry_length: number;
} | null> {
  try {
    const result = await select<{
      resistance_index: number;
      resistance_level: string;
      surface_language: number;
      repetition_rate: number;
      challenge_avoidance: number;
      emotional_flatness: number;
      inactivity_days: number;
      session_abandonment_rate: number;
      avg_entry_length: number;
    }>("resistance_metrics", {
      select: "resistance_index,resistance_level,surface_language,repetition_rate,challenge_avoidance,emotional_flatness,inactivity_days,session_abandonment_rate,avg_entry_length",
      eq: { profile_id: userId },
      order: { column: "created_at", ascending: false },
      limit: 1,
      accessToken,
    });

    if (!result.ok || result.data.length === 0) {
      return null;
    }

    return result.data[0];
  } catch (error) {
    console.error("Error getting resistance metrics:", error);
    return null;
  }
}
