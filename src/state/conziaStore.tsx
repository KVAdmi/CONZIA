import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
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

const STORAGE_SCHEMA_VERSION = 1;

type ConziaState = ConziaSeedData & {
  schemaVersion: number;
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
  | { type: "reset_phase1" }
  | { type: "set_profile"; profile: ConziaProfile }
  | { type: "add_process"; process: ConziaProcess }
  | { type: "update_process"; processId: string; patch: Partial<ConziaProcess> }
  | { type: "set_active_process"; processId: string | null }
  | { type: "start_session"; session: ConziaSession }
  | { type: "close_session"; sessionId: string; closedAt: string }
  | { type: "add_entry_v1"; entry: ConziaEntry };

type ConziaPersistedStateV1 = {
  schemaVersion: 1;
  profile: ConziaProfile | null;
  processes: ConziaProcess[];
  sessions: ConziaSession[];
  entriesV1: ConziaEntry[];
  activeProcessId: string | null;
  activeSessionId: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizePersisted(raw: unknown): ConziaPersistedStateV1 {
  if (!isRecord(raw)) {
    return {
      schemaVersion: 1,
      profile: null,
      processes: [],
      sessions: [],
      entriesV1: [],
      activeProcessId: null,
      activeSessionId: null,
    };
  }

  const version = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 0;

  // Migración simple: si no hay schemaVersion (o es desconocida), intentamos leer campos compatibles.
  const profile = (isRecord(raw.profile) ? (raw.profile as ConziaProfile) : null) as ConziaProfile | null;
  const processes = (Array.isArray(raw.processes) ? (raw.processes as ConziaProcess[]) : []) as ConziaProcess[];
  const sessions = (Array.isArray(raw.sessions) ? (raw.sessions as ConziaSession[]) : []) as ConziaSession[];
  const entriesV1 = (Array.isArray(raw.entriesV1) ? (raw.entriesV1 as ConziaEntry[]) : []) as ConziaEntry[];
  const activeProcessId = (typeof raw.activeProcessId === "string" ? raw.activeProcessId : null) as string | null;
  const activeSessionId = (typeof raw.activeSessionId === "string" ? raw.activeSessionId : null) as string | null;

  if (version === 1) {
    return {
      schemaVersion: 1,
      profile,
      processes,
      sessions,
      entriesV1,
      activeProcessId,
      activeSessionId,
    };
  }

  return {
    schemaVersion: 1,
    profile,
    processes,
    sessions,
    entriesV1,
    activeProcessId,
    activeSessionId,
  };
}

function toPersistedState(state: ConziaState): ConziaPersistedStateV1 {
  const activeSession = state.activeSessionId
    ? state.sessions.find((s) => s.id === state.activeSessionId) ?? null
    : null;
  const openSessionId = activeSession && !activeSession.closed ? activeSession.id : null;

  return {
    schemaVersion: 1,
    profile: state.profile,
    processes: state.processes,
    sessions: state.sessions,
    entriesV1: state.entriesV1,
    activeProcessId: state.activeProcessId,
    // No persistimos activeDoor; y solo guardamos sessionId si está abierta.
    activeSessionId: openSessionId,
  };
}

function devLog(event: string, payload: Record<string, unknown>) {
  if (!import.meta.env.DEV) return;
  try {
    // eslint-disable-next-line no-console
    console.log(`[CONZIA][${event}]`, { ts: new Date().toISOString(), ...payload });
  } catch {
    // ignore
  }
}

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
    case "reset_phase1":
      return {
        ...state,
        profile: null,
        processes: [],
        sessions: [],
        entriesV1: [],
        activeDoor: null,
        activeSessionId: null,
        activeProcessId: null,
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
  storageKey: string;
};

const ConziaContext = createContext<ConziaStore | null>(null);

function getInitialState(storageKey: string): ConziaState {
  const seeded: ConziaSeedData = loadSeedData();

  try {
    const raw = localStorage.getItem(storageKey);
    const base: ConziaState = {
      ...seeded,
      schemaVersion: STORAGE_SCHEMA_VERSION,
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

    const parsedUnknown = JSON.parse(raw) as unknown;
    const persisted = normalizePersisted(parsedUnknown);

    const merged: ConziaState = {
      ...base,
      schemaVersion: persisted.schemaVersion,
      profile: persisted.profile,
      processes: persisted.processes,
      sessions: persisted.sessions,
      entriesV1: persisted.entriesV1,
      activeProcessId: persisted.activeProcessId,
      activeSessionId: persisted.activeSessionId,
    };

    const activeSession = merged.activeSessionId
      ? merged.sessions.find((s) => s.id === merged.activeSessionId) ?? null
      : null;

    if (!activeSession || activeSession.closed) {
      merged.activeDoor = null;
      merged.activeSessionId = null;
    } else {
      merged.activeDoor = activeSession.door;
    }

    if (merged.activeProcessId && !merged.processes.some((p) => p.id === merged.activeProcessId)) {
      merged.activeProcessId = merged.processes[0]?.id ?? null;
    }

    return merged;
  } catch {
    return {
      ...seeded,
      schemaVersion: STORAGE_SCHEMA_VERSION,
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
  const [state, dispatchBase] = useReducer(reducer, storageKey, getInitialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(toPersistedState(state)));
    } catch {
      // ignore
    }
  }, [state, storageKey]);

  const dispatch = useMemo(() => {
    return (action: ConziaAction) => {
      const snapshot = stateRef.current;

      if (action.type === "start_session") {
        devLog("door_opened", {
          door: action.session.door,
          sessionId: action.session.id,
          processId: action.session.process_id,
        });
      }

      if (action.type === "close_session") {
        const session = snapshot.sessions.find((s) => s.id === action.sessionId) ?? null;
        devLog("door_closed", {
          sessionId: action.sessionId,
          door: session?.door ?? "unknown",
          processId: session?.process_id ?? "unknown",
        });
      }

      if (action.type === "update_process" && action.patch.status === "closed") {
        devLog("process_closed", { processId: action.processId });
      }

      if (action.type === "set_profile") {
        devLog("registration_done", {
          alias: action.profile.alias,
          tema_base: action.profile.tema_base,
          arquetipo_dominante: action.profile.arquetipo_dominante,
          estilo: action.profile.estilo_conduccion,
        });
      }

      if (action.type === "reset_phase1") {
        devLog("reset_phase1", { storageKey });
      }

      dispatchBase(action);
    };
  }, [dispatchBase, storageKey]);

  const value = useMemo(() => ({ state, dispatch, storageKey }), [dispatch, state, storageKey]);

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
