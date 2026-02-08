import type { Plugin, ViteDevServer } from "vite";

type Entry = {
  id: string;
  date: string;
  type: string;
  context: string;
  boundary: string;
  reaction: string;
  emotionalWeight: number;
  text: string;
  tags: string[];
};

type Pattern = {
  id: string;
  name: string;
  contexts: string[];
  evidenceEntryIds: string[];
};

type ReadingContent = {
  contencion: string;
  loQueVeo: string;
  patron?: string;
  loQueEvitas: string;
  pregunta: string;
  accionMinima?: string;
};

type MirrorStoryContent = {
  story: string;
  highlights: string[];
  questions: string[];
};

type TestSummary = {
  id: string;
  title: string;
  theme: string;
  description?: string;
  length?: string;
  questionCount?: number;
};

type TestResult = {
  avg: number;
  severity: "bajo" | "medio" | "alto";
};

type TestSignal = {
  questionId?: string;
  text: string;
  score: number;
};

type AiProxyConfig = {
  anthropicApiKey?: string;
  anthropicModel: string;
  groqApiKey?: string;
  groqModel: string;
};

function sendJson(res: import("http").ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJson(req: import("http").IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function extractJsonObject(text: string): unknown {
  const cleaned = text.trim();
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) return JSON.parse(cleaned);

  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return JSON.parse(fenced[1]);

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));

  throw new Error("No se encontró JSON en la respuesta.");
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function inferPatternId(entry: Entry, patterns: Pattern[]): string | undefined {
  const t = normalize(entry.tags.join(" "));
  const byName = (needle: string) => patterns.find((p) => normalize(p.name).includes(normalize(needle)))?.id;

  if (t.includes("rumiacion")) return byName("Rumiación");
  if (t.includes("evitacion")) return byName("Evitación");
  if (t.includes("autoanulacion")) return byName("Autoanulación");
  if (t.includes("que diran")) return byName("Qué dirán");
  if (t.includes("aprobacion")) return byName("Aprobación");
  if (t.includes("limite") || t.includes("limites")) return byName("Límite") ?? byName("Limite");

  const matchByContext = patterns.find((p) => p.contexts.includes(entry.context));
  return matchByContext?.id;
}

function readingTypeFromEntry(entry: Entry): string {
  if (entry.type === "algo_me_incomodo") return "evento_incomodo";
  if (entry.type === "queria_hacer_algo_distinto") return "intencion_no_lograda";
  if (entry.type === "no_quise_ver_esto") return "patron_activo";
  if (entry.type === "lectura_del_dia") return "lectura_del_dia";
  return "evento_incomodo";
}

function pickEvidence(entry: Entry, allEntries: Entry[]): Entry[] {
  const baseTags = new Set(entry.tags.map((t) => normalize(t)));
  const candidates = allEntries.filter((e) => e.id !== entry.id);

  const scored = candidates
    .map((e) => {
      const overlap = e.tags.reduce((acc, t) => acc + (baseTags.has(normalize(t)) ? 1 : 0), 0);
      const score =
        overlap * 2 +
        (e.context === entry.context ? 2 : 0) +
        (e.boundary === entry.boundary ? 1 : 0) +
        (e.reaction === entry.reaction ? 1 : 0) +
        (e.type === entry.type ? 1 : 0);
      return { e, score };
    })
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.e.date < b.e.date ? 1 : -1))
    .filter((x) => x.score > 0)
    .slice(0, 4)
    .map((x) => x.e);

  return [entry, ...scored].slice(0, 5);
}

function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

async function callAnthropic(params: {
  apiKey: string;
  model: string;
  system: string;
  userText: string;
  maxTokens?: number;
}) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens ?? 650,
      temperature: 0.4,
      system: params.system,
      messages: [{ role: "user", content: params.userText }],
    }),
  });

  const json = (await resp.json().catch(() => null)) as any;
  if (!resp.ok) {
    const message = json?.error?.message ?? json?.message ?? `HTTP ${resp.status}`;
    throw new Error(`Anthropic: ${message}`);
  }

  const blocks = Array.isArray(json?.content) ? json.content : [];
  const text = blocks.map((b: any) => (b?.type === "text" ? String(b.text ?? "") : "")).join("\n").trim();
  return text;
}

export function conciaAiProxyPlugin(config: AiProxyConfig): Plugin {
  return {
    name: "concia-ai-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        const method = (req.method ?? "GET").toUpperCase();

        if (method === "GET" && url.startsWith("/api/ai/ping")) {
          return sendJson(res, 200, {
            ok: true,
            configured: Boolean(config.anthropicApiKey),
            voice: "anthropic",
          });
        }

        if (method === "POST" && url.startsWith("/api/ai/reading")) {
          if (!config.anthropicApiKey) {
            return sendJson(res, 503, {
              ok: false,
              error: "AI proxy no configurado (falta ANTHROPIC_API_KEY).",
            });
          }

          try {
            const body = (await readJson(req)) as any;
            const entry = body?.entry as Entry | undefined;
            const patterns = (body?.patterns as Pattern[] | undefined) ?? [];
            const entries = (body?.entries as Entry[] | undefined) ?? [];
            const todayISO = (body?.todayISO as string | undefined) ?? entry?.date ?? "";

            if (!entry || !entry.id || !entry.text) {
              return sendJson(res, 400, { ok: false, error: "Body inválido: falta entry." });
            }

            const evidence = pickEvidence(entry, entries.length ? entries : [entry]);
            const basedOnEntryIds = evidence.map((e) => e.id);
            const patternId = inferPatternId(entry, patterns);
            const patternName = patternId ? patterns.find((p) => p.id === patternId)?.name : undefined;

            const system = [
              "Eres Concia: un sistema cognitivo personal. Hablas en español MX.",
              "Tono: sobrio, firme, amoroso pero crudo. Sin emojis. Sin clichés. Sin motivación barata.",
              "No diagnostiques, no etiquetes clínicamente, no prometas terapia ni curación.",
              "No inventes hechos: solo puedes afirmar lo que esté en la evidencia enviada.",
              "Devuelve SOLO JSON válido (sin markdown) con esta forma:",
              '{ "contencion": "...", "loQueVeo": "...", "patron": "... (opcional)", "loQueEvitas": "...", "pregunta": "...", "accionMinima": "... (opcional)" }',
              "Cada campo debe ser 1–3 frases máximo. Directo. Adulto.",
            ].join("\n");

            const userText = [
              "EVIDENCIA (no inventes nada fuera de esto):",
              ...evidence.map((e) =>
                `- [${e.id}] ${e.date} · contexto:${e.context} · límite:${e.boundary} · reacción:${e.reaction} · peso:${e.emotionalWeight} · texto:"${truncate(e.text, 360)}"`,
              ),
              "",
              "FOCO (entrada actual):",
              `[${entry.id}] ${entry.date} · contexto:${entry.context} · límite:${entry.boundary} · reacción:${entry.reaction} · peso:${entry.emotionalWeight}`,
              `texto:"${truncate(entry.text, 520)}"`,
              "",
              patternName ? `PATRÓN SUGERIDO (si aplica): ${patternName}` : "PATRÓN SUGERIDO: (si no hay evidencia, omítelo)",
            ].join("\n");

            const text = await callAnthropic({
              apiKey: config.anthropicApiKey,
              model: config.anthropicModel,
              system,
              userText,
            });

            const content = extractJsonObject(text) as ReadingContent;
            if (!content?.contencion || !content?.loQueVeo || !content?.loQueEvitas || !content?.pregunta) {
              throw new Error("Respuesta IA incompleta (faltan campos del formato fijo).");
            }

            return sendJson(res, 200, {
              ok: true,
              reading: {
                id: `r_${crypto.randomUUID()}`,
                date: todayISO,
                entryId: entry.id,
                type: readingTypeFromEntry(entry),
                content,
                patternId,
                basedOnEntryIds,
              },
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Error desconocido";
            return sendJson(res, 500, { ok: false, error: message });
          }
        }

        if (method === "POST" && url.startsWith("/api/ai/reflection")) {
          if (!config.anthropicApiKey) {
            return sendJson(res, 503, {
              ok: false,
              error: "AI proxy no configurado (falta ANTHROPIC_API_KEY).",
            });
          }

          try {
            const body = (await readJson(req)) as any;
            const entry = body?.entry as Entry | undefined;
            const todayISO = (body?.todayISO as string | undefined) ?? entry?.date ?? "";

            if (!entry || !entry.id || !entry.text) {
              return sendJson(res, 400, { ok: false, error: "Body inválido: falta entry." });
            }

            const system = [
              "Eres Concia: un sistema cognitivo personal. Hablas en español MX.",
              "Tono: sobrio, claro, sin juicio. Amoroso pero no cómplice. Sin emojis. Sin clichés.",
              "Esto es un REFLEJO BREVE después de escritura libre (no es análisis, no es dashboard, no es diagnóstico).",
              "No uses las palabras: patrón, diagnóstico, frecuencia, indicador, métrica, score, KPI, clínico.",
              "No des instrucciones largas. No des listas. No des ‘tareas’.",
              "No inventes hechos: solo puedes basarte en el texto enviado.",
              "",
              "Devuelve SOLO JSON válido (sin markdown) con esta forma:",
              '{ "contencion": "...", "loQueVeo": "...", "loQueEvitas": "...", "pregunta": "..." }',
              "",
              "Reglas:",
              "- contencion: 1 frase que baja defensas (sin motivación barata).",
              "- loQueVeo: 1–2 frases que nombren lo que aparece (emociones/tono/contradicción) sin etiquetar.",
              "- loQueEvitas: 1 frase sobre lo que está debajo (sin acusar).",
              "- pregunta: 1 pregunta abierta que invite a integrar (no corregir).",
            ].join("\n");

            const userText = [
              "TEXTO (no inventes nada fuera de esto):",
              `“${truncate(entry.text, 900)}”`,
            ].join("\n");

            const text = await callAnthropic({
              apiKey: config.anthropicApiKey,
              model: config.anthropicModel,
              system,
              userText,
              maxTokens: 420,
            });

            const content = extractJsonObject(text) as ReadingContent;
            if (!content?.contencion || !content?.loQueVeo || !content?.loQueEvitas || !content?.pregunta) {
              throw new Error("Respuesta IA incompleta (faltan campos del formato fijo).");
            }

            return sendJson(res, 200, {
              ok: true,
              reading: {
                id: `r_${crypto.randomUUID()}`,
                date: todayISO,
                entryId: entry.id,
                type: "reflejo",
                content: {
                  contencion: String(content.contencion),
                  loQueVeo: String(content.loQueVeo),
                  loQueEvitas: String(content.loQueEvitas),
                  pregunta: String(content.pregunta),
                },
                basedOnEntryIds: [entry.id],
              },
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Error desconocido";
            return sendJson(res, 500, { ok: false, error: message });
          }
        }

        if (method === "POST" && url.startsWith("/api/ai/test-reading")) {
          if (!config.anthropicApiKey) {
            return sendJson(res, 503, {
              ok: false,
              error: "AI proxy no configurado (falta ANTHROPIC_API_KEY).",
            });
          }

          try {
            const body = (await readJson(req)) as any;
            const test = body?.test as TestSummary | undefined;
            const result = body?.result as TestResult | undefined;
            const signals = (body?.signals as TestSignal[] | undefined) ?? [];
            const suggestedPattern = body?.suggestedPattern as { id: string; name: string } | null | undefined;
            const todayISO = (body?.todayISO as string | undefined) ?? "";

            if (!test || !test.id || !test.title || !test.theme) {
              return sendJson(res, 400, { ok: false, error: "Body inválido: falta test." });
            }
            if (!result || typeof result.avg !== "number" || !result.severity) {
              return sendJson(res, 400, { ok: false, error: "Body inválido: falta result." });
            }

            const system = [
              "Eres Concia: un sistema cognitivo personal. Hablas en español MX.",
              "Tono: sobrio, firme, amoroso pero crudo. Sin emojis. Sin clichés. Sin motivación barata.",
              "No diagnostiques, no etiquetes clínicamente, no prometas terapia ni curación.",
              "No inventes datos: solo puedes afirmar lo que esté en el resumen del test y las señales.",
              "",
              "Estás generando una lectura a partir de un test de comportamiento.",
              "Devuelve SOLO JSON válido (sin markdown) con esta forma:",
              '{ "contencion": "...", "loQueVeo": "...", "patron": "... (opcional)", "loQueEvitas": "...", "pregunta": "...", "accionMinima": "... (opcional)" }',
              "",
              "Reglas de formato:",
              "- contencion es el contenido del bloque “Esto sugiere” (no escribas el encabezado) y debe ser 1–2 frases.",
              "- loQueVeo debe ser la base del test: tema + severidad + 2–3 señales (si existen).",
              "- patron: usa el patrón sugerido si existe; si no, omítelo.",
              "- loQueEvitas: 1 frase directa.",
              "- pregunta: 1 pregunta abierta (sin juicio).",
              "- accionMinima: 1 acción mínima concreta (opcional pero preferible).",
            ].join("\n");

            const signalsLines = signals
              .slice(0, 6)
              .map((s) => `- (${s.score}/4) ${truncate(String(s.text ?? ""), 160)}`)
              .filter(Boolean);

            const userText = [
              "TEST (resumen):",
              `- id: ${test.id}`,
              `- título: ${test.title}`,
              `- tema: ${test.theme}`,
              test.length ? `- longitud: ${test.length}` : null,
              typeof test.questionCount === "number" ? `- preguntas: ${test.questionCount}` : null,
              test.description ? `- descripción: ${test.description}` : null,
              "",
              "RESULTADO:",
              `- severidad: ${result.severity}`,
              `- promedio: ${Math.round(result.avg * 100) / 100}`,
              "",
              signalsLines.length ? "SEÑALES (más altas):" : "SEÑALES (más altas): (no disponibles)",
              ...signalsLines,
              "",
              suggestedPattern?.name ? `PATRÓN SUGERIDO: ${suggestedPattern.name}` : "PATRÓN SUGERIDO: (si no hay evidencia, omítelo)",
            ]
              .filter((x): x is string => Boolean(x))
              .join("\n");

            const text = await callAnthropic({
              apiKey: config.anthropicApiKey,
              model: config.anthropicModel,
              system,
              userText,
            });

            const content = extractJsonObject(text) as ReadingContent;
            if (!content?.contencion || !content?.loQueVeo || !content?.loQueEvitas || !content?.pregunta) {
              throw new Error("Respuesta IA incompleta (faltan campos del formato fijo).");
            }

            return sendJson(res, 200, {
              ok: true,
              reading: {
                id: `r_${crypto.randomUUID()}`,
                date: todayISO,
                type: "test",
                content,
                patternId: suggestedPattern?.id ?? undefined,
                basedOnEntryIds: [`test:${test.id}`],
              },
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Error desconocido";
            return sendJson(res, 500, { ok: false, error: message });
          }
        }

        if (method === "POST" && url.startsWith("/api/ai/mirror-story")) {
          if (!config.anthropicApiKey) {
            return sendJson(res, 503, {
              ok: false,
              error: "AI proxy no configurado (falta ANTHROPIC_API_KEY).",
            });
          }

          try {
            const body = (await readJson(req)) as any;
            const pattern = body?.pattern as Pattern | undefined;
            const evidence = (body?.evidence as Entry[] | undefined) ?? [];

            if (!pattern || !pattern.id || !pattern.name) {
              return sendJson(res, 400, { ok: false, error: "Body inválido: falta pattern." });
            }

            const basedOnEntryIds = evidence.map((e) => e.id).filter(Boolean).slice(0, 8);

            const system = [
              "Eres Concia: un sistema cognitivo personal. Hablas en español MX.",
              "Tono: sobrio, firme, amoroso pero crudo. Sin emojis. Sin clichés.",
              "No diagnostiques. No uses lenguaje clínico. No prometas terapia.",
              "Genera una historia espejo ficticia (otra persona) con el mismo patrón estructural.",
              "Debes elegir 2–4 fragmentos EXACTOS del texto de la historia para subrayar (highlights).",
              "Devuelve SOLO JSON válido (sin markdown) con esta forma:",
              '{ "story": "...", "highlights": ["..."], "questions": ["..."] }',
              "Las preguntas deben ser 3 y deben confrontar sin humillar.",
            ].join("\n");

            const userText = [
              `PATRÓN: ${pattern.name}`,
              evidence.length ? "" : "(Sin evidencia adicional. Usa solo el patrón.)",
              ...evidence.map((e) => `- [${e.id}] ${e.date} · ${truncate(e.text, 380)}`),
            ].join("\n");

            const text = await callAnthropic({
              apiKey: config.anthropicApiKey,
              model: config.anthropicModel,
              system,
              userText,
              maxTokens: 900,
            });

            const content = extractJsonObject(text) as MirrorStoryContent;
            if (!content?.story || !Array.isArray(content?.highlights) || !Array.isArray(content?.questions)) {
              throw new Error("Respuesta IA incompleta (story/highlights/questions).");
            }

            return sendJson(res, 200, {
              ok: true,
              mirrorStory: {
                id: `ms_${crypto.randomUUID()}`,
                patternId: pattern.id,
                story: String(content.story),
                highlights: content.highlights.map(String).slice(0, 6),
                questions: content.questions.map(String).slice(0, 6),
                basedOnEntryIds,
              },
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Error desconocido";
            return sendJson(res, 500, { ok: false, error: message });
          }
        }

        return next();
      });
    },
  };
}
