/**
 * Cliente de Supabase para queries a la base de datos
 * Usa fetch directo para mantener consistencia con auth.ts
 */

import { getSupabaseConfig } from "./config";

type ApiError = {
  message: string;
  status?: number;
};

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: ApiError };

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

/**
 * Realiza un SELECT query a Supabase
 */
export async function select<T>(
  table: string,
  options?: {
    select?: string;
    eq?: Record<string, any>;
    limit?: number;
    order?: { column: string; ascending?: boolean };
    accessToken?: string;
  }
): Promise<ApiOk<T[]> | ApiErr> {
  const { anonKey, configured } = getSupabaseConfig();
  if (!configured) {
    return { ok: false, error: { message: "Supabase no está configurado." } };
  }

  const headers: Record<string, string> = {
    apikey: anonKey,
    "Content-Type": "application/json",
  };

  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  // Construir query string
  const params = new URLSearchParams();
  if (options?.select) {
    params.append("select", options.select);
  }
  if (options?.eq) {
    for (const [key, value] of Object.entries(options.eq)) {
      params.append(key, `eq.${value}`);
    }
  }
  if (options?.limit) {
    params.append("limit", options.limit.toString());
  }
  if (options?.order) {
    const direction = options.order.ascending === false ? ".desc" : ".asc";
    params.append("order", `${options.order.column}${direction}`);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(`/rest/v1/${table}?${params.toString()}`), {
      method: "GET",
      headers,
    });
  } catch {
    return {
      ok: false,
      error: { message: "No se pudo conectar a Supabase." },
    };
  }

  const payload = await parseJson(res);
  if (!res.ok) {
    return {
      ok: false,
      error: { message: errorMessage(payload), status: res.status },
    };
  }

  return { ok: true, data: payload as T[] };
}

/**
 * Realiza un INSERT a Supabase
 */
export async function insert<T>(
  table: string,
  data: Record<string, any> | Record<string, any>[],
  options?: {
    accessToken?: string;
  }
): Promise<ApiOk<T[]> | ApiErr> {
  const { anonKey, configured } = getSupabaseConfig();
  if (!configured) {
    return { ok: false, error: { message: "Supabase no está configurado." } };
  }

  const headers: Record<string, string> = {
    apikey: anonKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(`/rest/v1/${table}`), {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  } catch {
    return {
      ok: false,
      error: { message: "No se pudo conectar a Supabase." },
    };
  }

  const payload = await parseJson(res);
  if (!res.ok) {
    return {
      ok: false,
      error: { message: errorMessage(payload), status: res.status },
    };
  }

  return { ok: true, data: payload as T[] };
}

/**
 * Realiza un UPDATE a Supabase
 */
export async function update<T>(
  table: string,
  data: Record<string, any>,
  options: {
    eq: Record<string, any>;
    accessToken?: string;
  }
): Promise<ApiOk<T[]> | ApiErr> {
  const { anonKey, configured } = getSupabaseConfig();
  if (!configured) {
    return { ok: false, error: { message: "Supabase no está configurado." } };
  }

  const headers: Record<string, string> = {
    apikey: anonKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  // Construir query string para el WHERE
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options.eq)) {
    params.append(key, `eq.${value}`);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(`/rest/v1/${table}?${params.toString()}`), {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });
  } catch {
    return {
      ok: false,
      error: { message: "No se pudo conectar a Supabase." },
    };
  }

  const payload = await parseJson(res);
  if (!res.ok) {
    return {
      ok: false,
      error: { message: errorMessage(payload), status: res.status },
    };
  }

  return { ok: true, data: payload as T[] };
}
