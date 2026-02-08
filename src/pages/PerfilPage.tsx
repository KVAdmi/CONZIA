import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { FieldHint, FieldLabel } from "../components/ui/Field";
import Input from "../components/ui/Input";
import Toggle from "../components/ui/Toggle";
import { useAuth } from "../state/authStore";
import { useSubscription } from "../state/subscriptionStore";
import { useConzia } from "../state/conziaStore";

export default function PerfilPage() {
  const { state } = useConzia();
  const auth = useAuth();
  const sub = useSubscription();
  const navigate = useNavigate();
  const [name, setName] = useState("Usuario demo");
  const [privateMode, setPrivateMode] = useState(true);

  const counts = useMemo(() => {
    return {
      entries: state.entries.length,
      intentions: state.intentions.length,
      readings: state.readings.length,
      patterns: state.patterns.length,
      vaultNotes: state.vaultNotes.length,
    };
  }, [state.entries.length, state.intentions.length, state.patterns.length, state.readings.length, state.vaultNotes.length]);

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14 space-y-4">
      <Card className="p-6">
        <h2 className="text-sm font-semibold tracking-tight">Perfil</h2>
        <p className="mt-1 text-sm text-outer-space/70">
          CONZIA no es social. No hay “progreso” público. Solo estructura privada.
        </p>

        <div className="mt-5 rounded-xl bg-mint-cream/70 px-4 py-3 ring-1 ring-gainsboro/60">
          <div className="text-xs text-morning-blue">Cuenta</div>
          <div className="mt-1 text-sm text-outer-space/80">
            {auth.status === "authenticated"
              ? auth.user?.email ?? "Con cuenta"
              : "Sin cuenta (modo local)"}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <div className="text-xs text-outer-space/60">
              En nativo: sesión segura + sincronización (fase 2).
            </div>
            {auth.status === "authenticated" ? (
              <Button
                variant="quiet"
                onClick={async () => {
                  await auth.signOut();
                  navigate("/sesion");
                }}
              >
                Cerrar sesión
              </Button>
            ) : (
              <Button variant="primary" onClick={() => navigate("/acceso")}>
                Iniciar sesión
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white px-4 py-3 ring-1 ring-gainsboro/70">
          <div className="text-xs text-morning-blue">Plan</div>
          <div className="mt-1 text-sm text-outer-space/80">
            {sub.state.selectedPlan === "conzia_asistencia"
              ? "CONZIA + Asistencia"
              : sub.state.selectedPlan === "conzia_total"
                ? "CONZIA Sistema"
                : sub.derived.trialActive
                  ? "Trial activo (7 días)"
                  : "Modo básico"}
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={() => navigate("/planes")}>Ver planes</Button>
          </div>
        </div>

        <div className="mt-5">
          <FieldLabel>Nombre</FieldLabel>
          <Input className="mt-2" value={name} onChange={(e) => setName(e.target.value)} />
          <FieldHint className="mt-2">No se sincroniza. No se sube a ningún lado.</FieldHint>
        </div>

        <div className="mt-5">
          <Toggle
            checked={privateMode}
            onChange={setPrivateMode}
            label="Modo privado"
            description="Reduce elementos ‘sociales’ (CONZIA no gamifica)."
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold tracking-tight">Resumen local</h3>
        <p className="mt-1 text-sm text-outer-space/70">Solo datos en este dispositivo.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-outer-space/75">
          <div className="rounded-lg bg-mint-cream/70 px-3 py-2 ring-1 ring-gainsboro/60">
            Entradas: {counts.entries}
          </div>
          <div className="rounded-lg bg-mint-cream/70 px-3 py-2 ring-1 ring-gainsboro/60">
            Intenciones: {counts.intentions}
          </div>
          <div className="rounded-lg bg-mint-cream/70 px-3 py-2 ring-1 ring-gainsboro/60">
            Lecturas: {counts.readings}
          </div>
          <div className="rounded-lg bg-mint-cream/70 px-3 py-2 ring-1 ring-gainsboro/60">
            Patrones: {counts.patterns}
          </div>
          <div className="rounded-lg bg-mint-cream/70 px-3 py-2 ring-1 ring-gainsboro/60">
            Bóveda: {counts.vaultNotes}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setName("Usuario demo")}>Restablecer</Button>
        </div>
      </Card>
    </div>
  );
}
