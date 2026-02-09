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

  return { ...base, ...profileByA[archetype], mixed };
}

export function todayPlanFromProfile(profile: ConziaGuidanceProfile): ConziaTodayPlan {
  const recommendedDoor: ConziaRecommendedDoor = profile.defaultDoor;
  return {
    pace: profile.pace,
    recommendedDoor,
    openingLine: "No quiero una historia. Quiero el hecho.",
    cutLine: cutLineForTrap(profile.trap),
    trap: profile.trap,
    mixed: profile.mixed,
  };
}
