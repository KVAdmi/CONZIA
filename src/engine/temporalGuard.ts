/**
 * TEMPORAL GUARD
 * Sistema de gestión temporal sólida
 * Protege contra manipulación de fechas y maneja usuarios que regresan
 */

// =====================================================
// TIPOS
// =====================================================

export interface ProgramStatus {
  profile_id: string;
  program_start_date: string;
  current_date: string;
  days_in_program: number;
  current_month: 1 | 2 | 3;
  phase: "Catarsis" | "Elucidación" | "Integración";
  days_until_next_phase: number;
  program_completed: boolean;
  is_valid: boolean;
  warnings: string[];
}

export interface TemporalAnomaly {
  type: "date_manipulation" | "time_travel" | "inconsistent_activity" | "program_restart";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  detected_at: string;
  suggested_action: string;
}

export interface ReturnedUserStatus {
  days_since_last_entry: number;
  is_long_absence: boolean;
  degradation_applied: boolean;
  welcome_message: string;
  should_recalculate_month: boolean;
}

// =====================================================
// CONSTANTES
// =====================================================

const PROGRAM_DURATION_DAYS = 90;
const PHASE_1_DAYS = 30;
const PHASE_2_DAYS = 30;
const PHASE_3_DAYS = 30;
const LONG_ABSENCE_THRESHOLD_DAYS = 30;
const MAX_ALLOWED_TIME_DIFF_SECONDS = 300; // 5 minutos de tolerancia

// =====================================================
// FUNCIONES DE VALIDACIÓN TEMPORAL
// =====================================================

/**
 * Obtiene la fecha del servidor (no confiar en cliente)
 */
export function getServerTime(): Date {
  return new Date();
}

/**
 * Valida que program_start_date no haya cambiado
 */
export function validateProgramStartDate(
  storedStartDate: string,
  currentStartDate: string
): TemporalAnomaly | null {
  if (storedStartDate !== currentStartDate) {
    return {
      type: "date_manipulation",
      severity: "critical",
      message: `Program start date cambió de ${storedStartDate} a ${currentStartDate}`,
      detected_at: new Date().toISOString(),
      suggested_action: "Restaurar fecha original y bloquear cuenta temporalmente",
    };
  }
  
  return null;
}

/**
 * Valida que current_date no retroceda
 */
export function validateTimeProgression(
  lastActivityDate: string,
  currentDate: string
): TemporalAnomaly | null {
  const last = new Date(lastActivityDate);
  const current = new Date(currentDate);
  
  if (current < last) {
    return {
      type: "time_travel",
      severity: "critical",
      message: `Current date (${currentDate}) es anterior a last activity (${lastActivityDate})`,
      detected_at: new Date().toISOString(),
      suggested_action: "Usar server time en lugar de client time",
    };
  }
  
  return null;
}

/**
 * Valida que la diferencia entre client time y server time sea razonable
 */
export function validateClientServerTimeDiff(
  clientTime: string,
  serverTime: Date = getServerTime()
): TemporalAnomaly | null {
  const client = new Date(clientTime);
  const diffSeconds = Math.abs((serverTime.getTime() - client.getTime()) / 1000);
  
  if (diffSeconds > MAX_ALLOWED_TIME_DIFF_SECONDS) {
    return {
      type: "inconsistent_activity",
      severity: "medium",
      message: `Diferencia de ${diffSeconds}s entre client y server time`,
      detected_at: serverTime.toISOString(),
      suggested_action: "Usar server time para todas las operaciones críticas",
    };
  }
  
  return null;
}

/**
 * Detecta si el usuario intentó reiniciar el programa
 */
export function detectProgramRestart(
  programStartDate: string,
  accountCreatedDate: string
): TemporalAnomaly | null {
  const start = new Date(programStartDate);
  const created = new Date(accountCreatedDate);
  
  const daysDiff = Math.floor((start.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  
  // Si program_start_date es más de 7 días después de account creation
  // podría indicar un intento de reinicio
  if (daysDiff > 7) {
    return {
      type: "program_restart",
      severity: "high",
      message: `Program start date es ${daysDiff} días después de account creation`,
      detected_at: new Date().toISOString(),
      suggested_action: "Verificar manualmente con el usuario",
    };
  }
  
  return null;
}

// =====================================================
// CÁLCULO DE ESTADO DEL PROGRAMA
// =====================================================

/**
 * Calcula el estado actual del programa del usuario
 */
export function calculateProgramStatus(
  profile_id: string,
  program_start_date: string,
  last_activity_at: string,
  stored_start_date?: string
): ProgramStatus {
  const warnings: string[] = [];
  const serverTime = getServerTime();
  const currentDate = serverTime.toISOString();
  
  // Validaciones
  if (stored_start_date) {
    const anomaly = validateProgramStartDate(stored_start_date, program_start_date);
    if (anomaly) {
      warnings.push(anomaly.message);
    }
  }
  
  const timeAnomaly = validateTimeProgression(last_activity_at, currentDate);
  if (timeAnomaly) {
    warnings.push(timeAnomaly.message);
  }
  
  // Calcular días en el programa
  const startDate = new Date(program_start_date);
  const daysInProgram = Math.floor((serverTime.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determinar mes actual
  let current_month: 1 | 2 | 3;
  let phase: "Catarsis" | "Elucidación" | "Integración";
  let days_until_next_phase: number;
  
  if (daysInProgram < PHASE_1_DAYS) {
    current_month = 1;
    phase = "Catarsis";
    days_until_next_phase = PHASE_1_DAYS - daysInProgram;
  } else if (daysInProgram < PHASE_1_DAYS + PHASE_2_DAYS) {
    current_month = 2;
    phase = "Elucidación";
    days_until_next_phase = (PHASE_1_DAYS + PHASE_2_DAYS) - daysInProgram;
  } else if (daysInProgram < PROGRAM_DURATION_DAYS) {
    current_month = 3;
    phase = "Integración";
    days_until_next_phase = PROGRAM_DURATION_DAYS - daysInProgram;
  } else {
    current_month = 3;
    phase = "Integración";
    days_until_next_phase = 0;
  }
  
  const program_completed = daysInProgram >= PROGRAM_DURATION_DAYS;
  const is_valid = warnings.length === 0;
  
  return {
    profile_id,
    program_start_date,
    current_date: currentDate,
    days_in_program: daysInProgram,
    current_month,
    phase,
    days_until_next_phase,
    program_completed,
    is_valid,
    warnings,
  };
}

// =====================================================
// MANEJO DE USUARIOS QUE REGRESAN
// =====================================================

/**
 * Maneja el caso de un usuario que regresa después de ausencia
 */
export function handleReturnedUser(
  last_activity_at: string,
  program_start_date: string
): ReturnedUserStatus {
  const serverTime = getServerTime();
  const lastActivity = new Date(last_activity_at);
  
  const daysSinceLastEntry = Math.floor(
    (serverTime.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const isLongAbsence = daysSinceLastEntry > LONG_ABSENCE_THRESHOLD_DAYS;
  
  let welcomeMessage: string;
  let degradationApplied = false;
  
  if (isLongAbsence) {
    welcomeMessage = `Bienvenido de vuelta. Han pasado ${daysSinceLastEntry} días desde tu última entrada. 
El programa no se "pausa", así que vamos a retomar desde donde lo dejaste y recalcular tu progreso.`;
    degradationApplied = true;
  } else if (daysSinceLastEntry > 7) {
    welcomeMessage = `Bienvenido de vuelta. Han pasado ${daysSinceLastEntry} días. 
Es importante mantener la consistencia para aprovechar mejor el proceso.`;
  } else {
    welcomeMessage = "Bienvenido de vuelta.";
  }
  
  // Siempre recalcular el mes actual (el programa no se pausa)
  const shouldRecalculateMonth = true;
  
  return {
    days_since_last_entry: daysSinceLastEntry,
    is_long_absence: isLongAbsence,
    degradation_applied: degradationApplied,
    welcome_message: welcomeMessage,
    should_recalculate_month: shouldRecalculateMonth,
  };
}

/**
 * Calcula la degradación de scores por inactividad
 */
export function calculateInactivityDegradation(
  daysSinceLastEntry: number,
  currentScores: { guerrero: number; rey: number; amante: number; mago: number }
): { guerrero: number; rey: number; amante: number; mago: number } {
  if (daysSinceLastEntry <= LONG_ABSENCE_THRESHOLD_DAYS) {
    return currentScores; // No hay degradación
  }
  
  const degradationDays = daysSinceLastEntry - LONG_ABSENCE_THRESHOLD_DAYS;
  const degradationPerDay = 1.0;
  const totalDegradation = degradationPerDay * degradationDays;
  
  return {
    guerrero: Math.max(0, currentScores.guerrero - totalDegradation),
    rey: Math.max(0, currentScores.rey - totalDegradation),
    amante: Math.max(0, currentScores.amante - totalDegradation),
    mago: Math.max(0, currentScores.mago - totalDegradation),
  };
}

// =====================================================
// PROTECCIÓN CONTRA MANIPULACIÓN
// =====================================================

/**
 * Verifica integridad temporal del usuario
 */
export function verifyTemporalIntegrity(
  profile_id: string,
  program_start_date: string,
  last_activity_at: string,
  stored_start_date: string,
  account_created_at: string,
  client_time?: string
): {
  is_valid: boolean;
  anomalies: TemporalAnomaly[];
  should_block: boolean;
} {
  const anomalies: TemporalAnomaly[] = [];
  
  // Validación 1: Program start date no cambió
  const startDateAnomaly = validateProgramStartDate(stored_start_date, program_start_date);
  if (startDateAnomaly) anomalies.push(startDateAnomaly);
  
  // Validación 2: Tiempo no retrocedió
  const timeProgressionAnomaly = validateTimeProgression(last_activity_at, new Date().toISOString());
  if (timeProgressionAnomaly) anomalies.push(timeProgressionAnomaly);
  
  // Validación 3: Client time vs server time
  if (client_time) {
    const clientServerAnomaly = validateClientServerTimeDiff(client_time);
    if (clientServerAnomaly) anomalies.push(clientServerAnomaly);
  }
  
  // Validación 4: Detección de reinicio de programa
  const restartAnomaly = detectProgramRestart(program_start_date, account_created_at);
  if (restartAnomaly) anomalies.push(restartAnomaly);
  
  // Determinar si se debe bloquear
  const shouldBlock = anomalies.some(a => a.severity === "critical");
  
  return {
    is_valid: anomalies.length === 0,
    anomalies,
    should_block: shouldBlock,
  };
}

/**
 * Restaura la fecha correcta si se detectó manipulación
 */
export function restoreCorrectDate(
  stored_start_date: string
): {
  restored_date: string;
  action_taken: string;
} {
  return {
    restored_date: stored_start_date,
    action_taken: "Program start date restaurado a valor original",
  };
}

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Formatea duración en días a texto legible
 */
export function formatDuration(days: number): string {
  if (days === 0) return "hoy";
  if (days === 1) return "1 día";
  if (days < 7) return `${days} días`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 semana" : `${weeks} semanas`;
  }
  const months = Math.floor(days / 30);
  return months === 1 ? "1 mes" : `${months} meses`;
}

/**
 * Calcula el porcentaje de progreso en el programa
 */
export function calculateProgressPercentage(daysInProgram: number): number {
  return Math.min(100, Math.round((daysInProgram / PROGRAM_DURATION_DAYS) * 100));
}

/**
 * Obtiene el día del programa (1-90)
 */
export function getProgramDay(program_start_date: string): number {
  const start = new Date(program_start_date);
  const now = getServerTime();
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(PROGRAM_DURATION_DAYS, Math.max(1, days + 1));
}

/**
 * Verifica si el usuario está en el último día de una fase
 */
export function isLastDayOfPhase(daysInProgram: number): boolean {
  return (
    daysInProgram === PHASE_1_DAYS - 1 ||
    daysInProgram === PHASE_1_DAYS + PHASE_2_DAYS - 1 ||
    daysInProgram === PROGRAM_DURATION_DAYS - 1
  );
}

/**
 * Verifica si el usuario está en el primer día de una fase
 */
export function isFirstDayOfPhase(daysInProgram: number): boolean {
  return (
    daysInProgram === 0 ||
    daysInProgram === PHASE_1_DAYS ||
    daysInProgram === PHASE_1_DAYS + PHASE_2_DAYS
  );
}

/**
 * Obtiene mensaje de transición de fase
 */
export function getPhaseTransitionMessage(
  oldPhase: number,
  newPhase: number
): string {
  if (oldPhase === 1 && newPhase === 2) {
    return `¡Felicidades! Has completado la fase de Catarsis. 
Ahora entras en Elucidación, donde profundizaremos en los patrones detectados.`;
  }
  
  if (oldPhase === 2 && newPhase === 3) {
    return `¡Excelente progreso! Has completado la fase de Elucidación. 
Ahora entras en Integración, donde consolidaremos todo lo aprendido.`;
  }
  
  if (newPhase === 3 && oldPhase === 3) {
    return `¡Has completado el programa de 90 días! 
Este es un logro significativo. ¿Cómo te sientes con el proceso?`;
  }
  
  return "Continuando con el proceso...";
}

/**
 * Registra anomalía temporal en logs
 */
export function logTemporalAnomaly(
  profile_id: string,
  anomaly: TemporalAnomaly
): void {
  console.error(`[TEMPORAL ANOMALY] User: ${profile_id}`, {
    type: anomaly.type,
    severity: anomaly.severity,
    message: anomaly.message,
    detected_at: anomaly.detected_at,
    suggested_action: anomaly.suggested_action,
  });
  
  // TODO: Enviar a sistema de monitoreo (Sentry, LogRocket, etc.)
}
