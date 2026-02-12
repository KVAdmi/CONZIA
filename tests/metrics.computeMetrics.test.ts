import assert from "node:assert/strict";
import { test } from "node:test";
import { computeMetrics } from "../src/metrics/computeMetrics.ts";
import { toISODateOnly } from "../src/utils/dates.ts";

test("computeMetrics() calcula métricas base y conteos 7d", () => {
  const now = new Date(2024, 0, 8, 12, 0, 0);
  const todayKey = toISODateOnly(now);
  const processId = "p1";

  const entries = [
    {
      id: "e1",
      process_id: processId,
      source: "desahogo",
      text: "no puedo más, me desbordé, tengo miedo",
      analysis: {
        emotion: "miedo",
        pattern_tag: "rumiacion",
        reflection: "x",
        question: "y",
        resistance_score: 80,
        risk_flag: "watch",
        recommended_next: "reto",
      },
      created_at: new Date(2024, 0, 8, 11, 0, 0).toISOString(),
    },
  ] as any[];

  const sessions = [] as any[];

  const m = computeMetrics({ entries: entries as any, sessions: sessions as any, processId, todayKey, now });
  assert.equal(m.patternCounts7d.rumiacion, 1);
  assert.ok(typeof m.silencioMinutos === "number");
  assert.ok(m.silencioMinutos! >= 59 && m.silencioMinutos! <= 61);
});

