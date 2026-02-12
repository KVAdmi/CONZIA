import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, diffDays, formatDateLongEsMX, parseISODate, toISODateOnly } from "../src/utils/dates.ts";

test("parseISODate() interpreta YYYY-MM-DD como fecha local (sin UTC shift)", () => {
  const d = parseISODate("2024-02-29");
  assert.equal(d.getFullYear(), 2024);
  assert.equal(d.getMonth(), 1);
  assert.equal(d.getDate(), 29);
});

test("parseISODate() rechaza fechas inválidas YYYY-MM-DD", () => {
  assert.throws(() => parseISODate("2024-02-30"), /Fecha inválida/);
  assert.throws(() => parseISODate("2024-13-01"), /Fecha inválida/);
});

test("toISODateOnly() formatea YYYY-MM-DD", () => {
  const d = new Date(2024, 0, 2, 12, 0, 0);
  assert.equal(toISODateOnly(d), "2024-01-02");
});

test("addDays() suma días de calendario", () => {
  const base = new Date(2024, 0, 31, 10, 0, 0);
  const next = addDays(base, 1);
  assert.equal(toISODateOnly(next), "2024-02-01");
});

test("diffDays() calcula diferencia en días-calendario (DST-safe)", () => {
  const from = new Date(2024, 0, 1, 10, 0, 0);
  const to = new Date(2024, 0, 31, 10, 0, 0);
  assert.equal(diffDays(from, to), 30);
});

test("formatDateLongEsMX() devuelve un string con año", () => {
  const s = formatDateLongEsMX("2024-01-02");
  assert.equal(typeof s, "string");
  assert.match(s, /2024/);
});

