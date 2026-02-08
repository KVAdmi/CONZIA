import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MiniSparkline from "../components/charts/MiniSparkline";
import Sparkline from "../components/charts/Sparkline";
import StackedBarChart, { type BarDatum } from "../components/charts/StackedBarChart";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Chip from "../components/ui/Chip";
import Collapsible from "../components/ui/Collapsible";
import { FieldHint, FieldLabel } from "../components/ui/Field";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import ProgressRing from "../components/ui/ProgressRing";
import Range from "../components/ui/Range";
import SegmentedControl from "../components/ui/SegmentedControl";
import Select from "../components/ui/Select";
import Sheet from "../components/ui/Sheet";
import Textarea from "../components/ui/Textarea";
import { QUICK_TOOLS, type QuickTool } from "../content/tools";
import { TESTS } from "../content/tests";
import { generateAlerts } from "../services/ai";
import { useSubscription } from "../state/subscriptionStore";
import { useXmi } from "../state/xmiStore";
import type {
  CheckIn,
  ClarityLevel,
  EnergyLevel,
  EntryType,
  Intention,
  IntentionBlock,
  IntentionOutcome,
  IntentionType,
} from "../types/models";
import { addDays, formatDateLongEsMX, parseISODate, toISODateOnly } from "../utils/dates";
import { createId } from "../utils/id";

const LAYERS: Array<{ type: EntryType; label: string; hint: string }> = [
  { type: "desahogo_libre", label: "Desahogo libre", hint: "Lo que salga. Sin explicación." },
  { type: "algo_me_incomodo", label: "Algo me incomodó", hint: "Evidencia + reacción. Sin maquillar." },
  { type: "queria_hacer_algo_distinto", label: "Quería hacer algo distinto", hint: "Intención vs realidad." },
  { type: "hoy_si_lo_hice", label: "Hoy sí lo hice", hint: "Hecho. Sin aplauso." },
  { type: "no_quise_ver_esto", label: "No quise ver esto", hint: "Una línea sin justificar." },
];

const INTENTIONS: IntentionType[] = [
  "Poner un límite",
  "Decir que no",
  "No justificarme",
  "Pedir lo que necesito",
  "No ceder",
  "No controlar",
  "No perseguir",
  "Hablar claro",
  "Priorizarme",
];

const BLOCKS: IntentionBlock[] = ["miedo", "culpa", "costumbre", "presion", "apego", "confusion"];

type Trend = "up" | "down" | "flat";
type IndicatorKind = "positive" | "neutral" | "negative";
type Indicator = {
  id: string;
  title: string;
  kind: IndicatorKind;
  values30d: number[];
  hint: string;
};

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function trendFrom(values30d: number[]): Trend {
  const v = values30d.slice(-30);
  const last7 = avg(v.slice(-7));
  const prev7 = avg(v.slice(-14, -7));
  const diff = last7 - prev7;
  if (diff > 0.7) return "up";
  if (diff < -0.7) return "down";
  return "flat";
}

function arrow(t: Trend): string {
  if (t === "up") return "↑";
  if (t === "down") return "↓";
  return "→";
}

function labelForTrend(params: { trend: Trend; kind: IndicatorKind }): string {
  if (params.trend === "flat") return "estable";
  if (params.kind === "negative") return params.trend === "up" ? "más activo" : "cede";
  return params.trend === "up" ? "sube" : "baja";
}

function scoreFromClarity(c?: CheckIn["clarity"]): number {
  if (!c) return 0;
  if (c === "nublado") return 2;
  if (c === "medio") return 6;
  return 9;
}

function scoreFromIntentionOutcome(i?: Intention): number {
  if (!i?.outcome) return 0;
  if (i.outcome === "lo_hice") return 9;
  if (i.outcome === "a_medias") return 5;
  return 2;
}

function scoreAvoidance(entries: { type: EntryType; repeatSignal?: "no" | "creo_que_si" | "si"; silenceMode?: boolean }[]): number {
  if (entries.length === 0) return 0;
  const blind = entries.filter((e) => e.type === "no_quise_ver_esto").length;
  const repeat = entries.filter((e) => e.repeatSignal === "si").length;
  const silence = entries.filter((e) => e.silenceMode).length;
  const t = clamp01((blind * 1.0 + repeat * 0.6 + silence * 0.4) / Math.max(1, entries.length));
  return Math.round((2 + t * 8) * 10) / 10;
}

function nextStepForLayer(layer: EntryType): { label: string; kind: "nav" | "intention"; to?: string } {
  if (layer === "desahogo_libre" || layer === "no_quise_ver_esto") {
    return { label: "Ir a Escribir (silencio)", kind: "nav", to: `/escribir?silencio=1&layer=${encodeURIComponent(layer)}` };
  }
  if (layer === "algo_me_incomodo") {
    return { label: "Registrar evidencia", kind: "nav", to: `/escribir?layer=${encodeURIComponent(layer)}` };
  }
  return { label: "Cerrar intención", kind: "intention" };
}

function layerTitle(layer: EntryType): string {
  return LAYERS.find((l) => l.type === layer)?.label ?? layer;
}

function featuredTestIdFor(date: Date): string | null {
  if (TESTS.length === 0) return null;
  const idx = (date.getFullYear() * 12 + date.getMonth()) % TESTS.length;
  return TESTS[idx]?.id ?? null;
}

export default function HoyPage() {
  const { state, dispatch } = useXmi();
  const sub = useSubscription();
  const navigate = useNavigate();
  const todayISO = toISODateOnly(new Date());

  const todayCheckIn = state.checkIns.find((c) => c.date === todayISO);
  const savedLayer = todayCheckIn?.honestyLayer;

  const [selectedLayer, setSelectedLayer] = useState<EntryType>(savedLayer ?? "algo_me_incomodo");
  const [status, setStatus] = useState<string | null>(null);

  const [ritualOpen, setRitualOpen] = useState(false);
  const [pulseOpen, setPulseOpen] = useState(false);
  const [intentionOpen, setIntentionOpen] = useState(false);

  const [dominantTags, setDominantTags] = useState<string[]>(todayCheckIn?.dominantTags ?? []);
  const [energy, setEnergy] = useState<EnergyLevel>(todayCheckIn?.energy ?? "media");
  const [emotionalWeight, setEmotionalWeight] = useState<number>(
    typeof todayCheckIn?.emotionalWeight === "number" ? todayCheckIn.emotionalWeight : 6,
  );
  const [clarity, setClarity] = useState<ClarityLevel>(todayCheckIn?.clarity ?? "medio");

  const todayIntention = useMemo(() => {
    return state.intentions
      .filter((i) => i.date === todayISO)
      .sort((a, b) => (a.id < b.id ? 1 : -1))[0];
  }, [state.intentions, todayISO]);

  const sessionProgress = useMemo(() => {
    const hasCheckIn = Boolean(todayCheckIn);
    const hasEvidence = state.entries.some((e) => e.date === todayISO && e.text.trim().length >= 3);
    const hasClosure = Boolean(todayIntention?.outcome);
    const done = [hasCheckIn, hasEvidence, hasClosure].filter(Boolean).length;
    return { done, total: 3, value: done / 3 };
  }, [state.entries, todayCheckIn, todayIntention?.outcome, todayISO]);

  const [intentionType, setIntentionType] = useState<IntentionType>(
    todayIntention?.intentionType ?? "Poner un límite",
  );
  const [closureOutcome, setClosureOutcome] = useState<IntentionOutcome>("a_medias");
  const [closureBlock, setClosureBlock] = useState<IntentionBlock>("miedo");
  const [closureNote, setClosureNote] = useState("");

  const intentionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(null), 2200);
    return () => window.clearTimeout(t);
  }, [status]);

  useEffect(() => {
    if (!intentionOpen) return;
    intentionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [intentionOpen]);

  const alerts = useMemo(() => {
    return generateAlerts({
      todayISO,
      entries: state.entries,
      intentions: state.intentions,
      patterns: state.patterns,
      checkIns: state.checkIns,
    });
  }, [state.checkIns, state.entries, state.intentions, state.patterns, todayISO]);

  const dominantPattern = useMemo(() => {
    return [...state.patterns].sort((a, b) => b.frequency30d - a.frequency30d)[0];
  }, [state.patterns]);

  const last7Days = useMemo(() => {
    const base = parseISODate(todayISO);
    return Array.from({ length: 7 }, (_, idx) => {
      const date = addDays(base, -6 + idx);
      return toISODateOnly(date);
    });
  }, [todayISO]);

  const emotionalSeries = useMemo(() => {
    return last7Days.map((d) => {
      const checkIn = state.checkIns.find((c) => c.date === d);
      const valueFromCheckIn = checkIn?.emotionalWeight;
      const entries = state.entries.filter((e) => e.date === d);
      const valueFromEntries =
        entries.length === 0
          ? 0
          : Math.round((entries.reduce((acc, e) => acc + e.emotionalWeight, 0) / entries.length) * 10) / 10;

      const value = typeof valueFromCheckIn === "number" ? valueFromCheckIn : valueFromEntries;

      const label = new Intl.DateTimeFormat("es-MX", { weekday: "short" })
        .format(parseISODate(d))
        .replace(".", "");

      return { label, value };
    });
  }, [last7Days, state.checkIns, state.entries]);

  const last14Days = useMemo(() => {
    const base = parseISODate(todayISO);
    return Array.from({ length: 14 }, (_, idx) => toISODateOnly(addDays(base, -13 + idx)));
  }, [todayISO]);

  const density14 = useMemo(() => {
    return last14Days.map((d) => {
      const checkIn = state.checkIns.find((c) => c.date === d);
      const valueFromCheckIn = checkIn?.emotionalWeight;
      const entries = state.entries.filter((e) => e.date === d);
      const valueFromEntries =
        entries.length === 0
          ? 0
          : Math.round((entries.reduce((acc, e) => acc + e.emotionalWeight, 0) / entries.length) * 10) / 10;
      const value = typeof valueFromCheckIn === "number" ? valueFromCheckIn : valueFromEntries;
      return { value };
    });
  }, [last14Days, state.checkIns, state.entries]);

  const intentionBars = useMemo<BarDatum[]>(() => {
    return last7Days.map((d) => {
      const intents = state.intentions.filter((i) => i.date === d);
      const done = intents.filter((i) => i.outcome === "lo_hice").length;
      const partial = intents.filter((i) => i.outcome === "a_medias").length;
      const notDone = intents.filter((i) => i.outcome === "no_lo_hice").length;
      const label = new Intl.DateTimeFormat("es-MX", { weekday: "short" })
        .format(parseISODate(d))
        .replace(".", "");
      return { label, done, partial, notDone };
    });
  }, [last7Days, state.intentions]);

  const last30Days = useMemo(() => {
    const base = parseISODate(todayISO);
    return Array.from({ length: 30 }, (_, idx) => toISODateOnly(addDays(base, -29 + idx)));
  }, [todayISO]);

  const indicators = useMemo<Indicator[]>(() => {
    const clarity30 = last30Days.map((d) => scoreFromClarity(state.checkIns.find((c) => c.date === d)?.clarity));
    const decirNo30 = last30Days.map((d) => {
      const i = state.intentions.find((x) => x.date === d && x.intentionType === "Decir que no");
      return scoreFromIntentionOutcome(i);
    });
    const avoidance30 = last30Days.map((d) => scoreAvoidance(state.entries.filter((e) => e.date === d)));

    return [
      {
        id: "decir_no",
        title: "Decir NO",
        kind: "positive",
        values30d: decirNo30,
        hint: "Basado en intención + cierre.",
      },
      {
        id: "claridad",
        title: "Claridad",
        kind: "neutral",
        values30d: clarity30,
        hint: "Basado en ritual (check-in).",
      },
      {
        id: "evitacion",
        title: "Evitación",
        kind: "negative",
        values30d: avoidance30,
        hint: "Basado en ‘No quise ver esto’, repetición y silencio.",
      },
    ];
  }, [last30Days, state.checkIns, state.entries, state.intentions]);

  const todaySummary = useMemo(() => {
    const entries = state.entries.filter((e) => e.date === todayISO);
    const checkIn = state.checkIns.find((c) => c.date === todayISO);
    const intention = state.intentions.filter((i) => i.date === todayISO).sort((a, b) => (a.id < b.id ? 1 : -1))[0];

    const hasSilence = entries.some((e) => e.silenceMode);
    const didBoundary = entries.some((e) => e.reaction === "puse_limite" || e.reaction === "pedi");

    if (intention?.outcome === "lo_hice") return `Movimiento: ${intention.intentionType}.`;
    if (didBoundary) return "Movimiento: sostuviste un límite (evidencia en registros).";
    if (hasSilence) return "Sesión en silencio: guardaste sin lectura inmediata.";

    const weight =
      typeof checkIn?.emotionalWeight === "number"
        ? checkIn.emotionalWeight
        : entries.length
          ? Math.round(avg(entries.map((e) => e.emotionalWeight)) * 10) / 10
          : 0;
    const clarity = checkIn?.clarity;
    if (weight >= 8 && clarity === "nublado") return "Día pesado: carga alta, claridad nublada.";
    if (entries.length > 0) return `Evidencia registrada: ${entries.length} evento(s).`;
    if (checkIn) return "Ritual mínimo: check-in sin evidencia.";
    return "Aún no hay registro. Si algo pasa hoy, nómbralo sin adornarlo.";
  }, [state.checkIns, state.entries, state.intentions, todayISO]);

  const weekCounters = useMemo(() => {
    const counters = { movement: 0, silence: 0, heavy: 0, evidence: 0 };
    for (const d of last7Days) {
      const entries = state.entries.filter((e) => e.date === d);
      const checkIn = state.checkIns.find((c) => c.date === d);
      const intention = state.intentions.filter((i) => i.date === d).sort((a, b) => (a.id < b.id ? 1 : -1))[0];

      const hasSilence = entries.some((e) => e.silenceMode);
      const didBoundary = entries.some((e) => e.reaction === "puse_limite" || e.reaction === "pedi");
      const didMovement = intention?.outcome === "lo_hice" || didBoundary;

      const weight =
        typeof checkIn?.emotionalWeight === "number"
          ? checkIn.emotionalWeight
          : entries.length
            ? avg(entries.map((e) => e.emotionalWeight))
            : 0;
      const heavy = weight >= 8 && checkIn?.clarity === "nublado";

      if (entries.length) counters.evidence += 1;
      if (didMovement) counters.movement += 1;
      if (hasSilence) counters.silence += 1;
      if (heavy) counters.heavy += 1;
    }
    return counters;
  }, [last7Days, state.checkIns, state.entries, state.intentions]);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of state.entries) {
      for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, [state.entries]);

  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  const filteredTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return tagOptions.slice(0, 24);
    return tagOptions.filter((t) => t.toLowerCase().includes(q)).slice(0, 40);
  }, [tagOptions, tagSearch]);

  function toggleDominantTag(tag: string) {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;
    setDominantTags((prev) => {
      if (prev.includes(clean)) return prev.filter((t) => t !== clean);
      if (prev.length >= 3) return prev;
      return [...prev, clean];
    });
  }

  function save() {
    const checkIn: CheckIn = {
      id: todayCheckIn?.id ?? createId("ci"),
      date: todayISO,
      honestyLayer: selectedLayer,
      dominantTags: dominantTags.slice(0, 3),
      energy,
      emotionalWeight,
      clarity,
    };
    dispatch({ type: "upsert_checkin", checkIn });
    setStatus("Guardado.");
  }

  function registerIntention() {
    const intention: Intention = {
      id: createId("i"),
      date: todayISO,
      intentionType,
    };
    dispatch({ type: "add_intention", intention });
    setStatus("Intención registrada.");
  }

  function saveIntentionClosure() {
    if (!todayIntention) return;
    dispatch({
      type: "upsert_intention",
      intention: {
        ...todayIntention,
        outcome: closureOutcome,
        block: closureOutcome === "lo_hice" ? undefined : closureBlock,
        note: closureNote.trim() ? closureNote.trim() : undefined,
      },
    });
    setStatus("Cierre guardado.");
  }

  const nextStep = savedLayer ? nextStepForLayer(savedLayer) : null;
  const alert = alerts[0];

  const [interventionsOpen, setInterventionsOpen] = useState(false);
  const [toolOpen, setToolOpen] = useState<QuickTool | null>(null);
  const [crisisOpen, setCrisisOpen] = useState(false);

  const featuredTest = useMemo(() => {
    const id = featuredTestIdFor(new Date());
    return id ? TESTS.find((t) => t.id === id) ?? null : null;
  }, []);

  const primaryCta = useMemo(() => {
    if (!nextStep) {
      return { label: "Escribir ahora", onClick: () => navigate("/descarga") };
    }
    if (nextStep.kind === "nav" && nextStep.to) {
      return { label: `Continuar: ${nextStep.label}`, onClick: () => navigate(nextStep.to!) };
    }
    return {
      label: "Continuar: Cerrar intención",
      onClick: () => {
        setRitualOpen(true);
        setIntentionOpen(true);
      },
    };
  }, [navigate, nextStep]);

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-morning-blue">Hoy</div>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-outer-space font-serif">
                Estado del proceso
              </h2>
              <p className="mt-1 text-sm text-outer-space/70">
                Amoroso, directo, sin ser cómplice.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="hidden sm:block">
                <ProgressRing
                  label="Sesión de hoy"
                  sublabel={`${sessionProgress.done}/${sessionProgress.total} pasos`}
                  value={sessionProgress.value}
                />
              </div>
              <div className="text-right">
                <div className="text-xs text-morning-blue">{formatDateLongEsMX(todayISO)}</div>
                <div className="mt-1 text-xs text-outer-space/60">{status ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 text-lg text-outer-space/90 leading-relaxed">
            {todaySummary}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="primary" onClick={primaryCta.onClick}>
                  {primaryCta.label}
                </Button>
                <Button onClick={() => navigate("/archivo")}>Ver archivo</Button>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button variant="quiet" onClick={() => setInterventionsOpen(true)}>
                  Intervenciones
                </Button>
                <Button variant="quiet" onClick={() => setRitualOpen(true)}>
                  Abrir ritual
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {alert ? (
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-morning-blue">Alerta viva</div>
                <div className="mt-1 text-sm font-semibold tracking-tight text-outer-space">{alert.title}</div>
                <div className="mt-1 text-sm text-outer-space/70">{alert.detail}</div>
              </div>
              <Button variant="primary" onClick={() => navigate(alert.ctaTo)}>
                {alert.ctaLabel}
              </Button>
            </div>
          </Card>
        ) : null}

        {featuredTest ? (
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-morning-blue">Test del mes</div>
                <div className="mt-1 text-sm font-semibold tracking-tight text-outer-space">{featuredTest.title}</div>
                <div className="mt-1 text-sm text-outer-space/70">
                  Nuevo cada mes. No etiqueta: ubica tu patrón para hacer mejor preguntas.
                </div>
              </div>
              <Button variant="primary" onClick={() => navigate(`/tests?testId=${encodeURIComponent(featuredTest.id)}`)}>
                Tomar test
              </Button>
            </div>
          </Card>
        ) : null}

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Resumen</h3>
              <p className="mt-1 text-sm text-outer-space/70">
                No es desempeño. Es rastro.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-5 py-5">
              <div className="text-xs text-morning-blue">Semana (7d)</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{weekCounters.movement}</div>
                  <div className="text-xs text-outer-space/60">movimiento</div>
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{weekCounters.evidence}</div>
                  <div className="text-xs text-outer-space/60">días con evidencia</div>
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{weekCounters.silence}</div>
                  <div className="text-xs text-outer-space/60">silencio</div>
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{weekCounters.heavy}</div>
                  <div className="text-xs text-outer-space/60">pesado</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-outer-space/60">
                Movimiento = intención cerrada o límite sostenido.
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 ring-1 ring-gainsboro/60 px-5 py-5">
              <div className="text-xs text-morning-blue">Sombra dominante (30d)</div>
              <div className="mt-1 text-sm font-semibold tracking-tight text-outer-space">
                {dominantPattern?.name ?? "—"}
              </div>
              <div className="mt-2 text-sm text-outer-space/75">
                {dominantPattern
                  ? `Frecuencia 30d: ${dominantPattern.frequency30d} · tendencia ${arrow(dominantPattern.trend)}`
                  : "Aún no hay evidencia suficiente."}
              </div>
              {dominantPattern ? (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="quiet"
                    onClick={() =>
                      navigate(`/patrones/archivo?patternId=${encodeURIComponent(dominantPattern.id)}`)
                    }
                  >
                    Ver evidencia
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Indicadores</h3>
              <p className="mt-1 text-sm text-outer-space/70">
                No son “logros”. Son señales de cambio o repetición.
              </p>
            </div>
            <Button variant="quiet" onClick={() => navigate("/archivo")}>
              Ver tablero
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {indicators.map((i) => {
              const t = trendFrom(i.values30d);
              const lbl = labelForTrend({ trend: t, kind: i.kind });
              const spark =
                i.kind === "negative"
                  ? "text-chestnut"
                  : i.kind === "neutral"
                    ? "text-outer-space/70"
                    : "text-camel";
              return (
                <div key={i.id} className="rounded-2xl bg-white/70 ring-1 ring-gainsboro/60 px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold tracking-tight text-outer-space">{i.title}</div>
                    <div className="text-[11px] text-outer-space/60">
                      {arrow(t)} {lbl}
                    </div>
                  </div>
                  <div className="mt-3">
                    <MiniSparkline values={i.values30d} className={spark} />
                  </div>
                  <div className="mt-3 text-xs text-outer-space/60">{i.hint}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Gráficas</h3>
              <p className="mt-1 text-sm text-outer-space/70">
                Tendencias visibles. Sin KPI empresarial.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <Sparkline points={density14} title="Marea emocional" subtitle="14 días" />
            <div className="rounded-2xl bg-white/70 ring-1 ring-gainsboro/60 px-4 py-4">
              <StackedBarChart data={intentionBars} title="Intención vs Realidad" />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button variant="quiet" onClick={() => navigate("/archivo")}>
              Abrir archivo completo
            </Button>
          </div>
        </Card>

        <Collapsible
          title="Ritual de hoy"
          description="Aquí sí registras. Pero no te interrogamos."
          open={ritualOpen}
          onOpenChange={setRitualOpen}
        >
          <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Estado actual</h2>
              <p className="mt-1 text-sm text-outer-space/70">
                Selecciona el nivel de honestidad disponible hoy.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-morning-blue">{formatDateLongEsMX(todayISO)}</div>
              <div className="mt-1 text-xs text-outer-space/60">{status ?? "—"}</div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl bg-white/65 ring-1 ring-gainsboro/60 backdrop-blur-md">
            {LAYERS.map((l, idx) => {
              const active = l.type === selectedLayer;
              return (
                <button
                  key={l.type}
                  type="button"
                  onClick={() => setSelectedLayer(l.type)}
                  className={[
                    "w-full px-4 py-4 text-left transition",
                    idx === 0 ? "" : "border-t border-gainsboro/50",
                    active ? "bg-mint-cream/70" : "hover:bg-mint-cream/45",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold tracking-tight text-outer-space">{l.label}</div>
                      <div className="mt-1 text-sm text-outer-space/70">{l.hint}</div>
                    </div>
                    {active ? (
                      <div className="mt-0.5 text-[11px] text-outer-space/60">
                        Seleccionado
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button variant="primary" onClick={save}>
              Guardar
            </Button>
          </div>
          {nextStep ? (
            <div className="mt-5 rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-5 py-5">
              <div className="text-xs text-morning-blue">Siguiente paso</div>
              <div className="mt-2 text-sm text-outer-space/80">
                Guardaste: <span className="font-medium text-outer-space">{layerTitle(savedLayer!)}</span>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => {
                    if (nextStep.kind === "nav" && nextStep.to) {
                      navigate(nextStep.to);
                      return;
                    }
                    setIntentionOpen(true);
                  }}
                >
                  {nextStep.label}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        <div ref={intentionRef} />
        <Collapsible
          title="Intención del día"
          description="No es meta. Es contraste."
          open={intentionOpen}
          onOpenChange={setIntentionOpen}
        >
          {!todayIntention ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
              <div className="sm:col-span-2">
                <FieldLabel>¿Qué vas a intentar hoy?</FieldLabel>
                <Select
                  className="mt-2"
                  value={intentionType}
                  onChange={(e) => setIntentionType(e.target.value as IntentionType)}
                >
                  {INTENTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <FieldHint className="mt-2">Una sola. Lo demás es ruido.</FieldHint>
              </div>
              <Button variant="primary" onClick={registerIntention} className="sm:col-span-1">
                Registrar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
                <div className="text-xs text-morning-blue">Intención</div>
                <div className="mt-1 text-sm font-semibold tracking-tight text-outer-space">
                  {todayIntention.intentionType}
                </div>
                <div className="mt-2 text-xs text-outer-space/65">
                  Estado:{" "}
                  <span className="font-medium text-outer-space">
                    {todayIntention.outcome === "lo_hice"
                      ? "Lo hice"
                      : todayIntention.outcome === "no_lo_hice"
                        ? "No lo hice"
                        : todayIntention.outcome === "a_medias"
                          ? "A medias"
                          : "Sin cierre"}
                  </span>
                </div>
                {todayIntention.note ? (
                  <div className="mt-3 text-sm text-outer-space/80">{todayIntention.note}</div>
                ) : null}
              </div>

              {!todayIntention.outcome ? (
                <div className="space-y-4">
                  <div>
                    <FieldLabel>Resultado</FieldLabel>
                    <div className="mt-2">
                      <SegmentedControl
                        value={closureOutcome}
                        onChange={setClosureOutcome}
                        ariaLabel="Resultado"
                        options={[
                          { value: "lo_hice", label: "Lo hice" },
                          { value: "no_lo_hice", label: "No lo hice" },
                          { value: "a_medias", label: "A medias" },
                        ]}
                      />
                    </div>
                  </div>
                  {closureOutcome !== "lo_hice" ? (
                    <div>
                      <FieldLabel>Bloqueo</FieldLabel>
                      <Select
                        className="mt-2"
                        value={closureBlock}
                        onChange={(e) => setClosureBlock(e.target.value as IntentionBlock)}
                      >
                        {BLOCKS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : null}
                  <div>
                    <FieldLabel>Nota breve</FieldLabel>
                    <Textarea
                      className="mt-2 min-h-[90px]"
                      value={closureNote}
                      onChange={(e) => setClosureNote(e.target.value)}
                      placeholder="Una línea. Sin justificar."
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button onClick={() => setIntentionOpen(false)}>Cerrar</Button>
                    <Button variant="primary" onClick={saveIntentionClosure}>
                      Guardar cierre
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end">
                  <Button onClick={() => setIntentionOpen(false)}>Cerrar</Button>
                </div>
              )}
            </div>
          )}
        </Collapsible>

        <Collapsible
          title="Pulso (opcional)"
          description="Si no puedes medir hoy, no se fuerza."
          open={pulseOpen}
          onOpenChange={setPulseOpen}
        >
          <div className="space-y-5">
            <div>
              <FieldLabel>Dominante hoy (máx 3)</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {dominantTags.length ? (
                  dominantTags.map((t) => (
                    <Chip key={t} selected onClick={() => toggleDominantTag(t)}>
                      {t}
                    </Chip>
                  ))
                ) : (
                  <div className="text-sm text-outer-space/60">—</div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-outer-space/60">Seleccionados: {dominantTags.length}/3</div>
                <Button size="sm" onClick={() => setTagPickerOpen(true)}>
                  Elegir tags
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Energía</FieldLabel>
                <div className="mt-2">
                  <SegmentedControl
                    value={energy}
                    onChange={setEnergy}
                    ariaLabel="Energía"
                    options={[
                      { value: "baja", label: "Baja" },
                      { value: "media", label: "Media" },
                      { value: "alta", label: "Alta" },
                    ]}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Claridad</FieldLabel>
                <div className="mt-2">
                  <SegmentedControl
                    value={clarity}
                    onChange={setClarity}
                    ariaLabel="Claridad"
                    options={[
                      { value: "nublado", label: "Nublado" },
                      { value: "medio", label: "Medio" },
                      { value: "alto", label: "Alto" },
                    ]}
                  />
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Peso emocional</FieldLabel>
              <div className="mt-2 flex items-center gap-3">
                <Range value={emotionalWeight} onChange={setEmotionalWeight} ariaLabel="Peso emocional" />
                <div className="w-10 text-right text-sm font-medium text-outer-space">{emotionalWeight}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button onClick={() => setPulseOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </Collapsible>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="quiet" onClick={() => navigate("/entrada")}>
              Entrada
            </Button>
            <Button onClick={() => setInterventionsOpen(true)}>Intervenciones</Button>
          </div>
        </div>
        </Collapsible>
      </div>

      <Sheet
        open={interventionsOpen}
        title="Intervenciones"
        description="No te motivan. Te aterrizan."
        onClose={() => setInterventionsOpen(false)}
      >
        <div className="space-y-3">
          {QUICK_TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setToolOpen(t)}
              className="w-full text-left rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4 transition hover:bg-mint-cream"
            >
              <div className="text-sm font-semibold tracking-tight text-outer-space">{t.title}</div>
              <div className="mt-1 text-sm text-outer-space/70">{t.subtitle}</div>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCrisisOpen(true)}
            className="w-full text-left rounded-xl bg-white ring-1 ring-gainsboro/70 px-4 py-4 transition hover:bg-mint-cream/50"
          >
            <div className="text-sm font-semibold tracking-tight text-outer-space">Modo Crisis</div>
            <div className="mt-1 text-sm text-outer-space/70">Contención básica. Sin confrontación.</div>
          </button>

          <div className="pt-1 flex justify-end">
            <Button variant="primary" onClick={() => setInterventionsOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Sheet>

      <Modal
        open={toolOpen !== null}
        title={toolOpen?.title ?? "Intervención"}
        description={toolOpen?.subtitle}
        onClose={() => setToolOpen(null)}
      >
        <div className="space-y-3">
          {(toolOpen?.steps ?? []).map((s) => (
            <div
              key={s}
              className="rounded-xl bg-mint-cream/70 px-4 py-3 ring-1 ring-gainsboro/60 text-sm text-outer-space/85"
            >
              {s}
            </div>
          ))}
          <div className="pt-1 flex justify-end">
            <Button variant="primary" onClick={() => setToolOpen(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={tagPickerOpen}
        title="Tags (máx 3)"
        description="Selecciona lo dominante. No todo."
        onClose={() => setTagPickerOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <FieldLabel>Búsqueda</FieldLabel>
            <Input
              className="mt-2"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Escribe para filtrar"
            />
            <FieldHint className="mt-2">Máximo 3. Si no hay palabra exacta, crea una breve.</FieldHint>
          </div>

          <div className="flex flex-wrap gap-2">
            {filteredTags.slice(0, 6).map((t) => (
              <Chip key={t} selected={dominantTags.includes(t)} onClick={() => toggleDominantTag(t)}>
                {t}
              </Chip>
            ))}
          </div>

          <div className="rounded-xl bg-white ring-1 ring-gainsboro/70 px-4 py-4">
            <div className="text-xs text-morning-blue">Más</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {filteredTags.slice(6).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleDominantTag(t)}
                  className={
                    dominantTags.includes(t)
                      ? "rounded-lg bg-outer-space px-3 py-2 text-xs text-white"
                      : "rounded-lg bg-mint-cream px-3 py-2 text-xs text-outer-space/80 ring-1 ring-gainsboro/70 hover:bg-white"
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button onClick={() => setTagPickerOpen(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={crisisOpen}
        title="Modo Crisis"
        description="Contención básica. Sin confrontación."
        onClose={() => setCrisisOpen(false)}
      >
        <div className="space-y-3">
          <div className="rounded-xl bg-mint-cream/70 px-4 py-3 ring-1 ring-gainsboro/60">
            <div className="text-sm font-medium text-outer-space">Respira 60s</div>
            <div className="mt-1 text-sm text-outer-space/70">
              Inhala 4, sostén 2, exhala 6. Repite.
            </div>
          </div>
          <div className="rounded-xl bg-mint-cream/70 px-4 py-3 ring-1 ring-gainsboro/60">
            <div className="text-sm font-medium text-outer-space">Escribe 5 líneas</div>
            <div className="mt-1 text-sm text-outer-space/70">
              Sin filtro. Sin lectura automática.
            </div>
            <div className="mt-3">
              <Button onClick={() => navigate("/escribir?silencio=1")}>Abrir Escribir</Button>
            </div>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-gainsboro/70">
            <div className="text-sm font-medium text-outer-space">Recursos</div>
            <div className="mt-1 text-sm text-outer-space/70">
              Si estás en peligro inmediato o piensas hacerte daño, contacta servicios de emergencia locales.
            </div>
            <div className="mt-2 text-xs text-outer-space/60">
              Concia no sustituye atención de emergencia.
            </div>
          </div>

          <div className="rounded-xl bg-mint-cream/70 px-4 py-3 ring-1 ring-gainsboro/60">
            <div className="text-sm font-medium text-outer-space">Hablar con un orientador</div>
            <div className="mt-1 text-sm text-outer-space/70">
              Orientación emocional no terapéutica (terceros). Sin acceso a contenido de Concia.
            </div>
            <div className="mt-3">
              <Button variant="primary" disabled={!sub.derived.hasAssistance} onClick={() => {}}>
                Abrir canal externo (mock)
              </Button>
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <Button variant="primary" onClick={() => setCrisisOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
