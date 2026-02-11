/**
 * CRISIS PROTOCOL
 * Sistema de protección psicológica avanzada
 * Clasificación de riesgo, protocolo escalado, bloqueo de fase
 */

// =====================================================
// TIPOS
// =====================================================

export interface RiskAssessment {
  profile_id: string;
  entry_text: string;
  risk_level: "low" | "medium" | "high" | "critical";
  risk_score: number; // 0-100
  risk_factors: RiskFactor[];
  recommended_action: string;
  requires_immediate_intervention: boolean;
  should_block_phase_progression: boolean;
  emergency_contacts_shown: boolean;
}

export interface RiskFactor {
  type: "suicidal_ideation" | "self_harm" | "severe_distress" | "high_resistance" | "abandonment";
  severity: "low" | "medium" | "high" | "critical";
  detected_keywords: string[];
  confidence: number; // 0-100
}

export interface CrisisResponse {
  show_crisis_message: boolean;
  crisis_message: string;
  show_emergency_contacts: boolean;
  emergency_contacts: EmergencyContact[];
  block_phase_progression: boolean;
  alert_human_team: boolean;
  alert_priority: "low" | "medium" | "high" | "critical";
  suggested_claude_tone: "normal" | "supportive" | "containment" | "crisis";
}

export interface EmergencyContact {
  name: string;
  phone: string;
  available: string;
  type: "hotline" | "emergency" | "support";
}

export interface EscalationProtocol {
  level: 1 | 2 | 3 | 4;
  name: string;
  triggers: string[];
  actions: string[];
  response_time: string;
  notification_channels: string[];
}

// =====================================================
// CONSTANTES
// =====================================================

// Palabras clave de alto riesgo (suicidio)
const HIGH_RISK_KEYWORDS = [
  "suicid",
  "quitarme la vida",
  "me voy a matar",
  "me quiero morir",
  "no quiero vivir",
  "no vale la pena vivir",
  "acabar con todo",
  "terminar con mi vida",
  "mejor muerto",
  "mejor muerta",
];

// Palabras clave de riesgo moderado (autolesión)
const MODERATE_RISK_KEYWORDS = [
  "hacerme daño",
  "hacerme dano",
  "autolesión",
  "autolesion",
  "cortarme",
  "lastimarme",
  "herirme",
];

// Palabras clave de angustia severa
const SEVERE_DISTRESS_KEYWORDS = [
  "no puedo más",
  "no puedo mas",
  "me desbordé",
  "me desborde",
  "estoy al límite",
  "estoy al limite",
  "no aguanto",
  "me estoy volviendo loco",
  "me estoy volviendo loca",
];

// Contactos de emergencia (México/LATAM)
const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: "Línea de la Vida (México)",
    phone: "800 911 2000",
    available: "24/7",
    type: "hotline",
  },
  {
    name: "SAPTEL (México)",
    phone: "55 5259 8121",
    available: "24/7",
    type: "hotline",
  },
  {
    name: "Emergencias",
    phone: "911",
    available: "24/7",
    type: "emergency",
  },
  {
    name: "Locatel (CDMX)",
    phone: "55 5658 1111",
    available: "24/7",
    type: "support",
  },
];

// =====================================================
// CLASIFICACIÓN DE RIESGO
// =====================================================

/**
 * Normaliza texto para detección de keywords
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detecta keywords de riesgo en el texto
 */
function detectRiskKeywords(
  text: string,
  keywords: string[]
): { found: boolean; matches: string[] } {
  const normalized = normalizeText(text);
  const matches: string[] = [];

  for (const keyword of keywords) {
    if (normalized.includes(keyword)) {
      matches.push(keyword);
    }
  }

  return {
    found: matches.length > 0,
    matches,
  };
}

/**
 * Clasifica el riesgo de una entrada
 */
export function assessRisk(
  profile_id: string,
  entry_text: string,
  resistance_index?: number
): RiskAssessment {
  const risk_factors: RiskFactor[] = [];
  let risk_score = 0;

  // Factor 1: Ideación suicida (peso: 100)
  const suicidalDetection = detectRiskKeywords(entry_text, HIGH_RISK_KEYWORDS);
  if (suicidalDetection.found) {
    risk_factors.push({
      type: "suicidal_ideation",
      severity: "critical",
      detected_keywords: suicidalDetection.matches,
      confidence: 95,
    });
    risk_score = 100; // Automáticamente crítico
  }

  // Factor 2: Autolesión (peso: 75)
  const selfHarmDetection = detectRiskKeywords(entry_text, MODERATE_RISK_KEYWORDS);
  if (selfHarmDetection.found) {
    risk_factors.push({
      type: "self_harm",
      severity: "high",
      detected_keywords: selfHarmDetection.matches,
      confidence: 85,
    });
    risk_score = Math.max(risk_score, 75);
  }

  // Factor 3: Angustia severa (peso: 50)
  const distressDetection = detectRiskKeywords(entry_text, SEVERE_DISTRESS_KEYWORDS);
  if (distressDetection.found) {
    risk_factors.push({
      type: "severe_distress",
      severity: "high",
      detected_keywords: distressDetection.matches,
      confidence: 75,
    });
    risk_score = Math.max(risk_score, 50);
  }

  // Factor 4: Alta resistencia (peso: variable)
  if (resistance_index !== undefined && resistance_index > 80) {
    risk_factors.push({
      type: "high_resistance",
      severity: "medium",
      detected_keywords: [],
      confidence: 70,
    });
    risk_score = Math.max(risk_score, 50);
  }

  // Determinar nivel de riesgo
  let risk_level: "low" | "medium" | "high" | "critical";
  if (risk_score >= 90) {
    risk_level = "critical";
  } else if (risk_score >= 70) {
    risk_level = "high";
  } else if (risk_score >= 40) {
    risk_level = "medium";
  } else {
    risk_level = "low";
  }

  // Determinar acciones
  const requires_immediate_intervention = risk_level === "critical";
  const should_block_phase_progression = risk_level === "critical" || risk_level === "high";
  const emergency_contacts_shown = risk_level === "critical";

  // Acción recomendada
  let recommended_action: string;
  if (risk_level === "critical") {
    recommended_action = "Intervención humana inmediata + mostrar contactos de emergencia + bloquear progreso";
  } else if (risk_level === "high") {
    recommended_action = "Alerta al equipo humano (respuesta en 24h) + ajustar tono de Claude + bloquear progreso";
  } else if (risk_level === "medium") {
    recommended_action = "Monitoreo cercano + ajustar tono de Claude a más contenedor";
  } else {
    recommended_action = "Continuar con el proceso normal";
  }

  return {
    profile_id,
    entry_text,
    risk_level,
    risk_score,
    risk_factors,
    recommended_action,
    requires_immediate_intervention,
    should_block_phase_progression,
    emergency_contacts_shown,
  };
}

// =====================================================
// PROTOCOLO DE ESCALACIÓN
// =====================================================

/**
 * Define los niveles de escalación
 */
const ESCALATION_LEVELS: EscalationProtocol[] = [
  {
    level: 1,
    name: "Monitoreo",
    triggers: ["resistance_index > 60", "medium_risk"],
    actions: [
      "Ajustar tono de Claude a más contenedor",
      "Incrementar frecuencia de monitoreo",
      "Generar alerta de seguimiento",
    ],
    response_time: "72 horas",
    notification_channels: ["dashboard"],
  },
  {
    level: 2,
    name: "Intervención Suave",
    triggers: ["resistance_index > 70", "high_risk", "days_inactive > 14"],
    actions: [
      "Alerta al equipo humano",
      "Ofrecer contacto con terapeuta",
      "Ajustar dificultad de retos",
      "Enviar email de seguimiento",
    ],
    response_time: "24 horas",
    notification_channels: ["dashboard", "email"],
  },
  {
    level: 3,
    name: "Intervención Activa",
    triggers: ["resistance_index > 80", "high_risk + days_inactive > 7"],
    actions: [
      "Contacto telefónico del equipo",
      "Bloquear progreso de fase hasta validación",
      "Ofrecer sesión de emergencia",
      "Notificar a supervisor",
    ],
    response_time: "12 horas",
    notification_channels: ["dashboard", "email", "sms"],
  },
  {
    level: 4,
    name: "Crisis",
    triggers: ["critical_risk", "suicidal_ideation"],
    actions: [
      "Mostrar contactos de emergencia inmediatamente",
      "Bloquear toda la aplicación excepto contactos",
      "Notificación inmediata al equipo (email + SMS)",
      "Protocolo de seguimiento obligatorio",
      "Registro en sistema de crisis",
    ],
    response_time: "Inmediato",
    notification_channels: ["dashboard", "email", "sms", "phone_call"],
  },
];

/**
 * Determina el nivel de escalación apropiado
 */
export function determineEscalationLevel(
  risk_assessment: RiskAssessment,
  resistance_index: number,
  days_inactive: number
): EscalationProtocol {
  // Nivel 4: Crisis
  if (risk_assessment.risk_level === "critical") {
    return ESCALATION_LEVELS[3];
  }

  // Nivel 3: Intervención Activa
  if (
    risk_assessment.risk_level === "high" ||
    resistance_index > 80
  ) {
    return ESCALATION_LEVELS[2];
  }

  // Nivel 2: Intervención Suave
  if (
    risk_assessment.risk_level === "medium" ||
    resistance_index > 70 ||
    days_inactive > 14
  ) {
    return ESCALATION_LEVELS[1];
  }

  // Nivel 1: Monitoreo
  return ESCALATION_LEVELS[0];
}

// =====================================================
// RESPUESTA A CRISIS
// =====================================================

/**
 * Genera la respuesta apropiada según el nivel de riesgo
 */
export function generateCrisisResponse(
  risk_assessment: RiskAssessment
): CrisisResponse {
  const { risk_level } = risk_assessment;

  if (risk_level === "critical") {
    return {
      show_crisis_message: true,
      crisis_message: `Detectamos que estás pasando por un momento muy difícil y queremos que sepas que no estás solo/a.

Por favor, contacta a un profesional de inmediato. Tu bienestar es lo más importante.

Si estás en peligro inmediato, llama al 911.`,
      show_emergency_contacts: true,
      emergency_contacts: EMERGENCY_CONTACTS,
      block_phase_progression: true,
      alert_human_team: true,
      alert_priority: "critical",
      suggested_claude_tone: "crisis",
    };
  }

  if (risk_level === "high") {
    return {
      show_crisis_message: true,
      crisis_message: `Notamos que estás pasando por un momento difícil. 

Tu bienestar es nuestra prioridad. Un miembro de nuestro equipo se pondrá en contacto contigo pronto para ofrecerte apoyo adicional.

Si necesitas ayuda inmediata, no dudes en contactar a las líneas de apoyo disponibles.`,
      show_emergency_contacts: true,
      emergency_contacts: EMERGENCY_CONTACTS,
      block_phase_progression: true,
      alert_human_team: true,
      alert_priority: "high",
      suggested_claude_tone: "containment",
    };
  }

  if (risk_level === "medium") {
    return {
      show_crisis_message: false,
      crisis_message: "",
      show_emergency_contacts: false,
      emergency_contacts: [],
      block_phase_progression: false,
      alert_human_team: true,
      alert_priority: "medium",
      suggested_claude_tone: "supportive",
    };
  }

  // Low risk
  return {
    show_crisis_message: false,
    crisis_message: "",
    show_emergency_contacts: false,
    emergency_contacts: [],
    block_phase_progression: false,
    alert_human_team: false,
    alert_priority: "low",
    suggested_claude_tone: "normal",
  };
}

// =====================================================
// BLOQUEO DE FASE
// =====================================================

/**
 * Verifica si se debe bloquear el progreso de fase
 */
export function shouldBlockPhaseProgression(
  risk_level: "low" | "medium" | "high" | "critical",
  human_team_validated: boolean
): boolean {
  // Bloquear si:
  // 1. Riesgo crítico o alto
  // 2. Y el equipo humano NO ha validado que el usuario está estable
  return (risk_level === "critical" || risk_level === "high") && !human_team_validated;
}

/**
 * Genera mensaje de bloqueo de fase
 */
export function getPhaseBlockMessage(risk_level: "high" | "critical"): string {
  if (risk_level === "critical") {
    return `Tu bienestar es lo más importante. 

Antes de continuar con el programa, queremos asegurarnos de que estés bien y recibas el apoyo que necesitas.

Un miembro de nuestro equipo se pondrá en contacto contigo muy pronto.`;
  }

  return `Queremos asegurarnos de que estés recibiendo el apoyo adecuado antes de continuar.

Un miembro de nuestro equipo se pondrá en contacto contigo en las próximas 24 horas.

Mientras tanto, puedes seguir escribiendo tus desahogos, pero el avance a la siguiente fase estará pausado temporalmente.`;
}

// =====================================================
// AJUSTE DE TONO DE CLAUDE
// =====================================================

/**
 * Obtiene el system prompt según el tono requerido
 */
export function getClaudeTonePrompt(
  tone: "normal" | "supportive" | "containment" | "crisis"
): string {
  switch (tone) {
    case "crisis":
      return `MODO CRISIS: El usuario está en crisis. Tu prioridad es contener, validar y dirigir a ayuda profesional inmediata.

- NO hagas preguntas profundas
- NO confrontes
- Valida su dolor sin minimizar
- Ofrece contención emocional
- Dirige a contactos de emergencia
- Usa lenguaje cálido y directo`;

    case "containment":
      return `MODO CONTENCIÓN: El usuario muestra signos de alto riesgo. Tu prioridad es contener y apoyar.

- Reduce la profundidad de las preguntas
- Valida más, confronta menos
- Ofrece contención emocional
- Menciona que el equipo humano estará disponible
- Mantén un tono cálido y presente`;

    case "supportive":
      return `MODO APOYO: El usuario necesita más soporte. Ajusta tu enfoque.

- Balancea confrontación con validación
- Ofrece más contención emocional
- Reconoce el esfuerzo que está haciendo
- Mantén las preguntas pero con más calidez`;

    case "normal":
    default:
      return `MODO NORMAL: Continúa con el enfoque junguiano estándar.

- Confronta con compasión
- Haz preguntas profundas
- Señala patrones y sombras
- Mantén el equilibrio entre contención y desafío`;
  }
}

// =====================================================
// REGISTRO Y NOTIFICACIÓN
// =====================================================

/**
 * Crea una alerta para el equipo humano
 */
export function createHumanSupportAlert(
  profile_id: string,
  risk_assessment: RiskAssessment,
  escalation_level: EscalationProtocol
): {
  alert_type: string;
  priority: string;
  message: string;
  suggested_action: string;
  requires_immediate_action: boolean;
} {
  return {
    alert_type: risk_assessment.risk_level === "critical" ? "crisis_suicidal" : "high_risk",
    priority: escalation_level.level === 4 ? "critical" : escalation_level.level === 3 ? "high" : "medium",
    message: `Usuario ${profile_id} - Nivel de riesgo: ${risk_assessment.risk_level} (score: ${risk_assessment.risk_score})
    
Factores detectados:
${risk_assessment.risk_factors.map(f => `- ${f.type}: ${f.severity} (confianza: ${f.confidence}%)`).join("\n")}

Texto de entrada: "${risk_assessment.entry_text.substring(0, 200)}..."`,
    suggested_action: risk_assessment.recommended_action,
    requires_immediate_action: risk_assessment.requires_immediate_intervention,
  };
}

/**
 * Envía notificación de emergencia
 */
export async function sendEmergencyNotification(
  profile_id: string,
  risk_assessment: RiskAssessment,
  escalation_level: EscalationProtocol
): Promise<void> {
  // TODO: Implementar envío real de notificaciones
  // - Email al equipo
  // - SMS a supervisor
  // - Webhook a sistema de monitoreo
  // - Push notification a app del equipo

  console.error(`[EMERGENCY NOTIFICATION] User: ${profile_id}`, {
    risk_level: risk_assessment.risk_level,
    risk_score: risk_assessment.risk_score,
    escalation_level: escalation_level.level,
    response_time: escalation_level.response_time,
    channels: escalation_level.notification_channels,
  });
}

// =====================================================
// VALIDACIÓN POR EQUIPO HUMANO
// =====================================================

/**
 * Marca al usuario como validado por el equipo humano
 */
export function markAsValidatedByTeam(
  profile_id: string,
  validated_by: string,
  notes: string
): {
  validated_at: string;
  validated_by: string;
  notes: string;
  can_progress: boolean;
} {
  return {
    validated_at: new Date().toISOString(),
    validated_by,
    notes,
    can_progress: true,
  };
}

/**
 * Verifica si el usuario puede progresar de fase
 */
export function canProgressPhase(
  risk_level: "low" | "medium" | "high" | "critical",
  human_validation?: {
    validated_at: string;
    can_progress: boolean;
  }
): boolean {
  // Si el riesgo es bajo o medio, puede progresar
  if (risk_level === "low" || risk_level === "medium") {
    return true;
  }

  // Si el riesgo es alto o crítico, necesita validación humana
  if (risk_level === "high") {
    return human_validation?.can_progress === true;
  }
  
  if (risk_level === "critical") {
    return human_validation?.can_progress === true;
  }

  return false;
}
