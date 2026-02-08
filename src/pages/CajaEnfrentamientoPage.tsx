import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Collapsible from "../components/ui/Collapsible";
import GlassSheet from "../components/ui/GlassSheet";
import { generateMirrorStory } from "../services/ai";
import { useSubscription } from "../state/subscriptionStore";
import { useXmi } from "../state/xmiStore";
import type { Entry, MirrorStory, Pattern } from "../types/models";

function inferPatternFromEntry(entry: Entry, patterns: Pattern[]): Pattern | undefined {
  const direct = patterns.find((p) => p.evidenceEntryIds.includes(entry.id));
  if (direct) return direct;

  const tags = entry.tags.join(" ").toLowerCase();
  const pickByName = (needle: string) => patterns.find((p) => p.name.toLowerCase().includes(needle.toLowerCase()));

  if (tags.includes("rumiación") || tags.includes("rumiacion")) return pickByName("rumiación") ?? pickByName("rumiacion");
  if (tags.includes("evitación") || tags.includes("evitacion")) return pickByName("evitación") ?? pickByName("evitacion");
  if (tags.includes("autoanulación") || tags.includes("autoanulacion")) return pickByName("autoanulación") ?? pickByName("autoanulacion");
  if (tags.includes("qué dirán") || tags.includes("que diran")) return pickByName("qué dirán") ?? pickByName("que diran");
  if (tags.includes("aprobación") || tags.includes("aprobacion")) return pickByName("aprobación") ?? pickByName("aprobacion");
  if (tags.includes("límite") || tags.includes("limite")) return pickByName("límite") ?? pickByName("limit");

  return patterns.find((p) => p.contexts.includes(entry.context));
}

function patternExplanation(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("límite") || n.includes("limit")) return "Tu límite existe, pero llega tarde. Primero cedes, luego acumulas, luego pagas.";
  if (n.includes("aprob")) return "Estás midiendo tu valor en señales externas. No es conexión. Es permiso.";
  if (n.includes("evit")) return "Evitas la incomodidad corta y te compras un problema largo. Parece paz. Es postergación.";
  if (n.includes("rumi")) return "Le llamas pensar. Pero es dar vueltas para sentir control donde no existe.";
  if (n.includes("autoanul")) return "Te haces pequeño para mantener pertenencia. Eres querido, pero te vuelves invisible en lo que necesitas.";
  if (n.includes("qué dirán") || n.includes("que diran")) return "Tu brújula está afuera. Decides por reacción imaginada, no por deseo real.";
  return "Esto no es nuevo. Es recurrente. Lo importante es ver qué lo sostiene.";
}

function confrontationLine(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("límite") || n.includes("limit")) return "No es que la gente pida de más. Es que tú entregas tu límite antes de que exista.";
  if (n.includes("aprob")) return "No estás buscando amor. Estás buscando confirmación. Y la confundes con paz.";
  if (n.includes("evit")) return "No te falta claridad. Te falta sostener la incomodidad sin escapar.";
  if (n.includes("rumi")) return "No estás pensando. Estás postergando bajo una máscara de análisis.";
  if (n.includes("autoanul")) return "No es que no te elijan. Te estás encogiendo para que no te dejen.";
  if (n.includes("qué dirán") || n.includes("que diran")) return "Estás viviendo con un jurado imaginario. Y le das el voto final.";
  return "No es mala suerte. Es elección repetida desde miedo.";
}

function actionMinimaFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("límite") || n.includes("limit")) return "Una frase hoy: “No puedo con eso. No lo voy a tomar”. Sin explicación.";
  if (n.includes("aprob")) return "Hoy: no persigas una respuesta. Observa qué se activa y no lo arregles con un mensaje.";
  if (n.includes("evit")) return "Quédate 30 segundos más en la incomodidad antes de salirte. Solo observa.";
  if (n.includes("rumi")) return "Acción de 5 minutos. Sin optimizar. Sin ‘cuando esté listo’.";
  if (n.includes("autoanul")) return "Di lo que quieres en una línea. Sin chiste. Sin suavizar.";
  if (n.includes("qué dirán") || n.includes("que diran")) return "Haz una micro-decisión sin consultar a nadie. Solo una.";
  return "Acción mínima: nombra el límite en una frase.";
}

function deepQuestionFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("límite") || n.includes("limit")) return "¿Qué crees que pasa si pones un límite temprano y alguien se incomoda?";
  if (n.includes("aprob")) return "¿Qué parte de ti cree que sin señales externas no existe?";
  if (n.includes("evit")) return "¿Qué verdad sería inevitable si hoy no pudieras escapar?";
  if (n.includes("rumi")) return "¿Qué decisión estás posponiendo detrás de la ‘claridad’ que buscas?";
  if (n.includes("autoanul")) return "¿Dónde te haces pequeño para no perder pertenencia?";
  if (n.includes("qué dirán") || n.includes("que diran")) return "¿A quién le estás dando el voto final de tu vida, y por qué?";
  return "¿Qué estás evitando nombrar para seguir igual?";
}

type Segment = { text: string; highlighted: boolean };

function highlightStory(story: string, highlights: string[]): Segment[] {
  let segments: Segment[] = [{ text: story, highlighted: false }];
  for (const h of highlights) {
    if (!h.trim()) continue;
    const next: Segment[] = [];
    for (const seg of segments) {
      if (seg.highlighted) {
        next.push(seg);
        continue;
      }
      const parts = seg.text.split(h);
      if (parts.length === 1) {
        next.push(seg);
        continue;
      }
      parts.forEach((p, idx) => {
        if (p) next.push({ text: p, highlighted: false });
        if (idx < parts.length - 1) next.push({ text: h, highlighted: true });
      });
    }
    segments = next;
  }
  return segments;
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export default function CajaEnfrentamientoPage() {
  const { state, dispatch } = useXmi();
  const sub = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patternId = searchParams.get("patternId") ?? undefined;
  const entryId = searchParams.get("entryId") ?? undefined;
  const locked = !sub.derived.hasSystem;

  const entry = useMemo(() => (entryId ? state.entries.find((e) => e.id === entryId) : undefined), [entryId, state.entries]);

  const pattern = useMemo(() => {
    if (patternId) return state.patterns.find((p) => p.id === patternId);
    if (entry) return inferPatternFromEntry(entry, state.patterns);
    return state.patterns[0];
  }, [entry, patternId, state.patterns]);

  const evidence = useMemo(() => {
    if (!pattern) return [];
    const list = pattern.evidenceEntryIds
      .map((id) => state.entries.find((e) => e.id === id))
      .filter(Boolean) as Entry[];
    return list.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
  }, [pattern, state.entries]);

  const mirrorStory = useMemo<MirrorStory | undefined>(() => {
    if (!pattern) return undefined;
    return state.mirrorStories.find((m) => m.patternId === pattern.id) ?? state.mirrorStories[0];
  }, [pattern, state.mirrorStories]);

  const storySegments = useMemo(() => {
    if (!mirrorStory) return [];
    return highlightStory(mirrorStory.story, mirrorStory.highlights);
  }, [mirrorStory]);

  const [actionOpen, setActionOpen] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [storyBusy, setStoryBusy] = useState(false);

  if (!pattern) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <h2 className="text-sm font-semibold tracking-tight">Caja de Enfrentamiento</h2>
          <p className="mt-1 text-sm text-outer-space/70">Sin patrón disponible.</p>
        </Card>
      </div>
    );
  }

  const explanation = patternExplanation(pattern.name);
  const confrontation = confrontationLine(pattern.name);
  const actionMinima = actionMinimaFor(pattern.name);
  const deepQuestion = deepQuestionFor(pattern.name);

  async function regenerateStory() {
    if (locked || storyBusy) return;
    if (!pattern) return;
    setStoryBusy(true);
    try {
      const next = await generateMirrorStory({ pattern, evidence });
      dispatch({ type: "upsert_mirror_story", mirrorStory: next });
    } finally {
      setStoryBusy(false);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 pb-14 pt-12 scroll-smooth">
        <div className="sticky top-0 z-20 -mx-4 px-4 pb-4 pt-2 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/12"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver
            </button>
            <button
              type="button"
              onClick={() => navigate("/sesion")}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/12"
            >
              Salir a Sesión
            </button>
          </div>
        </div>

        {locked ? (
          <div className="mb-6 rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-5 py-4">
            <div className="text-xs text-morning-blue">Modo básico</div>
            <div className="mt-1 text-sm text-outer-space/80">
              En modo básico no abrimos Caja con IA. Aquí ves estructura y ejemplo del visor.
            </div>
            <div className="mt-3">
              <Button variant="primary" onClick={() => navigate("/planes")}>
                Ver planes
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-10">
          <div>
            <div className="text-xs text-morning-blue">Caja de Enfrentamiento</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-outer-space">
              {pattern.name}
            </h1>
            <p className="mt-3 text-base text-outer-space/80 leading-relaxed">{explanation}</p>
          </div>

          <div className="space-y-4">
            <div className="text-xs text-morning-blue">Lo que pasó (evidencia)</div>
            {evidence.length ? (
              <div className="space-y-3">
                {evidence.map((e) => (
                  <div key={e.id} className="rounded-xl bg-white ring-1 ring-gainsboro/70 px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm font-semibold tracking-tight text-outer-space">{e.date}</div>
                      <div className="text-xs text-outer-space/60">
                        {e.context} · {e.boundary} · {e.reaction} · peso {e.emotionalWeight}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-outer-space/80 leading-relaxed">
                      {oneLine(e.text)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-outer-space/70">Sin evidencia disponible.</div>
            )}
          </div>

          <div className="rounded-2xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-6 py-6">
            <div className="text-xs text-morning-blue">Confrontación</div>
            <div className="mt-2 text-lg font-semibold tracking-tight text-outer-space leading-snug">
              {confrontation}
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs text-morning-blue">Historia espejo</div>
            {mirrorStory ? (
              <div className="rounded-2xl bg-white ring-1 ring-gainsboro/70 px-6 py-6">
                <div className="text-base text-outer-space/85 leading-relaxed">
                  {storySegments.map((s, idx) =>
                    s.highlighted ? (
                      <span key={idx} className="rounded bg-camel/35 px-1 text-outer-space">
                        {s.text}
                      </span>
                    ) : (
                      <span key={idx}>{s.text}</span>
                    ),
                  )}
                </div>
                {mirrorStory.basedOnEntryIds?.length ? (
                  <div className="mt-4 text-xs text-outer-space/60">
                    Basado en: {mirrorStory.basedOnEntryIds.join(" · ")}
                  </div>
                ) : null}
                <div className="mt-6 space-y-2">
                  {mirrorStory.questions.map((q) => (
                    <div key={q} className="text-sm text-outer-space/85">
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-outer-space/70">Sin historia espejo.</div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-xs text-morning-blue">Cierre</div>
            <div className="text-sm text-outer-space/70">Dos rutas. Ninguna es heroica.</div>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  if (locked) {
                    navigate("/planes");
                    return;
                  }
                  setActionOpen(true);
                }}
              >
                Ruta A: Acción mínima hoy
              </Button>
              <Button
                onClick={() => {
                  if (locked) {
                    navigate("/planes");
                    return;
                  }
                  setQuestionOpen(true);
                }}
              >
                Ruta B: Pregunta profunda para escribir
              </Button>
            </div>
          </div>

          <Collapsible title="Opciones (visor)" description="No se muestra por defecto." defaultOpen={false}>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-outer-space/70">
                Regenerar historia espejo (IA) para probar consistencia.
              </div>
              <Button size="sm" disabled={locked || storyBusy} onClick={regenerateStory}>
                {storyBusy ? "…" : "Regenerar"}
              </Button>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="quiet" onClick={() => navigate("/sesion")}>
                Salir de Caja
              </Button>
            </div>
          </Collapsible>
        </div>
      </div>

      <GlassSheet
        open={actionOpen}
        title="Ruta A: Acción mínima hoy"
        description="No cambia tu vida. Cambia el patrón en un milímetro."
        onClose={() => setActionOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4 text-sm text-outer-space/85">
            {actionMinima}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button onClick={() => setActionOpen(false)}>Cerrar</Button>
            <Button variant="primary" onClick={() => navigate("/sesion")}>
              Volver al inicio
            </Button>
          </div>
        </div>
      </GlassSheet>

      <GlassSheet
        open={questionOpen}
        title="Ruta B: Pregunta profunda"
        description="Para escribir sin negociar la verdad."
        onClose={() => setQuestionOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4 text-sm text-outer-space/85">
            {deepQuestion}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button onClick={() => setQuestionOpen(false)}>Cerrar</Button>
            <Button
              variant="primary"
              onClick={() =>
                navigate(
                  `/escribir?silencio=1&layer=${encodeURIComponent("no_quise_ver_esto")}&prompt=${encodeURIComponent(deepQuestion)}`,
                )
              }
            >
              Abrir Escribir
            </Button>
          </div>
        </div>
      </GlassSheet>
    </>
  );
}
