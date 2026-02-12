import assert from "node:assert/strict";
import { test } from "node:test";
import { cn } from "../src/utils/cn.ts";
import { createId } from "../src/utils/id.ts";

test("cn() concatena clases y filtra falsy", () => {
  assert.equal(cn("a", false, null, undefined, "b"), "a b");
  assert.equal(cn(), "");
});

test("createId() agrega prefijo y separador", () => {
  const id = createId("x");
  assert.ok(id.startsWith("x_"));
  assert.ok(id.length > 2);
});

