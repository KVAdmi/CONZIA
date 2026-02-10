import type {
  ConziaArchetype,
  ConziaFriccion,
  ConziaGuidanceProfile,
  ConziaRecommendedDoor,
  ConziaTodayPlan,
  ConziaTrap,
} from "../types/models";

export function cutLineForTrap(trap: ConziaTrap): string {
  if (trap === "ACTION_WITHOUT_TRUTH") return "¿Cuál fue el costo real de esa acción?";
  if (trap === "INFINITE_ANALYSIS") return "Dame el hecho. Y cerramos.";
  if (trap === "GUILT_PERFORMANCE") return "¿Qué límite mínimo pusiste para ti?";
  return "¿Qué cambia hoy en conducta, aunque sea mínimo?";
}

export function conziaGuidanceProfile(input: {
  archetypeDominant: ConziaArchetype;
  archetypeConfidence: number;
  friccionPrincipal: ConziaFriccion;
  costoDominante: string;
  currentMonth?: number;
}): ConziaGuidanceProfile {
  const base: Pick<ConziaGuidanceProfile, "maxTurns" | "startWith" | "mustClose"> = {
    maxTurns: 3,
    startWith: "HECHO",
    mustClose: true,
  };

  const archetype = input.archetypeDominant;
  const mixed = input.archetypeConfidence < 2;

  const profileByA: Record<
    ConziaArchetype,
    Pick<ConziaGuidanceProfile, "pace" | "defaultDoor" | "trap">
  > = {
    guerrero: { pace: "FAST", defaultDoor: "mesa", trap: "ACTION_WITHOUT_TRUTH" },
    rey: { pace: "MEDIUM", defaultDoor: "consultorio", trap: "INFINITE_ANALYSIS" },
    amante: { pace: "MEDIUM_SLOW", defaultDoor: "consultorio", trap: "GUILT_PERFORMANCE" },
    mago: { pace: "VARIABLE", defaultDoor: "consultorio", trap: "PRETTY_INSIGHT" },
  };

  return { ...base, ...profileByA[archetype], mixed, currentMonth: input.currentMonth ?? 1 };
}

export function todayPlanFromProfile(profile: ConziaGuidanceProfile): ConziaTodayPlan {
  const month = profile.currentMonth ?? 1;
  let recommendedDoor: ConziaRecommendedDoor = profile.defaultDoor;
  let openingLine = "No quiero una historia. Quiero el hecho.";

  // Ajuste de puerta recomendada según el mes de terapia
  if (month === 1) {
    recommendedDoor = "observacion";
    openingLine = "Estamos en fase de catarsis. Solo observa el hecho.";
  } else if (month === 3) {
    recommendedDoor = "proceso";
    openingLine = "Fase de integración. ¿Cómo vas a actuar hoy?";
  }

  return {
    pace: profile.pace,
    recommendedDoor,
    openingLine,
    cutLine: cutLineForTrap(profile.trap),
    trap: profile.trap,
    mixed: profile.mixed,
  };
}

export function getArchetypeLabel(archetype: ConziaArchetype): string {
  switch (archetype) {
    case "guerrero": return "Guerrero";
    case "amante": return "Amante";
    case "rey": return "Rey";
    case "mago": return "Mago";
    default: return "Desconocido";
  }
}

export function getArchetypeDescription(archetype: ConziaArchetype, isShadow: boolean): string {
  const descriptions = {
    guerrero: {
      light: "Fuerza, límites y acción disciplinada.",
      shadow: "Agresión reprimida o incapacidad de decir no."
    },
    amante: {
      light: "Conexión, sensibilidad y gozo de vivir.",
      shadow: "Vulnerabilidad bloqueada o búsqueda de aprobación constante."
    },
    rey: {
      light: "Orden, propósito e integridad.",
      shadow: "Caos interno o necesidad de control absoluto."
    },
    mago: {
      light: "Intuición, transformación y sabiduría.",
      shadow: "Confusión mental o miedo a ver la verdad."
    }
  };
  
  return isShadow ? descriptions[archetype].shadow : descriptions[archetype].light;
}
