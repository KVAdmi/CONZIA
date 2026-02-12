import type { Entry, MirrorStory, Pattern } from "../../types/models";
import { createId } from "../../utils/id.ts";

type Template = {
  story: (name: string) => string;
  highlights: string[];
  questions: string[];
};

type AiMirrorStoryResponse =
  | { ok: true; mirrorStory: MirrorStory }
  | { ok: false; error: string };

const TEMPLATES: Array<{ match: (name: string) => boolean; tpl: Template }> = [
  {
    match: (n) => n.toLowerCase().includes("límite") || n.toLowerCase().includes("limit"),
    tpl: {
      story: () =>
        "Hay personas que aprenden a ganarse su lugar siendo útiles. No lo llaman así. Solo lo hacen. Un día descubren que el sí automático les dejó una vida llena y una identidad vacía.",
      highlights: ["ganarse su lugar siendo útiles", "sí automático", "identidad vacía"],
      questions: [
        "¿Dónde entregas tu límite antes de que exista?",
        "¿Qué crees que perderías si dices no a tiempo?",
        "¿Qué límite pequeño podrías decir hoy?"
      ],
    },
  },
  {
    match: (n) => n.toLowerCase().includes("rumi"),
    tpl: {
      story: () =>
        "Hay personas que repiten conversaciones como si ahí estuviera la salida. Si encuentran la frase perfecta, creen que el pasado se acomoda. Pero no es claridad: es control retroactivo.",
      highlights: ["frase perfecta", "claridad", "control retroactivo"],
      questions: [
        "¿Qué decisión estás posponiendo con vueltas mentales?",
        "¿Qué certeza imposible estás exigiendo?",
        "¿Qué acción mínima evitarías por no sentirte listo?"
      ],
    },
  },
  {
    match: (n) => n.toLowerCase().includes("evit"),
    tpl: {
      story: () =>
        "Hay personas que se vuelven eficientes para no volverse honestas. Hacen todo menos lo que duele. La evitación no grita. Se normaliza.",
      highlights: ["eficientes", "lo que duele", "Se normaliza"],
      questions: [
        "¿Qué estás evitando sentir hoy?",
        "¿Qué excusa ‘limpia’ usas para postergar?",
        "¿Qué pasa si sostienes la incomodidad 60 segundos?"
      ],
    },
  },
];

function generateMirrorStoryMock(params: { pattern: Pattern }): MirrorStory {
  const name = params.pattern.name;
  const found = TEMPLATES.find((t) => t.match(name))?.tpl;
  const tpl = found ?? {
    story: (n: string) =>
      `Hay personas que repiten ${n.toLowerCase()} sin verlo. Cuando lo ven, el patrón deja de ser destino y se vuelve elección.`,
    highlights: ["deja de ser destino", "se vuelve elección"],
    questions: [
      "¿En qué parte te viste?",
      "¿Qué justificaste sin querer?",
      "¿Qué acción mínima cambiaría tu próximo paso?"
    ],
  };

  return {
    id: createId("ms"),
    patternId: params.pattern.id,
    story: tpl.story(name),
    highlights: tpl.highlights,
    questions: tpl.questions,
  };
}

async function requestMirrorStoryFromProxy(params: { pattern: Pattern; evidence: Entry[] }): Promise<MirrorStory> {
  const resp = await fetch("/api/ai/mirror-story", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      pattern: params.pattern,
      evidence: params.evidence,
    }),
  });

  const json = (await resp.json().catch(() => null)) as AiMirrorStoryResponse | null;
  if (!resp.ok || !json) {
    throw new Error(`Proxy IA: HTTP ${resp.status}`);
  }
  if (!json.ok) {
    throw new Error(json.error);
  }
  return json.mirrorStory;
}

export async function generateMirrorStory(params: { pattern: Pattern; evidence?: Entry[] }): Promise<MirrorStory> {
  const evidence = params.evidence ?? [];
  try {
    return await requestMirrorStoryFromProxy({ pattern: params.pattern, evidence });
  } catch {
    return generateMirrorStoryMock({ pattern: params.pattern });
  }
}
