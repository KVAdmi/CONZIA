import assert from "node:assert/strict";
import { test } from "node:test";
import { composeConziaResponse, inferPatternTag } from "../src/ai/responseComposer.ts";

test("inferPatternTag() detecta keywords", () => {
  assert.equal(inferPatternTag({ text: "No paro de pensar, le doy vueltas" }), "rumiacion");
  assert.equal(inferPatternTag({ text: "Me aislé y no contesté" }), "aislamiento");
});

test("inferPatternTag() cae a trap/fricción", () => {
  assert.equal(inferPatternTag({ trap: "INFINITE_ANALYSIS" }), "rumiacion");
  assert.equal(inferPatternTag({ friccion: "verguenza" }), "aislamiento");
});

test("composeConziaResponse() construye mensaje + pregunta", () => {
  const out = composeConziaResponse({ text: "me fui, lo evité", recommendedDoor: "mesa" });
  assert.equal(out.tag, "evitacion");
  assert.ok(out.assistantMessage.includes("\n"));
  assert.ok(out.followupQuestion.length > 6);
});

