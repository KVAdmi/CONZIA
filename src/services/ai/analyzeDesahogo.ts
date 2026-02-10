import type { ConziaDesahogoAnalysis, ConziaDesahogoEmotion } from "../../types/models";
import { inferPatternTag } from "../../ai/responseComposer";

type AiDesahogoResponse =
  | { ok: true; reading: { content: ConziaDesahogoAnalysis } }
  | { ok: false; error: string };

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

function emotionFromText(text: string): ConziaDesahogoEmotion {
  const t = normalize(text);
  if (includesAny(t, ["enojo", "enoj", "rabia", "furia", "coraje", "odio"])) return "ira";
  if (includesAny(t, ["ansiedad", "ansioso", "ansiosa", "inquiet", "nervios", "estres", "estrés"])) return "ansiedad";
  if (includesAny(t, ["verguenza", "vergüenza", "pena", "humill", "ridiculo", "ridículo"])) return "vergüenza";
  if (includesAny(t, ["miedo", "panico", "pánico", "terror"])) return "miedo";
  if (includesAny(t, ["culpa", "culpable", "me culpo"])) return "culpa";
  if (includesAny(t, ["triste", "tristeza", "llor", "vacío", "vacio", "duelo"])) return "tristeza";
  return "otra";
}

function riskFlagFromText(text: string): ConziaDesahogoAnalysis["risk_flag"] {
  const t = normalize(text);
  if (
    includesAny(t, [
      "suicid",
      "quitarme la vida",
      "me voy a matar",
      "me quiero morir",
      "no quiero vivir",
      "no vale la pena vivir",
      "hacerme dano",
      "hacerme daño",
      "autolesion",
      "autolesión",
    ])
  ) {
    return "crisis";
  }

  if (includesAny(t, ["no puedo mas", "no puedo más", "me desborde", "me desbordé", "estoy al limite", "al límite"])) {
    return "watch";
  }

  return "none";
}

function resistanceScoreFromText(text: string): number {
  const t = normalize(text);
  let score = 55;
  const len = t.length;
  if (len < 80) score += 18;
  if (includesAny(t, ["pero", "aunque", "igual"])) score += 10;
  if (includesAny(t, ["siempre", "nunca", "todos", "nadie"])) score += 10;
  if (includesAny(t, ["es culpa de", "por su culpa", "me hicieron", "me hizo"])) score += 14;
  if (includesAny(t, ["yo", "me doy cuenta", "me pasa", "me cuesta", "lo estoy evitando"])) score -= 10;
  if (includesAny(t, ["no se", "no sé", "no entiendo", "me confunde"])) score -= 6;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function patternTagFromText(text: string): string {
  const t = normalize(text);
  if (includesAny(t, ["perfeccion", "perfeccionismo", "perfecto", "perfecta"])) return "perfeccionismo";
  if (includesAny(t, ["control", "controlar", "controlado", "controlada"])) return "control";
  if (includesAny(t, ["culpa", "culpable"])) return "culpa";
  return inferPatternTag({ text });
}

function buildFallbackAnalysis(text: string): ConziaDesahogoAnalysis {
  const emotion = emotionFromText(text);
  const risk_flag = riskFlagFromText(text);
  const resistance_score = resistanceScoreFromText(text);
  const pattern_tag = patternTagFromText(text);

  const reflectionLead =
    emotion === "ira"
      ? "Hay ira aquí. No como drama: como señal."
      : emotion === "tristeza"
        ? "Hay tristeza aquí. No necesita permiso para ser real."
        : emotion === "culpa"
          ? "Hay culpa aquí. Y también una exigencia."
          : emotion === "miedo"
            ? "Hay miedo aquí. Y una parte tuya tratando de protegerte."
            : emotion === "ansiedad"
              ? "Hay ansiedad aquí. Mucho intento de controlar el resultado."
              : "Hay carga aquí. Y estás sosteniéndola como puedes.";

  const mirror =
    pattern_tag === "rumiacion"
      ? "Noto vueltas mentales: parece claridad, pero es control."
      : pattern_tag === "aislamiento"
        ? "Noto cierre: te proteges, pero también te quedas solo con esto."
        : pattern_tag === "evitacion"
          ? "Noto evitación: una verdad simple queda fuera."
          : pattern_tag === "control"
            ? "Noto control: la tensión sube cuando no puedes garantizar el resultado."
            : pattern_tag === "perfeccionismo"
              ? "Noto perfeccionismo: si no sale impecable, se vuelve amenaza."
              : pattern_tag === "culpa"
                ? "Noto culpa como mecanismo: pagas por sentir."
                : "Noto un patrón intentando cerrarte el paso.";

  const reflection = `${reflectionLead}\n${mirror}`;

  const question =
    pattern_tag === "rumiacion"
      ? "Si tuvieras que decir el hecho en una frase, ¿cuál sería?"
      : pattern_tag === "aislamiento"
        ? "¿Qué límite mínimo te debes hoy para no traicionarte?"
        : pattern_tag === "control"
          ? "¿Qué pasaría si sueltas el control solo un 5% hoy?"
          : pattern_tag === "perfeccionismo"
            ? "¿Qué parte de ti cree que fallar te vuelve indigno?"
            : "¿Qué estás evitando admitir en una frase simple?";

  const recommended_next: ConziaDesahogoAnalysis["recommended_next"] = risk_flag === "crisis" ? "consultorio" : "reto";

  return {
    emotion,
    pattern_tag,
    reflection,
    question,
    resistance_score,
    risk_flag,
    recommended_next,
  };
}

async function requestDesahogoFromProxy(params: { text: string, month?: number }): Promise<ConziaDesahogoAnalysis> {
  const resp = await fetch("/api/ai/reflection", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ 
      entry: { id: "temp", text: params.text, date: new Date().toISOString() },
      month: params.month ?? 1
    }),
  });

  const json = (await resp.json().catch(() => null)) as any;
  if (!resp.ok || !json) throw new Error(`Proxy IA: HTTP ${resp.status}`);
  if (!json.ok) throw new Error(json.error);
  
  const content = json.reading.content;
  return {
    emotion: emotionFromText(params.text),
    pattern_tag: content.patron || patternTagFromText(params.text),
    reflection: content.loQueVeo || content.contencion,
    question: content.pregunta,
    resistance_score: resistanceScoreFromText(params.text),
    risk_flag: riskFlagFromText(params.text),
    recommended_next: "reto"
  };
}

export async function analyzeDesahogo(params: { text: string, month?: number }): Promise<ConziaDesahogoAnalysis> {
  try {
    return await requestDesahogoFromProxy(params);
  } catch {
    return buildFallbackAnalysis(params.text);
  }
}
