import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useXmi } from "../state/xmiStore";
import type { Entry, Pattern } from "../types/models";

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function preview(text: string): string {
  const clean = oneLine(text);
  return clean.length > 170 ? `${clean.slice(0, 167)}…` : clean;
}

function contextsLabel(p: Pattern): string {
  return p.contexts.length ? p.contexts.join(", ") : "—";
}

export default function RepeticionPage() {
  const navigate = useNavigate();
  const { state } = useXmi();

  const patterns = useMemo(() => [...state.patterns].sort((a, b) => b.frequency30d - a.frequency30d), [state.patterns]);
  const [selectedId, setSelectedId] = useState<string>(patterns[0]?.id ?? "");
  const selected = patterns.find((p) => p.id === selectedId) ?? patterns[0];

  const evidence = useMemo<Entry[]>(() => {
    if (!selected) return [];
    const list = selected.evidenceEntryIds
      .map((id) => state.entries.find((e) => e.id === id))
      .filter(Boolean) as Entry[];
    return list.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4);
  }, [selected, state.entries]);

  if (!patterns.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-14 pt-10">
        <button
          type="button"
          onClick={() => navigate("/sesion")}
          className="inline-flex items-center gap-2 rounded-xl bg-white/55 ring-1 ring-gainsboro/60 px-3 py-2 text-sm text-outer-space/80 backdrop-blur-md transition hover:bg-white/70"
        >
          <X className="h-4 w-4" aria-hidden />
          Cerrar
        </button>
        <div className="mt-10">
          <h1 className="text-2xl font-semibold tracking-tight text-outer-space">Algo se repite</h1>
          <p className="mt-3 text-sm text-outer-space/70">
            Aún no hay evidencia suficiente para abrir Caja con honestidad.
          </p>
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={() => navigate("/descarga")}>
              Escribir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-14 pt-10">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/sesion")}
          className="inline-flex items-center gap-2 rounded-xl bg-white/55 ring-1 ring-gainsboro/60 px-3 py-2 text-sm text-outer-space/80 backdrop-blur-md transition hover:bg-white/70"
        >
          <X className="h-4 w-4" aria-hidden />
          Cerrar
        </button>
        <Button variant="quiet" onClick={() => navigate("/archivo")}>
          Ver archivo
        </Button>
      </div>

      <div className="mt-10">
        <div className="text-xs text-morning-blue">Repetición</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-outer-space">Algo se repite.</h1>
        <p className="mt-3 text-sm text-outer-space/70 leading-relaxed">
          La sombra no es un problema a resolver. Es información que no habías querido ver. Aquí solo la iluminamos con evidencia.
        </p>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Patrones activos (resumen)</h2>
            <p className="mt-1 text-sm text-outer-space/70">Elige uno para ver evidencia.</p>
          </div>
          <div className="text-xs text-outer-space/60">mock</div>
        </div>

        <div className="mt-5 space-y-2">
          {patterns.slice(0, 3).map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={
                  active
                    ? "w-full rounded-2xl bg-white/70 ring-1 ring-gainsboro/60 px-4 py-4 text-left backdrop-blur-md"
                    : "w-full rounded-2xl bg-white/55 ring-1 ring-gainsboro/60 px-4 py-4 text-left backdrop-blur-md transition hover:bg-white/70"
                }
                aria-pressed={active}
              >
                <div className="text-sm font-semibold tracking-tight text-outer-space">{p.name}</div>
                <div className="mt-1 text-sm text-outer-space/70">Contextos: {contextsLabel(p)}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 rounded-2xl bg-white/65 ring-1 ring-gainsboro/60 px-6 py-6 backdrop-blur-md">
        <div className="text-xs text-morning-blue">Evidencia (extracto)</div>
        <div className="mt-2 text-lg font-semibold tracking-tight text-outer-space">{selected?.name}</div>
        <div className="mt-4 space-y-3">
          {evidence.length ? (
            evidence.map((e) => (
              <div key={e.id} className="rounded-2xl bg-white/70 ring-1 ring-gainsboro/60 px-4 py-4 backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-xs text-morning-blue">{e.date}</div>
                  <div className="text-xs text-outer-space/60">
                    {e.context} · {e.boundary} · {e.reaction} · peso {e.emotionalWeight}
                  </div>
                </div>
                <div className="mt-2 text-sm text-outer-space/80 leading-relaxed">{preview(e.text)}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-outer-space/70">Sin evidencia disponible.</div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => navigate("/descarga")}>Escribir primero</Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/caja?patternId=${encodeURIComponent(selected?.id ?? "")}`)}
            disabled={!selected}
          >
            Entrar a Caja
          </Button>
        </div>
      </div>
    </div>
  );
}
