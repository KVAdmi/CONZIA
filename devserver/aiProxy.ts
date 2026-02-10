import type { Plugin, ViteDevServer } from "vite";
import crypto from "crypto";

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
  try {
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
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

const SYSTEM_PROMPTS = {
  mes1: [
    "Eres CONZIA: un sistema de acompañamiento consciente. Hablas en español MX.",
    "Fase: CATARSIS (Mes 1). Tono: sereno, profesional y profundamente observador.",
    "Tu misión: Identificar proyecciones y mecanismos de defensa. No interrumpas el flujo emocional.",
    "No diagnostiques, no etiquetes clínicamente. Devuelve SOLO JSON.",
  ].join("\n"),
  mes2: [
    "Eres CONZIA: un sistema de acompañamiento consciente. Hablas en español MX.",
    "Fase: ELUCIDACIÓN (Mes 2). Tono: directo, analítico y confrontativo.",
    "Tu misión: Desmantelar la máscara del usuario. Cuestiona las contradicciones.",
    "No diagnostiques, no etiquetes clínicamente. Devuelve SOLO JSON.",
  ].join("\n"),
  mes3: [
    "Eres CONZIA: un sistema de acompañamiento consciente. Hablas en español MX.",
    "Fase: INTEGRACIÓN (Mes 3). Tono: empoderador, práctico y orientado a la realidad.",
    "Tu misión: Integrar la energía de la sombra en la personalidad consciente.",
    "No diagnostiques, no etiquetes clínicamente. Devuelve SOLO JSON.",
  ].join("\n"),
  default: [
    "Eres CONZIA: un sistema de acompañamiento consciente. Hablas en español MX.",
    "Tono: sobrio, firme, amoroso pero crudo. Sin emojis. Sin clichés.",
    "No diagnostiques, no etiquetes clínicamente. Devuelve SOLO JSON.",
  ].join("\n")
};

export function conziaAiProxyPlugin(config: AiProxyConfig): Plugin {
  return {
    name: "conzia-ai-proxy",
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

        // Endpoint para Análisis de Desahogo / Reflexión
        if (method === "POST" && (url.startsWith("/api/ai/reading") || url.startsWith("/api/ai/reflection"))) {
          if (!config.anthropicApiKey) {
            return sendJson(res, 503, { ok: false, error: "Falta ANTHROPIC_API_KEY." });
          }

          try {
            const body = (await readJson(req)) as any;
            const entry = body?.entry as Entry | undefined;
            const month = body?.month ?? 1;

            if (!entry || !entry.text) {
              return sendJson(res, 400, { ok: false, error: "Falta texto de entrada." });
            }

            const baseSystem = month === 1 ? SYSTEM_PROMPTS.mes1 : month === 2 ? SYSTEM_PROMPTS.mes2 : month === 3 ? SYSTEM_PROMPTS.mes3 : SYSTEM_PROMPTS.default;
            const system = [
              baseSystem,
              "Devuelve SOLO JSON válido con esta forma:",
              '{ "contencion": "...", "loQueVeo": "...", "loQueEvitas": "...", "pregunta": "...", "accionMinima": "..." }',
            ].join("\n");

            const text = await callAnthropic({
              apiKey: config.anthropicApiKey,
              model: config.anthropicModel,
              system,
              userText: `Analiza este desahogo: "${entry.text}"`,
            });

            const content = extractJsonObject(text) as ReadingContent;
            return sendJson(res, 200, { ok: true, content });
          } catch (err) {
            return sendJson(res, 500, { ok: false, error: String(err) });
          }
        }

        // Endpoint para Extracción de Rasgos de Sombra (Onboarding)
        if (method === "POST" && url.startsWith("/api/ai/shadow-traits")) {
          if (!config.anthropicApiKey) {
            return sendJson(res, 503, { ok: false, error: "Falta ANTHROPIC_API_KEY." });
          }

          try {
            const body = (await readJson(req)) as any;
            const text = body?.text;

            const system = [
              SYSTEM_PROMPTS.default,
              "Analiza las proyecciones del usuario. Devuelve SOLO JSON:",
              '{ "traits": ["..."], "summary": "...", "archetype_impact": "..." }',
            ].join("\n");

            const aiResponse = await callAnthropic({
              apiKey: config.anthropicApiKey,
              model: config.anthropicModel,
              system,
              userText: `Analiza estas proyecciones: "${text}"`,
            });

            const analysis = extractJsonObject(aiResponse);
            return sendJson(res, 200, { ok: true, analysis });
          } catch (err) {
            return sendJson(res, 500, { ok: false, error: String(err) });
          }
        }

        // Endpoint para Análisis de Sueños
        if (method === "POST" && url.startsWith("/api/ai/dream-analysis")) {
          if (!config.anthropicApiKey) {
            return sendJson(res, 503, { ok: false, error: "Falta ANTHROPIC_API_KEY." });
          }

          try {
            const body = (await readJson(req)) as any;
            const text = body?.text;

            const system = [
              SYSTEM_PROMPTS.default,
              "Eres un experto en análisis de sueños junguiano.",
              "Devuelve SOLO JSON:",
              '{ "interpretation": "...", "symbols": ["..."], "visual_prompt": "..." }',
              "visual_prompt debe ser en INGLÉS, estilo surrealista, oscuro, cinematográfico.",
            ].join("\n");

            const aiResponse = await callAnthropic({
              apiKey: config.anthropicApiKey,
              model: config.anthropicModel,
              system,
              userText: `Analiza este sueño: "${text}"`,
            });

            const analysis = extractJsonObject(aiResponse) as any;
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(analysis.visual_prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}&model=flux`;

            return sendJson(res, 200, {
              ok: true,
              analysis: { ...analysis, imageUrl }
            });
          } catch (err) {
            return sendJson(res, 500, { ok: false, error: String(err) });
          }
        }

        // Endpoint para Mirror Story (Cofre)
        if (method === "POST" && url.startsWith("/api/ai/mirror-story")) {
          if (!config.anthropicApiKey) {
            return sendJson(res, 503, { ok: false, error: "Falta ANTHROPIC_API_KEY." });
          }

          try {
            const body = (await readJson(req)) as any;
            const entries = (body?.entries as Entry[]) ?? [];
            const pattern = body?.pattern as Pattern;

            const system = [
              SYSTEM_PROMPTS.default,
              "Crea una historia espejo basada en la evidencia. Devuelve SOLO JSON:",
              '{ "story": "...", "highlights": ["..."], "questions": ["..."] }',
            ].join("\n");

            const userText = `Patrón: ${pattern.name}. Evidencia: ${entries.map(e => e.text).join(" | ")}`;

            const text = await callAnthropic({
              apiKey: config.anthropicApiKey,
              model: config.anthropicModel,
              system,
              userText,
            });

            const content = extractJsonObject(text) as MirrorStoryContent;
            return sendJson(res, 200, {
              ok: true,
              mirrorStory: {
                id: `ms_${crypto.randomUUID()}`,
                patternId: pattern.id,
                story: content.story,
                highlights: content.highlights,
                questions: content.questions,
              },
            });
          } catch (err) {
            return sendJson(res, 500, { ok: false, error: String(err) });
          }
        }

        return next();
      });
    },
  };
}
