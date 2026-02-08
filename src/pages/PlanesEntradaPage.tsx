import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PlanId } from "../state/subscriptionStore";
import { useSubscription } from "../state/subscriptionStore";

const PLAN_INTENT_KEY = "conzia_v1_plan_intent";
const PENDING_SUBSCRIPTION_KEY = "conzia_v1_pending_subscription";
const CHECKOUT_PLAN_KEY = "conzia_v1_checkout_plan";
const ACCESS_DONE_KEY = "conzia_v1_access_done";

function glassCardClassName(): string {
  return [
    "w-full rounded-[34px] px-7 py-6 text-left",
    "bg-[rgba(234,230,223,0.08)] ring-1 ring-white/14 backdrop-blur-xl",
    "shadow-[0_20px_80px_rgba(0,0,0,0.45)] transition hover:bg-[rgba(234,230,223,0.10)] active:scale-[0.995]",
  ].join(" ");
}

function pillClassName(): string {
  return "inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-[11px] tracking-[0.18em] text-[#EAE6DF]/75 ring-1 ring-white/14 backdrop-blur-md";
}

function setPlanIntent(value: string) {
  try {
    localStorage.setItem(PLAN_INTENT_KEY, value);
  } catch {
    // ignore
  }
}

function clearAccessDone() {
  try {
    localStorage.removeItem(ACCESS_DONE_KEY);
  } catch {
    // ignore
  }
}

function setCheckoutPlan(plan: PlanId) {
  try {
    localStorage.setItem(CHECKOUT_PLAN_KEY, plan);
  } catch {
    // ignore
  }
}

function clearCheckoutPlan() {
  try {
    localStorage.removeItem(CHECKOUT_PLAN_KEY);
  } catch {
    // ignore
  }
}

function setPendingSubscription(state: { selectedPlan: PlanId; trialStartedAt?: string }) {
  try {
    localStorage.setItem(PENDING_SUBSCRIPTION_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearPendingSubscription() {
  try {
    localStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
  } catch {
    // ignore
  }
}

export default function PlanesEntradaPage() {
  const navigate = useNavigate();
  const sub = useSubscription();
  const [busy, setBusy] = useState(false);

  const todayISO = useMemo(() => new Date().toISOString(), []);

  function chooseTrial() {
    if (busy) return;
    setBusy(true);
    clearAccessDone();
    const startedAt = todayISO;
    sub.dispatch({ type: "select_plan", plan: "none" });
    sub.dispatch({ type: "start_trial", startedAt });
    setPlanIntent("trial_7d");
    setPendingSubscription({ selectedPlan: "none", trialStartedAt: startedAt });
    clearCheckoutPlan();
    navigate(`/acceso?next=${encodeURIComponent("/inicio")}`, { replace: true });
  }

  function choosePaid() {
    if (busy) return;
    setBusy(true);
    clearAccessDone();
    sub.dispatch({ type: "select_plan", plan: "none" });
    sub.dispatch({ type: "end_trial" });
    setPlanIntent("paid_conzia_total");
    setCheckoutPlan("conzia_total");
    clearPendingSubscription();
    navigate(`/acceso?next=${encodeURIComponent("/checkout")}`, { replace: true });
  }

  return (
    <div className="relative min-h-[100svh] text-[#EAE6DF]">
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
      <div className="absolute inset-0 bg-[#1E2A38]/65" />

      <div className="relative z-10 min-h-[100svh] px-8 pb-10 pt-14 flex flex-col">
        <button
          type="button"
          onClick={() => navigate("/onboarding")}
          className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-2 text-xs text-[#EAE6DF]/85 ring-1 ring-white/14 backdrop-blur-md transition hover:bg-white/12"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver
        </button>

        <div className="mt-10">
          <div className={pillClassName()}>SELECCIÓN</div>
          <div className="mt-4 font-serif text-[28px] leading-[1.12]">Elige cómo entrar</div>
          <div className="mt-3 text-sm text-[#EAE6DF]/70 leading-relaxed">
            Sin urgencia. Sin truco. Solo decisión clara.
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <button type="button" onClick={chooseTrial} className={glassCardClassName()} disabled={busy}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-serif text-[22px] leading-[1.15]">Trial 7 días</div>
                <div className="mt-2 text-sm text-[#EAE6DF]/72 leading-relaxed">
                  Acceso completo a CONZIA Sistema por 7 días. Luego eliges si continúas.
                </div>
              </div>
              <div className="shrink-0 text-sm text-[#EAE6DF]/70">Gratis</div>
            </div>
            <div className="mt-5 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-[#EAE6DF] ring-1 ring-white/14 backdrop-blur-md">
              Elegir trial
            </div>
          </button>

          <button type="button" onClick={choosePaid} className={glassCardClassName()} disabled={busy}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-serif text-[22px] leading-[1.15]">CONZIA Sistema</div>
                <div className="mt-2 text-sm text-[#EAE6DF]/72 leading-relaxed">
                  Pago directo con Mercado Pago. Cancelas cuando quieras.
                </div>
              </div>
              <div className="shrink-0 text-sm text-[#EAE6DF]/70">$99/mes</div>
            </div>
            <div className="mt-5 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-[#EAE6DF] ring-1 ring-white/14 backdrop-blur-md">
              Pagar con Mercado Pago
            </div>
          </button>
        </div>

        <AnimatePresence>
          {busy ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-auto pt-10 text-center text-xs text-[#EAE6DF]/65"
            >
              Preparando…
            </motion.div>
          ) : (
            <div className="mt-auto pt-10 text-center text-xs text-[#EAE6DF]/55">
              Vas a poder cambiar esto después.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
