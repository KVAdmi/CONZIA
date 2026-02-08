import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { loadSeedData } from "../data/seed";
import type {
  CheckIn,
  Entry,
  Intention,
  MirrorStory,
  Pattern,
  Reading,
  VaultNote,
  XmiSeedData,
} from "../types/models";

type TruthFeedback = "me_sirve" | "no_me_sirve";

type XmiState = XmiSeedData & {
  truthFeedback: Record<string, TruthFeedback | undefined>;
};

type XmiAction =
  | { type: "add_entry"; entry: Entry }
  | { type: "add_intention"; intention: Intention }
  | { type: "upsert_intention"; intention: Intention }
  | { type: "upsert_checkin"; checkIn: CheckIn }
  | { type: "add_reading"; reading: Reading }
  | { type: "upsert_mirror_story"; mirrorStory: MirrorStory }
  | { type: "add_vault_note"; vaultNote: VaultNote }
  | { type: "set_truth_feedback"; truthId: string; feedback: TruthFeedback };

function reducer(state: XmiState, action: XmiAction): XmiState {
  switch (action.type) {
    case "add_entry":
      return { ...state, entries: [action.entry, ...state.entries] };
    case "add_intention":
      return { ...state, intentions: [action.intention, ...state.intentions] };
    case "upsert_intention": {
      const idx = state.intentions.findIndex((i) => i.id === action.intention.id);
      if (idx === -1) return { ...state, intentions: [action.intention, ...state.intentions] };
      const next = [...state.intentions];
      next[idx] = action.intention;
      return { ...state, intentions: next };
    }
    case "upsert_checkin": {
      const idx = state.checkIns.findIndex((c) => c.date === action.checkIn.date);
      if (idx === -1) return { ...state, checkIns: [action.checkIn, ...state.checkIns] };
      const next = [...state.checkIns];
      next[idx] = action.checkIn;
      return { ...state, checkIns: next };
    }
    case "add_reading":
      return { ...state, readings: [action.reading, ...state.readings] };
    case "upsert_mirror_story": {
      const idx = state.mirrorStories.findIndex((m) => m.patternId === action.mirrorStory.patternId);
      if (idx === -1) return { ...state, mirrorStories: [action.mirrorStory, ...state.mirrorStories] };
      const next = [...state.mirrorStories];
      next[idx] = action.mirrorStory;
      return { ...state, mirrorStories: next };
    }
    case "add_vault_note":
      return { ...state, vaultNotes: [action.vaultNote, ...state.vaultNotes] };
    case "set_truth_feedback":
      return {
        ...state,
        truthFeedback: { ...state.truthFeedback, [action.truthId]: action.feedback },
      };
    default:
      return state;
  }
}

type XmiStore = {
  state: XmiState;
  dispatch: React.Dispatch<XmiAction>;
};

const XmiContext = createContext<XmiStore | null>(null);

function getInitialState(storageKey: string): XmiState {
  const seeded: XmiSeedData = loadSeedData();

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { ...seeded, truthFeedback: {} };
    const parsed = JSON.parse(raw) as XmiState;
    return { ...seeded, ...parsed, truthFeedback: parsed.truthFeedback ?? {} };
  } catch {
    return { ...seeded, truthFeedback: {} };
  }
}

export function XmiProvider({
  children,
  storageKey,
}: {
  children: React.ReactNode;
  storageKey: string;
}) {
  const [state, dispatch] = useReducer(reducer, storageKey, getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, storageKey]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <XmiContext.Provider value={value}>{children}</XmiContext.Provider>;
}

export function useXmi() {
  const ctx = useContext(XmiContext);
  if (!ctx) throw new Error("useXmi debe usarse dentro de <XmiProvider />");
  return ctx;
}

export function useXmiLookup() {
  const { state } = useXmi();
  return useMemo(() => {
    const entryById = new Map(state.entries.map((e) => [e.id, e] as const));
    const intentionById = new Map(state.intentions.map((i) => [i.id, i] as const));
    const patternById = new Map(state.patterns.map((p) => [p.id, p] as const));
    const mirrorStoryById = new Map(state.mirrorStories.map((m) => [m.id, m] as const));
    return { entryById, intentionById, patternById, mirrorStoryById };
  }, [state.entries, state.intentions, state.patterns, state.mirrorStories]);
}

export function useXmiDerived() {
  const { state } = useXmi();
  return useMemo(() => {
    const latestDate =
      [...state.checkIns, ...state.entries]
        .map((x) => x.date)
        .sort()
        .at(-1) ?? "";

    return { latestDate };
  }, [state.checkIns, state.entries]);
}
