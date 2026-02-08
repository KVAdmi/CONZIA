import type { Entry, Pattern } from "../../types/models";

export type EntryClassification = {
  likelyPatternId?: string;
  intensity: "baja" | "media" | "alta";
  notes: string[];
};

function intensityFromWeight(weight: number): EntryClassification["intensity"] {
  if (weight >= 8) return "alta";
  if (weight >= 5) return "media";
  return "baja";
}

function inferPatternId(entry: Entry, patterns: Pattern[]): string | undefined {
  const tags = entry.tags.join(" ").toLowerCase();
  const pickByName = (needle: string) =>
    patterns.find((p) => p.name.toLowerCase().includes(needle.toLowerCase()))?.id;

  if (tags.includes("rumiación") || tags.includes("rumiacion")) return pickByName("rumi");
  if (tags.includes("evitación") || tags.includes("evitacion")) return pickByName("evit");
  if (tags.includes("autoanulación") || tags.includes("autoanulacion")) return pickByName("autoanul");
  if (tags.includes("qué dirán") || tags.includes("que diran")) return pickByName("qué dirán") ?? pickByName("que diran");
  if (tags.includes("aprobación") || tags.includes("aprobacion")) return pickByName("aprob");
  if (tags.includes("límite") || tags.includes("limite")) return pickByName("límit") ?? pickByName("limit");

  return patterns.find((p) => p.contexts.includes(entry.context))?.id;
}

export function classifyEntry(params: { entry: Entry; patterns: Pattern[] }): EntryClassification {
  const likelyPatternId = inferPatternId(params.entry, params.patterns);

  const notes: string[] = [];
  if (params.entry.reaction === "cedi") notes.push("Ceder temprano suele ocultar miedo a incomodar.");
  if (params.entry.reaction === "calle") notes.push("Callar es una elección. A veces es costo, no paz.");
  if (params.entry.reaction === "explote") notes.push("Explotar suele ser acumulación. El límite faltó antes.");
  if (params.entry.reaction === "hui") notes.push("Huir reduce el dolor ahora, lo multiplica después.");
  if (params.entry.repeatSignal === "si") notes.push("Marcaste repetición. Úsalo como dato, no como culpa.");

  return {
    likelyPatternId,
    intensity: intensityFromWeight(params.entry.emotionalWeight),
    notes,
  };
}

