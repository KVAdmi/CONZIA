import type { Entry, Reading, ReadingContent } from "../../types/models";
import { toISODateOnly } from "../../utils/dates";
import { createId } from "../../utils/id";

type AiReflectionResponse =
  | { ok: true; reading: Reading }
  | { ok: false; error: string };

function buildFallbackContent(entry: Entry): ReadingContent {
  const text = entry.text.toLowerCase();
  const hasAnger = text.includes("enojo") || text.includes("enoj") || text.includes("rabia");
  const hasFear = text.includes("miedo") || text.includes("ansiedad") || text.includes("pánico") || text.includes("panico");
  const hasGuilt = text.includes("culpa") || text.includes("vergüenza") || text.includes("verguenza");

  const contencion =
    entry.text.trim().length > 0
      ? "Te leí. No lo tienes que ordenar hoy."
      : "Te leí.";

  const loQueVeo =
    hasAnger && hasFear
      ? "Hay enojo y miedo al mismo tiempo. Eso suele sentirse como tensión en el cuerpo."
      : hasAnger
        ? "Hay enojo aquí. No como drama: como señal."
        : hasFear
          ? "Hay miedo aquí. No necesitas justificarlo para que sea real."
          : hasGuilt
            ? "Hay algo que te da culpa o vergüenza nombrar. Aun así lo escribiste."
            : "Hay carga aquí. Y un intento de sostenerte mientras escribes.";

  const loQueEvitas =
    hasAnger
      ? "Decir qué límite se cruzó sin suavizarlo."
      : hasFear
        ? "Nombrar qué perderías si eliges por ti."
        : "Decirlo en una frase simple, sin defensa.";

  const pregunta =
    hasAnger
      ? "Si ese enojo pudiera hablar sin atacar, ¿qué pediría?"
      : hasFear
        ? "¿Qué parte de ti está tratando de protegerte con este miedo?"
        : "¿Qué parte de ti estás tratando de cuidar al escribir esto así?";

  return { contencion, loQueVeo, loQueEvitas, pregunta };
}

async function requestReflectionFromProxy(params: { entry: Entry; todayISO: string }): Promise<Reading> {
  const resp = await fetch("/api/ai/reflection", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entry: params.entry, todayISO: params.todayISO }),
  });

  const json = (await resp.json().catch(() => null)) as AiReflectionResponse | null;
  if (!resp.ok || !json) {
    throw new Error(`Proxy IA: HTTP ${resp.status}`);
  }
  if (!json.ok) {
    throw new Error(json.error);
  }
  return json.reading;
}

export async function generateReflection(params: { entry: Entry; todayISO?: string }): Promise<Reading> {
  const todayISO = params.todayISO ?? toISODateOnly(new Date());

  try {
    return await requestReflectionFromProxy({ entry: params.entry, todayISO });
  } catch {
    return {
      id: createId("r"),
      date: todayISO,
      entryId: params.entry.id,
      type: "reflejo",
      content: buildFallbackContent(params.entry),
      basedOnEntryIds: [params.entry.id],
    };
  }
}

