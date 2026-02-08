import { Navigate } from "react-router-dom";
import { useAuth } from "../state/authStore";
import { useSubscription } from "../state/subscriptionStore";

const ONBOARDING_DONE_KEY = "concia_v1_onboarding_done";
const PLAN_INTENT_KEY = "concia_v1_plan_intent";
const ACCESS_DONE_KEY = "concia_v1_access_done";

function getFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function getPlanIntent(): string | null {
  try {
    return localStorage.getItem(PLAN_INTENT_KEY);
  } catch {
    return null;
  }
}

export default function BootPage() {
  const auth = useAuth();
  const sub = useSubscription();

  const onboardingDone = getFlag(ONBOARDING_DONE_KEY);
  const planIntent = getPlanIntent();
  const accessDone = getFlag(ACCESS_DONE_KEY);

  if (!onboardingDone) return <Navigate to="/onboarding" replace />;

  const hasChosenPlan = Boolean(planIntent) || sub.derived.hasSystem;
  if (!hasChosenPlan) return <Navigate to="/planes/elige" replace />;

  const isPaidIntent = Boolean(planIntent && planIntent.startsWith("paid"));
  const isTrialIntent = planIntent === "trial_7d";

  const needsCheckout = isPaidIntent && !sub.derived.hasSystem;
  const trialMissing = isTrialIntent && !sub.derived.trialActive && sub.state.selectedPlan === "none";

  if (trialMissing) return <Navigate to="/planes/elige" replace />;

  if (auth.status !== "authenticated") {
    if (!accessDone) {
      const next = needsCheckout ? "/checkout" : "/inicio";
      return <Navigate to={`/acceso?next=${encodeURIComponent(next)}`} replace />;
    }
    if (needsCheckout) return <Navigate to="/checkout" replace />;
    return <Navigate to="/sesion" replace />;
  }

  if (needsCheckout) return <Navigate to="/checkout" replace />;

  return <Navigate to="/sesion" replace />;
}
