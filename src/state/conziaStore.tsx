import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { loadSeedData } from "../data/seed";
import type {
  CheckIn,
  ConziaEntry,
  ConziaProcess,
  ConziaProfile,
  Entry,
  Intention,
  MirrorStory,
  Pattern,
  Reading,
  VaultNote,
  ConziaSeedData,
  ConziaSession,
  DoorId,
} from "../types/models";

type TruthFeedback = "me_sirve" | "no_me_sirve";

type ConziaState = ConziaSeedData & {
  truthFeedback: Record<string, TruthFeedback | undefined>;
  profile: ConziaProfile | null;
  processes: ConziaProcess[];
  sessions: ConziaSession[];
  entriesV1: ConziaEntry[];
  activeDoor: DoorId | null;
  activeSessionId: string | null;
  activeProcessId: string | null;
};

type ConziaAction =
  | { type: "add_entry"; entry: Entry }
  | { type: "add_intention"; intention: Intention }
  | { type: "upsert_intention"; intention: Intention }
  | { type: "upsert_checkin"; checkIn: CheckIn }
  | { type: "add_reading"; reading: Reading }
  | { type: "upsert_mirror_story"; mirrorStory: MirrorStory }
  | { type: "add_vault_note"; vaultNote: VaultNote }
  | { type: "set_truth_feedback"; truthId: string; feedback: TruthFeedback }
  | { type: "set_profile"; profile: ConziaProfile }
  | { type: "add_process"; process: ConziaProcess }
  | { type: "update_process"; processId: string; patch: Partial<ConziaProcess> }
  | { type: "set_active_process"; processId: string | null }
  | { type: "start_session"; session: ConziaSession }
  | { type: "close_session"; sessionId: string; closedAt: string }
  | { type: "add_entry_v1"; entry: ConziaEntry };

function reducer(state: ConziaState, action: ConziaAction): ConziaState {
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
    case "set_profile":
      return { ...state, profile: action.profile };
    case "add_process": {
      const next = [action.process, ...state.processes];
      return {
        ...state,
        processes: next,
        activeProcessId: state.activeProcessId ?? action.process.id,
      };
    }
    case "update_process": {
      const idx = state.processes.findIndex((p) => p.id === action.processId);
      if (idx === -1) return state;
      const next = [...state.processes];
      next[idx] = { ...next[idx], ...action.patch };
      return { ...state, processes: next };
    }
    case "set_active_process":
      return { ...state, activeProcessId: action.processId };
    case "start_session":
      return {
        ...state,
        sessions: [action.session, ...state.sessions],
        activeDoor: action.session.door,
        activeSessionId: action.session.id,
      };
    case "close_session": {
      const idx = state.sessions.findIndex((s) => s.id === action.sessionId);
      if (idx === -1) return state;
      const next = [...state.sessions];
      next[idx] = { ...next[idx], closed: true, closed_at: action.closedAt };
      const shouldClear = state.activeSessionId === action.sessionId;
      return {
        ...state,
        sessions: next,
        activeDoor: shouldClear ? null : state.activeDoor,
        activeSessionId: shouldClear ? null : state.activeSessionId,
      };
    }
    case "add_entry_v1":
      return { ...state, entriesV1: [action.entry, ...state.entriesV1] };
    default:
      return state;
  }
}

type ConziaStore = {
  state: ConziaState;
  dispatch: React.Dispatch<ConziaAction>;
};

const ConziaContext = createContext<ConziaStore | null>(null);

function getInitialState(storageKey: string): ConziaState {
  const seeded: ConziaSeedData = loadSeedData();

  try {
    const raw = localStorage.getItem(storageKey);
    const base: ConziaState = {
      ...seeded,
      truthFeedback: {},
      profile: null,
      processes: [],
      sessions: [],
      entriesV1: [],
      activeDoor: null,
      activeSessionId: null,
      activeProcessId: null,
    };
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<ConziaState>;
    return {
      ...base,
      ...parsed,
      truthFeedback: parsed.truthFeedback ?? {},
      profile: parsed.profile ?? null,
      processes: parsed.processes ?? [],
      sessions: parsed.sessions ?? [],
      entriesV1: parsed.entriesV1 ?? [],
      activeDoor: parsed.activeDoor ?? null,
      activeSessionId: parsed.activeSessionId ?? null,
      activeProcessId: parsed.activeProcessId ?? null,
    };
  } catch {
    return {
      ...seeded,
      truthFeedback: {},
      profile: null,
      processes: [],
      sessions: [],
      entriesV1: [],
      activeDoor: null,
      activeSessionId: null,
      activeProcessId: null,
    };
  }
}

export function ConziaProvider({
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

  return <ConziaContext.Provider value={value}>{children}</ConziaContext.Provider>;
}

export function useConzia() {
  const ctx = useContext(ConziaContext);
  if (!ctx) throw new Error("useConzia debe usarse dentro de <ConziaProvider />");
  return ctx;
}

export function useConziaLookup() {
  const { state } = useConzia();
  return useMemo(() => {
    const entryById = new Map(state.entries.map((e) => [e.id, e] as const));
    const intentionById = new Map(state.intentions.map((i) => [i.id, i] as const));
    const patternById = new Map(state.patterns.map((p) => [p.id, p] as const));
    const mirrorStoryById = new Map(state.mirrorStories.map((m) => [m.id, m] as const));
    return { entryById, intentionById, patternById, mirrorStoryById };
  }, [state.entries, state.intentions, state.patterns, state.mirrorStories]);
}

export function useConziaDerived() {
  const { state } = useConzia();
  return useMemo(() => {
    const latestDate =
      [...state.checkIns, ...state.entries]
        .map((x) => x.date)
        .sort()
        .at(-1) ?? "";

    return { latestDate };
  }, [state.checkIns, state.entries]);
}
