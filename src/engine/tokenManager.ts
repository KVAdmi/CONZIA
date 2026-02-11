/**
 * TOKEN MANAGER
 * Control de tokens y sistema de resumen automático de memoria
 * Previene explosión de costos de IA
 */

import type { DesahogoEntry, DetectedPattern, TraumaNode, AIMemory } from "./memoryEngine";

// =====================================================
// CONSTANTES
// =====================================================

export const MAX_CONTEXT_TOKENS = 4000;
export const TOKENS_PER_ENTRY = 150;
export const TOKENS_PER_PATTERN = 50;
export const TOKENS_PER_TRAUMA = 75;
export const TOKENS_PER_MEMORY = 100;
export const SUMMARY_INTERVAL_ENTRIES = 10;
export const COMPRESSION_INTERVAL_DAYS = 30;

// =====================================================
// TIPOS
// =====================================================

export interface TokenBudget {
  total: number;
  used: number;
  remaining: number;
  breakdown: {
    entries: number;
    patterns: number;
    traumas: number;
    memories: number;
    metadata: number;
  };
}

export interface ContextPriority {
  entries: DesahogoEntry[];
  patterns: DetectedPattern[];
  traumas: TraumaNode[];
  memories: AIMemory[];
  total_tokens: number;
}

export interface SummaryRequest {
  profile_id: string;
  entries: DesahogoEntry[];
  entry_count: number;
}

export interface CompressionRequest {
  profile_id: string;
  memories: AIMemory[];
  theme: string;
}

// =====================================================
// FUNCIONES DE ESTIMACIÓN DE TOKENS
// =====================================================

/**
 * Estima tokens de un texto (aproximación simple)
 */
export function estimateTokens(text: string): number {
  // Aproximación: 1 token ≈ 4 caracteres en español
  return Math.ceil(text.length / 4);
}

/**
 * Estima tokens de una entrada de desahogo
 */
export function estimateEntryTokens(entry: DesahogoEntry): number {
  let tokens = estimateTokens(entry.text);
  
  // Agregar tokens de metadatos
  if (entry.shadow_traits && entry.shadow_traits.length > 0) {
    tokens += entry.shadow_traits.length * 5;
  }
  
  if (entry.emotional_tone) {
    tokens += 5;
  }
  
  return tokens;
}

/**
 * Estima tokens de un patrón
 */
export function estimatePatternTokens(pattern: DetectedPattern): number {
  return estimateTokens(pattern.description) + 10; // +10 por metadatos
}

/**
 * Estima tokens de un trauma node
 */
export function estimateTraumaTokens(trauma: TraumaNode): number {
  return estimateTokens(trauma.description) + 15; // +15 por metadatos
}

/**
 * Estima tokens de una memoria
 */
export function estimateMemoryTokens(memory: AIMemory): number {
  return estimateTokens(memory.content) + 10; // +10 por metadatos
}

// =====================================================
// CONSTRUCCIÓN DE CONTEXTO CON PRESUPUESTO
// =====================================================

/**
 * Construye contexto respetando el límite de tokens
 */
export function buildContextWithBudget(
  entries: DesahogoEntry[],
  patterns: DetectedPattern[],
  traumas: TraumaNode[],
  memories: AIMemory[],
  maxTokens: number = MAX_CONTEXT_TOKENS
): ContextPriority {
  const result: ContextPriority = {
    entries: [],
    patterns: [],
    traumas: [],
    memories: [],
    total_tokens: 0,
  };

  let remainingTokens = maxTokens;

  // PASO 1: Agregar entradas recientes (prioridad alta)
  // Máximo 7 entradas, pero respetando el límite de tokens
  const sortedEntries = [...entries]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 7);

  for (const entry of sortedEntries) {
    const tokens = estimateEntryTokens(entry);
    if (remainingTokens - tokens >= 0) {
      result.entries.push(entry);
      remainingTokens -= tokens;
      result.total_tokens += tokens;
    } else {
      break;
    }
  }

  // PASO 2: Agregar patrones (prioridad media)
  // Máximo 5 patrones por frecuencia
  const sortedPatterns = [...patterns]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  for (const pattern of sortedPatterns) {
    const tokens = estimatePatternTokens(pattern);
    if (remainingTokens - tokens >= 0) {
      result.patterns.push(pattern);
      remainingTokens -= tokens;
      result.total_tokens += tokens;
    } else {
      break;
    }
  }

  // PASO 3: Agregar traumas (prioridad alta)
  // Máximo 3 traumas por intensidad
  const sortedTraumas = [...traumas]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3);

  for (const trauma of sortedTraumas) {
    const tokens = estimateTraumaTokens(trauma);
    if (remainingTokens - tokens >= 0) {
      result.traumas.push(trauma);
      remainingTokens -= tokens;
      result.total_tokens += tokens;
    } else {
      break;
    }
  }

  // PASO 4: Agregar memorias críticas (prioridad media-alta)
  // Máximo 10 memorias por importancia
  const sortedMemories = [...memories]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10);

  for (const memory of sortedMemories) {
    const tokens = estimateMemoryTokens(memory);
    if (remainingTokens - tokens >= 0) {
      result.memories.push(memory);
      remainingTokens -= tokens;
      result.total_tokens += tokens;
    } else {
      break;
    }
  }

  return result;
}

/**
 * Calcula presupuesto de tokens
 */
export function calculateTokenBudget(
  entries: DesahogoEntry[],
  patterns: DetectedPattern[],
  traumas: TraumaNode[],
  memories: AIMemory[]
): TokenBudget {
  const breakdown = {
    entries: entries.reduce((sum, e) => sum + estimateEntryTokens(e), 0),
    patterns: patterns.reduce((sum, p) => sum + estimatePatternTokens(p), 0),
    traumas: traumas.reduce((sum, t) => sum + estimateTraumaTokens(t), 0),
    memories: memories.reduce((sum, m) => sum + estimateMemoryTokens(m), 0),
    metadata: 100, // Tokens para metadatos del sistema
  };

  const used = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return {
    total: MAX_CONTEXT_TOKENS,
    used,
    remaining: MAX_CONTEXT_TOKENS - used,
    breakdown,
  };
}

// =====================================================
// SISTEMA DE RESUMEN AUTOMÁTICO
// =====================================================

/**
 * Verifica si es necesario generar un resumen
 */
export function shouldGenerateSummary(entryCount: number): boolean {
  return entryCount % SUMMARY_INTERVAL_ENTRIES === 0;
}

/**
 * Genera un resumen de múltiples entradas
 * (Esta función debe llamar a Claude para generar el resumen)
 */
export async function generateSummary(
  entries: DesahogoEntry[]
): Promise<string> {
  // TODO: Implementar llamada a Claude para generar resumen
  
  // Por ahora, generamos un resumen simple basado en patrones
  const themes = new Set<string>();
  const emotions = new Set<string>();
  
  for (const entry of entries) {
    // Los temas se extraerían del análisis de IA
    // if (entry.pattern_tag) themes.add(entry.pattern_tag);
    if (entry.emotional_tone) emotions.add(entry.emotional_tone);
  }

  const summary = `
Resumen de ${entries.length} entradas:
- Temas recurrentes: ${Array.from(themes).join(", ")}
- Emociones predominantes: ${Array.from(emotions).join(", ")}
- Período: ${entries[entries.length - 1].created_at} a ${entries[0].created_at}
  `.trim();

  return summary;
}

/**
 * Crea una solicitud de resumen
 */
export function createSummaryRequest(
  profile_id: string,
  entries: DesahogoEntry[]
): SummaryRequest {
  return {
    profile_id,
    entries,
    entry_count: entries.length,
  };
}

// =====================================================
// SISTEMA DE COMPRESIÓN DE MEMORIA
// =====================================================

/**
 * Verifica si es necesario comprimir memorias
 */
export function shouldCompressMemories(daysSinceStart: number): boolean {
  return daysSinceStart % COMPRESSION_INTERVAL_DAYS === 0;
}

/**
 * Agrupa memorias por tema
 */
export function groupMemoriesByTheme(memories: AIMemory[]): Map<string, AIMemory[]> {
  const grouped = new Map<string, AIMemory[]>();

  for (const memory of memories) {
    // Extraer tema del contenido (simplificado)
    const theme = extractThemeFromMemory(memory);
    
    if (!grouped.has(theme)) {
      grouped.set(theme, []);
    }
    
    grouped.get(theme)!.push(memory);
  }

  return grouped;
}

/**
 * Extrae tema de una memoria (heurística simple)
 */
function extractThemeFromMemory(memory: AIMemory): string {
  const content = memory.content.toLowerCase();
  
  if (content.includes("relacion") || content.includes("pareja")) return "relaciones";
  if (content.includes("trabajo") || content.includes("laboral")) return "trabajo";
  if (content.includes("familia") || content.includes("padre") || content.includes("madre")) return "familia";
  if (content.includes("miedo") || content.includes("ansiedad")) return "miedos";
  if (content.includes("culpa") || content.includes("verguenza")) return "culpa";
  
  return "general";
}

/**
 * Genera un meta-resumen de múltiples memorias
 */
export async function generateMetaSummary(
  memories: AIMemory[]
): Promise<string> {
  // TODO: Implementar llamada a Claude para generar meta-resumen
  
  // Por ahora, generamos un meta-resumen simple
  const metaSummary = `
Meta-resumen de ${memories.length} memorias:
- Importancia promedio: ${memories.reduce((sum, m) => sum + m.importance, 0) / memories.length}
- Insights clave: [Requiere procesamiento por IA]
  `.trim();

  return metaSummary;
}

/**
 * Crea una solicitud de compresión
 */
export function createCompressionRequest(
  profile_id: string,
  memories: AIMemory[],
  theme: string
): CompressionRequest {
  return {
    profile_id,
    memories,
    theme,
  };
}

// =====================================================
// MODO LITE VS FULL
// =====================================================

/**
 * Construye contexto LITE (para interacciones rápidas)
 */
export function buildContextLite(
  entries: DesahogoEntry[],
  currentChallenge?: any
): string {
  // Solo las últimas 3 entradas + reto actual
  const recentEntries = entries.slice(0, 3);
  
  let context = "## Contexto Reciente (Lite)\n\n";
  
  for (const entry of recentEntries) {
    context += `- ${entry.emotional_tone}: "${entry.text.substring(0, 100)}..."\n`;
  }
  
  if (currentChallenge) {
    context += `\n## Reto Actual\n${currentChallenge.challenge_text}\n`;
  }
  
  return context;
}

/**
 * Construye contexto FULL (para análisis profundo)
 */
export function buildContextFull(
  entries: DesahogoEntry[],
  patterns: DetectedPattern[],
  traumas: TraumaNode[],
  memories: AIMemory[],
  currentChallenge?: any,
  archetypeScores?: any
): string {
  const prioritized = buildContextWithBudget(entries, patterns, traumas, memories);
  
  let context = "## Contexto Completo (Full)\n\n";
  
  // Entradas
  context += "### Entradas Recientes\n";
  for (const entry of prioritized.entries) {
    context += `- [${entry.created_at}] ${entry.emotional_tone}: "${entry.text}"\n`;
  }
  
  // Patrones
  if (prioritized.patterns.length > 0) {
    context += "\n### Patrones Detectados\n";
    for (const pattern of prioritized.patterns) {
      context += `- ${pattern.pattern_type} (frecuencia: ${pattern.frequency}): ${pattern.description}\n`;
    }
  }
  
  // Traumas
  if (prioritized.traumas.length > 0) {
    context += "\n### Nodos de Trauma\n";
    for (const trauma of prioritized.traumas) {
      context += `- ${trauma.theme} (intensidad: ${trauma.intensity}): ${trauma.description}\n`;
    }
  }
  
  // Memorias
  if (prioritized.memories.length > 0) {
    context += "\n### Memorias Críticas\n";
    for (const memory of prioritized.memories) {
      context += `- [${memory.memory_type}] ${memory.content}\n`;
    }
  }
  
  // Reto actual
  if (currentChallenge) {
    context += `\n### Reto Actual\n`;
    context += `Arquetipo: ${currentChallenge.shadow_archetype}\n`;
    context += `${currentChallenge.challenge_text}\n`;
  }
  
  // Scores de arquetipos
  if (archetypeScores) {
    context += `\n### Arquetipos Actuales\n`;
    context += `- Guerrero: ${archetypeScores.guerrero}\n`;
    context += `- Rey: ${archetypeScores.rey}\n`;
    context += `- Amante: ${archetypeScores.amante}\n`;
    context += `- Mago: ${archetypeScores.mago}\n`;
    context += `- Dominante: ${archetypeScores.dominant}\n`;
    context += `- En Sombra: ${archetypeScores.shadow}\n`;
  }
  
  context += `\n---\n**Tokens usados:** ${prioritized.total_tokens} / ${MAX_CONTEXT_TOKENS}\n`;
  
  return context;
}

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Verifica si el contexto excede el límite de tokens
 */
export function isContextOverBudget(
  entries: DesahogoEntry[],
  patterns: DetectedPattern[],
  traumas: TraumaNode[],
  memories: AIMemory[]
): boolean {
  const budget = calculateTokenBudget(entries, patterns, traumas, memories);
  return budget.used > MAX_CONTEXT_TOKENS;
}

/**
 * Obtiene estadísticas de uso de tokens
 */
export function getTokenStats(
  entries: DesahogoEntry[],
  patterns: DetectedPattern[],
  traumas: TraumaNode[],
  memories: AIMemory[]
): {
  total_items: number;
  total_tokens: number;
  percentage_used: number;
  is_over_budget: boolean;
} {
  const budget = calculateTokenBudget(entries, patterns, traumas, memories);
  
  return {
    total_items: entries.length + patterns.length + traumas.length + memories.length,
    total_tokens: budget.used,
    percentage_used: (budget.used / budget.total) * 100,
    is_over_budget: budget.used > budget.total,
  };
}
