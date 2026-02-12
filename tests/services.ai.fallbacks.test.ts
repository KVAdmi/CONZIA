import assert from "node:assert/strict";
import { test } from "node:test";
import { TESTS } from "../src/content/tests.ts";
import { analyzeDesahogo } from "../src/services/ai/analyzeDesahogo.ts";
import { extractShadowTraits } from "../src/services/ai/extractShadowTraits.ts";
import { generateMirrorStory } from "../src/services/ai/generateMirrorStory.ts";
import { generateReading } from "../src/services/ai/generateReading.ts";
import { generateReflection } from "../src/services/ai/generateReflection.ts";
import { generateTestReading } from "../src/services/ai/generateTestReading.ts";

test("fallbacks IA: reading/reflection/test-reading/mirror-story/shadow-traits/desahogo", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("network");
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const entry = {
    id: "e1",
    date: "2024-01-10",
    type: "algo_me_incomodo",
    context: "yo",
    boundary: "respeto",
    reaction: "calle",
    emotionalWeight: 6,
    text: "me dio enojo y ansiedad",
    tags: ["rumiación"],
  } as any;

  const patterns = [{ id: "p1", name: "Rumiación", contexts: ["yo"], frequency30d: 0, trend: "flat", evidenceEntryIds: [] }] as any[];

  const reading = await generateReading({ entry, patterns, entries: [entry], todayISO: "2024-01-10" });
  assert.ok(reading.id.startsWith("r_"));
  assert.ok(reading.content?.loQueVeo);

  const reflection = await generateReflection({ entry, todayISO: "2024-01-10" });
  assert.equal(reflection.type, "reflejo");
  assert.ok(reflection.content?.pregunta);

  const testDef = TESTS[0]!;
  const tr = await generateTestReading({
    test: testDef as any,
    result: { avg: 2.3, severity: "medio" },
    signals: [{ questionId: "q1", text: "x", score: 3 }],
    patterns: patterns as any,
    todayISO: "2024-01-10",
  });
  assert.equal(tr.type, "test");
  assert.ok(tr.basedOnEntryIds?.some((x) => x === `test:${testDef.id}`));

  const ms = await generateMirrorStory({ pattern: { id: "p_rumi", name: "Rumiación", contexts: [], evidenceEntryIds: [], frequency30d: 0, trend: "flat" } as any });
  assert.equal(ms.patternId, "p_rumi");
  assert.ok(ms.story.length > 20);

  const traits = await extractShadowTraits({ rechazo: "control controladora", envidia: "", juicio: "" });
  assert.ok(traits.length >= 1);
  assert.ok(traits.some((x) => String(x.trait).toLowerCase().includes("control")));

  const des = await analyzeDesahogo({ text: "quiero suicidarme. no vale la pena vivir." });
  assert.equal(des.risk_flag, "crisis");
  assert.equal(des.recommended_next, "consultorio");
  assert.ok(des.resistance_score >= 0 && des.resistance_score <= 100);
});

