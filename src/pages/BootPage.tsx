import { Navigate } from "react-router-dom";
import { useConzia } from "../state/conziaStore";

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

  const onboardingDone = getFlag(ONBOARDING_DONE_KEY);
  const registrationDone = Boolean(state.profile?.registrationDone);

  if (!onboardingDone) return <Navigate to="/onboarding" replace />;
  if (!registrationDone) return <Navigate to="/registro" replace />;
  if (state.activeDoor) return <Navigate to={`/${state.activeDoor}`} replace />;
  return <Navigate to="/sesion" replace />;
}
