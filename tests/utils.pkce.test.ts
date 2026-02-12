import assert from "node:assert/strict";
import { test } from "node:test";
import { createCodeChallenge, generateCodeVerifier } from "../src/utils/pkce.ts";

test("generateCodeVerifier() genera longitud correcta y charset permitido", () => {
  const v = generateCodeVerifier(96);
  assert.equal(v.length, 96);
  assert.match(v, /^[A-Za-z0-9\-._~]+$/);
});

test("createCodeChallenge() coincide con vector de RFC 7636", async () => {
  // RFC 7636 - Appendix B
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const expected = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
  const challenge = await createCodeChallenge(verifier);
  assert.equal(challenge, expected);
  assert.ok(!challenge.includes("="));
});

