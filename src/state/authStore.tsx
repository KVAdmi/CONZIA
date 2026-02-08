import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createCodeChallenge, generateCodeVerifier } from "../utils/pkce";
import { getSupabaseConfig } from "../services/supabase/config";
import {
  buildOAuthAuthorizeUrl,
  exchangeCodeForSession,
  refreshSession,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  type SupabaseSession,
  type SupabaseUser,
} from "../services/supabase/auth";

type AuthStatus = "loading" | "local" | "authenticated";

type AuthResult = { ok: true } | { ok: false; message: string };

type SignUpResult =
  | { ok: true; kind: "signed_in" }
  | { ok: true; kind: "needs_email_confirmation" }
  | { ok: false; message: string };

type AuthContextValue = {
  status: AuthStatus;
  configured: boolean;
  actorId: string; // "local" or Supabase user id
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  continueLocal: () => void;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<SignUpResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  exchangeOAuthCode: (code: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AUTH_SESSION_KEY = "conzia_v1_auth_session";
const AUTH_MODE_KEY = "conzia_v1_auth_mode";
const PKCE_VERIFIER_KEY = "conzia_v1_pkce_verifier";

function loadSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SupabaseSession;
  } catch {
    return null;
  }
}

function saveSession(session: SupabaseSession | null) {
  try {
    if (!session) localStorage.removeItem(AUTH_SESSION_KEY);
    else localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

function setMode(mode: "local" | "supabase") {
  try {
    localStorage.setItem(AUTH_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

function getMode(): "local" | "supabase" {
  try {
    const raw = localStorage.getItem(AUTH_MODE_KEY);
    if (raw === "supabase") return "supabase";
    return "local";
  } catch {
    return "local";
  }
}

function isExpired(session: SupabaseSession): boolean {
  return session.expires_at * 1000 <= Date.now() + 30_000;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { configured } = getSupabaseConfig();
  const initialSession = configured ? loadSession() : null;
  const [session, setSession] = useState<SupabaseSession | null>(initialSession);
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (!configured) return "local";
    if (initialSession && !isExpired(initialSession)) return "authenticated";
    return "local";
  });

  const user = status === "authenticated" ? (session?.user ?? null) : null;
  const actorId = user?.id ?? "local";

  useEffect(() => {
    if (!configured) {
      setStatus("local");
      setSession(null);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        const existing = loadSession();
        if (!existing) {
          if (!cancelled) {
            setSession(null);
            setStatus("local");
          }
          return;
        }

        if (!isExpired(existing)) {
          if (!cancelled) {
            setSession(existing);
            setStatus("authenticated");
          }
          return;
        }

        const refreshed = await refreshSession(existing.refresh_token);
        if (!cancelled) {
          if (refreshed.ok) {
            saveSession(refreshed.data);
            setSession(refreshed.data);
            setMode("supabase");
            setStatus("authenticated");
          } else {
            saveSession(null);
            setSession(null);
            setMode("local");
            setStatus("local");
          }
        }
      } catch {
        if (!cancelled) {
          saveSession(null);
          setSession(null);
          setMode("local");
          setStatus("local");
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [configured]);

  useEffect(() => {
    if (!configured) return;
    saveSession(session);
  }, [configured, session]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      status,
      configured,
      actorId,
      user,
      session,
      continueLocal() {
        setMode("local");
        setStatus("local");
        setSession(null);
      },
      async signInWithEmail(email, password) {
        if (!configured) return { ok: false, message: "Supabase no está configurado." };
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) return { ok: false, message: "Completa correo y contraseña." };

        const res = await signInWithPassword(cleanEmail, password);
        if (!res.ok) return { ok: false, message: res.error.message };

        setMode("supabase");
        setSession(res.data);
        setStatus("authenticated");
        return { ok: true };
      },
      async signUpWithEmail(email, password) {
        if (!configured) return { ok: false, message: "Supabase no está configurado." };
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) return { ok: false, message: "Completa correo y contraseña." };

        const res = await signUpWithPassword(cleanEmail, password);
        if (!res.ok) return { ok: false, message: res.error.message };

        if (res.data.session) {
          setMode("supabase");
          setSession(res.data.session);
          setStatus("authenticated");
          return { ok: true, kind: "signed_in" };
        }

        setMode("supabase");
        setStatus("local");
        return { ok: true, kind: "needs_email_confirmation" };
      },
      async signInWithGoogle() {
        if (!configured) return { ok: false, message: "Supabase no está configurado." };

        try {
          const verifier = generateCodeVerifier();
          const challenge = await createCodeChallenge(verifier);
          sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

          const redirectTo = `${window.location.origin}/auth/callback`;
          const url = buildOAuthAuthorizeUrl({
            provider: "google",
            redirectTo,
            codeChallenge: challenge,
          });
          setMode("supabase");
          window.location.assign(url);
          return { ok: true };
        } catch {
          return { ok: false, message: "No se pudo iniciar OAuth en este dispositivo." };
        }
      },
      async exchangeOAuthCode(code: string) {
        if (!configured) return { ok: false, message: "Supabase no está configurado." };
        const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY) ?? "";
        sessionStorage.removeItem(PKCE_VERIFIER_KEY);
        if (!verifier) return { ok: false, message: "OAuth incompleto. Intenta de nuevo." };

        const res = await exchangeCodeForSession(code, verifier);
        if (!res.ok) return { ok: false, message: res.error.message };

        setMode("supabase");
        setSession(res.data);
        setStatus("authenticated");
        return { ok: true };
      },
      async signOut() {
        if (session?.access_token) {
          try {
            await signOut(session.access_token);
          } catch {
            // ignore
          }
        }
        setMode("local");
        setSession(null);
        setStatus("local");
      },
    };
  }, [actorId, configured, session, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider />");
  return ctx;
}
