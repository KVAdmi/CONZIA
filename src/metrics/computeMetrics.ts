import type { ConziaDesahogoEmotion, ConziaEntry, ConziaPatternTag, ConziaSession } from "../types/models";
import { addDays, toISODateOnly } from "../utils/dates";
import { inferPatternTag } from "../ai/responseComposer";

export type PatternStatus = "Iniciando" | "Frecuente" | "En aumento" | "Recurrente";

export type ConziaMetrics = {
  cargaEmocionalHoy: number | null;
  estabilidadScore: number | null;
  silencioMinutos: number | null;
  patternCounts7d: Record<ConziaPatternTag, number>;
  patternPrev7d: Record<ConziaPatternTag, number>;
  patternStatus: Record<ConziaPatternTag, PatternStatus>;
  chart: {
    days: string[];
    values: Array<number | null>;
    dataPoints: number;
  };
};

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function variance(values: number[]): number | null {
  const m = mean(values);
  if (m === null) return null;
  if (values.length <= 1) return 0;
  const v = values.reduce((acc, x) => acc + (x - m) * (x - m), 0) / values.length;
  return v;
}

function entryText(entry: ConziaEntry): string {
  if (entry.source === "consultorio" || entry.source === "mesa") return entry.hecho;
  if (entry.source === "quick") return entry.fact_line;
  if (entry.source === "puerta1_observacion") return entry.fact_line;
  if (entry.source === "desahogo") return entry.text;
  return "";
}

function tagForEntry(entry: ConziaEntry): ConziaPatternTag {
  if (entry.source === "desahogo") {
    const raw = entry.analysis?.pattern_tag ?? "";
    if (raw === "rumiacion" || raw === "evitacion" || raw === "aislamiento") return raw;
    return inferPatternTag({ text: entry.text });
  }
  if (entry.source === "puerta1_observacion") {
    return inferPatternTag({ text: entry.fact_line, trap: entry.trap_selected, friccion: entry.friccion_hoy });
  }
  return inferPatternTag({ text: entryText(entry) });
}

function initPatternCounts(): Record<ConziaPatternTag, number> {
  return { rumiacion: 0, evitacion: 0, aislamiento: 0 };
}

function emotionBase(emotion: ConziaDesahogoEmotion): number {
  if (emotion === "ira") return 8.7;
  if (emotion === "ansiedad") return 7.8;
  if (emotion === "vergüenza") return 7.8;
  if (emotion === "miedo") return 7.2;
  if (emotion === "culpa") return 7.2;
  if (emotion === "tristeza") return 6.3;
  return 5.6;
}

function cargaFromDesahogoEntry(entry: Extract<ConziaEntry, { source: "desahogo" }>): number {
  const base = emotionBase(entry.analysis.emotion);
  const lengthBonus = Math.min(2, (entry.text.trim().length / 420) * 2);
  return Math.max(0, Math.min(10, base + lengthBonus));
}

function indiceSaludFromDesahogoEntry(entry: Extract<ConziaEntry, { source: "desahogo" }>): number {
  const resistance = Math.max(0, Math.min(100, entry.analysis.resistance_score));
  const emotionPenalty = (emotionBase(entry.analysis.emotion) - 5.5) / 2.5; // ~0..1.3
  const lengthBonus = Math.min(1.2, (entry.text.trim().length / 520) * 1.2);
  const score = 10 - resistance / 12 - emotionPenalty + lengthBonus;
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

export function computeMetrics(input: {
  entries: ConziaEntry[];
  sessions: ConziaSession[];
  processId: string;
  todayKey: string;
  now?: Date;
}): ConziaMetrics {
  const now = input.now ?? new Date();
  const sessionById = new Map(input.sessions.map((s) => [s.id, s] as const));

  const entriesForProcess = input.entries.filter((e) => e.process_id === input.processId);

  const latestCreatedAtMs = entriesForProcess
    .map((e) => new Date(e.created_at).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a)[0];

  const silencioMinutos =
    typeof latestCreatedAtMs === "number" && !Number.isNaN(latestCreatedAtMs)
      ? Math.max(0, Math.round((now.getTime() - latestCreatedAtMs) / 60000))
      : null;

  const desahogoToday = entriesForProcess.filter(
    (e): e is Extract<ConziaEntry, { source: "desahogo" }> =>
      e.source === "desahogo" && toISODateOnly(new Date(e.created_at)) === input.todayKey,
  );

  const cargaEmocionalHoy = desahogoToday.length
    ? Math.round(mean(desahogoToday.map(cargaFromDesahogoEntry))! * 10) / 10
    : (() => {
        const weightsToday: number[] = [];
        for (const e of entriesForProcess) {
          if (e.source !== "consultorio" && e.source !== "mesa") continue;
          const s = sessionById.get(e.session_id) ?? null;
          if (!s || s.date_key !== input.todayKey) continue;
          weightsToday.push(e.peso);
        }
        const m = mean(weightsToday);
        return m === null ? null : Math.round(m * 10) / 10;
      })();

  const resistanceWindow = entriesForProcess
    .filter((e): e is Extract<ConziaEntry, { source: "desahogo" }> => e.source === "desahogo")
    .filter((e) => {
      const createdKey = toISODateOnly(new Date(e.created_at));
      const age = Math.abs(Number(new Date(createdKey)) - Number(new Date(input.todayKey)));
      return age <= 7 * 24 * 60 * 60 * 1000;
    })
    .map((e) => e.analysis.resistance_score);

  const avgResistance = mean(resistanceWindow);
  const estabilidadScore =
    avgResistance === null ? null : Math.max(0, Math.min(10, Math.round((10 - avgResistance / 10) * 10) / 10));

  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i -= 1) last7Days.push(toISODateOnly(addDays(now, -i)));
  const prev7Days: string[] = [];
  for (let i = 13; i >= 7; i -= 1) prev7Days.push(toISODateOnly(addDays(now, -i)));

  const last7Set = new Set(last7Days);
  const prev7Set = new Set(prev7Days);

  const patternCounts7d = initPatternCounts();
  const patternPrev7d = initPatternCounts();

  for (const e of entriesForProcess) {
    const createdKey = toISODateOnly(new Date(e.created_at));
    const tag = tagForEntry(e);
    if (last7Set.has(createdKey)) patternCounts7d[tag] += 1;
    if (prev7Set.has(createdKey)) patternPrev7d[tag] += 1;
  }

  const patternStatus = (Object.keys(patternCounts7d) as ConziaPatternTag[]).reduce(
    (acc, tag) => {
      const curr = patternCounts7d[tag];
      const prev = patternPrev7d[tag];
      acc[tag] =
        curr === 0 && prev === 0 ? "Iniciando" : prev === 0 && curr > 0 ? "Frecuente" : curr > prev ? "En aumento" : "Recurrente";
      return acc;
    },
    {} as Record<ConziaPatternTag, PatternStatus>,
  );

  const saludValues: Array<number | null> = last7Days.map((dayKey) => {
    const values: number[] = [];
    for (const e of entriesForProcess) {
      if (e.source !== "desahogo") continue;
      const createdKey = toISODateOnly(new Date(e.created_at));
      if (createdKey !== dayKey) continue;
      values.push(indiceSaludFromDesahogoEntry(e));
    }
    return mean(values);
  });

  const chartValues = saludValues.map((v) => (typeof v === "number" ? Math.round(v * 10) / 10 : null));
  const dataPoints = chartValues.filter((x) => typeof x === "number").length;

  return {
    cargaEmocionalHoy,
    estabilidadScore,
    silencioMinutos,
    patternCounts7d,
    patternPrev7d,
    patternStatus,
    chart: { days: last7Days, values: chartValues, dataPoints },
  };
}
