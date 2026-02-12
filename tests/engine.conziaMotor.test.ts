import assert from "node:assert/strict";
import { test } from "node:test";
import {
  conziaGuidanceProfile,
  cutLineForTrap,
  getArchetypeDescription,
  getArchetypeLabel,
  todayPlanFromProfile,
} from "../src/engine/conziaMotor.ts";

test("cutLineForTrap() devuelve líneas esperadas", () => {
  assert.equal(cutLineForTrap("ACTION_WITHOUT_TRUTH"), "¿Cuál fue el costo real de esa acción?");
  assert.equal(cutLineForTrap("INFINITE_ANALYSIS"), "Dame el hecho. Y cerramos.");
});

test("conziaGuidanceProfile() aplica perfil por arquetipo y flag mixed", () => {
  const p = conziaGuidanceProfile({
    archetypeDominant: "guerrero",
    archetypeConfidence: 1,
    friccionPrincipal: "limites",
    costoDominante: "x",
  });
  assert.equal(p.defaultDoor, "mesa");
  assert.equal(p.trap, "ACTION_WITHOUT_TRUTH");
  assert.equal(p.mixed, true);
});

test("todayPlanFromProfile() ajusta puerta por mes", () => {
  const base = conziaGuidanceProfile({
    archetypeDominant: "rey",
    archetypeConfidence: 5,
    friccionPrincipal: "control",
    costoDominante: "x",
    currentMonth: 1,
  });
  const m1 = todayPlanFromProfile(base);
  assert.equal(m1.recommendedDoor, "observacion");

  const m3 = todayPlanFromProfile({ ...base, currentMonth: 3 });
  assert.equal(m3.recommendedDoor, "proceso");
});

test("labels/descriptions de arquetipos", () => {
  assert.equal(getArchetypeLabel("mago"), "Mago");
  assert.match(getArchetypeDescription("mago", false), /Intuición|Intuicion/);
  assert.match(getArchetypeDescription("mago", true), /Confusión|Confusion|miedo/i);
});

