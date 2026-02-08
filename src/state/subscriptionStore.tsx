import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";

export type PlanId = "none" | "xmi_total" | "xmi_asistencia";

type SubscriptionState = {
  selectedPlan: PlanId;
  trialStartedAt?: string; // ISO
};

type SubscriptionAction =
  | { type: "start_trial"; startedAt: string }
  | { type: "end_trial" }
  | { type: "select_plan"; plan: PlanId }
  | { type: "reset" };

const TRIAL_DAYS = 7;
const PENDING_SUBSCRIPTION_KEY = "concia_v1_pending_subscription";

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toISO(date: Date): string {
  return date.toISOString();
}

function parseISO(iso: string): Date | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function makeStorageKey(actorId: string): string {
  return `concia_v1_subscription_${actorId || "local"}`;
}

function loadPendingSubscription(): SubscriptionState | null {
  try {
    const raw = localStorage.getItem(PENDING_SUBSCRIPTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SubscriptionState;
    if (!parsed || typeof parsed !== "object") return null;
    const selectedPlan = (parsed.selectedPlan ?? "none") as PlanId;
    if (selectedPlan !== "none" && selectedPlan !== "xmi_total" && selectedPlan !== "xmi_asistencia") return null;
    const trialStartedAt = typeof parsed.trialStartedAt === "string" ? parsed.trialStartedAt : undefined;
    return { selectedPlan, trialStartedAt };
  } catch {
    return null;
  }
}

function clearPendingSubscription() {
  try {
    localStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
  } catch {
    // ignore
  }
}

function getInitialState(actorId: string): SubscriptionState {
  const key = makeStorageKey(actorId);
  let base: SubscriptionState = { selectedPlan: "none" };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      base = { selectedPlan: "none" };
    } else {
      const parsed = JSON.parse(raw) as SubscriptionState;
      if (parsed && typeof parsed === "object") {
        base = {
          selectedPlan: parsed.selectedPlan ?? "none",
          trialStartedAt: parsed.trialStartedAt,
        };
      }
    }
  } catch {
    // ignore
  }

  const pending = loadPendingSubscription();
  const shouldApplyPending =
    actorId !== "local" && pending && base.selectedPlan === "none" && !base.trialStartedAt;
  if (shouldApplyPending) {
    clearPendingSubscription();
    return { ...base, ...pending };
  }

  return base;
}

function reducer(state: SubscriptionState, action: SubscriptionAction): SubscriptionState {
  switch (action.type) {
    case "start_trial":
      return { ...state, trialStartedAt: action.startedAt };
    case "end_trial":
      return { ...state, trialStartedAt: undefined };
    case "select_plan":
      return { ...state, selectedPlan: action.plan };
    case "reset":
      return { selectedPlan: "none", trialStartedAt: undefined };
    default:
      return state;
  }
}

type SubscriptionContextValue = {
  state: SubscriptionState;
  dispatch: React.Dispatch<SubscriptionAction>;
  derived: {
    trialActive: boolean;
    trialEndsAtISO: string | null;
    effectivePlan: PlanId;
    hasSystem: boolean;
    hasAssistance: boolean;
  };
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({
  actorId,
  children,
}: {
  actorId: string;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, actorId, getInitialState);

  useEffect(() => {
    const key = makeStorageKey(actorId);
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [actorId, state]);

  const derived = useMemo(() => {
    const started = state.trialStartedAt ? parseISO(state.trialStartedAt) : null;
    const ends = started ? addDays(started, TRIAL_DAYS) : null;
    const trialActive = Boolean(ends && ends.getTime() > Date.now());
    const effectivePlan: PlanId =
      state.selectedPlan !== "none" ? state.selectedPlan : trialActive ? "xmi_total" : "none";

    return {
      trialActive,
      trialEndsAtISO: ends ? ends.toISOString() : null,
      effectivePlan,
      hasSystem: effectivePlan !== "none",
      hasAssistance: effectivePlan === "xmi_asistencia",
    };
  }, [state.selectedPlan, state.trialStartedAt]);

  const value = useMemo<SubscriptionContextValue>(() => ({ state, dispatch, derived }), [derived, state]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription debe usarse dentro de <SubscriptionProvider />");
  return ctx;
}
