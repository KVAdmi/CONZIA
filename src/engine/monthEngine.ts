/**
 * MOTOR DE SISTEMA DE MES (1, 2, 3)
 * Determina la fase terapéutica del usuario y genera el system prompt correspondiente
 * Alineado con: ConziaProfile, ConziaGuidanceProfile en models.ts
 */

// =====================================================
// TIPOS
// =====================================================

export interface UserMonthStatus {
  current_month: 1 | 2 | 3;
  days_in_program: number;
  phase_name: "Catarsis" | "Elucidación" | "Integración";
  days_until_next_phase: number;
  program_completion_percentage: number;
}

export interface PhaseTransition {
  trigger_day: number;
  from_phase: string;
  to_phase: string;
  unlock_features: string[];
  system_prompt_change: boolean;
  notification_message: string;
}

// =====================================================
// CONSTANTES
// =====================================================

const PHASE_TRANSITIONS: PhaseTransition[] = [
  {
    trigger_day: 30,
    from_phase: "Catarsis",
    to_phase: "Elucidación",
    unlock_features: [
      "dream_interpretation",
      "pattern_analysis",
      "mirror_stories",
    ],
    system_prompt_change: true,
    notification_message:
      "Has completado el Mes 1: Catarsis. Ahora entramos en la fase de Elucidación, donde analizaremos los patrones que has revelado.",
  },
  {
    trigger_day: 60,
    from_phase: "Elucidación",
    to_phase: "Integración",
    unlock_features: [
      "advanced_challenges",
      "integration_rituals",
      "final_assessment",
    ],
    system_prompt_change: true,
    notification_message:
      "Has completado el Mes 2: Elucidación. Ahora entramos en la fase de Integración, donde llevarás tu trabajo interno al mundo real.",
  },
];

const SYSTEM_PROMPTS: Record<1 | 2 | 3, string> = {
  1: `Eres un analista junguiano en la fase de CATARSIS (Mes 1/3).

Tu rol es ser un ESPEJO. No interpretes, no aconsejes, no consueles.

Tu tarea:
1. Escucha sin juicio.
2. Refleja lo que el usuario dice, usando sus propias palabras.
3. Haz UNA pregunta profunda que lo lleve más adentro.
4. Valida la emoción sin minimizarla.

Tono: Cálido pero directo. No uses frases como "entiendo que..." o "debe ser difícil...". Usa frases como "Dijiste X. ¿Qué hay detrás de eso?"

NUNCA des soluciones. NUNCA digas "todo estará bien". Tu trabajo es que el usuario SIENTA, no que se sienta mejor.

Mes actual: 1 (Catarsis)`,

  2: `Eres un analista junguiano en la fase de ELUCIDACIÓN (Mes 2/3).

Tu rol es ser un GUÍA. Ahora sí interpretas, conectas patrones, analizas símbolos.

Tu tarea:
1. Identifica patrones repetitivos en las entradas del usuario.
2. Conecta eventos del pasado con el presente.
3. Analiza sueños usando simbolismo junguiano.
4. Confronta las contradicciones del usuario con compasión.

Tono: Analítico pero humano. Usa frases como "He notado que cada vez que hablas de X, aparece Y. ¿Ves la conexión?"

Puedes ser más directo que en el Mes 1. Si el usuario está evadiendo, señálalo.

Mes actual: 2 (Elucidación)`,

  3: `Eres un analista junguiano en la fase de INTEGRACIÓN (Mes 3/3).

Tu rol es ser un MENTOR. Ahora asignas retos concretos en el mundo real.

Tu tarea:
1. Diseñar acciones específicas basadas en el arquetipo más débil.
2. Validar el progreso del usuario en sus retos.
3. Preparar al usuario para el cierre del programa.
4. Reforzar los aprendizajes clave de los 90 días.

Tono: Firme pero alentador. Usa frases como "Es momento de llevar esto al mundo real. Tu reto esta semana es..."

No permitas que el usuario se quede en la reflexión. Empújalo a la acción.

Mes actual: 3 (Integración)`,
};

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Determina el mes actual del usuario basándose en program_start_date
 */
export function determineCurrentMonth(
  programStartDate: string | Date
): UserMonthStatus {
  const startDate = new Date(programStartDate);
  const now = new Date();
  const daysSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let current_month: 1 | 2 | 3;
  let phase_name: "Catarsis" | "Elucidación" | "Integración";
  let days_until_next_phase: number;

  if (daysSinceStart < 30) {
    current_month = 1;
    phase_name = "Catarsis";
    days_until_next_phase = 30 - daysSinceStart;
  } else if (daysSinceStart < 60) {
    current_month = 2;
    phase_name = "Elucidación";
    days_until_next_phase = 60 - daysSinceStart;
  } else {
    current_month = 3;
    phase_name = "Integración";
    days_until_next_phase = 90 - daysSinceStart;
  }

  const completion = Math.round((daysSinceStart / 90) * 100);

  return {
    current_month,
    days_in_program: daysSinceStart,
    phase_name,
    days_until_next_phase: Math.max(0, days_until_next_phase),
    program_completion_percentage: Math.min(100, completion),
  };
}

/**
 * Obtiene el system prompt correspondiente al mes actual
 */
export function getSystemPrompt(
  month: 1 | 2 | 3,
  daysUntilNextPhase?: number
): string {
  let prompt = SYSTEM_PROMPTS[month];

  // Agregar días restantes si se proporciona
  if (daysUntilNextPhase !== undefined) {
    prompt = prompt.replace(
      /Mes actual: \d/,
      `Mes actual: ${month}\nDías restantes en esta fase: ${daysUntilNextPhase}`
    );
  }

  return prompt;
}

/**
 * Verifica si hay una transición de fase pendiente
 */
export function checkPhaseTransition(
  daysInProgram: number
): PhaseTransition | null {
  return (
    PHASE_TRANSITIONS.find((t) => t.trigger_day === daysInProgram) || null
  );
}

/**
 * Valida la integridad del programa (prevenir evasión)
 */
export function validateProgramIntegrity(
  programStartDate: string | Date,
  currentMonth: number
): boolean {
  const startDate = new Date(programStartDate);
  const now = new Date();

  // Validación 1: La fecha de inicio no puede ser en el futuro
  if (startDate > now) {
    console.error("Program start date is in the future");
    return false;
  }

  // Validación 2: El programa no puede durar más de 90 días sin renovación
  const daysSinceStart =
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceStart > 90) {
    console.warn("Program has exceeded 90 days");
    return false;
  }

  // Validación 3: Verificar que el mes almacenado coincide con el calculado
  const calculatedMonth = determineCurrentMonth(programStartDate).current_month;
  if (currentMonth !== calculatedMonth) {
    console.warn(
      `Month mismatch: stored=${currentMonth}, calculated=${calculatedMonth}`
    );
    return false;
  }

  return true;
}

/**
 * Construye el contexto completo para Claude incluyendo el mes
 */
export function buildClaudeContext(
  month: 1 | 2 | 3,
  daysInProgram: number,
  additionalContext?: Record<string, any>
): string {
  const monthStatus = {
    current_month: month,
    days_in_program: daysInProgram,
    phase_name:
      month === 1 ? "Catarsis" : month === 2 ? "Elucidación" : "Integración",
  };

  let context = `\n\n## CONTEXTO DEL USUARIO\n\n`;
  context += `**Mes actual:** ${monthStatus.current_month} (${monthStatus.phase_name})\n`;
  context += `**Días en el programa:** ${monthStatus.days_in_program}/90\n\n`;

  if (additionalContext) {
    for (const [key, value] of Object.entries(additionalContext)) {
      context += `**${key}:** ${JSON.stringify(value)}\n`;
    }
  }

  return context;
}

/**
 * Obtiene el system prompt con fallback en caso de error
 */
export function getSystemPromptWithFallback(
  programStartDate: string | Date
): string {
  try {
    const monthStatus = determineCurrentMonth(programStartDate);
    return getSystemPrompt(
      monthStatus.current_month,
      monthStatus.days_until_next_phase
    );
  } catch (error) {
    console.error("Failed to determine current month:", error);

    // FALLBACK: Usar prompt genérico pero seguro
    return `Eres un analista junguiano. El usuario está en un proceso de integración de sombra. 
    Escucha con atención y haz preguntas profundas. No des consejos superficiales.`;
  }
}

/**
 * Genera mensaje de bienvenida según el mes
 */
export function getWelcomeMessage(month: 1 | 2 | 3): string {
  const messages = {
    1: "Bienvenido al Mes 1: Catarsis. Este es un espacio seguro para que expreses lo que has estado guardando. No hay juicios aquí.",
    2: "Bienvenido al Mes 2: Elucidación. Ahora vamos a conectar los puntos. ¿Qué patrones estás empezando a ver?",
    3: "Bienvenido al Mes 3: Integración. Es momento de llevar tu trabajo interno al mundo real. ¿Estás listo para actuar?",
  };

  return messages[month];
}

/**
 * Determina si una feature está desbloqueada según el mes
 */
export function isFeatureUnlocked(
  feature: string,
  currentMonth: number
): boolean {
  const featureUnlockMap: Record<string, number> = {
    desahogo: 1,
    consultorio: 1,
    mesa: 1,
    observacion: 1,
    dream_interpretation: 2,
    pattern_analysis: 2,
    mirror_stories: 2,
    advanced_challenges: 3,
    integration_rituals: 3,
    final_assessment: 3,
  };

  const unlockMonth = featureUnlockMap[feature];
  return unlockMonth ? currentMonth >= unlockMonth : false;
}
