import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Heatmap from "../components/charts/Heatmap";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import Sparkline from "../components/charts/Sparkline";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Collapsible from "../components/ui/Collapsible";
import Select from "../components/ui/Select";
import { useSubscription } from "../state/subscriptionStore";
import { useConzia } from "../state/conziaStore";
import type { Entry, Pattern } from "../types/models";
import { addDays, parseISODate, toISODateOnly } from "../utils/dates";

function entryPreview(e: Entry): string {
  return e.text.length > 120 ? `${e.text.slice(0, 117)}…` : e.text;
}

function mondayOf(date: Date): Date {
  const day = date.getDay(); // 0=domingo
  const sinceMonday = (day + 6) % 7;
  return addDays(date, -sinceMonday);
}

export default function PatronesArchivoPage() {
  const { state } = useConzia();
  const sub = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locked = !sub.derived.hasSystem;

  const patterns = useMemo(() => {
    return [...state.patterns].sort((a, b) => b.frequency30d - a.frequency30d);
  }, [state.patterns]);

  const patternIdFromUrl = searchParams.get("patternId") ?? "";
  const initialId = patternIdFromUrl && patterns.some((p) => p.id === patternIdFromUrl) ? patternIdFromUrl : patterns[0]?.id ?? "";

  const [selectedPatternId, setSelectedPatternId] = useState<string>(initialId);
  const selectedPattern = patterns.find((p) => p.id === selectedPatternId);

  const todayISO = toISODateOnly(new Date());
  const today = parseISODate(todayISO);

  const evidenceEntries = useMemo(() => {
    if (!selectedPattern) return [];
    const list = selectedPattern.evidenceEntryIds
      .map((id) => state.entries.find((e) => e.id === id))
      .filter(Boolean) as Entry[];
    return list.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  }, [selectedPattern, state.entries]);

  const stagnation = useMemo(() => {
    if (!selectedPattern) return { repeatedReactionPct: 0, uniqueReactions: 0, sample: "" };
    const list = evidenceEntries.slice(0, 10);
    if (list.length === 0) return { repeatedReactionPct: 0, uniqueReactions: 0, sample: "" };
    const counts = new Map<string, number>();
    for (const e of list) counts.set(e.reaction, (counts.get(e.reaction) ?? 0) + 1);
    const max = Math.max(...counts.values());
    const uniqueReactions = counts.size;
    const repeatedReactionPct = Math.round((max / list.length) * 100);
    const sample = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    return { repeatedReactionPct, uniqueReactions, sample };
  }, [evidenceEntries, selectedPattern]);

  const heatmapCells = useMemo(() => {
    const endMonday = mondayOf(today);
    const startMonday = addDays(endMonday, -28);
    const cells: Array<{ date: string; value: number }> = [];

    for (let dayIdx = 0; dayIdx < 35; dayIdx += 1) {
      const d = addDays(startMonday, dayIdx);
      const iso = toISODateOnly(d);
      const value = parseISODate(iso) > today ? 0 : state.entries.filter((e) => e.date === iso).length;
      cells.push({ date: iso, value });
    }

    return cells;
  }, [state.entries, today]);

  const density30 = useMemo(() => {
    const points: Array<{ value: number }> = [];
    const start = addDays(today, -29);
    for (let i = 0; i < 30; i += 1) {
      const d = addDays(start, i);
      const iso = toISODateOnly(d);
      const checkIn = state.checkIns.find((c) => c.date === iso);
      const entries = state.entries.filter((e) => e.date === iso);
      const fromEntries =
        entries.length === 0
          ? 0
          : Math.round((entries.reduce((acc, e) => acc + e.emotionalWeight, 0) / entries.length) * 10) / 10;
      points.push({ value: typeof checkIn?.emotionalWeight === "number" ? checkIn.emotionalWeight : fromEntries });
    }
    return points;
  }, [state.checkIns, state.entries, today]);

  const patternBars = useMemo(() => {
    return patterns.slice(0, 8).map((p) => ({ label: p.name, value: p.frequency30d }));
  }, [patterns]);

  if (!selectedPattern) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <h2 className="text-sm font-semibold tracking-tight">Archivo de patrones</h2>
          <p className="mt-1 text-sm text-outer-space/70">Sin patrón disponible.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14 space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Revisar archivo</h2>
            <p className="mt-1 text-sm text-outer-space/70">
              Evidencia → repetición → movimiento. Sin BI.
            </p>
          </div>
          <Button onClick={() => navigate("/patrones")}>Volver</Button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <div>
            <div className="text-xs font-medium text-outer-space/80">Patrón</div>
            <Select className="mt-2" value={selectedPatternId} onChange={(e) => setSelectedPatternId(e.target.value)}>
              {patterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="primary"
            disabled={locked}
            onClick={() => navigate(`/caja?patternId=${encodeURIComponent(selectedPattern.id)}`)}
          >
            Enfrentar en Caja
          </Button>
        </div>
      </Card>

      <Collapsible title="Evidencia" description="3–8 entradas que sustentan el patrón." defaultOpen>
        <div className="space-y-3">
          {evidenceEntries.length ? (
            evidenceEntries.map((e) => (
              <div key={e.id} className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{e.date}</div>
                  <div className="text-xs text-outer-space/60">
                    {e.context} · {e.boundary} · {e.reaction} · peso {e.emotionalWeight}
                  </div>
                </div>
                <div className="mt-2 text-sm text-outer-space/75">{entryPreview(e)}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-outer-space/70">Sin evidencia para este patrón.</div>
          )}
        </div>
      </Collapsible>

      <Collapsible title="Movimiento" description="Estancamiento = mismo patrón + misma reacción." defaultOpen={false}>
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
            <div className="text-xs text-morning-blue">Reacción dominante</div>
            <div className="mt-1 text-sm font-semibold tracking-tight text-outer-space">
              {stagnation.sample || "—"}
            </div>
            <div className="mt-2 text-sm text-outer-space/70">
              Repetición (muestra):{" "}
              <span className="font-medium text-outer-space">{stagnation.repeatedReactionPct}%</span>
            </div>
          </div>
          <div className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
            <div className="text-xs text-morning-blue">Variedad de reacción</div>
            <div className="mt-1 text-sm font-semibold tracking-tight text-outer-space">
              {stagnation.uniqueReactions || 0}
            </div>
            <div className="mt-2 text-sm text-outer-space/70">
              Si baja la variedad, suele subir el estancamiento.
            </div>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Gráficas" description="Aquí viven. No en la lista." defaultOpen={false}>
        <div className="space-y-6">
          <Heatmap cells={heatmapCells} title="Heatmap semanal (densidad)" />
          <HorizontalBarChart data={patternBars} title="Frecuencia de patrones" />
          <Sparkline points={density30} title="Densidad emocional" subtitle="30 días" />
        </div>
      </Collapsible>
    </div>
  );
}
