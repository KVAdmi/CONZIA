import assert from "node:assert/strict";
import { test } from "node:test";
import { signInWithPassword, signOut, signUpWithPassword } from "../src/services/supabase/auth.ts";

async function withEnv(vars, fn) {
  const prev = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    process.env[k] = v;
  }
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test("supabase auth: error si no hay config", async () => {
  await withEnv({ VITE_SUPABASE_URL: "", VITE_SUPABASE_ANON_KEY: "" }, async () => {
    const res = await signInWithPassword("a@b.com", "x");
    assert.equal(res.ok, false);
    assert.match(res.error.message, /no está configurado/i);
  });
});

test("supabase auth: maneja fallo de red", async (t) => {
  await withEnv({ VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_ANON_KEY: "anon" }, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("network");
    };
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    const res = await signInWithPassword("a@b.com", "x");
    assert.equal(res.ok, false);
    assert.match(res.error.message, /no se pudo conectar/i);
  });
});

test("supabase auth: signUpWithPassword soporta payload con session anidada", async (t) => {
  await withEnv({ VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_ANON_KEY: "anon" }, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(String(input), "https://example.supabase.co/auth/v1/signup");
      assert.equal(init?.method, "POST");
      return new Response(
        JSON.stringify({
          user: { id: "u1", email: "a@b.com" },
          session: {
            access_token: "at",
            refresh_token: "rt",
            token_type: "bearer",
            expires_in: 3600,
            user: { id: "u1", email: "a@b.com" },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    const res = await signUpWithPassword("a@b.com", "x");
    assert.equal(res.ok, true);
    assert.equal(res.data.user.id, "u1");
    assert.equal(res.data.session?.access_token, "at");
  });
});

test("supabase auth: signUpWithPassword soporta payload con tokens top-level", async (t) => {
  await withEnv({ VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_ANON_KEY: "anon" }, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          access_token: "at",
          refresh_token: "rt",
          token_type: "bearer",
          expires_in: 3600,
          user: { id: "u2", email: "a@b.com" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    const res = await signUpWithPassword("a@b.com", "x");
    assert.equal(res.ok, true);
    assert.equal(res.data.user.id, "u2");
    assert.equal(res.data.session?.access_token, "at");
  });
});

test("supabase auth: signOut usa Authorization Bearer", async (t) => {
  await withEnv({ VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_ANON_KEY: "anon" }, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_input, init) => {
      const headers = init?.headers ?? {};
      const h = headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers;
      assert.equal(h.Authorization, "Bearer token123");
      assert.equal(h.apikey, "anon");
      return new Response(null, { status: 204 });
    };
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    const res = await signOut("token123");
    assert.equal(res.ok, true);
  });
});
