import { Navigate } from "react-router-dom";
import { useConzia } from "../state/conziaStore";
import { useAuth } from "../state/authStore";

const ONBOARDING_DONE_KEY = "conzia_v1_onboarding_done";

function getFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export default function BootPage() {
  const { state } = useConzia();
  const auth = useAuth();

  const onboardingDone = getFlag(ONBOARDING_DONE_KEY);
  const registrationDone = Boolean(state.profile?.registrationDone);
  const isAuthenticated = auth.status === "authenticated" && auth.session !== null;

  // Si NO hay sesión:
  if (!isAuthenticated) {
    if (!onboardingDone) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/acceso" replace />;
  }

  // Si HAY sesión:
  if (!registrationDone) {
    // Usuario autenticado pero sin completar registro => continuar registro
    return <Navigate to="/registro" replace />;
  }

  // Usuario autenticado y registrado => ir a sesión o active door
  if (state.activeDoor) return <Navigate to={`/${state.activeDoor}`} replace />;
  return <Navigate to="/sesion" replace />;
}
