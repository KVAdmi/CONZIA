import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const ONBOARDING_DONE_KEY = "conzia_v1_onboarding_done";

function glassCardClassName(variant: "soft" | "solid"): string {
  return [
    "w-full max-w-[340px] rounded-[36px] px-8 py-8 text-center",
    "backdrop-blur-xl ring-1 ring-white/14 shadow-[0_20px_80px_rgba(0,0,0,0.45)]",
    variant === "solid" ? "bg-[rgba(234,230,223,0.12)]" : "bg-[rgba(234,230,223,0.08)]",
  ].join(" ");
}

function glassButtonClassName(kind: "small" | "cta"): string {
  return [
    "inline-flex items-center justify-center select-none",
    kind === "cta" ? "w-full rounded-2xl px-6 py-4 text-sm font-semibold tracking-wide" : "rounded-full px-6 py-3 text-xs font-semibold tracking-wide",
    "bg-white/10 text-[#EAE6DF] ring-1 ring-white/16 backdrop-blur-md",
    "shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:bg-white/12 active:scale-[0.99]",
  ].join(" ");
}

function dots(count: number, active: number) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label="Progreso">
      {Array.from({ length: count }, (_, idx) => (
        <span
          key={idx}
          className={[
            "h-1.5 w-1.5 rounded-full transition",
            idx === active ? "bg-[#EAE6DF]/85" : "bg-[#EAE6DF]/30",
          ].join(" ")}
          aria-hidden
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [accepted, setAccepted] = useState(false);

  const isContrato = idx === 1;
  const stepCount = 2;

  const overlayOpacity = useMemo(() => {
    return isContrato ? 0.7 : 0.62;
  }, [isContrato]);

  function persistDone() {
    try {
      localStorage.setItem(ONBOARDING_DONE_KEY, "1");
    } catch {
      // ignore
    }
  }

  function next() {
    if (idx === 0) {
      setIdx(1);
      return;
    }
    if (!accepted) return;
    persistDone();
    navigate("/registro", { replace: true });
  }

  function onTap(e: React.MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest("button,a,input,textarea,select,label")) return;
    if (!isContrato) next();
  }

  return (
    <div className="relative min-h-[100svh] text-[#EAE6DF]" onClick={onTap}>
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1, 1.03] }}
        transition={{ duration: 38, ease: "linear", repeat: Infinity, repeatType: "mirror" }}
      >
        <img
          src={`${import.meta.env.BASE_URL}brand/conzia-onboarding-bg.png`}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          draggable={false}
        />
      </motion.div>
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(30,42,56,${overlayOpacity})` }} />

      <div className="relative z-10 min-h-[100svh] px-8 pb-10 pt-14 flex flex-col">
        <div className="mt-2">{dots(stepCount, idx)}</div>

        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
              transition={{ duration: 0.34, ease: "easeOut" }}
              className="w-full flex items-center justify-center"
            >
              {idx === 0 ? (
                <div className="w-full max-w-[340px] text-center">
                  <img
                    src={`${import.meta.env.BASE_URL}brand/conzia-favicon.png`}
                    alt="CONZIA"
                    className="mx-auto h-16 w-16 object-contain"
                    loading="eager"
                    draggable={false}
                  />
                  <div className="font-serif text-[44px] tracking-[0.18em]">CONZIA</div>
                  <div className="mt-6 text-base text-[#EAE6DF]/85">Acompañamiento para ver lo que evitas.</div>
                </div>
              ) : (
                <div className={glassCardClassName("solid")}>
                  <div className="text-[11px] tracking-[0.18em] text-[#EAE6DF]/55">CONTRATO</div>
                  <div className="mt-4 font-serif text-[22px] leading-[1.25]">
                    CONZIA no es terapia. No diagnostica. No te endulza.
                  </div>

                  <label className="mt-8 flex items-start gap-3 text-left">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#7D5C6B]"
                    />
                    <span className="text-[15px] leading-relaxed text-[#EAE6DF]/85">
                      Acepto trabajar sin justificarme.
                    </span>
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-auto flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              next();
            }}
            disabled={isContrato && !accepted}
            className={[
              isContrato ? glassButtonClassName("cta") : glassButtonClassName("small"),
              isContrato && !accepted ? "opacity-60 pointer-events-none" : "",
            ].join(" ")}
          >
            {isContrato ? "Entrar" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
