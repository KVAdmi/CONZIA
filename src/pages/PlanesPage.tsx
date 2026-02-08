import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useSubscription } from "../state/subscriptionStore";

function formatMoneyMx(n: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-MX", { year: "numeric", month: "short", day: "2-digit" })
    .format(d)
    .replace(".", "");
}

export default function PlanesPage() {
  const navigate = useNavigate();
  const { state, dispatch, derived } = useSubscription();

  const statusLine = useMemo(() => {
    if (state.selectedPlan !== "none") {
      return derived.effectivePlan === "xmi_asistencia"
        ? "Activo: Concia + Asistencia"
        : "Activo: Concia Sistema";
    }
    if (derived.trialActive && derived.trialEndsAtISO) {
      return `Trial activo (7 días). Termina: ${formatDateShort(derived.trialEndsAtISO)}.`;
    }
    return "Modo básico (sin IA/analítica).";
  }, [derived.effectivePlan, derived.trialActive, derived.trialEndsAtISO, state.selectedPlan]);

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14 space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Planes</h2>
            <p className="mt-1 text-sm text-outer-space/70">
              Decisión adulta. Sin urgencia. Sin truco.
            </p>
          </div>
          <Button onClick={() => navigate(-1)}>Volver</Button>
        </div>

        <div className="mt-4 rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-3 text-sm text-outer-space/80">
          {statusLine}
        </div>

        <div className="mt-4 text-xs text-outer-space/60">
          Nota: en el visor web la suscripción es mock. En nativo se implementa con IAP + RevenueCat.
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6">
          <div className="text-xs text-morning-blue">Concia Sistema</div>
          <div className="mt-2 text-lg font-semibold tracking-tight text-outer-space">
            {formatMoneyMx(99)} <span className="text-sm font-medium text-outer-space/70">/ mes</span>
          </div>
          <div className="mt-1 text-sm text-outer-space/70">Sistema cognitivo personal</div>

          <div className="mt-4 text-xs text-outer-space/60">IA completa · Privado · Sin humanos</div>

          <ul className="mt-4 space-y-2 text-sm text-outer-space/80">
            <li>Registro estructurado</li>
            <li>Lecturas con evidencia</li>
            <li>Patrones reales</li>
            <li>Caja de Enfrentamiento</li>
            <li>Tests de resonancia</li>
            <li>Bóveda privada</li>
          </ul>

          <div className="mt-6">
            <Button
              variant="primary"
              onClick={() => {
                dispatch({ type: "select_plan", plan: "xmi_total" });
                navigate("/sesion");
              }}
            >
              Elegir este plan
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="inline-flex items-center gap-2">
            <div className="text-xs text-morning-blue">Concia + Asistencia</div>
            <div className="rounded-full bg-camel/15 px-2 py-0.5 text-[11px] text-outer-space/80 ring-1 ring-camel/20">
              Soporte adicional
            </div>
          </div>
          <div className="mt-2 text-lg font-semibold tracking-tight text-outer-space">
            {formatMoneyMx(129)} <span className="text-sm font-medium text-outer-space/70">/ mes</span>
          </div>
          <div className="mt-1 text-sm text-outer-space/70">Sistema + orientación humana (terceros)</div>

          <div className="mt-4 text-xs text-outer-space/60">IA + apoyo cuando lo necesitas</div>

          <ul className="mt-4 space-y-2 text-sm text-outer-space/80">
            <li>Todo Concia Sistema</li>
            <li>Orientación emocional 24/7 (terceros)</li>
            <li>Voz (lecturas, caja, dictado)</li>
            <li>Red indirecta sin exposición de Concia</li>
          </ul>

          <div className="mt-4 rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-3 text-xs text-outer-space/70">
            “Orientación emocional no terapéutica, operada por terceros. No sustituye terapia ni atención de
            emergencia.”
          </div>

          <div className="mt-6">
            <Button
              variant="primary"
              onClick={() => {
                dispatch({ type: "select_plan", plan: "xmi_asistencia" });
                navigate("/sesion");
              }}
            >
              Elegir este plan
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-sm font-semibold tracking-tight text-outer-space">Modo básico</div>
        <div className="mt-1 text-sm text-outer-space/70">
          Si no estás listo para suscripción, Concia no te castiga: te deja escribir y guardar.
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <div className="text-xs text-outer-space/60">
            Activo: Escribir · Bóveda · Hoy básico · Modo Crisis
          </div>
          <Button
            variant="quiet"
            onClick={() => {
              dispatch({ type: "select_plan", plan: "none" });
              dispatch({ type: "end_trial" });
              navigate("/sesion");
            }}
          >
            Usar modo básico
          </Button>
        </div>
      </Card>
    </div>
  );
}
