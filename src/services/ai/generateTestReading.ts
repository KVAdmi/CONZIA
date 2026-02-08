import type { ConziaTest } from "../../content/tests";
import type { Pattern, Reading, ReadingContent } from "../../types/models";
import { toISODateOnly } from "../../utils/dates";
import { createId } from "../../utils/id";

export type TestResult = {
  avg: number;
  severity: "bajo" | "medio" | "alto";
};

export type TestSignal = {
  questionId: string;
  text: string;
  score: number; // 0–4 (ya normalizado con reverse)
};

type AiTestReadingResponse =
  | { ok: true; reading: Reading }
  | { ok: false; error: string };

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function themeLines(theme: ConziaTest["theme"]): { avoids: string; question: string; action?: string } {
  switch (theme) {
    case "límites":
      return {
        avoids: "El costo de decir no a tiempo. Pagas después con resentimiento.",
        question: "¿Qué NO pequeño podrías decir hoy sin justificarlo?",
        action: "Una frase: “No puedo eso”. Punto. Sin explicación.",
      };
    case "evitación":
      return {
        avoids: "La incomodidad corta que evita un problema largo.",
        question: "¿Qué estás postergando con ‘luego lo veo’?",
        action: "Sostén 60 segundos de incomodidad y escribe una línea sin ‘porque’.",
      };
    case "rumiación":
      return {
        avoids: "La decisión que te da miedo tomar. La cabeza te compra tiempo.",
        question: "¿Qué decisión estás posponiendo con vueltas mentales?",
        action: "Elige un paso mínimo hoy, aunque no se sienta ‘perfecto’.",
      };
    case "apego":
      return {
        avoids: "La claridad directa. Prefieres señales pequeñas porque duelen menos.",
        question: "¿Qué pregunta directa estás evitando por miedo a la respuesta?",
        action: "Escribe la pregunta en una línea. No la adornes.",
      };
    case "autoestima":
      return {
        avoids: "El riesgo de incomodar. Prefieres permiso externo a sostenerte.",
        question: "¿Qué estás negociando de ti para no parecer ‘difícil’?",
        action: "Di lo que quieres en 8–12 palabras. Sin disculparte.",
      };
    case "desgaste":
      return {
        avoids: "El límite interno. Sostener de más se vuelve identidad.",
        question: "¿Qué estás sosteniendo por costumbre, no por elección?",
        action: "Cancela una cosa mínima hoy. Sin explicar de más.",
      };
    default:
      return {
        avoids: "La verdad simple. La adornas para no sentirla.",
        question: "¿Qué parte de esto estás evitando mirar?",
        action: "Una línea honesta hoy. Sin explicación.",
      };
  }
}

function buildMockContent(params: {
  test: ConziaTest;
  result: TestResult;
  signals: TestSignal[];
  patternName?: string;
}): ReadingContent {
  const contencion =
    params.result.severity === "alto"
      ? "Un patrón sostenido. No es un mal día."
      : params.result.severity === "medio"
        ? "Una señal activa intermitente. Se enciende cuando algo te toca."
        : "Señal baja hoy. No es ausencia: solo no domina.";

  const top = params.signals.slice(0, 3);
  const signalsLine = top.length
    ? `Señales más altas: ${top.map((s) => `“${oneLine(s.text)}”`).join(" · ")}.`
    : "Sin señales destacadas.";

  const loQueVeo = oneLine(
    `Base: ${params.test.title} · tema ${params.test.theme} · promedio ${params.result.avg} · severidad ${params.result.severity}. ${signalsLine}`,
  );

  const patron = params.patternName ? `${params.patternName}.` : undefined;
  const lines = themeLines(params.test.theme);

  return {
    contencion,
    loQueVeo,
    patron,
    loQueEvitas: lines.avoids,
    pregunta: lines.question,
    accionMinima: lines.action,
  };
}

async function requestTestReadingFromProxy(params: {
  test: ConziaTest;
  result: TestResult;
  signals: TestSignal[];
  suggestedPattern?: Pattern;
  todayISO: string;
}): Promise<Reading> {
  const resp = await fetch("/api/ai/test-reading", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      test: {
        id: params.test.id,
        title: params.test.title,
        theme: params.test.theme,
        description: params.test.description,
        length: params.test.length,
        questionCount: params.test.questions.length,
      },
      result: params.result,
      signals: params.signals.slice(0, 6),
      suggestedPattern: params.suggestedPattern
        ? { id: params.suggestedPattern.id, name: params.suggestedPattern.name }
        : null,
      todayISO: params.todayISO,
    }),
  });

  const json = (await resp.json().catch(() => null)) as AiTestReadingResponse | null;
  if (!resp.ok || !json) {
    throw new Error(`Proxy IA: HTTP ${resp.status}`);
  }
  if (!json.ok) {
    throw new Error(json.error);
  }
  return json.reading;
}

export async function generateTestReading(params: {
  test: ConziaTest;
  result: TestResult;
  signals: TestSignal[];
  patterns: Pattern[];
  todayISO?: string;
}): Promise<Reading> {
  const todayISO = params.todayISO ?? toISODateOnly(new Date());
  const suggestedPattern = params.test.suggestedPatternId
    ? params.patterns.find((p) => p.id === params.test.suggestedPatternId)
    : undefined;

  try {
    return await requestTestReadingFromProxy({
      test: params.test,
      result: params.result,
      signals: params.signals,
      suggestedPattern,
      todayISO,
    });
  } catch {
    const content = buildMockContent({
      test: params.test,
      result: params.result,
      signals: params.signals,
      patternName: suggestedPattern?.name,
    });
    return {
      id: createId("r"),
      date: todayISO,
      type: "test",
      content,
      patternId: suggestedPattern?.id,
      basedOnEntryIds: [`test:${params.test.id}`],
    };
  }
}
