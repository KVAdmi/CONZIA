import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyEntry } from "../src/services/ai/classifyEntry.ts";
import { detectPatterns } from "../src/services/ai/detectPatterns.ts";
import { generateAlerts } from "../src/services/ai/generateAlerts.ts";

test("classifyEntry() infiere intensidad y notas", () => {
  const entry = {
    id: "e1",
    date: "2024-01-10",
    type: "algo_me_incomodo",
    context: "yo",
    boundary: "respeto",
    reaction: "calle",
    emotionalWeight: 8,
    text: "x",
    tags: ["rumiación"],
    repeatSignal: "si",
  } as const;

  const patterns = [
    { id: "p_rumi", name: "Rumiación", contexts: ["yo"], frequency30d: 0, trend: "flat", evidenceEntryIds: [] },
  ] as any[];

  const res = classifyEntry({ entry: entry as any, patterns: patterns as any });
  assert.equal(res.intensity, "alta");
  assert.ok(res.notes.some((n) => n.toLowerCase().includes("callar")));
  assert.ok(res.notes.some((n) => n.toLowerCase().includes("repet")));
});

test("detectPatterns() calcula frecuencia y tendencia", () => {
  const patterns = [
    {
      id: "p1",
      name: "Rumiación",
      contexts: ["yo"],
      frequency30d: 0,
      trend: "flat",
      evidenceEntryIds: ["e1", "e2", "e3"],
    },
  ] as any[];

  const entries = [
    { id: "e1", date: "2024-01-29", tags: ["rumiación"], context: "yo" },
    { id: "e2", date: "2024-01-28", tags: ["rumiación"], context: "yo" },
    { id: "e3", date: "2024-01-27", tags: ["rumiación"], context: "yo" },
    { id: "e_old", date: "2023-12-01", tags: ["rumiación"], context: "yo" },
  ] as any[];

  const out = detectPatterns({ todayISO: "2024-01-30", entries: entries as any, patterns: patterns as any });
  assert.equal(out[0].frequency30d, 3);
  assert.ok(["up", "down", "flat"].includes(out[0].trend));
});

test("generateAlerts() detecta patrón, estancamiento y silencio", () => {
  const todayISO = "2024-01-30";
  const entries = [
    { id: "e1", date: "2024-01-20", tags: ["x"], context: "yo" },
    { id: "e2", date: "2024-01-21", tags: ["x"], context: "yo" },
    { id: "e3", date: "2024-01-22", tags: ["x"], context: "yo" },
  ] as any[];

  const intentions = [
    { id: "i1", date: "2024-01-18", intentionType: "Poner un límite", outcome: "a_medias" },
    { id: "i2", date: "2024-01-19", intentionType: "Poner un límite", outcome: "no_lo_hice" },
    { id: "i3", date: "2024-01-20", intentionType: "Poner un límite", outcome: "lo_hice" },
  ] as any[];

  const patterns = [
    {
      id: "p1",
      name: "Límites",
      contexts: ["yo"],
      frequency30d: 0,
      trend: "up",
      evidenceEntryIds: ["e1", "e2", "e3"],
    },
  ] as any[];

  const checkIns = [] as any[];
  const alerts = generateAlerts({ todayISO, entries: entries as any, intentions: intentions as any, patterns: patterns as any, checkIns: checkIns as any });

  assert.ok(alerts.some((a) => a.kind === "pattern_estructural_activo"));
  assert.ok(alerts.some((a) => a.kind === "estancamiento_intencion"));
  assert.ok(alerts.some((a) => a.kind === "silencio_prolongado"));
});

