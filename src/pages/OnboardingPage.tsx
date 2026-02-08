import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Step = {
  id: string;
  kind: "umbral" | "card" | "final";
  eyebrow?: string;
  title: string;
  body: string[];
  footnote?: string;
};

const ONBOARDING_DONE_KEY = "concia_v1_onboarding_done";

const STEPS: Step[] = [
  {
    id: "umbral",
    kind: "umbral",
    title: "CONCIA",
    body: ["Desahogo y reencuentro."],
    footnote: "Un espacio íntimo para decir lo que cargas\ny volver a ti sin máscaras.",
  },
  {
    id: "desahogo",
    kind: "card",
    title: "Aquí no vienes\na verte bien.",
    body: [
      "Concia no te pide respuestas correctas.\nTe invita a decir lo que normalmente callas.\nSin orden. Sin filtro. Sin juicio.",
    ],
    footnote: "Hablar también es soltar.",
  },
  {
    id: "incomodo",
    kind: "card",
    title: "Lo que evitas\ntambién habla.",
    body: [
      "A veces lo que más pesa\nno es lo que pasó,\nsino lo que nunca dijiste.",
    ],
    footnote: "Aquí puedes mirarlo sin huir.",
  },
  {
    id: "reencuentro",
    kind: "card",
    title: "Después del desahogo,\nviene el regreso.",
    body: ["No para ser otra persona.\nSino para volver a ti\ncon menos carga y más claridad."],
    footnote: "Lo que sueltas, no te pierde.",
  },
  {
    id: "decision",
    kind: "final",
    title: "Concia es\nun proceso personal.",
    body: ["Nadie te observa.\nNadie te corrige.\nSolo tú, con lo que aparece."],
    footnote: "Puedes salir cuando quieras.",
  },
];

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

  const step = STEPS[idx]!;
  const isLast = idx === STEPS.length - 1;

  const overlayOpacity = useMemo(() => {
    if (step.id === "incomodo") return 0.72;
    if (step.id === "reencuentro") return 0.56;
    return 0.65;
  }, [step.id]);

  function persistDone() {
    try {
      localStorage.setItem(ONBOARDING_DONE_KEY, "1");
    } catch {
      // ignore
    }
  }

  function next() {
    if (isLast) {
      persistDone();
      navigate("/planes/elige", { replace: true });
      return;
    }
    setIdx((v) => Math.min(STEPS.length - 1, v + 1));
  }

  function onTap(e: React.MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest("button,a,input,textarea,select,label")) return;
    next();
  }

  return (
    <div className="relative min-h-[100svh] text-[#EAE6DF]" onClick={onTap}>
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1, 1.03] }}
        transition={{ duration: 38, ease: "linear", repeat: Infinity, repeatType: "mirror" }}
      >
        <img
          src={`${import.meta.env.BASE_URL}brand/concia-onboarding-bg.png`}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          draggable={false}
        />
      </motion.div>
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(30,42,56,${overlayOpacity})` }} />

      <div className="relative z-10 min-h-[100svh] px-8 pb-10 pt-14 flex flex-col">
        <div className="mt-2">{dots(STEPS.length, idx)}</div>

        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
              transition={{ duration: 0.34, ease: "easeOut" }}
              className="w-full flex items-center justify-center"
            >
              {step.kind === "umbral" ? (
                <div className="w-full max-w-[340px] text-center">
                  <img
                    src={`${import.meta.env.BASE_URL}brand/concia-favicon.png`}
                    alt="Concia"
                    className="mx-auto h-16 w-16 object-contain"
                    loading="eager"
                    draggable={false}
                  />
                  <div className="font-serif text-[44px] tracking-[0.18em]">{step.title}</div>
                  <div className="mt-6 text-base text-[#EAE6DF]/85">{step.body[0]}</div>
                </div>
              ) : (
                <div className={glassCardClassName(step.kind === "final" ? "solid" : "soft")}>
                  {step.eyebrow ? (
                    <div className="text-[11px] tracking-[0.18em] text-[#EAE6DF]/55">{step.eyebrow}</div>
                  ) : null}
                  <div className="font-serif text-[28px] leading-[1.18]">{step.title}</div>
                  <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#EAE6DF]/80 whitespace-pre-line">
                    {step.body.map((p) => (
                      <div key={p}>{p}</div>
                    ))}
                  </div>
                  {step.footnote && step.kind !== "final" ? (
                    <div className="mt-7 font-serif italic text-sm text-[#EAE6DF]/65">
                      {step.footnote}
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-auto flex flex-col items-center">
          {step.kind === "umbral" && step.footnote ? (
            <div className="max-w-[320px] text-center text-sm leading-relaxed text-[#EAE6DF]/80 whitespace-pre-line">
              {step.footnote}
            </div>
          ) : null}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              next();
            }}
            className={step.kind === "final" ? glassButtonClassName("cta") : glassButtonClassName("small")}
          >
            {step.kind === "final" ? "Entrar a Concia" : "Continuar"}
          </button>

          {step.kind === "final" && step.footnote ? (
            <div className="mt-4 text-xs text-[#EAE6DF]/60 italic">{step.footnote}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
