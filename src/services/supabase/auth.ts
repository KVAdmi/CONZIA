import { getSupabaseConfig } from "./config";

export type SupabaseUser = {
  id: string;
  email?: string | null;
};

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number; // epoch seconds
  user: SupabaseUser;
};

type ApiError = {
  message: string;
  status?: number;
};

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: ApiError };

function normalizeSession(raw: {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  user: SupabaseUser;
}): SupabaseSession {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    token_type: raw.token_type,
    expires_in: raw.expires_in,
    expires_at: raw.expires_at ?? now + (raw.expires_in ?? 0),
    user: raw.user,
  };
}

function buildUrl(path: string): string {
  const { url } = getSupabaseConfig();
  return `${url}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

function errorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Error desconocido.";
  const rec = payload as Record<string, unknown>;
  const candidates = [
    rec.error_description,
    rec.error,
    rec.message,
    rec.msg,
  ].filter((x) => typeof x === "string") as string[];
  return candidates[0] ?? "Error desconocido.";
}

async function post<T>(path: string, body: unknown, opts?: { accessToken?: string }): Promise<ApiOk<T> | ApiErr> {
  const { anonKey, configured } = getSupabaseConfig();
  if (!configured) return { ok: false, error: { message: "Supabase no está configurado." } };

  const headers: Record<string, string> = {
    apikey: anonKey,
    "Content-Type": "application/json",
  };
  if (opts?.accessToken) headers.Authorization = `Bearer ${opts.accessToken}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: { message: "No se pudo conectar a Supabase. Puedes continuar sin cuenta." } };
  }

  const payload = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: { message: errorMessage(payload), status: res.status } };
  }
  return { ok: true, data: payload as T };
}

async function postNoBody(path: string, opts?: { accessToken?: string }): Promise<ApiOk<null> | ApiErr> {
  const { anonKey, configured } = getSupabaseConfig();
  if (!configured) return { ok: false, error: { message: "Supabase no está configurado." } };

  const headers: Record<string, string> = {
    apikey: anonKey,
  };
  if (opts?.accessToken) headers.Authorization = `Bearer ${opts.accessToken}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path), { method: "POST", headers });
  } catch {
    return { ok: false, error: { message: "No se pudo conectar a Supabase. Puedes continuar sin cuenta." } };
  }
  if (!res.ok) {
    const payload = await parseJson(res);
    return { ok: false, error: { message: errorMessage(payload), status: res.status } };
  }
  return { ok: true, data: null };
}

export async function signInWithPassword(email: string, password: string): Promise<ApiOk<SupabaseSession> | ApiErr> {
  const res = await post<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    expires_at?: number;
    user: SupabaseUser;
  }>(`/auth/v1/token?grant_type=password`, { email, password });

  if (!res.ok) return res;
  return { ok: true, data: normalizeSession(res.data) };
}

export async function signUpWithPassword(email: string, password: string): Promise<
  ApiOk<{ user: SupabaseUser; session?: SupabaseSession }> | ApiErr
> {
  const res = await post<
    | {
        user: SupabaseUser;
        session: {
          access_token: string;
          refresh_token: string;
          token_type: string;
          expires_in: number;
          expires_at?: number;
          user: SupabaseUser;
        } | null;
      }
    | {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        expires_at?: number;
        user: SupabaseUser;
      }
  >(`/auth/v1/signup`, { email, password });

  if (!res.ok) return res;

  const payload = res.data as any;
  if (payload?.access_token && payload?.refresh_token && payload?.user) {
    return { ok: true, data: { user: payload.user, session: normalizeSession(payload) } };
  }

  if (payload?.user) {
    const sessionRaw = payload.session;
    if (sessionRaw?.access_token && sessionRaw?.refresh_token) {
      return { ok: true, data: { user: payload.user, session: normalizeSession(sessionRaw) } };
    }
    return { ok: true, data: { user: payload.user } };
  }

  return { ok: false, error: { message: "Respuesta inesperada de Supabase." } };
}

export async function refreshSession(refreshToken: string): Promise<ApiOk<SupabaseSession> | ApiErr> {
  const res = await post<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    expires_at?: number;
    user: SupabaseUser;
  }>(`/auth/v1/token?grant_type=refresh_token`, { refresh_token: refreshToken });

  if (!res.ok) return res;
  return { ok: true, data: normalizeSession(res.data) };
}

export async function exchangeCodeForSession(
  authCode: string,
  codeVerifier: string,
): Promise<ApiOk<SupabaseSession> | ApiErr> {
  const res = await post<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    expires_at?: number;
    user: SupabaseUser;
  }>(`/auth/v1/token?grant_type=pkce`, { auth_code: authCode, code_verifier: codeVerifier });

  if (!res.ok) return res;
  return { ok: true, data: normalizeSession(res.data) };
}

export async function signOut(accessToken: string): Promise<ApiOk<null> | ApiErr> {
  return await postNoBody(`/auth/v1/logout`, { accessToken });
}

export function buildOAuthAuthorizeUrl(args: {
  provider: "google";
  redirectTo: string;
  codeChallenge: string;
}): string {
  const qs = new URLSearchParams({
    provider: args.provider,
    redirect_to: args.redirectTo,
    code_challenge: args.codeChallenge,
    code_challenge_method: "s256",
  });
  return buildUrl(`/auth/v1/authorize?${qs.toString()}`);
}
