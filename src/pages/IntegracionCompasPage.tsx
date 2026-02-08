import { ArrowLeft, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function IntegracionCompasPage() {
  const navigate = useNavigate();

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
            <Compass className="h-5 w-5 text-white/80" aria-hidden />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">Compás de valores</div>
            <div className="mt-1 text-xs text-white/60">mock (v1)</div>
          </div>
        </div>

        <div className="mt-5 text-sm leading-relaxed text-white/70">
          Aquí vive tu brújula: valores definidos después de avances reales. Concia los usa para recordarte una decisión mínima
          cuando vuelves al patrón.
        </div>
      </div>
    </div>
  );
}
