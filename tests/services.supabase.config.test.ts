import assert from "node:assert/strict";
import { test } from "node:test";
import { getSupabaseConfig } from "../src/services/supabase/config.ts";

test("getSupabaseConfig() lee VITE_SUPABASE_* desde process.env y normaliza URL", () => {
  const oldUrl = process.env.VITE_SUPABASE_URL;
  const oldKey = process.env.VITE_SUPABASE_ANON_KEY;
  process.env.VITE_SUPABASE_URL = " https://example.supabase.co/ ";
  process.env.VITE_SUPABASE_ANON_KEY = " anon ";

  try {
    const cfg = getSupabaseConfig();
    assert.equal(cfg.url, "https://example.supabase.co");
    assert.equal(cfg.anonKey, "anon");
    assert.equal(cfg.configured, true);
  } finally {
    if (oldUrl === undefined) delete process.env.VITE_SUPABASE_URL;
    else process.env.VITE_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.VITE_SUPABASE_ANON_KEY;
    else process.env.VITE_SUPABASE_ANON_KEY = oldKey;
  }
});

