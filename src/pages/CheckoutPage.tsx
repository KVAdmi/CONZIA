import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription, type PlanId } from "../state/subscriptionStore";

const CHECKOUT_PLAN_KEY = "conzia_v1_checkout_plan";

function pillClassName(): string {
  return "inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 transition hover:bg-white/12";
}

function glassPanelClassName(): string {
  return "rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]";
}

function primaryButtonClassName(): string {
  return "w-full rounded-2xl bg-[#7D5C6B] px-5 py-4 text-center text-sm font-semibold tracking-wide text-white ring-1 ring-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:bg-[#6f5160] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none";
}

function quietButtonClassName(): string {
  return "w-full rounded-2xl bg-white/10 px-5 py-4 text-center text-sm font-semibold tracking-wide text-white ring-1 ring-white/12 transition hover:bg-white/12 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none";
}

function loadCheckoutPlan(): PlanId {
  try {
    const raw = localStorage.getItem(CHECKOUT_PLAN_KEY) ?? "";
    if (raw === "conzia_total" || raw === "conzia_asistencia") return raw;
  } catch {
    // ignore
  }
  return "conzia_total";
}

function clearCheckoutPlan() {
  try {
    localStorage.removeItem(CHECKOUT_PLAN_KEY);
  } catch {
    // ignore
  }
}

function planCopy(plan: PlanId): { title: string; price: string; subtitle: string } {
  if (plan === "conzia_asistencia") {
    return {
      title: "CONZIA + Asistencia",
      price: "$129/mes",
      subtitle: "Sistema + orientación humana (terceros).",
    };
  }
  return {
    title: "CONZIA Sistema",
    price: "$99/mes",
    subtitle: "Sistema cognitivo personal. Privado. Sin humanos.",
  };
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const sub = useSubscription();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const plan = useMemo(() => loadCheckoutPlan(), []);
  const copy = useMemo(() => planCopy(plan), [plan]);

  const mpConfigured = Boolean((import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined)?.trim());

  async function pay() {
    if (busy) return;
    if (!mpConfigured) {
      setStatus("Mercado Pago aún no está configurado en este entorno.");
      return;
    }
    setBusy(true);
    try {
      setStatus("Abriendo Mercado Pago…");
      // TODO: aquí conectamos /api/mp/preference y redirigimos al init_point.
      setStatus("Pasarela pendiente: necesito tus llaves para conectar el checkout real.");
    } finally {
      setBusy(false);
    }
  }

  function activateDemo() {
    sub.dispatch({ type: "select_plan", plan });
    sub.dispatch({ type: "end_trial" });
    clearCheckoutPlan();
    navigate("/inicio", { replace: true });
  }

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14">
      <div className="flex items-start justify-between gap-4 text-white">
        <div>
          <div className="text-[26px] font-semibold tracking-tight">Pago</div>
          <div className="mt-2 text-sm text-white/65">Checkout con Mercado Pago</div>
        </div>
        <button type="button" onClick={() => navigate("/planes/elige")} className={pillClassName()}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver
        </button>
      </div>

      <div className="mt-7 space-y-4">
        <div className={glassPanelClassName()}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <ShieldCheck className="h-5 w-5 text-white/80" aria-hidden />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white">{copy.title}</div>
              <div className="mt-1 text-xs text-white/60">{copy.subtitle}</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/6 ring-1 ring-white/10 px-5 py-4">
            <div className="text-[11px] tracking-[0.18em] text-white/55">TOTAL</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{copy.price}</div>
            <div className="mt-2 text-sm text-white/70 leading-relaxed">
              Pago directo. Cancelas cuando quieras. Sin “letras pequeñas” en el visor.
            </div>
          </div>

          {status ? <div className="mt-4 text-sm text-white/75">{status}</div> : null}

          <div className="mt-5 space-y-2">
            <button type="button" onClick={pay} className={primaryButtonClassName()} disabled={busy}>
              Pagar con Mercado Pago
            </button>
            {!mpConfigured ? (
              <button type="button" onClick={activateDemo} className={quietButtonClassName()} disabled={busy}>
                Activar plan (demo)
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl bg-[#0b1220]/55 ring-1 ring-white/10 backdrop-blur-md px-5 py-4 text-sm text-white/70 leading-relaxed">
          Nota: en cuanto me pases las llaves (public key + access token), conecto el checkout real y el retorno de pago.
        </div>
      </div>
    </div>
  );
}
