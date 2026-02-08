import { ArrowLeft, Phone, PencilLine, Sparkles, Wind } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Option = {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
};

const OPTIONS: Option[] = [
  {
    id: "respira",
    title: "Respira 60s",
    subtitle: "Solo ritmo. Sin historia.",
    icon: <Wind className="h-5 w-5 text-white/80" aria-hidden />,
  },
  {
    id: "cinco_lineas",
    title: "5 líneas sin filtro",
    subtitle: "Escribe sin justificar.",
    icon: <PencilLine className="h-5 w-5 text-white/80" aria-hidden />,
  },
  {
    id: "lectura",
    title: "Lectura inmediata",
    subtitle: "Contención sobria.",
    icon: <Sparkles className="h-5 w-5 text-white/80" aria-hidden />,
  },
  {
    id: "contacto",
    title: "Contactar a alguien",
    subtitle: "Tu lista personal (mock).",
    icon: <Phone className="h-5 w-5 text-white/80" aria-hidden />,
  },
];

export default function CrisisPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);

  const activeOption = useMemo(() => OPTIONS.find((o) => o.id === active) ?? null, [active]);

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-12">
      <button
        type="button"
        onClick={() => navigate("/sesion")}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/12"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver
      </button>

      <div className="mt-6 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="text-[11px] tracking-[0.18em] text-white/55">CRISIS</div>
        <div className="mt-3 text-2xl font-semibold tracking-tight text-white">Sin drama. Con acción.</div>
        <div className="mt-3 text-sm leading-relaxed text-white/70">
          Concia no promete salvar. Contiene. Te regresa al cuerpo. Y luego a una línea de verdad.
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setActive(o.id)}
              className={
                o.id === active
                  ? "flex items-center justify-between gap-4 rounded-3xl bg-white/10 px-5 py-4 text-left ring-1 ring-white/15 transition"
                  : "flex items-center justify-between gap-4 rounded-3xl bg-white/6 px-5 py-4 text-left ring-1 ring-white/10 transition hover:bg-white/8"
              }
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  {o.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight text-white">{o.title}</div>
                  <div className="mt-1 text-xs text-white/60">{o.subtitle}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {activeOption ? (
          <div className="mt-6 rounded-3xl bg-white/6 px-5 py-4 ring-1 ring-white/10">
            <div className="text-sm font-semibold text-white">{activeOption.title}</div>
            <div className="mt-2 text-sm text-white/70">mock (v1). En nativo esto dispara el flujo real.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
