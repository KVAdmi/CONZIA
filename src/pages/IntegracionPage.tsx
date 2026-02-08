import { ArrowRight, Compass, Flame, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

function CardButton(props: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="flex w-full items-center justify-between gap-4 rounded-3xl bg-[#0b1220]/72 px-5 py-5 text-left ring-1 ring-white/10 backdrop-blur-xl transition hover:bg-[#0b1220]/78 active:scale-[0.995]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
          {props.icon}
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight text-white">{props.title}</div>
          <div className="mt-1 text-xs leading-relaxed text-white/60">{props.subtitle}</div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-white/50" aria-hidden />
    </button>
  );
}

export default function IntegracionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14">
      <div>
        <div className="text-[26px] font-semibold tracking-tight text-white">Integración</div>
        <div className="mt-2 text-sm text-white/65">Convierte insight en conducta. Sin heroísmo.</div>
      </div>

      <div className="mt-7 space-y-3">
        <div className="text-[11px] tracking-[0.18em] text-white/55">CAPAS</div>
        <CardButton
          title="Compás de valores"
          subtitle="Define un valor guía después de un avance. Úsalo cuando vuelvas al patrón."
          icon={<Compass className="h-5 w-5 text-white/80" aria-hidden />}
          onClick={() => navigate("/integracion/compas")}
        />
        <CardButton
          title="Herramientas"
          subtitle="Micro‑intervenciones activadas por patrón (límites, rumiación, pedir sin disculparte)."
          icon={<Wrench className="h-5 w-5 text-white/80" aria-hidden />}
          onClick={() => navigate("/integracion/herramientas")}
        />
        <CardButton
          title="Ritual de liberación"
          subtitle="Cierre simbólico: quemar · romper · soltar. Luego eliges qué valor pones en su lugar."
          icon={<Flame className="h-5 w-5 text-white/80" aria-hidden />}
          onClick={() => navigate("/integracion/ritual")}
        />
      </div>
    </div>
  );
}
