import { ArrowLeft, ChevronRight, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassSheet from "../components/ui/GlassSheet";

type Tool = {
  id: string;
  title: string;
  subtitle: string;
  steps: string[];
};

const TOOLS: Tool[] = [
  {
    id: "no_sin_justificar",
    title: "Cómo decir no sin justificar",
    subtitle: "1 frase. 1 límite. 0 explicación.",
    steps: [
      "Respira una vez. No negocies con tu tono.",
      "Di la frase completa y calla.",
      "Si insisten: repite igual. No agregues historia.",
      "Cierre: “Entiendo. Aun así, no.”",
    ],
  },
  {
    id: "pedir_sin_disculparte",
    title: "Cómo pedir sin disculparte",
    subtitle: "Pedir = claridad. No vergüenza.",
    steps: [
      "Nombra la necesidad (sin justificar).",
      "Pide algo concreto (una acción, una fecha, un sí/no).",
      "Si no pueden: pide alternativa específica.",
    ],
  },
  {
    id: "sostener_90s",
    title: "Cómo sostener incomodidad 90s",
    subtitle: "No es aguantar. Es observar sin huir.",
    steps: [
      "Pon un timer de 90s.",
      "Nombra 3 sensaciones físicas (sin historia).",
      "No tomes decisiones durante el timer.",
      "Al final: elige 1 acción mínima, no una solución.",
    ],
  },
  {
    id: "cortar_rumiacion",
    title: "Cómo cortar rumiación (ritmo + frase)",
    subtitle: "Cuerpo primero. Luego una línea.",
    steps: [
      "Camina 20 pasos (o golpe suave de pies) con ritmo.",
      "Repite una frase corta: “Ya vi el bucle. Vuelvo.”",
      "Haz 1 tarea de 5 min sin optimizar.",
    ],
  },
];

export default function IntegracionHerramientasPage() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTool = useMemo(() => TOOLS.find((t) => t.id === activeId) ?? null, [activeId]);

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
            <Wrench className="h-5 w-5 text-white/80" aria-hidden />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">Herramientas</div>
            <div className="mt-1 text-xs text-white/60">mock (v1)</div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              className="w-full rounded-3xl bg-white/6 px-5 py-4 text-left ring-1 ring-white/10 transition hover:bg-white/8 active:scale-[0.995]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-tight text-white">{t.title}</div>
                  <div className="mt-1 text-xs text-white/60">{t.subtitle}</div>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/50" aria-hidden />
              </div>
            </button>
          ))}
        </div>
      </div>

      <GlassSheet
        open={activeTool !== null}
        title={activeTool?.title ?? "Herramienta"}
        description="mock (v1). En nativo esto se personaliza por patrón."
        onClose={() => setActiveId(null)}
      >
        {activeTool ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/8 ring-1 ring-white/10 px-5 py-4">
              <div className="text-[11px] tracking-[0.18em] text-white/55">IDEA</div>
              <div className="mt-2 text-sm text-white/75">{activeTool.subtitle}</div>
            </div>
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-5 py-5">
              <div className="text-[11px] tracking-[0.18em] text-white/55">PASOS (RÁPIDO)</div>
              <div className="mt-3 space-y-2">
                {activeTool.steps.map((s) => (
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
