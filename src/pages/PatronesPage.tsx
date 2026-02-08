import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Collapsible from "../components/ui/Collapsible";
import { useSubscription } from "../state/subscriptionStore";
import { useXmi } from "../state/xmiStore";
import type { Pattern } from "../types/models";
import { addDays, parseISODate, toISODateOnly } from "../utils/dates";

function trendArrow(t: Pattern["trend"]): string {
  if (t === "up") return "↑";
  if (t === "down") return "↓";
  return "→";
}

function trendLabel(t: Pattern["trend"]): string {
  if (t === "up") return "más activo";
  if (t === "down") return "menos activo";
  return "estable";
}

export default function PatronesPage() {
  const { state } = useXmi();
  const sub = useSubscription();
  const navigate = useNavigate();
  const locked = !sub.derived.hasSystem;

  const patterns = useMemo(() => {
    return [...state.patterns].sort((a, b) => b.frequency30d - a.frequency30d);
  }, [state.patterns]);

  const [selectedPatternId, setSelectedPatternId] = useState<string>(patterns[0]?.id ?? "");
  const selectedPattern = patterns.find((p) => p.id === selectedPatternId);

  const intentionSummary = useMemo(() => {
    const todayISO = toISODateOnly(new Date());
    const start = addDays(parseISODate(todayISO), -29);
    const intentions = state.intentions.filter((i) => parseISODate(i.date) >= start);
    const byType = new Map<string, { total: number; notAchieved: number }>();
    for (const i of intentions) {
      const cur = byType.get(i.intentionType) ?? { total: 0, notAchieved: 0 };
      cur.total += 1;
      if (i.outcome && i.outcome !== "lo_hice") cur.notAchieved += 1;
      byType.set(i.intentionType, cur);
    }
    return [...byType.entries()]
      .map(([type, v]) => ({
        type,
        total: v.total,
        pctNotAchieved: v.total === 0 ? 0 : Math.round((v.notAchieved / v.total) * 100),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [state.intentions]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {locked ? (
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Patrones (modo básico)</h2>
              <p className="mt-1 text-sm text-outer-space/70">
                En modo básico no abrimos analítica completa. Aquí validamos el archivo y el ritual.
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate("/planes")}>
              Ver planes
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-6">
        <h2 className="text-sm font-semibold tracking-tight">Patrones</h2>
        <p className="mt-1 text-sm text-outer-space/70">
          Archivo semanal. Ciclos y evidencia. Sin juicio.
        </p>

        <div className="mt-5 space-y-2">
          {patterns.slice(0, 6).map((p) => {
            const active = p.id === selectedPatternId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPatternId(p.id)}
                className={
                  active
                    ? "w-full rounded-xl bg-mint-cream ring-1 ring-gainsboro/70 px-4 py-4 text-left"
                    : "w-full rounded-xl bg-white ring-1 ring-gainsboro/70 px-4 py-4 text-left transition hover:bg-mint-cream/50"
                }
                aria-pressed={active}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{p.name}</div>
                  <div className="text-xs text-outer-space/60">
                    {trendArrow(p.trend)} {trendLabel(p.trend)}
                  </div>
                </div>
                <div className="mt-1 text-sm text-outer-space/70">
                  Contextos: {p.contexts.join(", ")}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="quiet" onClick={() => navigate("/archivo")}>
            Ver archivo
          </Button>
          <Button
            variant="primary"
            disabled={!selectedPattern}
            onClick={() => navigate(`/patrones/archivo?patternId=${encodeURIComponent(selectedPatternId)}`)}
          >
            Revisar archivo
          </Button>
        </div>
      </Card>

      <Collapsible title="Intención vs Realidad (resumen)" description="Últimos 30 días. Lista breve. Sin panel." defaultOpen={false}>
        <div className="space-y-2">
          {intentionSummary.length ? (
            intentionSummary.map((x) => (
              <div key={x.type} className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{x.type}</div>
                  <div className="text-sm text-outer-space/70">{x.pctNotAchieved}% no logrado</div>
                </div>
                <div className="mt-1 text-xs text-outer-space/60">{x.total} veces declarada</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-outer-space/70">Sin intención suficiente todavía.</div>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
