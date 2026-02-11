/**
 * MOTOR DE RESISTENCIA
 * Calcula el índice de resistencia del usuario (0-100)
 * basándose en 7 indicadores ponderados
 */

// =====================================================
// TIPOS
// =====================================================

export interface ResistanceIndicators {
  entry_length_avg: number; // Promedio de caracteres en últimas 7 entradas
  entry_frequency: number; // Días transcurridos desde última entrada
  surface_language: number; // % de palabras superficiales vs. profundas
  repetition_rate: number; // % de temas repetidos sin evolución
  challenge_avoidance: number; // % de retos no completados
  session_abandonment: number; // % de sesiones cerradas antes de 2 minutos
  emotional_flatness: number; // Ausencia de palabras emocionales intensas
}

export interface ResistanceMetrics {
  resistance_index: number; // 0-100
  level: "Mínima" | "Baja" | "Moderada" | "Alta" | "Crítica";
  color: string;
  description: string;
  suggested_action: string;
  indicators: ResistanceIndicators;
}

export interface ResistanceAlert {
  type: "warning" | "critical";
  message: string;
  suggested_action: string;
}

export interface ExperienceAdjustments {
  claude_tone: "empathetic" | "neutral" | "confrontational";
  question_depth: "surface" | "moderate" | "deep";
  challenge_difficulty: "easy" | "medium" | "hard";
  unlock_crisis_module: boolean;
}

// =====================================================
// CONSTANTES
// =====================================================

const RESISTANCE_WEIGHTS = {
  entry_length_avg: 0.1, // 10%
  entry_frequency: 0.15, // 15%
  surface_language: 0.2, // 20% (más importante)
  repetition_rate: 0.15, // 15%
  challenge_avoidance: 0.2, // 20% (más importante)
  session_abandonment: 0.1, // 10%
  emotional_flatness: 0.1, // 10%
};

const SURFACE_WORDS = [
  "bien",
  "mal",
  "normal",
  "nada",
  "todo",
  "siempre",
  "nunca",
  "ok",
  "fine",
  "whatever",
  "algo",
  "cosas",
  "stuff",
];

const DEEP_WORDS = [
  "miedo",
  "rabia",
  "vergüenza",
  "culpa",
  "envidia",
  "odio",
  "dolor",
  "angustia",
  "ansiedad",
  "tristeza",
  "frustración",
  "resentimiento",
  "rechazo",
  "abandono",
  "traición",
];

const INTENSE_EMOTIONS = [
  "terror",
  "pánico",
  "furia",
  "ira",
  "odio",
  "desprecio",
  "asco",
  "vergüenza",
  "humillación",
  "desesperación",
  "angustia",
  "agonía",
  "tormento",
  "sufrimiento",
];

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Calcula el índice de resistencia basándose en los indicadores
 */
export function calculateResistanceIndex(
  indicators: ResistanceIndicators
): number {
  // PASO 1: Normalizar cada indicador a escala 0-100
  const normalized = {
    entry_length_avg: normalizeEntryLength(indicators.entry_length_avg),
    entry_frequency: normalizeFrequency(indicators.entry_frequency),
    surface_language: indicators.surface_language, // Ya está en %
    repetition_rate: indicators.repetition_rate, // Ya está en %
    challenge_avoidance: indicators.challenge_avoidance, // Ya está en %
    session_abandonment: indicators.session_abandonment, // Ya está en %
    emotional_flatness: indicators.emotional_flatness, // Ya está en %
  };

  // PASO 2: Calcular índice ponderado
  const resistanceIndex = Object.keys(normalized).reduce((acc, key) => {
    const k = key as keyof typeof normalized;
    return acc + normalized[k] * RESISTANCE_WEIGHTS[k];
  }, 0);

  return Math.round(clamp(resistanceIndex, 0, 100));
}

/**
 * Obtiene las métricas completas de resistencia
 */
export function getResistanceMetrics(
  indicators: ResistanceIndicators
): ResistanceMetrics {
  const resistance_index = calculateResistanceIndex(indicators);
  const level = getResistanceLevel(resistance_index);

  return {
    resistance_index,
    ...level,
    indicators,
  };
}

/**
 * Calcula el porcentaje de lenguaje superficial en un texto
 */
export function calculateSurfaceLanguage(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const surfaceCount = words.filter((w) => SURFACE_WORDS.includes(w)).length;
  const deepCount = words.filter((w) => DEEP_WORDS.includes(w)).length;

  if (surfaceCount + deepCount === 0) return 50; // Neutral si no hay ninguna

  const surfacePercentage = (surfaceCount / (surfaceCount + deepCount)) * 100;
  return Math.round(surfacePercentage);
}

/**
 * Calcula la tasa de repetición de temas
 */
export function calculateRepetitionRate(entries: { text: string }[]): number {
  if (entries.length < 2) return 0;

  const themes = entries.map((e) => extractMainTheme(e.text));
  const uniqueThemes = new Set(themes);

  // Si todos los temas son iguales = 100% repetición
  // Si todos son diferentes = 0% repetición
  const repetitionRate = (1 - uniqueThemes.size / themes.length) * 100;
  return Math.round(repetitionRate);
}

/**
 * Calcula el porcentaje de evitación de retos
 */
export function calculateChallengeAvoidance(
  challenges: { completed: boolean }[]
): number {
  if (challenges.length === 0) return 100; // Si no hay retos asignados = máxima evitación

  const completedCount = challenges.filter((c) => c.completed).length;
  const avoidanceRate = (1 - completedCount / challenges.length) * 100;

  return Math.round(avoidanceRate);
}

/**
 * Calcula el aplanamiento emocional
 */
export function calculateEmotionalFlatness(entries: { text: string }[]): number {
  const totalWords = entries.reduce(
    (acc, e) => acc + e.text.split(/\s+/).length,
    0
  );
  const intenseEmotionCount = entries.reduce((acc, e) => {
    const words = e.text.toLowerCase().split(/\s+/);
    return acc + words.filter((w) => INTENSE_EMOTIONS.includes(w)).length;
  }, 0);

  // Si hay menos de 1 palabra intensa por cada 100 palabras = alta flatness
  const emotionDensity = (intenseEmotionCount / totalWords) * 100;

  if (emotionDensity < 1) return 100; // Muy plano
  if (emotionDensity > 5) return 0; // Muy expresivo

  return Math.round(100 - (emotionDensity / 5) * 100);
}

/**
 * Verifica si hay alertas de resistencia
 */
export function checkResistanceTriggers(
  index: number,
  indicators: ResistanceIndicators
): ResistanceAlert[] {
  const alerts: ResistanceAlert[] = [];

  // Alerta crítica: Índice > 80
  if (index > 80) {
    alerts.push({
      type: "critical",
      message: "Usuario en riesgo de abandono. Resistencia crítica detectada.",
      suggested_action:
        "Activar módulo de Crisis. Enviar mensaje de contención.",
    });
  }

  // Alerta: No escribe hace más de 7 días
  if (indicators.entry_frequency > 7) {
    alerts.push({
      type: "warning",
      message: "Usuario inactivo por más de 7 días.",
      suggested_action: 'Enviar notificación push: "¿Qué está pasando?"',
    });
  }

  // Alerta: Evita todos los retos
  if (indicators.challenge_avoidance === 100) {
    alerts.push({
      type: "warning",
      message: "Usuario no ha completado ningún reto.",
      suggested_action:
        "Simplificar retos. Ofrecer opciones más accesibles.",
    });
  }

  // Alerta: Lenguaje superficial > 80%
  if (indicators.surface_language > 80) {
    alerts.push({
      type: "warning",
      message: "Usuario usa lenguaje evasivo y superficial.",
      suggested_action:
        "Claude debe hacer preguntas más específicas y profundas.",
    });
  }

  return alerts;
}

/**
 * Determina ajustes en la experiencia según el índice de resistencia
 */
export function determineExperienceAdjustments(
  index: number
): ExperienceAdjustments {
  if (index >= 80) {
    return {
      claude_tone: "empathetic",
      question_depth: "surface",
      challenge_difficulty: "easy",
      unlock_crisis_module: true,
    };
  }

  if (index >= 60) {
    return {
      claude_tone: "neutral",
      question_depth: "moderate",
      challenge_difficulty: "medium",
      unlock_crisis_module: false,
    };
  }

  if (index >= 40) {
    return {
      claude_tone: "neutral",
      question_depth: "deep",
      challenge_difficulty: "medium",
      unlock_crisis_module: false,
    };
  }

  return {
    claude_tone: "confrontational",
    question_depth: "deep",
    challenge_difficulty: "hard",
    unlock_crisis_module: false,
  };
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function normalizeEntryLength(avgLength: number): number {
  // Menos de 80 caracteres = alta resistencia (100)
  // Más de 500 caracteres = baja resistencia (0)
  if (avgLength < 80) return 100;
  if (avgLength > 500) return 0;
  return Math.round(100 - ((avgLength - 80) / 420) * 100);
}

function normalizeFrequency(daysSinceLastEntry: number): number {
  // Más de 7 días sin escribir = alta resistencia (100)
  // Menos de 1 día = baja resistencia (0)
  if (daysSinceLastEntry > 7) return 100;
  if (daysSinceLastEntry < 1) return 0;
  return Math.round((daysSinceLastEntry / 7) * 100);
}

function getResistanceLevel(index: number): Omit<
  ResistanceMetrics,
  "resistance_index" | "indicators"
> {
  if (index >= 81) {
    return {
      level: "Crítica",
      color: "#F44336",
      description:
        "El usuario está bloqueado o considerando abandonar.",
      suggested_action: "Activar protocolo de contención y re-encuadre.",
    };
  }

  if (index >= 61) {
    return {
      level: "Alta",
      color: "#FF9800",
      description:
        "El usuario está evadiendo activamente el trabajo de sombra.",
      suggested_action: "Activar protocolo de confrontación suave.",
    };
  }

  if (index >= 41) {
    return {
      level: "Moderada",
      color: "#FFC107",
      description:
        "El usuario está en la zona de confort, evitando profundizar.",
      suggested_action: "Introducir preguntas más confrontativas.",
    };
  }

  if (index >= 21) {
    return {
      level: "Baja",
      color: "#8BC34A",
      description: "El usuario muestra apertura con algunas reservas.",
      suggested_action: "Reforzar positivamente el progreso.",
    };
  }

  return {
    level: "Mínima",
    color: "#4CAF50",
    description: "El usuario está comprometido y abierto al proceso.",
    suggested_action: "Mantener el ritmo actual.",
  };
}

function extractMainTheme(text: string): string {
  const themeKeywords: Record<string, string[]> = {
    trabajo: ["trabajo", "jefe", "oficina", "empleo", "carrera"],
    pareja: ["pareja", "novio", "novia", "esposo", "esposa", "relación"],
    familia: [
      "padre",
      "madre",
      "hermano",
      "hermana",
      "familia",
      "papá",
      "mamá",
    ],
    dinero: ["dinero", "deuda", "pago", "económico", "financiero"],
    salud: ["salud", "enfermedad", "dolor", "médico", "hospital"],
  };

  const textLower = text.toLowerCase();

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some((keyword) => textLower.includes(keyword))) {
      return theme;
    }
  }

  return "otro";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
