import { ArrowLeft, Flame } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassSheet from "../components/ui/GlassSheet";

type Ritual = { id: string; label: string; hint: string; steps: string[] };

export default function IntegracionRitualPage() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);

  const items: Ritual[] = useMemo(() => {
    return [
      {
        id: "quemar",
        label: "Quemar",
        hint: "dejar ir",
        steps: ["Escribe 1 línea: qué sueltas.", "Respira. Lee en voz baja.", "Cierre simbólico: “Ya no te debo.”"],
      },
      {
        id: "romper",
        label: "Romper",
        hint: "cortar",
        steps: ["Nombra el contrato invisible.", "Rompe una regla vieja en 1 gesto mínimo.", "Cierre: “Hoy no juego ese juego.”"],
      },
      {
        id: "soltar",
        label: "Soltar",
        hint: "terminar",
        steps: ["Ubica qué estás controlando.", "Suelta 1 micro‑acción (no revisar, no perseguir).", "Cierre: “Puedo con la incomodidad.”"],
      },
    ];
  }, []);

  const active = useMemo(() => items.find((x) => x.id === activeId) ?? null, [activeId, items]);

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-12">
      <button
        type="button"
        onClick={() => navigate("/integracion")}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/12"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver
      </button>

      <div className="mt-10 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <Flame className="h-5 w-5 text-white/80" aria-hidden />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">Ritual de liberación</div>
            <div className="mt-1 text-xs text-white/60">mock (v1)</div>
          </div>
        </div>

        <div className="mt-5 text-sm leading-relaxed text-white/70">
          Este módulo no “cura”. Cierra simbólicamente. Después de un avance real, eliges qué valor pones en su lugar.
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {items.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setActiveId(x.id)}
              className="rounded-2xl bg-white/10 px-3 py-4 text-center ring-1 ring-white/10 transition hover:bg-white/12"
            >
              <div className="text-xs font-semibold text-white">{x.label}</div>
              <div className="mt-1 text-[11px] text-white/60">{x.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <GlassSheet
        open={active !== null}
        title={active?.label ?? "Ritual"}
        description="mock (v1). Cierre simbólico + valor guía."
        onClose={() => setActiveId(null)}
      >
        {active ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/8 ring-1 ring-white/10 px-5 py-4">
              <div className="text-[11px] tracking-[0.18em] text-white/55">INTENCIÓN</div>
              <div className="mt-2 text-sm text-white/75">{active.hint}</div>
            </div>
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-5 py-5">
              <div className="text-[11px] tracking-[0.18em] text-white/55">PASOS (RÁPIDO)</div>
              <div className="mt-3 space-y-2">
                {active.steps.map((s) => (
                  <div key={s} className="text-sm text-white/75 leading-relaxed">
                    - {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </GlassSheet>
    </div>
  );
}
