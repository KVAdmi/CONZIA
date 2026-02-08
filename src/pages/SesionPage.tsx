import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mic } from "lucide-react";
import { useXmi } from "../state/xmiStore";

function headlineFromPattern(name?: string): string {
  if (!name) return "Habla 60s.";
  return "Algo se repite.";
}

function promptFromPattern(name?: string): string {
  if (!name) return "“¿Dónde cediste hoy para evitar incomodidad?”";
  return `“${name}: nombra el hecho sin explicar.”`;
}

export default function SesionPage() {
  const navigate = useNavigate();
  const { state } = useXmi();

  const dominantPattern = useMemo(() => {
    return [...state.patterns].sort((a, b) => b.frequency30d - a.frequency30d)[0];
  }, [state.patterns]);

  const showCaja = Boolean(dominantPattern && dominantPattern.frequency30d >= 3);

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14">
      <div className="text-white">
        <div className="text-[28px] font-semibold tracking-tight">Hola, [Nombre].</div>
        <div className="mt-2 text-sm text-white/65">Hoy: nombra el hecho sin adornarlo.</div>
      </div>

      <div className="mt-7 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] tracking-[0.18em] text-white/55">TU PRÓXIMO PASO</div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {headlineFromPattern(dominantPattern?.name)}
            </div>
            <div className="mt-3 text-sm leading-relaxed text-white/70">
              {promptFromPattern(dominantPattern?.name)}
            </div>
          </div>
          <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/10">
            <span className="inline-block h-2 w-2 rounded-full bg-white/60" aria-hidden />
            Local
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => navigate("/espejo")}
            className="w-full rounded-2xl bg-[#7D5C6B] px-5 py-4 text-left text-sm font-semibold tracking-wide text-white ring-1 ring-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:bg-[#6f5160] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <Mic className="h-4 w-4" aria-hidden />
                HABLAR
              </span>
              <ArrowRight className="h-4 w-4 text-white/85" aria-hidden />
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/descarga")}
            className="w-full rounded-2xl bg-white/5 px-5 py-4 text-left text-sm font-semibold tracking-wide text-white ring-1 ring-white/10 transition hover:bg-white/8 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-3">
              <span>ESCRIBIR</span>
              <ArrowRight className="h-4 w-4 text-white/70" aria-hidden />
            </div>
          </button>

          {showCaja ? (
            <button
              type="button"
              onClick={() => navigate(`/caja?patternId=${encodeURIComponent(dominantPattern?.id ?? "")}`)}
              className="w-full rounded-2xl bg-white/5 px-5 py-4 text-left text-sm font-semibold tracking-wide text-white ring-1 ring-white/10 transition hover:bg-white/8 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-3">
                <span>ENTRAR A CAJA</span>
                <ArrowRight className="h-4 w-4 text-white/70" aria-hidden />
              </div>
              <div className="mt-2 text-xs text-white/60">Con evidencia. Sin prisa.</div>
            </button>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/mapa")}
            className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 transition hover:bg-white/12"
          >
            Mapa
          </button>
          <button
            type="button"
            onClick={() => navigate("/crisis")}
            className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 transition hover:bg-white/12"
          >
            Crisis
          </button>
          <button
            type="button"
            onClick={() => navigate("/boveda")}
            className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 transition hover:bg-white/12"
          >
            Bóveda
          </button>
          <button
            type="button"
            onClick={() => navigate("/mas")}
            className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 transition hover:bg-white/12"
          >
            Más
          </button>
        </div>
      </div>
    </div>
  );
}
