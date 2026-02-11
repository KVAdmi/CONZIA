/**
 * SERVICIO DE INTEGRACIÓN DE MOTORES CON SUPABASE
 * Conecta los 5 motores con la base de datos
 */

import { select, insert, update } from "./supabase/client";
import {
  determineCurrentMonth,
  getSystemPrompt,
  buildClaudeContext as buildMonthContext,
  type UserMonthStatus,
} from "../engine/monthEngine";
import {
  calculateResistanceIndex,
  getResistanceMetrics,
  calculateSurfaceLanguage,
  calculateRepetitionRate,
  calculateChallengeAvoidance,
  calculateEmotionalFlatness,
  checkResistanceTriggers,
  determineExperienceAdjustments,
  type ResistanceMetrics,
  type ResistanceIndicators,
} from "../engine/resistanceEngine";
import {
  calculateInitialScores,
  recalculateScores,
  getArchetypeStatus,
  generateRecommendations,
  type ArchetypeScores,
} from "../engine/archetypeEngine";
import {
  generateChallenge,
  validateChallengeCompletion,
  extractDominantTheme,
  type GeneratedChallenge,
} from "../engine/challengeEngine";
import {
  buildClaudeContext as buildMemoryContext,
  buildSystemPromptContext,
  detectNewPatterns,
  detectTraumaNodes,
  type ClaudeContextPayload,
  type DesahogoEntry,
  type DetectedPattern,
  type TraumaNode,
} from "../engine/memoryEngine";
import type { ConziaArchetype } from "../types/models";

// =====================================================
// TIPOS
// =====================================================

interface UserProfile {
  id: string;
  program_start_date: string;
  current_month: 1 | 2 | 3;
}

interface ArchetypeMetric {
  profile_id: string;
  guerrero: number;
  rey: number;
  amante: number;
  mago: number;
  dominant_archetype: ConziaArchetype;
  shadow_archetype: ConziaArchetype;
  balance_index: number;
}

interface Challenge {
  id: string;
  profile_id: string;
  card_title: string;
  challenge_text: string;
  shadow_archetype: ConziaArchetype;
  theme: string;
  difficulty: "easy" | "medium" | "hard";
  validation_criteria: string;
  completed: boolean;
  due_at: string;
}

// =====================================================
// FUNCIONES DE SISTEMA DE MES
// =====================================================

/**
 * Obtiene el estado del mes actual del usuario
 */
export async function getUserMonthStatus(
  userId: string,
  accessToken?: string
): Promise<UserMonthStatus | null> {
  const result = await select<UserProfile>("user_profiles", {
    select: "id,program_start_date,current_month",
    eq: { id: userId },
    accessToken,
  });

  if (!result.ok || result.data.length === 0) {
    return null;
  }

  const profile = result.data[0];
  return determineCurrentMonth(profile.program_start_date);
}

/**
 * Obtiene el system prompt para Claude basándose en el mes actual
 */
export async function getClaudeSystemPrompt(
  userId: string,
  accessToken?: string
): Promise<string> {
  const monthStatus = await getUserMonthStatus(userId, accessToken);

  if (!monthStatus) {
    // Fallback si no se puede determinar el mes
    return `Eres un analista junguiano. El usuario está en un proceso de integración de sombra. 
    Escucha con atención y haz preguntas profundas. No des consejos superficiales.`;
  }

  return getSystemPrompt(
    monthStatus.current_month,
    monthStatus.days_until_next_phase
  );
}

// =====================================================
// FUNCIONES DE ARQUETIPOS
// =====================================================

/**
 * Guarda los scores iniciales de arquetipos después del test
 */
export async function saveInitialArchetypeScores(
  userId: string,
  testResponses: number[],
  accessToken?: string
): Promise<boolean> {
  const scores = calculateInitialScores(
    testResponses.map((score, index) => ({
      question_id: index + 1,
      score,
    }))
  );

  const result = await insert<ArchetypeMetric>("archetype_metrics", {
    profile_id: userId,
    guerrero: scores.guerrero,
    rey: scores.rey,
    amante: scores.amante,
    mago: scores.mago,
    dominant_archetype: scores.dominant,
    shadow_archetype: scores.shadow,
    balance_index: scores.balance_index,
  }, { accessToken });

  return result.ok;
}

/**
 * Obtiene los scores actuales de arquetipos del usuario
 */
export async function getCurrentArchetypeScores(
  userId: string,
  accessToken?: string
): Promise<ArchetypeScores | null> {
  const result = await select<ArchetypeMetric>("archetype_metrics", {
    eq: { profile_id: userId },
    order: { column: "created_at", ascending: false },
    limit: 1,
    accessToken,
  });

  if (!result.ok || result.data.length === 0) {
    return null;
  }

  const metric = result.data[0];
  return {
    guerrero: metric.guerrero,
    rey: metric.rey,
    amante: metric.amante,
    mago: metric.mago,
    dominant: metric.dominant_archetype,
    shadow: metric.shadow_archetype,
    balance_index: metric.balance_index,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Recalcula y actualiza los scores de arquetipos semanalmente
 */
export async function recalculateArchetypeScores(
  userId: string,
  shadowTraits: string[],
  accessToken?: string
): Promise<boolean> {
  const currentScores = await getCurrentArchetypeScores(userId, accessToken);
  if (!currentScores) return false;

  // Obtener retos completados
  const challengesResult = await select<Challenge>("challenges", {
    eq: { profile_id: userId, completed: true },
    accessToken,
  });

  const completedChallenges = challengesResult.ok
    ? challengesResult.data.map((c) => ({
        shadow_archetype: c.shadow_archetype,
        validated: true,
      }))
    : [];

  const newScores = recalculateScores(
    currentScores,
    shadowTraits.map((trait) => ({ trait, archetype: 'guerrero' as ConziaArchetype })),
    completedChallenges
  );

  const result = await insert<ArchetypeMetric>("archetype_metrics", {
    profile_id: userId,
    guerrero: newScores.guerrero,
    rey: newScores.rey,
    amante: newScores.amante,
    mago: newScores.mago,
    dominant_archetype: newScores.dominant,
    shadow_archetype: newScores.shadow,
    balance_index: newScores.balance_index,
  }, { accessToken });

  return result.ok;
}

// =====================================================
// FUNCIONES DE RESISTENCIA
// =====================================================

/**
 * Calcula y guarda las métricas de resistencia del usuario
 */
export async function calculateAndSaveResistance(
  userId: string,
  accessToken?: string
): Promise<ResistanceMetrics | null> {
  // Obtener entradas recientes
  const entriesResult = await select<DesahogoEntry>("desahogo_entries", {
    eq: { profile_id: userId },
    order: { column: "created_at", ascending: false },
    limit: 7,
    accessToken,
  });

  if (!entriesResult.ok || entriesResult.data.length === 0) {
    return null;
  }

  const entries = entriesResult.data;

  // Calcular indicadores
  const avgLength =
    entries.reduce((sum, e) => sum + e.text.length, 0) / entries.length;

  const daysSinceLastEntry = Math.floor(
    (Date.now() - new Date(entries[0].created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const surfaceLanguage = calculateSurfaceLanguage(
    entries.map((e) => e.text).join(" ")
  );

  const repetitionRate = calculateRepetitionRate(entries);

  // Obtener retos para calcular evitación
  const challengesResult = await select<Challenge>("challenges", {
    eq: { profile_id: userId },
    accessToken,
  });

  const challengeAvoidance = challengesResult.ok
    ? calculateChallengeAvoidance(challengesResult.data)
    : 100;

  const emotionalFlatness = calculateEmotionalFlatness(entries);

  const indicators: ResistanceIndicators = {
    entry_length_avg: avgLength,
    entry_frequency: daysSinceLastEntry,
    surface_language: surfaceLanguage,
    repetition_rate: repetitionRate,
    challenge_avoidance: challengeAvoidance,
    session_abandonment: 0, // TODO: Implementar tracking de sesiones
    emotional_flatness: emotionalFlatness,
  };

  const metrics = getResistanceMetrics(indicators);

  // Guardar en base de datos
  await insert("resistance_metrics", {
    profile_id: userId,
    resistance_index: metrics.resistance_index,
    level: metrics.level,
    ...indicators,
  }, { accessToken });

  // Verificar si hay alertas
  const alerts = checkResistanceTriggers(metrics.resistance_index, indicators);

  if (alerts.length > 0) {
    // Guardar alertas para el equipo humano
    for (const alert of alerts) {
      await insert("human_support_alerts", {
        profile_id: userId,
        alert_type: alert.type,
        message: alert.message,
        suggested_action: alert.suggested_action,
      }, { accessToken });
    }
  }

  return metrics;
}

// =====================================================
// FUNCIONES DE RETOS
// =====================================================

/**
 * Genera y guarda un nuevo reto para el usuario
 */
export async function generateAndSaveChallenge(
  userId: string,
  accessToken?: string
): Promise<GeneratedChallenge | null> {
  // Obtener arquetipo en sombra
  const scores = await getCurrentArchetypeScores(userId, accessToken);
  if (!scores) return null;

  // Obtener entradas recientes para detectar tema
  const entriesResult = await select<DesahogoEntry>("desahogo_entries", {
    eq: { profile_id: userId },
    order: { column: "created_at", ascending: false },
    limit: 7,
    accessToken,
  });

  const theme = entriesResult.ok
    ? extractDominantTheme(entriesResult.data)
    : "general";

  // Obtener mes actual
  const monthStatus = await getUserMonthStatus(userId, accessToken);
  if (!monthStatus) return null;

  // Calcular resistencia para ajustar dificultad
  const resistanceResult = await select<{ resistance_index: number }>(
    "resistance_metrics",
    {
      eq: { profile_id: userId },
      order: { column: "created_at", ascending: false },
      limit: 1,
      accessToken,
    }
  );

  const resistanceIndex = resistanceResult.ok
    ? resistanceResult.data[0]?.resistance_index ?? 50
    : 50;

  // Generar reto
  const challenge = generateChallenge(
    scores.shadow,
    theme,
    monthStatus.current_month,
    resistanceIndex
  );

  // Guardar en base de datos
  const result = await insert<Challenge>("challenges", {
    profile_id: userId,
    card_title: challenge.card_title,
    challenge_text: challenge.challenge_text,
    shadow_archetype: challenge.shadow_archetype,
    theme: challenge.theme,
    difficulty: challenge.difficulty,
    validation_criteria: challenge.validation_criteria,
    completed: false,
    due_at: challenge.due_at,
  }, { accessToken });

  return result.ok ? challenge : null;
}

/**
 * Valida y marca como completado un reto
 */
export async function validateAndCompleteChallenge(
  challengeId: string,
  userReflection: string,
  accessToken?: string
): Promise<{ valid: boolean; reason: string }> {
  // Obtener el reto
  const result = await select<Challenge>("challenges", {
    eq: { id: challengeId },
    accessToken,
  });

  if (!result.ok || result.data.length === 0) {
    return { valid: false, reason: "Reto no encontrado." };
  }

  const challenge = result.data[0];

  // Validar cumplimiento
  const validation = validateChallengeCompletion(
    userReflection,
    challenge.validation_criteria
  );

  if (validation.is_valid) {
    // Marcar como completado
    await update("challenges", { completed: true }, {
      eq: { id: challengeId },
      accessToken,
    });

    // Actualizar scores de arquetipos
    const currentScores = await getCurrentArchetypeScores(
      challenge.profile_id,
      accessToken
    );

    if (currentScores) {
      const newScores = recalculateScores(currentScores, [], [
        { shadow_archetype: challenge.shadow_archetype, validated: true },
      ]);

      await insert<ArchetypeMetric>("archetype_metrics", {
        profile_id: challenge.profile_id,
        guerrero: newScores.guerrero,
        rey: newScores.rey,
        amante: newScores.amante,
        mago: newScores.mago,
        dominant_archetype: newScores.dominant,
        shadow_archetype: newScores.shadow,
        balance_index: newScores.balance_index,
      }, { accessToken });
    }
  }

  return { valid: validation.is_valid, reason: validation.reason };
}

// =====================================================
// FUNCIONES DE MEMORIA EVOLUTIVA
// =====================================================

/**
 * Construye el contexto completo para Claude
 */
export async function buildFullClaudeContext(
  userId: string,
  accessToken?: string
): Promise<string> {
  // Obtener mes actual
  const monthStatus = await getUserMonthStatus(userId, accessToken);
  if (!monthStatus) return "";

  // Obtener entradas recientes
  const entriesResult = await select<DesahogoEntry>("desahogo_entries", {
    eq: { profile_id: userId },
    order: { column: "created_at", ascending: false },
    limit: 7,
    accessToken,
  });

  const entries = entriesResult.ok ? entriesResult.data : [];

  // Obtener patrones
  const patternsResult = await select<DetectedPattern>("detected_patterns", {
    eq: { profile_id: userId },
    order: { column: "frequency", ascending: false },
    limit: 5,
    accessToken,
  });

  const patterns = patternsResult.ok ? patternsResult.data : [];

  // Obtener traumas
  const traumasResult = await select<TraumaNode>("trauma_nodes", {
    eq: { profile_id: userId },
    order: { column: "intensity", ascending: false },
    limit: 3,
    accessToken,
  });

  const traumas = traumasResult.ok ? traumasResult.data : [];

  // Obtener memorias críticas
  const memoriesResult = await select<any>("ai_memory", {
    eq: { profile_id: userId },
    order: { column: "importance", ascending: false },
    limit: 10,
    accessToken,
  });

  const memories = memoriesResult.ok ? memoriesResult.data : [];

  // Obtener reto actual
  const challengeResult = await select<Challenge>("challenges", {
    eq: { profile_id: userId, completed: false },
    order: { column: "created_at", ascending: false },
    limit: 1,
    accessToken,
  });

  const currentChallenge = challengeResult.ok && challengeResult.data.length > 0
    ? {
        shadow_archetype: challengeResult.data[0].shadow_archetype,
        challenge_text: challengeResult.data[0].challenge_text,
        due_at: challengeResult.data[0].due_at,
      }
    : undefined;

  // Obtener scores de arquetipos
  const scores = await getCurrentArchetypeScores(userId, accessToken);

  // Obtener resistencia
  const resistanceResult = await select<{ resistance_index: number }>(
    "resistance_metrics",
    {
      eq: { profile_id: userId },
      order: { column: "created_at", ascending: false },
      limit: 1,
      accessToken,
    }
  );

  const resistanceIndex = resistanceResult.ok
    ? resistanceResult.data[0]?.resistance_index
    : undefined;

  // Construir payload de contexto
  const context = buildMemoryContext(
    userId,
    monthStatus.days_in_program,
    monthStatus.current_month,
    entries,
    patterns,
    traumas,
    memories,
    currentChallenge,
    scores
      ? {
          guerrero: scores.guerrero,
          rey: scores.rey,
          amante: scores.amante,
          mago: scores.mago,
        }
      : undefined,
    scores?.dominant,
    scores?.shadow,
    resistanceIndex
  );

  return buildSystemPromptContext(context);
}
