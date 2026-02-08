import { useMemo, useState } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Toggle from "../components/ui/Toggle";
import Select from "../components/ui/Select";
import { useAuth } from "../state/authStore";
import { useSubscription } from "../state/subscriptionStore";

function makeStateKey(actorId: string) {
  return actorId === "local" ? "conzia_v1_state" : `conzia_v1_state_${actorId}`;
}

function makeVaultKey(actorId: string) {
  return actorId === "local" ? "conzia_v1_vault_unlocked" : `conzia_v1_vault_unlocked_${actorId}`;
}

function makeSubscriptionKey(actorId: string) {
  return `conzia_v1_subscription_${actorId || "local"}`;
}

const RESET_KEYS = [
  "conzia_v1_onboarding_done",
  "conzia_v1_plan_intent",
  "conzia_v1_checkout_plan",
  "conzia_v1_pending_subscription",
  "conzia_v1_access_done",
] as const;

export default function ConfiguracionPage() {
  const auth = useAuth();
  const sub = useSubscription();
  const [readingMotive, setReadingMotive] = useState<boolean>(() => {
    try {
      return localStorage.getItem("conzia_v1_motivo_lectura") === "1";
    } catch {
      return false;
    }
  });
  const supabase = useMemo(() => {
    const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
    const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";
    const publishable = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "";

    const host = (() => {
      try {
        return url ? new URL(url).host : "";
      } catch {
        return "";
      }
    })();

    return {
      configured: Boolean(url && anon),
      host,
      hasPublishable: Boolean(publishable),
    };
  }, []);

  function resetDemo() {
    const stateKey = makeStateKey(auth.actorId);
    const vaultKey = makeVaultKey(auth.actorId);
    const subscriptionKey = makeSubscriptionKey(auth.actorId);
    try {
      localStorage.removeItem(stateKey);
      localStorage.removeItem(vaultKey);
      localStorage.removeItem(subscriptionKey);
      for (const k of RESET_KEYS) localStorage.removeItem(k);
    } catch {
      // ignore
    }
    window.location.assign("/inicio");
  }

  function lockVault() {
    const vaultKey = makeVaultKey(auth.actorId);
    try {
      localStorage.removeItem(vaultKey);
    } catch {
      // ignore
    }
    window.location.assign("/boveda");
  }

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14 space-y-4">
      <Card className="p-6">
        <h2 className="text-sm font-semibold tracking-tight">Configuración</h2>
        <p className="mt-1 text-sm text-outer-space/70">
          Este build es visor web. CONZIA final es app nativa. Aquí validamos flujo, estructura y ritual.
        </p>

        <div className="mt-5 space-y-3">
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Tema del visor"
            description="Atmósfera sobria (fog/plum). En nativo se define el tema final."
          />
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Tono sobrio"
            description="Sin emojis, sin clichés, sin gamificación."
          />
          <Toggle
            checked={readingMotive}
            onChange={(next) => {
              setReadingMotive(next);
              try {
                localStorage.setItem("conzia_v1_motivo_lectura", next ? "1" : "0");
              } catch {
                // ignore
              }
            }}
            label="Simular motivo de lectura"
            description="Muestra/oculta “Lectura del día” en el visor (sin backend)."
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold tracking-tight">Datos locales</h3>
        <p className="mt-1 text-sm text-outer-space/70">
          Seed + cambios se guardan en `localStorage` (por cuenta o modo local).
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button onClick={resetDemo}>Reiniciar demo</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold tracking-tight">Suscripción (mock visor)</h3>
        <p className="mt-1 text-sm text-outer-space/70">
          En nativo esto lo define IAP + RevenueCat. Aquí se simula para validar gating.
        </p>
        <div className="mt-4">
          <div className="text-xs font-medium text-outer-space/80">Modo</div>
          <Select
            className="mt-2"
            value={
              sub.state.selectedPlan !== "none"
                ? sub.state.selectedPlan
                : sub.derived.trialActive
                  ? "trial"
                  : "basic"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "trial") {
                sub.dispatch({ type: "select_plan", plan: "none" });
                sub.dispatch({ type: "start_trial", startedAt: new Date().toISOString() });
                return;
              }
              if (v === "basic") {
                sub.dispatch({ type: "select_plan", plan: "none" });
                sub.dispatch({ type: "end_trial" });
                return;
              }
              if (v === "conzia_total") {
                sub.dispatch({ type: "select_plan", plan: "conzia_total" });
                sub.dispatch({ type: "end_trial" });
                return;
              }
              if (v === "conzia_asistencia") {
                sub.dispatch({ type: "select_plan", plan: "conzia_asistencia" });
                sub.dispatch({ type: "end_trial" });
              }
            }}
          >
            <option value="trial">Trial activo (7 días)</option>
            <option value="basic">Modo básico</option>
            <option value="conzia_total">Plan CONZIA Sistema (99)</option>
            <option value="conzia_asistencia">Plan CONZIA + Asistencia (129)</option>
          </Select>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold tracking-tight">Bóveda</h3>
        <p className="mt-1 text-sm text-outer-space/70">
          En v1 el bloqueo es mock. En fase 2 se cifra.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="primary" onClick={lockVault}>
            Bloquear Bóveda
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold tracking-tight">Integraciones (fase 2)</h3>
        <p className="mt-1 text-sm text-outer-space/70">
          Variables de entorno listas para Supabase Auth + backend.
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
            <div className="text-xs text-morning-blue">Supabase</div>
            <div className="mt-1 text-sm text-outer-space/80">
              {supabase.configured ? "Configurado" : "No configurado"}
            </div>
            <div className="mt-1 text-xs text-outer-space/60">
              {supabase.host ? supabase.host : "—"}
            </div>
            <div className="mt-2 text-xs text-outer-space/60">
              Publishable key: {supabase.hasPublishable ? "sí" : "no"}
            </div>
          </div>
          <div className="rounded-xl bg-white ring-1 ring-gainsboro/70 px-4 py-4 text-sm text-outer-space/75">
            Recomendación: nunca uses service role key en frontend. Usa RLS y anon key.
          </div>
        </div>
      </Card>
    </div>
  );
}
