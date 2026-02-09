import type { ConziaFriccion, ConziaPatternTag, ConziaRecommendedDoor, ConziaTrap } from "../types/models";

export type ResponseComposerInput = {
  text: string;
  friccion_hoy?: ConziaFriccion | null;
  trap_selected?: ConziaTrap | null;
  recommendedDoor?: ConziaRecommendedDoor | null;
  cutLine?: string | null;
};

export type ResponseComposerOutput = {
  assistantMessage: string; // 2–3 líneas máx (separadas por "\n")
  followupQuestion: string; // 1 pregunta
  tag: ConziaPatternTag;
};

const KEYWORDS_BY_TAG: Record<ConziaPatternTag, string[]> = {
  rumiacion: ["darle vueltas", "rumia", "rumiacion", "sobrepienso", "sobrepens", "no paro de pensar", "no puedo parar"],
  evitacion: ["evite", "evitar", "me fui", "evadi", "ignorar", "no quise ver", "autoengano", "me distraje", "lo deje pasar"],
  aislamiento: ["me aisle", "me encerre", "me aleje", "no conteste", "no respondi", "desconecte", "me calle", "me apague"],
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tagFromTrap(trap: ConziaTrap): ConziaPatternTag {
  if (trap === "INFINITE_ANALYSIS") return "rumiacion";
  if (trap === "GUILT_PERFORMANCE") return "aislamiento";
  return "evitacion";
}

function tagFromFriccion(friccion: ConziaFriccion): ConziaPatternTag {
  if (friccion === "verguenza" || friccion === "abandono_propio") return "aislamiento";
  if (friccion === "autoengano") return "evitacion";
  if (friccion === "control") return "evitacion";
  if (friccion === "dependencia") return "aislamiento";
  return "evitacion";
}

export function inferPatternTag(input: {
  text?: string;
  trap?: ConziaTrap | null;
  friccion?: ConziaFriccion | null;
}): ConziaPatternTag {
  const text = typeof input.text === "string" ? input.text : "";
  const norm = normalizeText(text);

  if (norm) {
    const hits = (Object.keys(KEYWORDS_BY_TAG) as ConziaPatternTag[]).map((tag) => {
      const count = KEYWORDS_BY_TAG[tag].reduce((acc, kw) => (norm.includes(normalizeText(kw)) ? acc + 1 : acc), 0);
      return { tag, count };
    });
    hits.sort((a, b) => b.count - a.count);
    if (hits[0]?.count) return hits[0].tag;
  }

  if (input.trap) return tagFromTrap(input.trap);
  if (input.friccion) return tagFromFriccion(input.friccion);
  return "evitacion";
}

function followupQuestionFor(tag: ConziaPatternTag, recommendedDoor?: ConziaRecommendedDoor | null): string {
  if (recommendedDoor === "mesa") return "¿Qué hecho vas a escribir hoy, sin justificar?";
  if (tag === "rumiacion") return "¿Cuál es el hecho, en una frase?";
  if (tag === "aislamiento") return "¿Qué límite mínimo vas a poner para ti hoy?";
  return "¿Qué parte estás dejando fuera?";
}

function assistantMessageFor(tag: ConziaPatternTag, cutLine?: string | null): string {
  const cut = (cutLine ?? "").trim();
  const cutOrDefault =
    cut ||
    (tag === "rumiacion"
      ? "Dame el hecho. Y cerramos."
      : tag === "aislamiento"
        ? "¿Qué límite mínimo vas a poner para ti?"
        : "No lo maquilles. Nómbralo.");

  const lead =
    tag === "rumiacion"
      ? "Te escucho. Noto rumiación."
      : tag === "aislamiento"
        ? "Te escucho. Noto aislamiento."
        : "Te escucho. Noto evitación.";

  return `${lead}\n${cutOrDefault}`;
}

export function composeConziaResponse(input: ResponseComposerInput): ResponseComposerOutput {
  const tag = inferPatternTag({ text: input.text, trap: input.trap_selected, friccion: input.friccion_hoy });
  return {
    tag,
    assistantMessage: assistantMessageFor(tag, input.cutLine),
    followupQuestion: followupQuestionFor(tag, input.recommendedDoor),
  };
}

