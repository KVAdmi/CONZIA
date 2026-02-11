/**
 * MOTORES DE CONZIA
 * Exporta todos los motores críticos para uso en la aplicación
 */

export * from "./archetypeEngine";
export * from "./resistanceEngine";
export * from "./challengeEngine";
export * from "./tokenManager";
export * from "./temporalGuard";
export * from "./crisisProtocol";

// Month engine exports (con alias para evitar conflicto)
export {
  determineCurrentMonth,
  getSystemPrompt,
  checkPhaseTransition,
  validateProgramIntegrity,
  getWelcomeMessage,
  isFeatureUnlocked,
  buildClaudeContext as buildMonthClaudeContext,
  type UserMonthStatus,
  type PhaseTransition,
} from "./monthEngine";

// Memory engine exports (con alias para evitar conflicto)
export {
  buildClaudeContext as buildMemoryClaudeContext,
  buildSystemPromptContext,
  detectNewPatterns,
  detectTraumaNodes,
  extractInsights,
  estimateTokens,
  trimContextIfNeeded,
  type ClaudeContextPayload,
  type DesahogoEntry,
  type DetectedPattern,
  type TraumaNode,
  type AIMemory,
  type CurrentChallenge,
} from "./memoryEngine";
