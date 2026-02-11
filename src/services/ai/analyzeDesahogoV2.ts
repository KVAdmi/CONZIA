/**
 * VERSIÓN MEJORADA DE ANALYZE DESAHOGO
 * Integra los 5 motores para análisis profundo
 */

import type { ConziaDesahogoAnalysis, ConziaDesahogoEmotion } from "../../types/models";
import { inferPatternTag } from "../../ai/responseComposer";
import {
  getClaudeSystemPrompt,
  buildFullClaudeContext,
  calculateAndSaveResistance,
  generateAndSaveChallenge,
} from "../engineService";
import { insert } from "../supabase/client";
import {
  detectNewPatterns,
  detectTraumaNodes,
} from "../../engine/memoryEngine";

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

/**
 * NUEVA VERSIÓN: Usa los motores para análisis profundo
 */
async function requestDesahogoWithEngines(params: {
  text: string;
  userId: string;
  accessToken?: string;
}): Promise<ConziaDesahogoAnalysis> {
  // PASO 1: Obtener system prompt basado en el mes actual
  const systemPrompt = await getClaudeSystemPrompt(params.userId, params.accessToken);

  // PASO 2: Construir contexto histórico completo
  const context = await buildFullClaudeContext(params.userId, params.accessToken);

  // PASO 3: Enviar a Claude con system prompt + contexto
  const resp = await fetch("/api/ai/reflection", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      entry: { id: "temp", text: params.text, date: new Date().toISOString() },
      systemPrompt: systemPrompt + context,
    }),
  });

  const json = (await resp.json().catch(() => null)) as any;
  if (!resp.ok || !json) throw new Error(`Proxy IA: HTTP ${resp.status}`);
  if (!json.ok) throw new Error(json.error);

  const content = json.reading.content;

  // PASO 4: Extraer rasgos de sombra de la respuesta de Claude
  const shadowTraits: string[] = [];
  if (content.patron) shadowTraits.push(content.patron);

  // PASO 5: Guardar entrada en base de datos
  await insert("desahogo_entries", {
    profile_id: params.userId,
    text: params.text,
    shadow_traits: shadowTraits,
    emotional_tone: emotionFromText(params.text),
  }, { accessToken: params.accessToken });

  // PASO 6: Detectar y guardar nuevos patrones
  const newPatterns = detectNewPatterns(params.text, []); // TODO: Pasar entradas previas
  for (const pattern of newPatterns) {
    await insert("detected_patterns", {
      profile_id: params.userId,
      pattern_type: pattern.pattern_type,
      description: pattern.description,
      frequency: pattern.frequency,
    }, { accessToken: params.accessToken });
  }

  // PASO 7: Detectar y guardar nodos de trauma
  const traumaNodes = detectTraumaNodes(params.text);
  for (const trauma of traumaNodes) {
    await insert("trauma_nodes", {
      profile_id: params.userId,
      theme: trauma.theme,
      description: trauma.description,
      intensity: trauma.intensity,
    }, { accessToken: params.accessToken });
  }

  // PASO 8: Calcular y guardar resistencia
  await calculateAndSaveResistance(params.userId, params.accessToken);

  // PASO 9: Generar reto si es necesario (cada 7 días)
  // TODO: Implementar lógica de frecuencia de retos

  return {
    emotion: emotionFromText(params.text),
    pattern_tag: content.patron || patternTagFromText(params.text),
    reflection: content.loQueVeo || content.contencion,
    question: content.pregunta,
    resistance_score: resistanceScoreFromText(params.text),
    risk_flag: riskFlagFromText(params.text),
    recommended_next: "reto",
  };
}

/**
 * Función principal de análisis de desahogo (MEJORADA)
 */
export async function analyzeDesahogoV2(params: {
  text: string;
  userId: string;
  accessToken?: string;
}): Promise<ConziaDesahogoAnalysis> {
  try {
    return await requestDesahogoWithEngines(params);
  } catch (error) {
    console.error("Error en analyzeDesahogoV2:", error);
    return buildFallbackAnalysis(params.text);
  }
}
