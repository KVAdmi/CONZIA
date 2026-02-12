import type { Entry, Pattern, Reading, ReadingContent, ReadingType } from "../../types/models";
import { toISODateOnly } from "../../utils/dates.ts";
import { createId } from "../../utils/id.ts";

type AiReadingResponse =
  | { ok: true; reading: Reading }
  | { ok: false; error: string };

function inferPatternId(entry: Entry, patterns: Pattern[]): string | undefined {
  const t = entry.tags.join(" ").toLowerCase();
  const nameMatch = (needle: string) =>
    patterns.find((p) => p.name.toLowerCase().includes(needle.toLowerCase()))?.id;

  if (t.includes("rumiación")) return nameMatch("Rumiación") ?? nameMatch("rumiacion");
  if (t.includes("evitación") || t.includes("evitacion")) return nameMatch("Evitación");
  if (t.includes("autoanulación") || t.includes("autoanulacion")) return nameMatch("Autoanulación");
  if (t.includes("qué dirán") || t.includes("que diran")) return nameMatch("Qué dirán");
  if (t.includes("aprobación") || t.includes("aprobacion")) return nameMatch("aprobación");
  if (t.includes("límite") || t.includes("limite")) return nameMatch("límit") ?? nameMatch("limit");

  const byContext = patterns
    .map((p) => ({ p, score: p.contexts.includes(entry.context) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score)[0];
  return byContext?.score ? byContext.p.id : undefined;
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function buildContent(entry: Entry, patternName?: string): ReadingContent {
  const reactionLine =
    entry.reaction === "calle"
      ? "Te callaste donde te tocaba nombrar."
      : entry.reaction === "cedi"
        ? "Cediste antes de que fuera necesario."
        : entry.reaction === "explote"
          ? "Explotaste tarde. Eso suele ser acumulación."
          : entry.reaction === "hui"
            ? "Huiste de la incomodidad en lugar de sostenerla."
            : entry.reaction === "negocie"
              ? "Negociaste claridad para mantener paz aparente."
              : entry.reaction === "pedi"
                ? "Pediste algo real. Eso ya es movimiento."
                : "Pusiste un límite. Eso cambia el mapa.";

  const boundaryLine =
    entry.boundary === "tiempo"
      ? "Tiempo."
      : entry.boundary === "respeto"
        ? "Respeto."
        : entry.boundary === "cuerpo"
          ? "Cuerpo."
          : entry.boundary === "dinero"
            ? "Dinero."
            : entry.boundary === "decision"
              ? "Decisión."
              : "Intimidad.";

  const contencion =
    entry.emotionalWeight >= 8
      ? "Esto pesa. No lo adornes."
      : entry.emotionalWeight >= 6
        ? "No es exageración. Es señal."
        : "Se puede ver sin drama.";

  const loQueVeo = oneLine(
    `Contexto: ${entry.context}. Límite: ${boundaryLine} Reacción: ${entry.reaction}. ${reactionLine}`,
  );

  const patron = patternName ? `${patternName}.` : undefined;

  const loQueEvitas =
    entry.reaction === "calle" || entry.reaction === "cedi"
      ? "El costo de sostener un ‘no’ sin justificarlo."
      : entry.reaction === "hui"
        ? "La incomodidad corta que evita un problema largo."
        : entry.reaction === "explote"
          ? "El límite temprano, pequeño y claro."
          : "El costo de que alguien no esté de acuerdo contigo.";

  const pregunta =
    entry.reaction === "calle"
      ? "¿Qué hubiera pasado si lo nombrabas en una frase simple?"
      : entry.reaction === "cedi"
        ? "¿Qué parte de ti se mueve primero: la culpa o la claridad?"
        : entry.reaction === "hui"
          ? "¿Qué verdad evitaste al salirte del momento?"
          : entry.reaction === "explote"
            ? "¿Qué límite omitiste antes de tronar?"
            : "¿Qué estás defendiendo con este patrón?";

  const accionMinima =
    entry.reaction === "calle"
      ? "Una frase hoy: “No me late. No voy a entrar en eso”."
      : entry.reaction === "cedi"
        ? "La próxima: “No puedo. No lo voy a tomar”. Sin explicación."
        : entry.reaction === "hui"
          ? "Quédate 30 segundos más en la incomodidad antes de escapar."
          : entry.reaction === "explote"
            ? "Di el límite a tiempo, aunque sea torpe."
            : entry.reaction === "puse_limite"
              ? "No lo repares. Sostén el silencio después del límite."
              : undefined;

  return { contencion, loQueVeo, patron, loQueEvitas, pregunta, accionMinima };
}

function readingTypeFromEntry(entry: Entry): ReadingType {
  if (entry.type === "algo_me_incomodo") return "evento_incomodo";
  if (entry.type === "queria_hacer_algo_distinto") return "intencion_no_lograda";
  if (entry.type === "no_quise_ver_esto") return "patron_activo";
  return "evento_incomodo";
}

function pickEvidenceEntryIds(entry: Entry, entries: Entry[]): string[] {
  const base = new Set(entry.tags.map((t) => t.toLowerCase()));
  const scored = entries
    .filter((e) => e.id !== entry.id)
    .map((e) => {
      const overlap = e.tags.reduce((acc, t) => acc + (base.has(t.toLowerCase()) ? 1 : 0), 0);
      const score =
        overlap * 2 +
        (e.context === entry.context ? 2 : 0) +
        (e.boundary === entry.boundary ? 1 : 0) +
        (e.reaction === entry.reaction ? 1 : 0);
      return { id: e.id, score, date: e.date };
    })
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.date < b.date ? 1 : -1))
    .filter((x) => x.score > 0)
    .slice(0, 4)
    .map((x) => x.id);

  return [entry.id, ...scored].slice(0, 5);
}

function generateReadingMock(params: {
  entry: Entry;
  patterns: Pattern[];
  entries?: Entry[];
  todayISO?: string;
}): Reading {
  const todayISO = params.todayISO ?? toISODateOnly(new Date());
  const patternId = inferPatternId(params.entry, params.patterns);
  const patternName = patternId ? params.patterns.find((p) => p.id === patternId)?.name : undefined;
  const content = buildContent(params.entry, patternName);

  return {
    id: createId("r"),
    date: todayISO,
    entryId: params.entry.id,
    type: readingTypeFromEntry(params.entry),
    content,
    patternId,
    basedOnEntryIds: params.entries ? pickEvidenceEntryIds(params.entry, params.entries) : [params.entry.id],
  };
}

async function requestReadingFromProxy(params: {
  entry: Entry;
  patterns: Pattern[];
  entries: Entry[];
  todayISO: string;
}): Promise<Reading> {
  const resp = await fetch("/api/ai/reading", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      entry: params.entry,
      patterns: params.patterns,
      entries: params.entries,
      todayISO: params.todayISO,
    }),
  });

  const json = (await resp.json().catch(() => null)) as AiReadingResponse | null;
  if (!resp.ok || !json) {
    throw new Error(`Proxy IA: HTTP ${resp.status}`);
  }
  if (!json.ok) {
    throw new Error(json.error);
  }
  return json.reading;
}

export async function generateReading(params: {
  entry: Entry;
  patterns: Pattern[];
  entries?: Entry[];
  todayISO?: string;
}): Promise<Reading> {
  const todayISO = params.todayISO ?? toISODateOnly(new Date());
  const entries = params.entries ?? [params.entry];

  try {
    return await requestReadingFromProxy({
      entry: params.entry,
      patterns: params.patterns,
      entries,
      todayISO,
    });
  } catch {
    return generateReadingMock({ ...params, entries, todayISO });
  }
}
