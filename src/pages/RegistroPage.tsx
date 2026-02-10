import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Textarea from "../components/ui/Textarea";
import { extractShadowTraits } from "../services/ai";
import { useConzia } from "../state/conziaStore";
import type { ConziaArchetype, ConziaDrivingStyle, ConziaFriccion, ConziaProfile, ConziaShadowTrait } from "../types/models";
import { createId } from "../utils/id";
import { useTypewriter } from "../utils/useTypewriter";

type StepId = "r1" | "r2" | "r3" | "resumen" | "radar" | "proyeccion" | "revelacion";

type ThemeOption = { id: ConziaFriccion; label: string };
type CostOption = { id: string; label: string };

const THEMES: ThemeOption[] = [
  { id: "limites", label: "Límites" },
  { id: "abandono_propio", label: "Abandono propio" },
  { id: "control", label: "Control" },
  { id: "verguenza", label: "Vergüenza" },
  { id: "dependencia", label: "Dependencia" },
  { id: "autoengano", label: "Autoengaño" },
];

const COSTS: CostOption[] = [
  { id: "tension", label: "Tensión y conflicto evitado" },
  { id: "culpa", label: "Culpa" },
  { id: "ansiedad", label: "Ansiedad y rumiación" },
  { id: "autoabandono", label: "Autoabandono" },
  { id: "resentimiento", label: "Resentimiento acumulado" },
  { id: "desgaste", label: "Desgaste y agotamiento" },
];

const ARCHETYPES: Array<{ id: ConziaArchetype; label: string; style: ConziaDrivingStyle }> = [
  { id: "guerrero", label: "Guerrero", style: "Directo" },
  { id: "rey", label: "Sabio Rey", style: "Sobrio" },
  { id: "amante", label: "Amante", style: "Relacional" },
  { id: "mago", label: "Mago", style: "Reflexivo" },
];

const ARCH_LABEL: Record<ConziaArchetype, string> = {
  guerrero: "Guerrero",
  amante: "Amante",
  rey: "Sabio Rey",
  mago: "Mago",
};

type ArchetypeQuestion = {
  id: string;
  prompt: string;
  options: Array<{ archetype: ConziaArchetype; label: string }>;
};

const QUESTIONS: ArchetypeQuestion[] = [
  {
    id: "q1",
    prompt: "Cuando algo me incomoda, mi primer impulso es…",
    options: [
      { archetype: "guerrero", label: "Actuar y cortar." },
      { archetype: "rey", label: "Definir regla y sostenerla." },
      { archetype: "amante", label: "Cuidar el vínculo y suavizar." },
      { archetype: "mago", label: "Observar el patrón antes de moverme." },
    ],
  },
  {
    id: "q2",
    prompt: "Si siento que pierdo control, yo…",
    options: [
      { archetype: "guerrero", label: "Subo el ritmo. Resuelvo." },
      { archetype: "rey", label: "Ordeno prioridades. Pongo límites claros." },
      { archetype: "amante", label: "Busco cercanía y confirmación." },
      { archetype: "mago", label: "Me voy a la cabeza. Analizo." },
    ],
  },
  {
    id: "q3",
    prompt: "Cuando me piden algo que no quiero hacer, yo…",
    options: [
      { archetype: "guerrero", label: "Digo no directo." },
      { archetype: "rey", label: "Negocio desde una regla (sin drama)." },
      { archetype: "amante", label: "Digo que sí para no incomodar." },
      { archetype: "mago", label: "Lo dejo abierto para ganar tiempo." },
    ],
  },
  {
    id: "q4",
    prompt: "Cuando algo se pone tenso, yo…",
    options: [
      { archetype: "guerrero", label: "Enfrento." },
      { archetype: "rey", label: "Bajo el tono y conduzco." },
      { archetype: "amante", label: "Busco reparar rápido." },
      { archetype: "mago", label: "Me retiro a observar." },
    ],
  },
  {
    id: "q5",
    prompt: "Mi forma típica de evitar una verdad es…",
    options: [
      { archetype: "guerrero", label: "Convertirla en acción sin sentirla." },
      { archetype: "rey", label: "Convertirla en regla para no tocarla." },
      { archetype: "amante", label: "Convertirla en vínculo para no perder." },
      { archetype: "mago", label: "Convertirla en explicación." },
    ],
  },
  {
    id: "q6",
    prompt: "Cuando cometo un error, yo…",
    options: [
      { archetype: "guerrero", label: "Me exijo y corrijo de inmediato." },
      { archetype: "rey", label: "Lo pongo en contexto y ajusto el sistema." },
      { archetype: "amante", label: "Me preocupo por cómo quedé con el otro." },
      { archetype: "mago", label: "Busco la causa profunda." },
    ],
  },
  {
    id: "q7",
    prompt: "Cuando alguien se aleja, mi reacción es…",
    options: [
      { archetype: "guerrero", label: "Me cierro y sigo." },
      { archetype: "rey", label: "Pido claridad y decido con calma." },
      { archetype: "amante", label: "Me activo. Busco señal." },
      { archetype: "mago", label: "Leo señales. Interpreto." },
    ],
  },
  {
    id: "q8",
    prompt: "Si tengo que elegir rápido, yo…",
    options: [
      { archetype: "guerrero", label: "Decido y sostengo el golpe." },
      { archetype: "rey", label: "Elijo lo más estable y consistente." },
      { archetype: "amante", label: "Elijo lo que cuide el vínculo." },
      { archetype: "mago", label: "Busco un ángulo distinto antes de decidir." },
    ],
  },
  {
    id: "q9",
    prompt: "En una conversación difícil, yo…",
    options: [
      { archetype: "guerrero", label: "Voy al punto." },
      { archetype: "rey", label: "Marco el marco: tema, límites y cierre." },
      { archetype: "amante", label: "Busco que el otro no se sienta mal." },
      { archetype: "mago", label: "Hago preguntas para entender motivaciones." },
    ],
  },
  {
    id: "q10",
    prompt: "Cuando estoy cansado, tiendo a…",
    options: [
      { archetype: "guerrero", label: "Forzarme igual." },
      { archetype: "rey", label: "Recortar y sostener lo esencial." },
      { archetype: "amante", label: "Seguir para no fallar a nadie." },
      { archetype: "mago", label: "Desaparecer mentalmente." },
    ],
  },
  {
    id: "q11",
    prompt: "Mi trampa más limpia suele ser…",
    options: [
      { archetype: "guerrero", label: "Confundir intensidad con avance." },
      { archetype: "rey", label: "Confundir control con claridad." },
      { archetype: "amante", label: "Confundir paz con evitar." },
      { archetype: "mago", label: "Confundir análisis con verdad." },
    ],
  },
  {
    id: "q12",
    prompt: "Lo que más me cuesta sostener es…",
    options: [
      { archetype: "guerrero", label: "La vulnerabilidad sin actuar." },
      { archetype: "rey", label: "El caos sin cerrar." },
      { archetype: "amante", label: "La distancia sin perseguir." },
      { archetype: "mago", label: "La acción sin entender todo." },
    ],
  },
];

type RadarQuestion = { id: string; archetype: ConziaArchetype; text: string };
type Likert5 = 1 | 2 | 3 | 4 | 5;

const LIKERT5: Array<{ value: Likert5; label: string }> = [
  { value: 1, label: "Nunca" },
  { value: 2, label: "Rara vez" },
  { value: 3, label: "A veces" },
  { value: 4, label: "Frecuente" },
  { value: 5, label: "Siempre" },
];

const RADAR_QUESTIONS: RadarQuestion[] = [
  // Bloque 1: Guerrero
  {
    id: "radar_g1",
    archetype: "guerrero",
    text: 'Soy capaz de decir "NO" a las peticiones de otros sin sentir la necesidad de dar excusas o sentirme culpable.',
  },
  {
    id: "radar_g2",
    archetype: "guerrero",
    text: "Cuando alguien invade mi espacio o me falta al respeto, pongo un límite firme de manera inmediata.",
  },
  {
    id: "radar_g3",
    archetype: "guerrero",
    text: "Tengo la disciplina para empezar y terminar mis proyectos importantes sin dejar que la pereza me detenga.",
  },
  {
    id: "radar_g4",
    archetype: "guerrero",
    text: "Me siento seguro defendiendo mis puntos de vista, incluso cuando sé que la mayoría está en mi contra.",
  },
  {
    id: "radar_g5",
    archetype: "guerrero",
    text: "En situaciones de conflicto, prefiero enfrentar el problema directamente en lugar de evitarlo o callarme.",
  },
  // Bloque 2: Amante
  {
    id: "radar_a1",
    archetype: "amante",
    text: "Me permito llorar o expresar tristeza frente a otros cuando me siento vulnerable, sin sentir vergüenza.",
  },
  {
    id: "radar_a2",
    archetype: "amante",
    text: "Disfruto de los placeres de la vida (comida, descanso, arte) sin sentir que estoy perdiendo el tiempo.",
  },
  {
    id: "radar_a3",
    archetype: "amante",
    text: "Siento una conexión genuina y profunda con las emociones de las personas que amo.",
  },
  {
    id: "radar_a4",
    archetype: "amante",
    text: "Soy capaz de perdonarme a mí mismo por mis errores pasados en lugar de castigarme mentalmente.",
  },
  {
    id: "radar_a5",
    archetype: "amante",
    text: "Me siento cómodo con la intimidad física y emocional, permitiendo que otros se acerquen a mi corazón.",
  },
  // Bloque 3: Sabio Rey
  {
    id: "radar_r1",
    archetype: "rey",
    text: "Siento que soy el dueño de mi destino y que mis decisiones definen mi realidad actual.",
  },
  {
    id: "radar_r2",
    archetype: "rey",
    text: "Mantengo la calma y la claridad mental cuando todo a mi alrededor parece ser un caos.",
  },
  {
    id: "radar_r3",
    archetype: "rey",
    text: "Me resulta natural organizar mis prioridades y las de mi entorno para lograr un bien común.",
  },
  {
    id: "radar_r4",
    archetype: "rey",
    text: "Tengo un propósito de vida claro que guía mis acciones, más allá de solo sobrevivir el día a día.",
  },
  {
    id: "radar_r5",
    archetype: "rey",
    text: "La gente suele acudir a mí en busca de consejo o dirección porque transmito seguridad y equilibrio.",
  },
  // Bloque 4: Mago
  {
    id: "radar_m1",
    archetype: "mago",
    text: 'Confío plenamente en mi "voz interna" o intuición para tomar decisiones difíciles.',
  },
  {
    id: "radar_m2",
    archetype: "mago",
    text: "Puedo ver el aprendizaje o la oportunidad oculta incluso en las experiencias más dolorosas de mi vida.",
  },
  {
    id: "radar_m3",
    archetype: "mago",
    text: "Me considero una persona capaz de reinventarse y cambiar de piel cuando una etapa de mi vida termina.",
  },
  {
    id: "radar_m4",
    archetype: "mago",
    text: "Dedico tiempo diario a la reflexión profunda, tratando de entender los mensajes de mi inconsciente.",
  },
  {
    id: "radar_m5",
    archetype: "mago",
    text: "Creo firmemente que tengo el poder de transformar mis pensamientos para cambiar mi estado de ánimo.",
  },
];

function scoreFromAnswers(answers: Array<ConziaArchetype | null>): Record<ConziaArchetype, number> {
  const res: Record<ConziaArchetype, number> = { guerrero: 0, rey: 0, amante: 0, mago: 0 };
  answers.forEach((a) => {
    if (a) res[a] += 1;
  });
  return res;
}

function pickTopTwo(score: Record<ConziaArchetype, number>): { top1: ConziaArchetype; top2: ConziaArchetype } {
  const sorted = (Object.keys(score) as ConziaArchetype[]).sort((a, b) => score[b] - score[a]);
  return { top1: sorted[0], top2: sorted[1] };
}

function computeRadarScores(answers: Record<string, Likert5 | undefined>): {
  pct: Record<ConziaArchetype, number>;
  dominant: ConziaArchetype;
  shadow: ConziaArchetype;
  perfectionMask: boolean;
} {
  const sums: Record<ConziaArchetype, number> = { guerrero: 0, rey: 0, amante: 0, mago: 0 };
  const counts: Record<ConziaArchetype, number> = { guerrero: 0, rey: 0, amante: 0, mago: 0 };

  RADAR_QUESTIONS.forEach((q) => {
    const val = answers[q.id];
    if (val !== undefined) {
      sums[q.archetype] += val;
      counts[q.archetype] += 1;
    }
  });

  const pct: Record<ConziaArchetype, number> = { guerrero: 0, rey: 0, amante: 0, mago: 0 };
  (Object.keys(sums) as ConziaArchetype[]).forEach((a) => {
    const max = counts[a] * 5;
    pct[a] = max > 0 ? Math.round((sums[a] / max) * 100) : 0;
  });

  const sorted = (Object.keys(pct) as ConziaArchetype[]).sort((a, b) => pct[b] - pct[a]);
  const dominant = sorted[0];
  const shadow = sorted[3];
  const perfectionMask = Object.values(pct).every((v) => v >= 95);

  return { pct, dominant, shadow, perfectionMask };
}

function guessTargetPerson(text: string): string {
  const norm = text.toLowerCase();
  if (norm.includes("jefe") || norm.includes("trabajo")) return "tu jefe";
  if (norm.includes("mama") || norm.includes("madre")) return "tu madre";
  if (norm.includes("papa") || norm.includes("padre")) return "tu padre";
  if (norm.includes("pareja") || norm.includes("novio") || norm.includes("novia") || norm.includes("esposo") || norm.includes("esposa"))
    return "tu pareja";
  return "esa persona";
}

function guessMask(text: string): string {
  const norm = text.toLowerCase();
  if (norm.includes("fuerte") || norm.includes("puedo con todo")) return "fortaleza inquebrantable";
  if (norm.includes("bueno") || norm.includes("amable")) return "bondad extrema";
  if (norm.includes("inteligente") || norm.includes("sabio")) return "intelectualismo";
  if (norm.includes("exito") || norm.includes("logro")) return "éxito y perfección";
  return "seguridad";
}

function positiveNeedForTrait(trait: string): string {
  const norm = trait.toLowerCase();
  if (norm.includes("ego") || norm.includes("prepotente")) return "autoafirmación";
  if (norm.includes("debil") || norm.includes("miedo")) return "vulnerabilidad";
  if (norm.includes("control")) return "fluidez";
  if (norm.includes("ira") || norm.includes("enojo")) return "fuerza vital";
  return "libertad";
}

function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/Mexico_City";
  }
}

function detectCountry(): string {
  const tz = detectTimeZone();
  if (tz.includes("Mexico")) return "MX";
  if (tz.includes("Argentina")) return "AR";
  if (tz.includes("Spain") || tz.includes("Madrid")) return "ES";
  if (tz.includes("Colombia")) return "CO";
  if (tz.includes("Chile")) return "CL";
  return "MX";
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export default function RegistroPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, dispatch } = useConzia();

  const canReset = import.meta.env.DEV || params.get("reset") === "1";
  const registrationDone = Boolean(state.profile?.registrationDone);
  const diagnosisDone = Boolean(state.profile?.radar_completed_at);
  const phase2Ready = registrationDone && diagnosisDone;

  if (phase2Ready && !canReset) {
    return <Navigate to="/sesion" replace />;
  }

  if (phase2Ready && canReset) {
    return (
      <div className="min-h-[100svh] px-6 pb-10 pt-14">
        <div className="text-white">
          <div className="text-[26px] font-semibold tracking-tight">Registro</div>
          <div className="mt-2 text-sm text-white/65">Completado.</div>
        </div>

        <Card className="mt-7 p-6">
          <div className="text-sm font-semibold tracking-tight">Reset (dev)</div>
          <div className="mt-2 text-sm text-outer-space/70">
            Esto borra perfil/proceso/sesiones/entradas de Fase 1–2 en este dispositivo.
          </div>
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => navigate("/sesion")} type="button">
              Volver
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                dispatch({ type: "reset_phase1" });
                navigate("/registro", { replace: true });
              }}
              type="button"
            >
              Resetear
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const [step, setStep] = useState<StepId>("r1");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [tz, setTz] = useState(() => detectTimeZone());
  const [country, setCountry] = useState(() => detectCountry());

  const [temaBase, setTemaBase] = useState<ConziaFriccion>(THEMES[0]?.id ?? "limites");
  const [costoDominante, setCostoDominante] = useState<string>(COSTS[0]?.id ?? "");

  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Array<ConziaArchetype | null>>(() => QUESTIONS.map(() => null));
  const score = useMemo(() => scoreFromAnswers(answers), [answers]);
  const { top1, top2 } = useMemo(() => pickTopTwo(score), [score]);
  const confianza = useMemo(() => Math.max(0, score[top1] - score[top2]), [score, top1, top2]);
  const estilo = useMemo<ConziaDrivingStyle>(() => {
    return ARCHETYPES.find((a) => a.id === top1)?.style ?? "Sobrio";
  }, [top1]);

  const currentQuestion = QUESTIONS[qIdx];
  const canContinueR1 =
    alias.trim().length >= 2 &&
    email.trim().length >= 3 &&
    tz.trim().length >= 3 &&
    country.trim().length >= 2 &&
    password.length >= 6;

  const canContinueR2 = Boolean(temaBase) && Boolean(costoDominante);
  const allAnswered = answers.every(Boolean);

  // Radar 4 pilares
  const [radarIdx, setRadarIdx] = useState(0);
  const [radarAnswers, setRadarAnswers] = useState<Record<string, Likert5 | undefined>>({});
  const radar = useMemo(() => computeRadarScores(radarAnswers), [radarAnswers]);
  const radarCurrent = RADAR_QUESTIONS[radarIdx] ?? null;
  const radarProgressPct = Math.round(((radarIdx + 1) / RADAR_QUESTIONS.length) * 100);
  const radarCanAdvance = radarCurrent ? radarAnswers[radarCurrent.id] !== undefined : false;

  // Proyección de sombra
  const [rechazoText, setRechazoText] = useState("");
  const [envidiaText, setEnvidiaText] = useState("");
  const [juicioText, setJuicioText] = useState("");
  const [shadowTraits, setShadowTraits] = useState<ConziaShadowTrait[] | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const canSendProjection =
    rechazoText.trim().length >= 80 && envidiaText.trim().length >= 80 && juicioText.trim().length >= 80;

  const targetPerson = useMemo(() => guessTargetPerson(rechazoText), [rechazoText]);
  const userMask = useMemo(() => guessMask(juicioText), [juicioText]);

  const perfectionTrait: ConziaShadowTrait | null = radar.perfectionMask
    ? { trait: "Máscara de perfección", origin_probable: "Test perfecto (25/25 en todo)", status: "detected" }
    : null;

  const revelation = useMemo(() => {
    if (!shadowTraits) return "";
    const trait = shadowTraits[0]?.trait ?? "algo que no has querido nombrar";
    const need = positiveNeedForTrait(trait);
    const weak = ARCH_LABEL[radar.shadow];
    const strong = ARCH_LABEL[radar.dominant];
    const aliasName = alias.trim() || "—";

    const p1 =
      `Te he escuchado, ${aliasName}. He analizado no solo tus palabras, sino el silencio entre ellas. ` +
      `Lo que llamas 'odio' hacia ${targetPerson} no es más que el grito de una parte de ti que has mantenido encadenada ` +
      "en el sótano de tu mente para poder encajar en el mundo.";

    const p2 =
      `Tu ${strong} ha tenido que sostenerte para sobrevivir. Pero tu ${weak} está debilitado, y por eso repites ` +
      `el mismo punto ciego. Has construido una máscara de ${userMask} tan pesada que has olvidado el rostro que hay debajo.`;

    const p3 =
      `Ese "${trait}" que tanto detestas en los demás es, en realidad, tu propia necesidad de ${need} reprimida. ` +
      "Tu sombra no es tu enemiga; es el combustible que te falta para sentirte completo.";

    const p4 =
      "Hoy comienza tu proceso de 90 días. No será cómodo, porque la luz duele cuando has estado en la oscuridad, " +
      "pero al final no tendrás que volver a fingir. ¿Estás listo para dejar de huir de ti mismo?";

    const extra = radar.perfectionMask
      ? "\n\nY una cosa más: tu test salió perfecto. Eso suele ser una máscara. Lo vamos a mirar en el primer desahogo."
      : "";

    return `${p1}\n\n${p2}\n\n${p3}\n\n${p4}${extra}`;
  }, [alias, radar.dominant, radar.perfectionMask, radar.shadow, shadowTraits, targetPerson, userMask]);

  const typed = useTypewriter({ text: revelation, enabled: step === "revelacion" });

  const projectionDraftKey = useMemo(() => {
    return `conzia_draft_proyeccion_${normalize(alias || "anon")}`;
  }, [alias]);

  const projectionLoadedRef = useRef(false);
  useEffect(() => {
    if (step !== "proyeccion") return;
    if (projectionLoadedRef.current) return;
    projectionLoadedRef.current = true;
    try {
      const raw = localStorage.getItem(projectionDraftKey);
      if (!raw) return;
      const parsedUnknown = JSON.parse(raw) as unknown;
      if (!parsedUnknown || typeof parsedUnknown !== "object") return;
      const parsed = parsedUnknown as Record<string, unknown>;
      if (typeof parsed.rechazoText === "string") setRechazoText(parsed.rechazoText);
      if (typeof parsed.envidiaText === "string") setEnvidiaText(parsed.envidiaText);
      if (typeof parsed.juicioText === "string") setJuicioText(parsed.juicioText);
    } catch {
      // ignore
    }
  }, [projectionDraftKey, step]);

  useEffect(() => {
    if (step !== "proyeccion") return;
    try {
      localStorage.setItem(
        projectionDraftKey,
        JSON.stringify({ rechazoText, envidiaText, juicioText }),
      );
    } catch {
      // ignore
    }
  }, [envidiaText, juicioText, projectionDraftKey, rechazoText, step]);

  function clearProjectionDraft() {
    try {
      localStorage.removeItem(projectionDraftKey);
    } catch {
      // ignore
    }
  }

  async function runProjectionAnalysis() {
    if (aiBusy) return;
    if (!canSendProjection) return;
    setAiBusy(true);
    setAiStatus("Tu analista está trazando el mapa de tu inconsciente…");
    try {
      const traits = await extractShadowTraits({
        rechazo: rechazoText.trim(),
        envidia: envidiaText.trim(),
        juicio: juicioText.trim(),
      });
      const merged = [
        ...(perfectionTrait ? [perfectionTrait] : []),
        ...traits,
      ].slice(0, 10);
      setShadowTraits(merged);
      clearProjectionDraft();
      setAiStatus(null);
      setStep("revelacion");
    } finally {
      setAiBusy(false);
    }
  }

  function finishAndEnter() {
    const nowISO = new Date().toISOString();

    const profile: ConziaProfile = {
      alias: alias.trim(),
      email: email.trim(),
      tz: tz.trim(),
      country: country.trim().toUpperCase(),
      tema_base: temaBase,
      costo_dominante: costoDominante,
      arquetipo_dominante: top1,
      arquetipo_secundario: top2,
      confianza,
      estilo_conduccion: estilo,
      archetype_scores: radar.pct,
      dominant_archetype: radar.dominant,
      shadow_archetype: radar.shadow,
      shadow_traits: shadowTraits ?? (perfectionTrait ? [perfectionTrait] : []),
      shadow_mirror_text: [rechazoText.trim(), envidiaText.trim(), juicioText.trim()].filter(Boolean).join("\n\n"),
      radar_completed_at: nowISO,
      registrationDone: true,
    };

    const processId = createId("proc");
    dispatch({ type: "set_profile", profile });
    dispatch({
      type: "add_process",
      process: {
        id: processId,
        tema_activo: temaBase,
        day_index: 1,
        status: "open",
        started_at: nowISO,
      },
    });
    dispatch({ type: "set_active_process", processId });

    navigate("/resultados", { replace: true });
  }

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14">
      <div className="text-white">
        <div className="text-[26px] font-semibold tracking-tight">Registro</div>
        <div className="mt-2 text-sm text-white/65">No es técnico. Es clínico-operativo.</div>
      </div>

      {step === "r1" ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">R1 · Cuenta</div>
          <div className="mt-2 text-sm text-outer-space/70">
            Email, contraseña, alias y contexto. No se guarda la contraseña en este dispositivo.
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="text-xs font-medium text-outer-space/70">Email</div>
              <Input className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
            </div>
            <div>
              <div className="text-xs font-medium text-outer-space/70">Contraseña</div>
              <Input
                className="mt-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 6 caracteres"
                type="password"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-outer-space/70">Nombre / alias</div>
              <Input className="mt-2" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Cómo te llamo aquí" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="text-xs font-medium text-outer-space/70">Zona horaria</div>
                <Input className="mt-2" value={tz} onChange={(e) => setTz(e.target.value)} placeholder="America/Mexico_City" />
              </div>
              <div>
                <div className="text-xs font-medium text-outer-space/70">País</div>
                <Input className="mt-2" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="MX" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => navigate("/onboarding")} type="button">
              Volver
            </Button>
            <Button variant="primary" disabled={!canContinueR1} onClick={() => setStep("r2")} type="button">
              Continuar
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "r2" ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">R2 · Mapa de fricción</div>
          <div className="mt-2 text-sm text-outer-space/70">Dos decisiones. Rápido.</div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="text-sm font-semibold tracking-tight text-outer-space">Hoy lo que más se me repite es…</div>
              <Select className="mt-2" value={temaBase} onChange={(e) => setTemaBase(e.target.value as ConziaFriccion)}>
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-outer-space">El costo típico de esto es…</div>
              <Select className="mt-2" value={costoDominante} onChange={(e) => setCostoDominante(e.target.value)}>
                {COSTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep("r1")} type="button">
              Atrás
            </Button>
            <Button variant="primary" disabled={!canContinueR2} onClick={() => setStep("r3")} type="button">
              Continuar
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "r3" ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">R3 · Arquetipo operativo</div>
          <div className="mt-2 text-sm text-outer-space/70">
            12 preguntas. 1 respuesta por pregunta. Sin justificar.
          </div>

          <div className="mt-6">
            <div className="text-xs text-outer-space/60">
              Pregunta {qIdx + 1} de {QUESTIONS.length}
            </div>
            <div className="mt-2 text-base font-semibold tracking-tight text-outer-space">{currentQuestion?.prompt}</div>
          </div>

          <div className="mt-5 space-y-2">
            {currentQuestion?.options.map((opt) => {
              const isActive = answers[qIdx] === opt.archetype;
              return (
                <button
                  key={opt.archetype}
                  type="button"
                  onClick={() => {
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[qIdx] = opt.archetype;
                      return next;
                    });
                  }}
                  className={
                    isActive
                      ? "w-full rounded-xl bg-outer-space px-4 py-3 text-left text-sm text-white"
                      : "w-full rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-3 text-left text-sm text-outer-space/80 hover:bg-mint-cream"
                  }
                  aria-pressed={isActive}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              onClick={() => {
                if (qIdx <= 0) {
                  setStep("r2");
                  return;
                }
                setQIdx((v) => Math.max(0, v - 1));
              }}
              type="button"
            >
              Anterior
            </Button>
            <Button
              variant="primary"
              disabled={!answers[qIdx]}
              onClick={() => {
                if (qIdx + 1 >= QUESTIONS.length) {
                  setStep("resumen");
                  return;
                }
                setQIdx((v) => Math.min(QUESTIONS.length - 1, v + 1));
              }}
              type="button"
            >
              Siguiente
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "resumen" ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Resultado (operativo)</div>
          <div className="mt-2 text-sm text-outer-space/70">Esto no es etiqueta. Es conducción.</div>

          <div className="mt-6 rounded-2xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-5 py-4">
            <div className="text-xs text-morning-blue">Tu estilo de conducción inicial será:</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-outer-space">{estilo}</div>
            <div className="mt-3 text-xs text-outer-space/60">Confianza: {confianza}</div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep("r3")} type="button">
              Volver
            </Button>
            <Button
              variant="primary"
              disabled={!allAnswered}
              onClick={() => {
                setRadarIdx(0);
                setRadarAnswers({});
                setStep("radar");
              }}
              type="button"
            >
              Continuar al Espejo Inicial
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "radar" ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Diagnóstico · Radar 4 Pilares</div>
          <div className="mt-2 text-sm text-outer-space/70">
            Califica cada frase del 1 al 5 (1 = Nunca / 5 = Siempre).
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-outer-space/60">
                Ítem {radarIdx + 1} de {RADAR_QUESTIONS.length} · {ARCH_LABEL[radarCurrent?.archetype ?? "guerrero"]}
              </div>
              <div className="text-xs text-outer-space/60">{radarProgressPct}%</div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-gainsboro/70 overflow-hidden">
              <div className="h-full bg-camel" style={{ width: `${radarProgressPct}%` }} />
            </div>
            <div className="mt-5 text-base font-semibold tracking-tight text-outer-space">{radarCurrent?.text}</div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2">
            {LIKERT5.map((opt) => {
              const current = radarCurrent ? radarAnswers[radarCurrent.id] : undefined;
              const active = current === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (!radarCurrent) return;
                    setRadarAnswers((prev) => ({ ...prev, [radarCurrent.id]: opt.value }));
                  }}
                  className={
                    active
                      ? "rounded-xl bg-outer-space px-4 py-3 text-left text-sm text-white"
                      : "rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-3 text-left text-sm text-outer-space/80 hover:bg-mint-cream"
                  }
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-2">
            <Button
              onClick={() => {
                if (radarIdx <= 0) {
                  setStep("resumen");
                  return;
                }
                setRadarIdx((v) => Math.max(0, v - 1));
              }}
              type="button"
            >
              Anterior
            </Button>
            {radarIdx < RADAR_QUESTIONS.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setRadarIdx((v) => Math.min(RADAR_QUESTIONS.length - 1, v + 1))}
                disabled={!radarCanAdvance}
                type="button"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setStep("proyeccion")}
                disabled={!radarCanAdvance}
                type="button"
              >
                Continuar
              </Button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {(["guerrero", "amante", "rey", "mago"] as ConziaArchetype[]).map((a) => (
              <div key={a} className="rounded-2xl bg-white ring-1 ring-gainsboro/60 px-4 py-3">
                <div className="text-xs text-outer-space/60">{ARCH_LABEL[a]}</div>
                <div className="mt-1 text-sm font-semibold tracking-tight text-outer-space">{Math.round(radar.pct[a])}%</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {step === "proyeccion" ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Diagnóstico · Proyección de sombra</div>
          <div className="mt-3 text-sm text-outer-space/75 leading-relaxed">
            Este espacio es un santuario de honestidad radical. Nadie te juzgará aquí. Para encontrar tu sombra, debemos
            mirar hacia afuera, hacia aquello que te irrita en los demás, pues ahí reside lo que has ocultado de ti
            mismo.
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="text-sm font-semibold tracking-tight text-outer-space">Pregunta 1: El Espejo del Rechazo</div>
              <div className="mt-2 text-sm text-outer-space/70">
                Piensa en alguien que te genere un rechazo profundo o una irritación inmediata (un familiar, jefe,
                político o conocido). Describe detalladamente qué es lo que más te molesta de su forma de ser. ¿Qué hace
                o dice que te resulta insoportable?
              </div>
              <Textarea
                className="mt-3 min-h-[160px]"
                value={rechazoText}
                onChange={(e) => setRechazoText(e.target.value)}
                placeholder="Escribe aquí (mínimo 80 caracteres)."
              />
            </div>

            <div>
              <div className="text-sm font-semibold tracking-tight text-outer-space">Pregunta 2: El Espejo de la Envidia</div>
              <div className="mt-2 text-sm text-outer-space/70">
                Ahora piensa en alguien a quien admires tanto que te haga sentir 'pequeño' o alguien de quien sientas
                envidia en secreto. ¿Qué tiene esa persona que tú sientes que nunca podrías tener o ser?
              </div>
              <Textarea
                className="mt-3 min-h-[160px]"
                value={envidiaText}
                onChange={(e) => setEnvidiaText(e.target.value)}
                placeholder="Escribe aquí (mínimo 80 caracteres)."
              />
            </div>

            <div>
              <div className="text-sm font-semibold tracking-tight text-outer-space">Pregunta 3: El Juicio Social</div>
              <div className="mt-2 text-sm text-outer-space/70">
                ¿Qué es aquello que más te esfuerzas por ocultar de los demás para que no piensen mal de ti? ¿Cuál es
                esa 'máscara' que te pones cada mañana al salir de casa?
              </div>
              <Textarea
                className="mt-3 min-h-[160px]"
                value={juicioText}
                onChange={(e) => setJuicioText(e.target.value)}
                placeholder="Escribe aquí (mínimo 80 caracteres)."
              />
            </div>
          </div>

          {aiStatus ? <div className="mt-4 text-sm text-outer-space/70">{aiStatus}</div> : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep("radar")} type="button">
              Atrás
            </Button>
            <Button variant="primary" disabled={!canSendProjection || aiBusy} onClick={runProjectionAnalysis} type="button">
              {aiBusy ? "Analizando…" : "Entregar al analista"}
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "revelacion" ? (
        <div className="mt-7 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] text-white">
          <div className="text-[11px] tracking-[0.18em] text-white/55">DIAGNÓSTICO DE REVELACIÓN</div>
          <div className="mt-4 text-sm leading-relaxed whitespace-pre-line">{typed.out}</div>

          <div className="mt-7 flex flex-col gap-2">
            <button
              type="button"
              onClick={finishAndEnter}
              className="w-full rounded-2xl bg-camel px-5 py-4 text-center text-sm font-semibold tracking-wide text-white ring-1 ring-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:brightness-[0.98] active:scale-[0.99]"
            >
              ACEPTO MI SOMBRA
            </button>
            <Button onClick={() => setStep("proyeccion")} type="button">
              Volver
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
