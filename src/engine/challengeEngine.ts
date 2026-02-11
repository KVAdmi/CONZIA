/**
 * MOTOR DE RETOS
 * Genera retos personalizados basados en arquetipo débil, tema detectado y mes actual
 * Alineado con: ConziaChallenge, ConziaArchetype en models.ts
 */

import type { ConziaArchetype, ConziaDesahogoEmotion } from "../types/models";

// =====================================================
// TIPOS
// =====================================================

export interface ChallengeTemplate {
  archetype: ConziaArchetype;
  theme: string;
  month: number;
  difficulty: "easy" | "medium" | "hard";
  action: string;
  validation_criteria: string;
}

export interface GeneratedChallenge {
  id: string;
  card_title: string;
  challenge_text: string;
  shadow_archetype: ConziaArchetype;
  theme: string;
  difficulty: "easy" | "medium" | "hard";
  validation_criteria: string;
  due_at: string; // ISO date (7 días después)
  emotion?: ConziaDesahogoEmotion;
  pattern_tag?: string;
}

export interface ValidationResult {
  is_valid: boolean;
  reason: string;
  score_impact: number;
}

// =====================================================
// TEMPLATES DE RETOS
// =====================================================

const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  // ========== GUERRERO - RELACIONES ==========
  {
    archetype: "guerrero",
    theme: "relaciones",
    month: 1,
    difficulty: "easy",
    action:
      "Di 'no' a una petición que normalmente aceptarías por miedo al conflicto.",
    validation_criteria:
      "El usuario debe describir la situación y cómo se sintió al decir 'no'.",
  },
  {
    archetype: "guerrero",
    theme: "relaciones",
    month: 2,
    difficulty: "medium",
    action:
      "Confronta a alguien que te ha faltado al respeto. Expresa tu molestia sin agresividad.",
    validation_criteria:
      "El usuario debe reportar la conversación y el resultado.",
  },
  {
    archetype: "guerrero",
    theme: "relaciones",
    month: 3,
    difficulty: "hard",
    action:
      "Termina una relación o amistad que sabes que es tóxica pero has evitado por miedo.",
    validation_criteria:
      "El usuario debe confirmar que tomó la acción y describir el proceso.",
  },

  // ========== GUERRERO - TRABAJO ==========
  {
    archetype: "guerrero",
    theme: "trabajo",
    month: 1,
    difficulty: "easy",
    action:
      "Expresa tu desacuerdo en una reunión, aunque sea incómodo.",
    validation_criteria:
      "El usuario debe describir qué dijo y cómo reaccionaron los demás.",
  },
  {
    archetype: "guerrero",
    theme: "trabajo",
    month: 2,
    difficulty: "medium",
    action:
      "Pide un aumento o mejora de condiciones laborales que has estado evitando.",
    validation_criteria:
      "El usuario debe reportar la conversación con su jefe.",
  },
  {
    archetype: "guerrero",
    theme: "trabajo",
    month: 3,
    difficulty: "hard",
    action:
      "Renuncia o cambia de trabajo si sabes que estás en un lugar que no te valora.",
    validation_criteria:
      "El usuario debe confirmar que tomó la decisión y describir el plan.",
  },

  // ========== AMANTE - AUTOESTIMA ==========
  {
    archetype: "amante",
    theme: "autoestima",
    month: 1,
    difficulty: "easy",
    action:
      "Frente al espejo, di 3 cosas que te gustan de ti físicamente. Sin ironía.",
    validation_criteria: "El usuario debe escribir las 3 cosas que dijo.",
  },
  {
    archetype: "amante",
    theme: "autoestima",
    month: 2,
    difficulty: "medium",
    action:
      "Acepta un cumplido sin minimizarlo. Solo di 'gracias'.",
    validation_criteria:
      "El usuario debe describir la situación y cómo se sintió.",
  },
  {
    archetype: "amante",
    theme: "autoestima",
    month: 3,
    difficulty: "hard",
    action:
      "Haz algo que siempre has querido pero te daba vergüenza (cantar, bailar, escribir).",
    validation_criteria:
      "El usuario debe confirmar que lo hizo y describir la experiencia.",
  },

  // ========== AMANTE - RELACIONES ==========
  {
    archetype: "amante",
    theme: "relaciones",
    month: 1,
    difficulty: "easy",
    action:
      "Expresa una necesidad emocional a tu pareja o amigo cercano.",
    validation_criteria:
      "El usuario debe describir qué expresó y cómo fue recibido.",
  },
  {
    archetype: "amante",
    theme: "relaciones",
    month: 2,
    difficulty: "medium",
    action:
      "Pasa un día completo sin buscar validación externa (likes, mensajes, aprobación).",
    validation_criteria:
      "El usuario debe describir cómo se sintió durante el día.",
  },
  {
    archetype: "amante",
    theme: "relaciones",
    month: 3,
    difficulty: "hard",
    action:
      "Establece un límite claro con alguien que te demanda demasiado emocionalmente.",
    validation_criteria:
      "El usuario debe reportar cómo comunicó el límite.",
  },

  // ========== REY - TRABAJO ==========
  {
    archetype: "rey",
    theme: "trabajo",
    month: 1,
    difficulty: "easy",
    action:
      "Delega una tarea que normalmente harías tú porque 'nadie más lo hace bien'.",
    validation_criteria:
      "El usuario debe describir qué delegó y a quién.",
  },
  {
    archetype: "rey",
    theme: "trabajo",
    month: 2,
    difficulty: "medium",
    action:
      "Toma una decisión importante sin consultar a nadie más. Confía en tu criterio.",
    validation_criteria:
      "El usuario debe describir la decisión y el resultado.",
  },
  {
    archetype: "rey",
    theme: "trabajo",
    month: 3,
    difficulty: "hard",
    action:
      "Establece un límite claro en tu trabajo (horario, responsabilidades) y comunícalo.",
    validation_criteria:
      "El usuario debe reportar cómo comunicó el límite y la reacción.",
  },

  // ========== REY - CONTROL ==========
  {
    archetype: "rey",
    theme: "control",
    month: 1,
    difficulty: "easy",
    action:
      "Permite que alguien más tome una decisión en algo que normalmente controlas.",
    validation_criteria:
      "El usuario debe describir qué dejó ir y cómo se sintió.",
  },
  {
    archetype: "rey",
    theme: "control",
    month: 2,
    difficulty: "medium",
    action:
      "Acepta que algo salga 'imperfecto' sin intentar corregirlo.",
    validation_criteria:
      "El usuario debe describir la situación y su reacción.",
  },
  {
    archetype: "rey",
    theme: "control",
    month: 3,
    difficulty: "hard",
    action:
      "Renuncia al control de un proyecto o situación que has estado micromanaging.",
    validation_criteria:
      "El usuario debe confirmar que soltó el control y describir el resultado.",
  },

  // ========== MAGO - CONTROL ==========
  {
    archetype: "mago",
    theme: "control",
    month: 1,
    difficulty: "easy",
    action:
      "Cambia tu ruta habitual a casa. Toma un camino diferente sin planear.",
    validation_criteria:
      "El usuario debe describir la experiencia y qué notó.",
  },
  {
    archetype: "mago",
    theme: "control",
    month: 2,
    difficulty: "medium",
    action:
      "Haz algo espontáneo que no esté en tu agenda. Sin planear, sin optimizar.",
    validation_criteria:
      "El usuario debe describir qué hizo y cómo se sintió.",
  },
  {
    archetype: "mago",
    theme: "control",
    month: 3,
    difficulty: "hard",
    action:
      "Abandona un proyecto que sabes que no funciona pero sigues intentando 'por orgullo'.",
    validation_criteria:
      "El usuario debe confirmar que lo abandonó y describir el proceso.",
  },

  // ========== MAGO - AUTOENGAÑO ==========
  {
    archetype: "mago",
    theme: "autoengaño",
    month: 1,
    difficulty: "easy",
    action:
      "Admite en voz alta algo que has estado racionalizando o justificando.",
    validation_criteria:
      "El usuario debe escribir qué admitió y cómo se sintió.",
  },
  {
    archetype: "mago",
    theme: "autoengaño",
    month: 2,
    difficulty: "medium",
    action:
      "Pide feedback honesto a alguien sobre algo que has estado evitando escuchar.",
    validation_criteria:
      "El usuario debe reportar qué escuchó y cómo reaccionó.",
  },
  {
    archetype: "mago",
    theme: "autoengaño",
    month: 3,
    difficulty: "hard",
    action:
      "Acepta una verdad incómoda sobre ti mismo que has estado negando.",
    validation_criteria:
      "El usuario debe describir la verdad y cómo la está integrando.",
  },
];

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Genera un reto personalizado basado en el arquetipo más débil
 */
export function generateChallenge(
  shadowArchetype: ConziaArchetype,
  theme: string,
  currentMonth: 1 | 2 | 3,
  resistanceIndex: number
): GeneratedChallenge {
  // Buscar template que coincida
  let template = CHALLENGE_TEMPLATES.find(
    (t) =>
      t.archetype === shadowArchetype &&
      t.theme === theme &&
      t.month === currentMonth
  );

  // Fallback: buscar por arquetipo y mes solamente
  if (!template) {
    template = CHALLENGE_TEMPLATES.find(
      (t) => t.archetype === shadowArchetype && t.month === currentMonth
    );
  }

  // Fallback final: primer template del arquetipo
  if (!template) {
    template = CHALLENGE_TEMPLATES.find((t) => t.archetype === shadowArchetype);
  }

  if (!template) {
    throw new Error(`No template found for archetype: ${shadowArchetype}`);
  }

  // Ajustar dificultad según resistencia
  const adjustedDifficulty = adjustDifficultyByResistance(
    template.difficulty,
    resistanceIndex
  );

  // Calcular fecha de vencimiento (7 días)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  return {
    id: generateUUID(),
    card_title: `Reto ${shadowArchetype.toUpperCase()}: ${theme}`,
    challenge_text: template.action,
    shadow_archetype: shadowArchetype,
    theme: template.theme,
    difficulty: adjustedDifficulty,
    validation_criteria: template.validation_criteria,
    due_at: dueDate.toISOString(),
  };
}

/**
 * Valida si el usuario completó el reto correctamente
 */
export function validateChallengeCompletion(
  userReflection: string,
  validationCriteria: string
): ValidationResult {
  // PASO 1: Verificar longitud mínima
  if (userReflection.length < 100) {
    return {
      is_valid: false,
      reason:
        "La reflexión es demasiado corta. Describe con más detalle cómo completaste el reto.",
      score_impact: 0,
    };
  }

  // PASO 2: Verificar que no sea genérica
  const genericPhrases = [
    "lo hice",
    "fue bien",
    "todo bien",
    "ya está",
    "listo",
    "cumplí",
    "hecho",
    "ok",
    "sí",
  ];

  const isGeneric =
    genericPhrases.some((phrase) =>
      userReflection.toLowerCase().includes(phrase)
    ) && userReflection.length < 150;

  if (isGeneric) {
    return {
      is_valid: false,
      reason:
        "La reflexión es muy genérica. Describe específicamente qué hiciste, cómo te sentiste, y qué pasó.",
      score_impact: 0,
    };
  }

  // PASO 3: Verificar que mencione acción concreta
  const actionVerbs = [
    "dije",
    "hice",
    "confronté",
    "expresé",
    "terminé",
    "abandoné",
    "delegué",
    "decidí",
    "cambié",
    "acepté",
  ];

  const hasAction = actionVerbs.some((verb) =>
    userReflection.toLowerCase().includes(verb)
  );

  if (!hasAction) {
    return {
      is_valid: false,
      reason: "No describes una acción concreta. ¿Qué hiciste exactamente?",
      score_impact: 0,
    };
  }

  // PASO 4: Validación exitosa
  return {
    is_valid: true,
    reason: "Reto completado y validado.",
    score_impact: 5, // +5 puntos al arquetipo correspondiente
  };
}

/**
 * Extrae el tema dominante de las entradas recientes
 */
export function extractDominantTheme(entries: { text: string }[]): string {
  const allText = entries
    .map((e) => e.text)
    .join(" ")
    .toLowerCase();

  const themes: Record<string, string[]> = {
    relaciones: [
      "pareja",
      "novio",
      "novia",
      "esposo",
      "esposa",
      "amor",
      "relación",
    ],
    trabajo: ["trabajo", "jefe", "oficina", "empleo", "carrera", "proyecto"],
    familia: [
      "padre",
      "madre",
      "hermano",
      "hermana",
      "familia",
      "papá",
      "mamá",
    ],
    autoestima: [
      "inseguro",
      "inseguridad",
      "feo",
      "gordo",
      "tonto",
      "inútil",
    ],
    control: ["control", "perfección", "orden", "caos", "ansiedad"],
    autoengaño: [
      "mentira",
      "justificación",
      "excusa",
      "racionalización",
    ],
  };

  let detectedTheme = "general";
  let maxMatches = 0;

  for (const [theme, keywords] of Object.entries(themes)) {
    const matches = keywords.filter((kw) => allText.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedTheme = theme;
    }
  }

  return detectedTheme;
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function adjustDifficultyByResistance(
  baseDifficulty: "easy" | "medium" | "hard",
  resistanceIndex: number
): "easy" | "medium" | "hard" {
  // Si la resistencia es alta (> 60), bajar la dificultad
  if (resistanceIndex > 60) {
    if (baseDifficulty === "hard") return "medium";
    if (baseDifficulty === "medium") return "easy";
  }

  // Si la resistencia es baja (< 30), subir la dificultad
  if (resistanceIndex < 30) {
    if (baseDifficulty === "easy") return "medium";
    if (baseDifficulty === "medium") return "hard";
  }

  return baseDifficulty;
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
