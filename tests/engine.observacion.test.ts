import assert from "node:assert/strict";
import { test } from "node:test";
import { narrativeScore } from "../src/engine/observacion.ts";

test("narrativeScore() sube con conectores, longitud y múltiples oraciones", () => {
  assert.equal(narrativeScore(""), 0);

  const s1 = narrativeScore("Me dijo no.");
  const s2 = narrativeScore("Me dijo no, pero entonces me fui porque ya que.");
  assert.ok(s2 > s1);

  const s3 = narrativeScore("Uno. Dos. Tres.");
  assert.ok(s3 >= 1);
});

