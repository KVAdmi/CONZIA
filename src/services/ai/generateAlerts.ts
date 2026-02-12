import type { CheckIn, Entry, Intention, Pattern } from "../../types/models";
import { parseISODate, toISODateOnly } from "../../utils/dates.ts";
import type { Alert } from "./types";

function withinDays(dateISO: string, anchorISO: string, days: number) {
  const date = parseISODate(dateISO).getTime();
  const anchor = parseISODate(anchorISO).getTime();
  const diff = Math.abs(anchor - date);
  return diff <= days * 24 * 60 * 60 * 1000;
}

export function generateAlerts(params: {
  todayISO?: string;
  entries: Entry[];
  intentions: Intention[];
  patterns: Pattern[];
  checkIns: CheckIn[];
}): Alert[] {
  const todayISO = params.todayISO ?? toISODateOnly(new Date());
  const alerts: Alert[] = [];

  // 1) Patrón estructural activo (evidencia reciente + tendencia)
  const pattern = params.patterns.find((p) => {
    if (p.trend !== "up") return false;
    const evidenceRecent = p.evidenceEntryIds
      .map((id) => params.entries.find((e) => e.id === id))
      .filter(Boolean)
      .filter((e) => withinDays(e!.date, todayISO, 14));
    return evidenceRecent.length >= 3;
  });

  if (pattern) {
    const evidenceCount14d = pattern.evidenceEntryIds
      .map((id) => params.entries.find((e) => e.id === id))
      .filter(Boolean)
      .filter((e) => withinDays(e!.date, todayISO, 14)).length;

    alerts.push({
      id: `a_${pattern.id}`,
      kind: "pattern_estructural_activo",
      title: `Patrón estructural activo: ${pattern.name}`,
      detail: `${evidenceCount14d} eventos / 14 días`,
      ctaLabel: "Entrar al Consultorio",
      ctaTo: `/consultorio?patternId=${pattern.id}`,
      patternId: pattern.id,
    });
  }

  // 2) Estancamiento en intención recurrente (misma intención + fallos repetidos)
  const intentions14d = params.intentions.filter((i) => withinDays(i.date, todayISO, 14));
  const byType = new Map<string, Intention[]>();
  for (const i of intentions14d) {
    const key = i.intentionType;
    byType.set(key, [...(byType.get(key) ?? []), i]);
  }
  const stuck = [...byType.entries()].find(([, list]) => {
    if (list.length < 3) return false;
    const notDone = list.filter((i) => i.outcome && i.outcome !== "lo_hice");
    return notDone.length >= 2;
  });
  if (stuck) {
    const [type, list] = stuck;
    const misses = list.filter((i) => i.outcome && i.outcome !== "lo_hice").length;
    alerts.push({
      id: "a_estancamiento_intencion",
      kind: "estancamiento_intencion",
      title: "Estancamiento detectado",
      detail: `Intención recurrente: ${type} (${misses} de ${list.length} sin cierre real)`,
      ctaLabel: "Ver en Consultorio",
      ctaTo: "/consultorio",
    });
  }

  // 3) Silencio prolongado (sin entradas recientes)
  const hasEntry3d = params.entries.some((e) => withinDays(e.date, todayISO, 3));
  if (!hasEntry3d) {
    alerts.push({
      id: "a_silencio",
      kind: "silencio_prolongado",
      title: "Silencio prolongado",
      detail: "Sin registros recientes. Esto también es dato.",
      ctaLabel: "Abrir Mesa (modo silencio)",
      ctaTo: "/mesa?silencio=1",
    });
  }

  return alerts;
}
