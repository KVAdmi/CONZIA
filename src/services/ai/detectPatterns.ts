import type { Entry, Pattern, Trend } from "../../types/models";
import { addDays, parseISODate, toISODateOnly } from "../../utils/dates";

function withinDays(dateISO: string, anchorISO: string, days: number) {
  const date = parseISODate(dateISO).getTime();
  const anchor = parseISODate(anchorISO).getTime();
  const diff = anchor - date;
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function trendFromCounts(recent: number, prev: number): Trend {
  if (recent > prev) return "up";
  if (recent < prev) return "down";
  return "flat";
}

export function detectPatterns(params: {
  todayISO?: string;
  entries: Entry[];
  patterns: Pattern[];
}): Pattern[] {
  const todayISO = params.todayISO ?? toISODateOnly(new Date());
  const start30 = addDays(parseISODate(todayISO), -29);

  // Heurística v1: recalcula frecuencia/ tendencia por evidencia + coincidencias simples.
  return params.patterns.map((p) => {
    const evidenceEntries = p.evidenceEntryIds
      .map((id) => params.entries.find((e) => e.id === id))
      .filter(Boolean) as Entry[];

    const nameNeedle = p.name.toLowerCase();
    const byTag = params.entries.filter((e) => e.tags.join(" ").toLowerCase().includes(nameNeedle.split(" ")[0] ?? ""));

    const relevant = [...new Set([...evidenceEntries, ...byTag])].filter(
      (e) => parseISODate(e.date) >= start30,
    );

    const recent14 = relevant.filter((e) => withinDays(e.date, todayISO, 14)).length;
    const prev14 = relevant.filter((e) => withinDays(e.date, toISODateOnly(addDays(parseISODate(todayISO), -14)), 14)).length;

    return {
      ...p,
      frequency30d: relevant.length,
      trend: trendFromCounts(recent14, prev14),
    };
  });
}

