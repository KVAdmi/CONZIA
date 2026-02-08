import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function pillClassName(): string {
  return "rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md";
}

export default function InicioPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("concia_onboarded") === "1") {
      navigate("/sesion", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14 flex flex-col">
      <div className="flex items-start justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-[28px] bg-white/10 ring-1 ring-white/12 backdrop-blur-md shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <img
              src={`${import.meta.env.BASE_URL}brand/concia-logo.png`}
              alt="Concia"
              className="h-[60px] w-[60px] object-contain"
              loading="eager"
            />
          </div>
          <div className="mt-1 text-sm text-white/70">Volver a ti.</div>
        </div>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/10 backdrop-blur-md">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-200/80" aria-hidden />
          Local
        </div>
      </div>

      <div className="mt-auto">
        <div className="rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <div className="text-[11px] tracking-[0.18em] text-white/55">INFORMACIÓN</div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">Qué vas a hacer aquí</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Una pregunta por vez. Tú decides cuándo pedir lectura. La Bóveda está fuera del sistema.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className={pillClassName()}>Privado</span>
            <span className={pillClassName()}>Directo</span>
            <span className={pillClassName()}>Sin drama</span>
          </div>

          <button
            type="button"
            onClick={() => {
              localStorage.setItem("concia_onboarded", "1");
              navigate("/sesion");
            }}
            className="mt-7 w-full rounded-2xl bg-[#7D5C6B] px-5 py-4 text-center text-sm font-semibold tracking-wide text-white ring-1 ring-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:bg-[#6f5160] active:scale-[0.99]"
          >
            ENTRAR
          </button>
        </div>
      </div>
    </div>
  );
}
