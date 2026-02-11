/**
 * MOTOR DE ARQUETIPOS
 * Calcula y recalcula scores de los 4 arquetipos junguianos
 * Alineado con: ConziaProfile, ConziaArchetype en models.ts
 */

import type { ConziaArchetype } from "../types/models";

// =====================================================
// TIPOS
// =====================================================

export interface ArchetypeScores {
  guerrero: number; // 0-100
  rey: number; // 0-100
  amante: number; // 0-100
  mago: number; // 0-100
  dominant: ConziaArchetype;
  shadow: ConziaArchetype;
  balance_index: number; // 0-100
  updated_at: string;
}

export interface ArchetypeTestResponse {
  question_id: number;
  score: number; // 1-5
}

export interface ShadowTrait {
  trait: string;
  archetype: ConziaArchetype;
}

export interface CompletedChallenge {
  shadow_archetype: ConziaArchetype;
  validated: boolean;
}

// =====================================================
// CONSTANTES
// =====================================================

// Mapeo de preguntas del test a arquetipos
// 20 preguntas, 5 por arquetipo
const QUESTION_TO_ARCHETYPE: Record<number, ConziaArchetype> = {
  1: "guerrero",
  2: "guerrero",
  3: "guerrero",
  4: "guerrero",
  5: "guerrero",
  6: "rey",
  7: "rey",
  8: "rey",
  9: "rey",
  10: "rey",
  11: "amante",
  12: "amante",
  13: "amante",
  14: "amante",
  15: "amante",
  16: "mago",
  17: "mago",
  18: "mago",
  19: "mago",
  20: "mago",
};

// Mapeo de rasgos de sombra a arquetipos
const SHADOW_TRAIT_TO_ARCHETYPE: Record<string, ConziaArchetype> = {
  // Guerrero en sombra
  agresividad: "guerrero",
  pasividad: "guerrero",
  cobardía: "guerrero",
  violencia: "guerrero",
  sumisión: "guerrero",
  miedo_al_conflicto: "guerrero",

  // Rey en sombra
  tiranía: "rey",
  abdicación: "rey",
  control_excesivo: "rey",
  irresponsabilidad: "rey",
  megalomanía: "rey",
  debilidad: "rey",

  // Amante en sombra
  dependencia: "amante",
  frialdad: "amante",
  adicción: "amante",
  aislamiento: "amante",
  necesidad_excesiva: "amante",
  desconexión: "amante",

  // Mago en sombra
  manipulación: "mago",
  ingenuidad: "mago",
  charlatanería: "mago",
  negación: "mago",
  omnipotencia: "mago",
  impotencia: "mago",
};

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Calcula scores iniciales basándose en el test de 20 preguntas
 */
export function calculateInitialScores(
  responses: ArchetypeTestResponse[]
): ArchetypeScores {
  if (responses.length !== 20) {
    throw new Error("Se requieren exactamente 20 respuestas");
  }

  // PASO 1: Sumar scores por arquetipo
  const rawScores = {
    guerrero: 0,
    rey: 0,
    amante: 0,
    mago: 0,
  };

  responses.forEach((response) => {
    const archetype = QUESTION_TO_ARCHETYPE[response.question_id];
    rawScores[archetype] += response.score;
  });

  // PASO 2: Normalizar a escala 0-100
  // Cada arquetipo tiene 5 preguntas con scores 1-5
  // Score mínimo: 5 (5 × 1), Score máximo: 25 (5 × 5)
  const normalizedScores = {
    guerrero: Math.round(((rawScores.guerrero - 5) / 20) * 100),
    rey: Math.round(((rawScores.rey - 5) / 20) * 100),
    amante: Math.round(((rawScores.amante - 5) / 20) * 100),
    mago: Math.round(((rawScores.mago - 5) / 20) * 100),
  };

  // PASO 3: Identificar dominante y sombra
  const dominant = identifyDominant(normalizedScores);
  const shadow = identifyShadow(normalizedScores);

  // PASO 4: Calcular índice de balance
  const balance_index = calculateBalanceIndex(normalizedScores);

  return {
    ...normalizedScores,
    dominant,
    shadow,
    balance_index,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Recalcula scores basándose en rasgos de sombra detectados y retos cumplidos
 */
export function recalculateScores(
  currentScores: ArchetypeScores,
  shadowTraits: ShadowTrait[],
  completedChallenges: CompletedChallenge[]
): ArchetypeScores {
  const newScores = { ...currentScores };

  // PASO 1: Ajustar por rasgos de sombra detectados
  // Cada rasgo de sombra reduce el score del arquetipo correspondiente en 2 puntos
  shadowTraits.forEach((trait) => {
    newScores[trait.archetype] = Math.max(
      0,
      newScores[trait.archetype] - 2
    );
  });

  // PASO 2: Ajustar por retos cumplidos
  // Cada reto cumplido y validado aumenta el score del arquetipo en 5 puntos
  completedChallenges.forEach((challenge) => {
    if (challenge.validated) {
      newScores[challenge.shadow_archetype] = Math.min(
        100,
        newScores[challenge.shadow_archetype] + 5
      );
    }
  });

  // PASO 3: Normalizar para mantener suma = 400
  const sum =
    newScores.guerrero + newScores.rey + newScores.amante + newScores.mago;
  const targetSum = 400;

  if (sum !== targetSum) {
    const factor = targetSum / sum;
    newScores.guerrero = Math.round(newScores.guerrero * factor);
    newScores.rey = Math.round(newScores.rey * factor);
    newScores.amante = Math.round(newScores.amante * factor);
    newScores.mago = Math.round(newScores.mago * factor);
  }

  // PASO 4: Recalcular dominante, sombra y balance
  newScores.dominant = identifyDominant(newScores);
  newScores.shadow = identifyShadow(newScores);
  newScores.balance_index = calculateBalanceIndex(newScores);
  newScores.updated_at = new Date().toISOString();

  return newScores;
}

/**
 * Extrae rasgos de sombra de un array de strings
 */
export function extractShadowTraits(traits: string[]): ShadowTrait[] {
  return traits
    .map((trait) => {
      const normalizedTrait = trait.toLowerCase().trim();
      const archetype = SHADOW_TRAIT_TO_ARCHETYPE[normalizedTrait];

      if (archetype) {
        return { trait: normalizedTrait, archetype };
      }
      return null;
    })
    .filter((t): t is ShadowTrait => t !== null);
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function identifyDominant(
  scores: Omit<ArchetypeScores, "dominant" | "shadow" | "balance_index" | "updated_at">
): ConziaArchetype {
  const archetypes: ConziaArchetype[] = ["guerrero", "rey", "amante", "mago"];
  return archetypes.reduce((dominant, current) =>
    scores[current] > scores[dominant] ? current : dominant
  );
}

function identifyShadow(
  scores: Omit<ArchetypeScores, "dominant" | "shadow" | "balance_index" | "updated_at">
): ConziaArchetype {
  const archetypes: ConziaArchetype[] = ["guerrero", "rey", "amante", "mago"];
  return archetypes.reduce((shadow, current) =>
    scores[current] < scores[shadow] ? current : shadow
  );
}

function calculateBalanceIndex(
  scores: Omit<ArchetypeScores, "dominant" | "shadow" | "balance_index" | "updated_at">
): number {
  // Calcular desviación estándar
  const values = [scores.guerrero, scores.rey, scores.amante, scores.mago];
  const mean = values.reduce((sum, val) => sum + val, 0) / 4;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 4;
  const stdDev = Math.sqrt(variance);

  // Convertir a índice 0-100
  // stdDev = 0 → balance_index = 100 (perfectamente equilibrado)
  // stdDev = 50 → balance_index = 0 (muy desequilibrado)
  const maxStdDev = 50;
  const balance_index = Math.round(
    Math.max(0, 100 - (stdDev / maxStdDev) * 100)
  );

  return balance_index;
}

/**
 * Determina el estado de un arquetipo según su score
 */
export function getArchetypeStatus(
  score: number
): "dominante" | "equilibrado" | "en_sombra" {
  if (score >= 120) return "dominante";
  if (score >= 80) return "equilibrado";
  return "en_sombra";
}

/**
 * Genera recomendaciones basadas en los scores
 */
export function generateRecommendations(
  scores: ArchetypeScores
): string[] {
  const recommendations: string[] = [];

  // Recomendación para arquetipo en sombra
  if (scores[scores.shadow] < 80) {
    recommendations.push(
      `Tu arquetipo ${scores.shadow} está en sombra. Los retos semanales te ayudarán a fortalecerlo.`
    );
  }

  // Recomendación para balance
  if (scores.balance_index < 50) {
    recommendations.push(
      "Tus arquetipos están desequilibrados. Trabaja en integrar aspectos de todos los arquetipos."
    );
  } else if (scores.balance_index > 80) {
    recommendations.push(
      "Tus arquetipos están bien equilibrados. Mantén este balance mientras profundizas en tu trabajo de sombra."
    );
  }

  return recommendations;
}
