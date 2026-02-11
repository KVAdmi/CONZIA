/**
 * MOTOR DE MEMORIA EVOLUTIVA
 * Construye contexto histórico para Claude usando entradas, patrones y traumas
 */

import type { ConziaArchetype } from "../types/models";

// =====================================================
// TIPOS
// =====================================================

export interface DesahogoEntry {
  id: string;
  text: string;
  shadow_traits?: string[];
  emotional_tone?: string;
  created_at: string;
}

export interface DetectedPattern {
  pattern_type: "projection" | "repetition" | "avoidance" | "trigger";
  description: string;
  frequency: number;
  last_seen_at: string;
}

export interface TraumaNode {
  theme: "abandono" | "rechazo" | "traición" | "humillación" | "invalidación";
  description: string;
  intensity: number; // 1-10
}

export interface AIMemory {
  memory_type:
    | "key_insight"
    | "recurring_theme"
    | "breakthrough"
    | "resistance_point";
  content: string;
  importance: number; // 1-5
}

export interface CurrentChallenge {
  shadow_archetype: ConziaArchetype;
  challenge_text: string;
  due_at: string;
}

export interface ClaudeContextPayload {
  user_profile: {
    id: string;
    days_in_program: number;
    current_month: 1 | 2 | 3;
    archetype_scores?: Record<ConziaArchetype, number>;
    dominant_archetype?: ConziaArchetype;
    shadow_archetype?: ConziaArchetype;
    resistance_index?: number;
  };
  recent_entries: {
    entry_id: string;
    text: string;
    created_at: string;
    shadow_traits?: string[];
    emotional_tone?: string;
  }[];
  active_patterns: {
    pattern_type: string;
    description: string;
    frequency: number;
  }[];
  trauma_nodes: {
    theme: string;
    description: string;
    intensity: number;
  }[];
  critical_memories: {
    memory_type: string;
    content: string;
    importance: number;
  }[];
  current_challenge?: {
    archetype: string;
    action: string;
    due_date: string;
  };
}

// =====================================================
// CONSTANTES
// =====================================================

const CONTEXT_LIMITS = {
  max_recent_entries: 7, // Máximo 7 entradas recientes
  max_entry_length: 500, // Máximo 500 caracteres por entrada
  max_patterns: 5, // Máximo 5 patrones activos
  max_trauma_nodes: 3, // Máximo 3 nodos de trauma
  max_critical_memories: 10, // Máximo 10 memorias críticas
  total_context_tokens: 4000, // Máximo ~4000 tokens de contexto
};

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Construye el payload completo de contexto para Claude
 */
export function buildClaudeContext(
  userId: string,
  daysInProgram: number,
  currentMonth: 1 | 2 | 3,
  recentEntries: DesahogoEntry[],
  activePatterns: DetectedPattern[],
  traumaNodes: TraumaNode[],
  criticalMemories: AIMemory[],
  currentChallenge?: CurrentChallenge,
  archetypeScores?: Record<ConziaArchetype, number>,
  dominantArchetype?: ConziaArchetype,
  shadowArchetype?: ConziaArchetype,
  resistanceIndex?: number
): ClaudeContextPayload {
  // Limitar cantidad de datos según CONTEXT_LIMITS
  const limitedEntries = recentEntries
    .slice(0, CONTEXT_LIMITS.max_recent_entries)
    .map((e) => ({
      entry_id: e.id,
      text: e.text.substring(0, CONTEXT_LIMITS.max_entry_length),
      created_at: e.created_at,
      shadow_traits: e.shadow_traits,
      emotional_tone: e.emotional_tone,
    }));

  const limitedPatterns = activePatterns
    .slice(0, CONTEXT_LIMITS.max_patterns)
    .map((p) => ({
      pattern_type: p.pattern_type,
      description: p.description,
      frequency: p.frequency,
    }));

  const limitedTraumas = traumaNodes
    .slice(0, CONTEXT_LIMITS.max_trauma_nodes)
    .map((t) => ({
      theme: t.theme,
      description: t.description,
      intensity: t.intensity,
    }));

  const limitedMemories = criticalMemories
    .slice(0, CONTEXT_LIMITS.max_critical_memories)
    .map((m) => ({
      memory_type: m.memory_type,
      content: m.content,
      importance: m.importance,
    }));

  return {
    user_profile: {
      id: userId,
      days_in_program: daysInProgram,
      current_month: currentMonth,
      archetype_scores: archetypeScores,
      dominant_archetype: dominantArchetype,
      shadow_archetype: shadowArchetype,
      resistance_index: resistanceIndex,
    },
    recent_entries: limitedEntries,
    active_patterns: limitedPatterns,
    trauma_nodes: limitedTraumas,
    critical_memories: limitedMemories,
    current_challenge: currentChallenge
      ? {
          archetype: currentChallenge.shadow_archetype,
          action: currentChallenge.challenge_text,
          due_date: currentChallenge.due_at,
        }
      : undefined,
  };
}

/**
 * Construye el texto de contexto para agregar al system prompt
 */
export function buildSystemPromptContext(
  context: ClaudeContextPayload
): string {
  let contextSection = "\n\n## CONTEXTO DEL USUARIO\n\n";

  // Arquetipos
  if (context.user_profile.dominant_archetype && context.user_profile.shadow_archetype) {
    contextSection += `**Arquetipos:**\n`;
    contextSection += `- Dominante: ${context.user_profile.dominant_archetype}`;
    if (context.user_profile.archetype_scores) {
      const score = context.user_profile.archetype_scores[context.user_profile.dominant_archetype];
      contextSection += ` (${score})`;
    }
    contextSection += `\n`;
    contextSection += `- Sombra: ${context.user_profile.shadow_archetype}`;
    if (context.user_profile.archetype_scores) {
      const score = context.user_profile.archetype_scores[context.user_profile.shadow_archetype];
      contextSection += ` (${score})`;
    }
    contextSection += `\n\n`;
  }

  // Patrones activos
  if (context.active_patterns.length > 0) {
    contextSection += `**Patrones Detectados:**\n`;
    context.active_patterns.forEach((p) => {
      contextSection += `- ${p.pattern_type}: ${p.description} (visto ${p.frequency} veces)\n`;
    });
    contextSection += "\n";
  }

  // Traumas
  if (context.trauma_nodes.length > 0) {
    contextSection += `**Nodos de Trauma:**\n`;
    context.trauma_nodes.forEach((t) => {
      contextSection += `- ${t.theme} (intensidad ${t.intensity}/10): ${t.description}\n`;
    });
    contextSection += "\n";
  }

  // Memorias críticas
  if (context.critical_memories.length > 0) {
    contextSection += `**Memorias Clave:**\n`;
    context.critical_memories.forEach((m) => {
      contextSection += `- ${m.content}\n`;
    });
    contextSection += "\n";
  }

  // Reto actual
  if (context.current_challenge) {
    contextSection += `**Reto Actual:**\n`;
    contextSection += `- Arquetipo: ${context.current_challenge.archetype}\n`;
    contextSection += `- Acción: ${context.current_challenge.action}\n`;
    contextSection += `- Vence: ${context.current_challenge.due_date}\n\n`;
  }

  // Resistencia
  if (context.user_profile.resistance_index !== undefined) {
    contextSection += `**Índice de Resistencia:** ${context.user_profile.resistance_index}/100\n`;
    if (context.user_profile.resistance_index > 60) {
      contextSection += `⚠️ El usuario está mostrando alta resistencia. Sé más empático y menos confrontativo.\n`;
    }
  }

  return contextSection;
}

/**
 * Detecta nuevos patrones en una entrada de texto
 */
export function detectNewPatterns(
  text: string,
  previousEntries: DesahogoEntry[]
): Partial<DetectedPattern>[] {
  const patterns: Partial<DetectedPattern>[] = [];

  // Detectar proyección (culpar a otros)
  const projectionKeywords = [
    "culpa de",
    "por su culpa",
    "me hizo",
    "me obligó",
    "siempre hace",
  ];
  if (projectionKeywords.some((kw) => text.toLowerCase().includes(kw))) {
    patterns.push({
      pattern_type: "projection",
      description: "Tendencia a culpar a otros por sus emociones o situaciones",
      frequency: 1,
    });
  }

  // Detectar evitación
  const avoidanceKeywords = [
    "no quiero pensar",
    "mejor no",
    "prefiero no hablar",
    "cambio de tema",
  ];
  if (avoidanceKeywords.some((kw) => text.toLowerCase().includes(kw))) {
    patterns.push({
      pattern_type: "avoidance",
      description: "Evita profundizar en temas incómodos",
      frequency: 1,
    });
  }

  // Detectar repetición (comparar con entradas anteriores)
  const currentTheme = extractTheme(text);
  const previousThemes = previousEntries.map((e) => extractTheme(e.text));
  const repetitionCount = previousThemes.filter((t) => t === currentTheme).length;

  if (repetitionCount >= 3) {
    patterns.push({
      pattern_type: "repetition",
      description: `Repite constantemente el tema: ${currentTheme}`,
      frequency: repetitionCount,
    });
  }

  return patterns;
}

/**
 * Detecta nodos de trauma en una entrada de texto
 */
export function detectTraumaNodes(text: string): Partial<TraumaNode>[] {
  const nodes: Partial<TraumaNode>[] = [];

  const traumaKeywords: Record<string, string[]> = {
    abandono: ["me dejó", "me abandonó", "se fue", "me dejaron solo"],
    rechazo: ["me rechazó", "no me quiere", "no soy suficiente", "me ignoró"],
    traición: ["me traicionó", "me mintió", "me engañó", "me fue infiel"],
    humillación: [
      "me humilló",
      "me ridiculizó",
      "se burlaron",
      "me avergonzó",
    ],
    invalidación: [
      "no me escucha",
      "no me cree",
      "minimiza",
      "no importa lo que siento",
    ],
  };

  for (const [theme, keywords] of Object.entries(traumaKeywords)) {
    if (keywords.some((kw) => text.toLowerCase().includes(kw))) {
      nodes.push({
        theme: theme as TraumaNode["theme"],
        description: `Menciona experiencias de ${theme}`,
        intensity: 5, // Intensidad por defecto, se puede ajustar
      });
    }
  }

  return nodes;
}

/**
 * Extrae insights clave de una respuesta de Claude
 */
export function extractInsights(claudeResponse: string): Partial<AIMemory>[] {
  const insights: Partial<AIMemory>[] = [];

  // Detectar breakthroughs (palabras clave de avance)
  const breakthroughKeywords = [
    "me di cuenta",
    "ahora veo",
    "entiendo que",
    "por primera vez",
  ];
  if (
    breakthroughKeywords.some((kw) =>
      claudeResponse.toLowerCase().includes(kw)
    )
  ) {
    insights.push({
      memory_type: "breakthrough",
      content: claudeResponse.substring(0, 200),
      importance: 5,
    });
  }

  // Detectar insights clave (preguntas profundas de Claude)
  if (claudeResponse.includes("?") && claudeResponse.length > 100) {
    insights.push({
      memory_type: "key_insight",
      content: claudeResponse.substring(0, 200),
      importance: 4,
    });
  }

  return insights;
}

/**
 * Estima tokens de un texto (aproximación)
 */
export function estimateTokens(text: string): number {
  // Aproximación: 1 token ≈ 4 caracteres en español
  return Math.ceil(text.length / 4);
}

/**
 * Recorta el contexto si excede el límite de tokens
 */
export function trimContextIfNeeded(
  context: ClaudeContextPayload
): ClaudeContextPayload {
  let totalTokens = estimateTokens(JSON.stringify(context));

  if (totalTokens > CONTEXT_LIMITS.total_context_tokens) {
    // Recortar entradas recientes
    context.recent_entries = context.recent_entries.slice(0, 5);

    // Recortar patrones
    context.active_patterns = context.active_patterns.slice(0, 3);

    // Recortar memorias
    context.critical_memories = context.critical_memories.slice(0, 5);
  }

  return context;
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function extractTheme(text: string): string {
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

  return "general";
}
