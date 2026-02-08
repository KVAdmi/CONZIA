import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Heatmap from "../components/charts/Heatmap";
import MiniSparkline from "../components/charts/MiniSparkline";
import Sparkline from "../components/charts/Sparkline";
import StackedBarChart, { type BarDatum } from "../components/charts/StackedBarChart";
import GlassSheet from "../components/ui/GlassSheet";
import { SHADOW_PRACTICES } from "../content/shadowPractices";
import { TESTS } from "../content/tests";
import { useSubscription } from "../state/subscriptionStore";
import { useXmi } from "../state/xmiStore";
import type { CheckIn, Entry, EntryReaction, EntryType, Intention, Pattern } from "../types/models";
import { addDays, formatDateLongEsMX, parseISODate, toISODateOnly } from "../utils/dates";
import { ChevronRight } from "lucide-react";

type Trend = "up" | "down" | "flat";

type Indicator = {
  id: string;
  title: string;
  kind: "positive" | "neutral" | "negative";
  values30d: number[];
  evidenceHint: string;
  shadowHypothesis: string;
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

function labelForTrend(params: { trend: Trend; kind: Indicator["kind"] }): string {
  if (params.trend === "flat") return "estable";
  if (params.kind === "negative") return params.trend === "up" ? "más activo" : "menos activo";
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

function countByReaction(entries: Entry[], reaction: EntryReaction): number {
  return entries.filter((e) => e.reaction === reaction).length;
}

function scoreAssertion(entries: Entry[]): number {
  const assertive = countByReaction(entries, "puse_limite") + countByReaction(entries, "pedi") + countByReaction(entries, "negocie");
  const passive = countByReaction(entries, "cedi") + countByReaction(entries, "calle") + countByReaction(entries, "hui");
  const aggressive = countByReaction(entries, "explote");

  const total = entries.length || 1;
  const signal = (assertive - passive - aggressive * 0.6) / total; // [-?, +?]
  const normalized = clamp01(0.5 + signal * 0.75); // center at 0.5
  return Math.round(normalized * 10 * 10) / 10; // 0–10 (1 decimal)
}

function scoreAvoidance(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  const blind = entries.filter((e) => e.type === "no_quise_ver_esto").length;
  const repeat = entries.filter((e) => e.repeatSignal === "si").length;
  const silence = entries.filter((e) => e.silenceMode).length;
  const t = clamp01((blind * 1.0 + repeat * 0.6 + silence * 0.4) / Math.max(1, entries.length));
  return Math.round((2 + t * 8) * 10) / 10;
}

function scoreDrama(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  const high = entries.filter((e) => e.emotionalWeight >= 8).length;
  const explode = entries.filter((e) => e.reaction === "explote").length;
  const t = clamp01((high * 0.7 + explode * 1.2) / Math.max(1, entries.length));
  return Math.round((2 + t * 8) * 10) / 10;
}

function shortDateEsMX(value: string): string {
  const d = parseISODate(value);
  return new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "2-digit", month: "short" })
    .format(d)
    .replaceAll(".", "");
}

function dayHeadline(params: {
  date: string;
  checkIn?: CheckIn;
  entries: Entry[];
  intention?: Intention;
}): { headline: string; tone: "movement" | "heavy" | "silence" | "neutral" } {
  const { checkIn, entries, intention } = params;

  const hasSilence = entries.some((e) => e.silenceMode);
  const didBoundary = entries.some((e) => e.reaction === "puse_limite" || e.reaction === "pedi");
  const practiceId = entries.find((e) => e.practiceId)?.practiceId;

  if (intention?.outcome === "lo_hice") return { headline: `Movimiento: ${intention.intentionType}.`, tone: "movement" };
  if (practiceId) {
    const title = practiceTitleFromId(practiceId);
    if (hasSilence) {
      return { headline: title ? `Práctica en silencio: ${title}.` : "Práctica en silencio.", tone: "silence" };
    }
    return { headline: title ? `Práctica: ${title}.` : "Práctica registrada.", tone: "movement" };
  }
  if (didBoundary) return { headline: "Movimiento: sostuviste un límite (evidencia en registros).", tone: "movement" };
  if (hasSilence) return { headline: "Sesión en silencio: guardaste sin lectura inmediata.", tone: "silence" };

  const weight =
    typeof checkIn?.emotionalWeight === "number"
      ? checkIn.emotionalWeight
      : entries.length
        ? Math.round(avg(entries.map((e) => e.emotionalWeight)) * 10) / 10
        : 0;
  const clarity = checkIn?.clarity;

  if (weight >= 8 && clarity === "nublado") return { headline: "Día pesado: carga alta, claridad nublada.", tone: "heavy" };
  if (entries.length > 0) return { headline: `Evidencia registrada: ${entries.length} evento(s).`, tone: "neutral" };
  if (checkIn) return { headline: "Ritual mínimo: check-in sin evidencia.", tone: "neutral" };
  return { headline: "Sin registro.", tone: "neutral" };
}

function featuredTestIdFor(date: Date): string | null {
  if (TESTS.length === 0) return null;
  const idx = (date.getFullYear() * 12 + date.getMonth()) % TESTS.length;
  return TESTS[idx]?.id ?? null;
}

function dominantShadow(patterns: Pattern[]): Pattern | undefined {
  return [...patterns].sort((a, b) => b.frequency30d - a.frequency30d)[0];
}

function labelForEntryType(t: EntryType): string {
  if (t === "desahogo_libre") return "Desahogo libre";
  if (t === "algo_me_incomodo") return "Algo me incomodó";
  if (t === "queria_hacer_algo_distinto") return "Quería hacer algo distinto";
  if (t === "hoy_si_lo_hice") return "Hoy sí lo hice";
  return "No quise ver esto";
}

function entryPreview(e: Entry): string {
  const clean = e.text.replace(/\s+/g, " ").trim();
  return clean.length > 140 ? `${clean.slice(0, 137)}…` : clean;
}

function practiceTitleFromId(id?: string): string | undefined {
  if (!id) return undefined;
  return SHADOW_PRACTICES.find((p) => p.id === id)?.title;
}

function pickRecommendedPracticeId(params: { shadow?: Pattern; indicators: Indicator[] }): string {
  const byId = new Map(SHADOW_PRACTICES.map((p) => [p.id, p] as const));
  const safe = (id: string) => (byId.has(id) ? id : SHADOW_PRACTICES[0]!.id);

  const name = params.shadow?.name?.toLowerCase() ?? "";
  if (name.includes("evit")) return safe("sp_beneficio_oculto");
  if (name.includes("rumi")) return safe("sp_disparador_real");
  if (name.includes("límite") || name.includes("limite")) return safe("sp_dialogo_parte");
  if (name.includes("aprob")) return safe("sp_ego_verdad");
  if (name.includes("autoanul")) return safe("sp_talento_oculto");

  const neg = params.indicators.filter((i) => i.kind === "negative");
  const ranked = neg
    .map((i) => ({ id: i.id, last7: avg(i.values30d.slice(-7)) }))
    .sort((a, b) => b.last7 - a.last7)[0];

  if (ranked?.id === "evitacion") return safe("sp_beneficio_oculto");
  if (ranked?.id === "drama_conflicto") return safe("sp_disparador_real");
  return safe("sp_beneficio_oculto");
}

export default function ArchivoPage() {
  const { state } = useXmi();
  const sub = useSubscription();
  const navigate = useNavigate();
  const locked = !sub.derived.hasSystem;

  type PanelId =
    | "resumen"
    | "agenda"
    | "patrones"
    | "indicadores"
    | "intencion"
    | "densidad"
    | "practica"
    | "tests";

  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);

  const todayISO = toISODateOnly(new Date());
  const today = parseISODate(todayISO);

  const range14 = useMemo(() => {
    return Array.from({ length: 14 }, (_, idx) => toISODateOnly(addDays(today, -13 + idx)));
  }, [today]);

  const agenda = useMemo(() => {
    return range14
      .slice()
      .reverse()
      .map((iso) => {
        const entries = state.entries.filter((e) => e.date === iso);
        const checkIn = state.checkIns.find((c) => c.date === iso);
        const intention = state.intentions.filter((i) => i.date === iso).sort((a, b) => (a.id < b.id ? 1 : -1))[0];
        const readingCount = state.readings.filter((r) => r.date === iso).length;

        const { headline, tone } = dayHeadline({ date: iso, checkIn, entries, intention });

        const detailParts: string[] = [];
        if (checkIn) {
          detailParts.push(`energía ${checkIn.energy}`);
          detailParts.push(`peso ${checkIn.emotionalWeight}`);
          detailParts.push(`claridad ${checkIn.clarity}`);
        } else if (entries.length) {
          detailParts.push(`${entries.length} registro(s)`);
          detailParts.push(`peso prom. ${Math.round(avg(entries.map((e) => e.emotionalWeight)) * 10) / 10}`);
        }
        if (intention && !intention.outcome) detailParts.push("intención sin cierre");
        if (readingCount) detailParts.push(`${readingCount} lectura(s)`);

        return {
          date: iso,
          headline,
          detail: detailParts.length ? detailParts.join(" · ") : undefined,
          tone,
        };
      });
  }, [range14, state.checkIns, state.entries, state.intentions, state.readings]);

  const todayAgenda = useMemo(() => {
    return agenda.find((d) => d.date === todayISO);
  }, [agenda, todayISO]);

  const agendaCounts = useMemo(() => {
    const counters = { movement: 0, heavy: 0, silence: 0, neutral: 0 };
    for (const d of agenda) counters[d.tone] += 1;
    return counters;
  }, [agenda]);

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => toISODateOnly(addDays(today, -6 + idx)));
  }, [today]);

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

  const intentionSummary = useMemo(() => {
    const start = addDays(parseISODate(todayISO), -29);
    const intentions = state.intentions.filter((i) => parseISODate(i.date) >= start);
    const byType = new Map<string, { total: number; notAchieved: number; noClose: number }>();
    for (const i of intentions) {
      const cur = byType.get(i.intentionType) ?? { total: 0, notAchieved: 0, noClose: 0 };
      cur.total += 1;
      if (!i.outcome) cur.noClose += 1;
      else if (i.outcome !== "lo_hice") cur.notAchieved += 1;
      byType.set(i.intentionType, cur);
    }
    return [...byType.entries()]
      .map(([type, v]) => ({
        type,
        total: v.total,
        pctNotAchieved: v.total === 0 ? 0 : Math.round((v.notAchieved / v.total) * 100),
        noClose: v.noClose,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [state.intentions, todayISO]);

  const last30Days = useMemo(() => {
    return Array.from({ length: 30 }, (_, idx) => toISODateOnly(addDays(today, -29 + idx)));
  }, [today]);

  const indicators = useMemo<Indicator[]>(() => {
    const clarity30 = last30Days.map((d) => scoreFromClarity(state.checkIns.find((c) => c.date === d)?.clarity));

    const intentionNo30 = last30Days.map((d) => {
      const i = state.intentions.find((x) => x.date === d && x.intentionType === "Decir que no");
      return scoreFromIntentionOutcome(i);
    });

    const assertion30 = last30Days.map((d) => scoreAssertion(state.entries.filter((e) => e.date === d)));
    const avoidance30 = last30Days.map((d) => scoreAvoidance(state.entries.filter((e) => e.date === d)));
    const drama30 = last30Days.map((d) => scoreDrama(state.entries.filter((e) => e.date === d)));

    const totalEntries30 = state.entries.filter((e) => last30Days.includes(e.date)).length;
    const totalCheckIns30 = state.checkIns.filter((c) => last30Days.includes(c.date)).length;

    return [
      {
        id: "decir_no",
        title: "Decir NO",
        kind: "positive",
        values30d: intentionNo30,
        evidenceHint: `Basado en intenciones tipo “Decir que no” (30 días).`,
        shadowHypothesis: "Evitar el NO suele comprar aceptación inmediata y venderte después.",
      },
      {
        id: "respeto_limites",
        title: "Respeto a mis límites",
        kind: "positive",
        values30d: assertion30,
        evidenceHint: `Basado en reacciones (puse límite/pedí/cedí/callé) · ${totalEntries30} registro(s).`,
        shadowHypothesis: "Ceder temprano puede evitar culpa hoy y construir resentimiento mañana.",
      },
      {
        id: "autoestima_conductual",
        title: "Autoestima conductual",
        kind: "neutral",
        values30d: assertion30.map((v) => Math.round((v * 0.9 + avg(clarity30) * 0.1) * 10) / 10),
        evidenceHint: "No cómo te sientes: cómo actúas cuando cuesta.",
        shadowHypothesis: "La imagen pública suele protegerte de sentirte “demasiado” frente a otros.",
      },
      {
        id: "evitacion",
        title: "Evitación",
        kind: "negative",
        values30d: avoidance30,
        evidenceHint: `Basado en “No quise ver esto”, señal de repetición y silencio · ${totalEntries30} registro(s).`,
        shadowHypothesis: "Evitar puede darte control y quitarte conflicto. También te quita verdad.",
      },
      {
        id: "drama_conflicto",
        title: "Drama / conflicto",
        kind: "negative",
        values30d: drama30,
        evidenceHint: `Basado en densidad (peso ≥ 8) y reacción “exploté” · ${totalEntries30} registro(s).`,
        shadowHypothesis: "El drama a veces mantiene vínculo: sin conflicto, no sabes dónde estás parado.",
      },
      {
        id: "claridad",
        title: "Claridad",
        kind: "positive",
        values30d: clarity30,
        evidenceHint: `Basado en check-ins · ${totalCheckIns30} día(s) con ritual.`,
        shadowHypothesis: "La confusión puede ser un lugar seguro: te evita una decisión.",
      },
    ];
  }, [last30Days, state.checkIns, state.entries, state.intentions]);

  const shadow = useMemo(() => dominantShadow(state.patterns), [state.patterns]);
  const recommendedPracticeId = useMemo(
    () => pickRecommendedPracticeId({ shadow, indicators }),
    [indicators, shadow],
  );
  const [practiceOverrideId, setPracticeOverrideId] = useState<string | null>(null);
  const practice = useMemo(() => {
    const id = practiceOverrideId ?? recommendedPracticeId;
    return SHADOW_PRACTICES.find((p) => p.id === id) ?? SHADOW_PRACTICES[0]!;
  }, [practiceOverrideId, recommendedPracticeId]);

  const topPatterns = useMemo(() => {
    return [...state.patterns].sort((a, b) => b.frequency30d - a.frequency30d).slice(0, 8);
  }, [state.patterns]);

  const [openDayISO, setOpenDayISO] = useState<string | null>(null);
  const openDay = useMemo(() => {
    if (!openDayISO) return null;
    const entries = state.entries.filter((e) => e.date === openDayISO).sort((a, b) => (a.id < b.id ? 1 : -1));
    const checkIn = state.checkIns.find((c) => c.date === openDayISO);
    const intention = state.intentions.filter((i) => i.date === openDayISO).sort((a, b) => (a.id < b.id ? 1 : -1))[0];
    const readings = state.readings.filter((r) => r.date === openDayISO).sort((a, b) => (a.id < b.id ? 1 : -1));
    const { headline, tone } = dayHeadline({ date: openDayISO, checkIn, entries, intention });
    const latestReadingId = readings[0]?.id;
    return { iso: openDayISO, entries, checkIn, intention, headline, tone, readingsCount: readings.length, latestReadingId };
  }, [openDayISO, state.checkIns, state.entries, state.intentions, state.readings]);

  const heatmapCells = useMemo(() => {
    const cells: Array<{ date: string; value: number }> = [];
    const start = addDays(today, -34);
    for (let i = 0; i < 35; i += 1) {
      const d = addDays(start, i);
      const iso = toISODateOnly(d);
      const value = parseISODate(iso) > today ? 0 : state.entries.filter((e) => e.date === iso).length;
      cells.push({ date: iso, value });
    }
    return cells;
  }, [state.entries, today]);

  const density30 = useMemo(() => {
    const points: Array<{ value: number }> = [];
    const start = addDays(today, -29);
    for (let i = 0; i < 30; i += 1) {
      const d = addDays(start, i);
      const iso = toISODateOnly(d);
      const checkIn = state.checkIns.find((c) => c.date === iso);
      const entries = state.entries.filter((e) => e.date === iso);
      const fromEntries =
        entries.length === 0
          ? 0
          : Math.round((entries.reduce((acc, e) => acc + e.emotionalWeight, 0) / entries.length) * 10) / 10;
      points.push({ value: typeof checkIn?.emotionalWeight === "number" ? checkIn.emotionalWeight : fromEntries });
    }
    return points;
  }, [state.checkIns, state.entries, today]);

  const featuredTest = useMemo(() => {
    const id = featuredTestIdFor(today);
    return id ? TESTS.find((t) => t.id === id) : undefined;
  }, [today]);

  function PanelTile({
    title,
    subtitle,
    meta,
    onClick,
  }: {
    title: string;
    subtitle?: string;
    meta?: string;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-2xl bg-white/5 px-5 py-4 text-left ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/8 active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-white">{title}</div>
            {subtitle ? <div className="mt-1 text-xs text-white/65">{subtitle}</div> : null}
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/55" aria-hidden />
        </div>
        {meta ? <div className="mt-3 text-xs text-white/55">{meta}</div> : null}
      </button>
    );
  }

  function primaryButtonClassName(): string {
    return "w-full rounded-2xl bg-[#7D5C6B] px-5 py-4 text-center text-sm font-semibold tracking-wide text-white ring-1 ring-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:bg-[#6f5160] active:scale-[0.99]";
  }

  function quietButtonClassName(): string {
    return "w-full rounded-2xl bg-white/5 px-5 py-4 text-center text-sm font-semibold tracking-wide text-white ring-1 ring-white/10 transition hover:bg-white/8 active:scale-[0.99]";
  }

  function pillClassName(): string {
    return "rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 transition hover:bg-white/12";
  }

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14">
      <div className="flex items-start justify-between gap-4 text-white">
        <div>
          <div className="text-[28px] font-semibold tracking-tight">Mapa</div>
          <div className="mt-2 text-sm text-white/65">Tablero de conciencia. Aquí sí se ve.</div>
        </div>
        <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/10 backdrop-blur-md">
          <span className="inline-block h-2 w-2 rounded-full bg-white/60" aria-hidden />
          Local
        </div>
      </div>

      <div className="mt-7 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        {locked ? (
          <div className="rounded-2xl bg-white/8 ring-1 ring-white/10 px-4 py-4">
            <div className="text-sm font-semibold tracking-tight text-white">Modo básico</div>
            <div className="mt-1 text-xs text-white/65">
              Puedes ver el mapa, pero Lecturas/Caja se limitan. Esto es un visor de avance.
            </div>
            <div className="mt-4">
              <button type="button" onClick={() => navigate("/planes")} className={quietButtonClassName()}>
                Ver planes
              </button>
            </div>
          </div>
        ) : null}

        <div className={locked ? "mt-5" : ""}>
          <div className="text-[11px] tracking-[0.18em] text-white/55">HOY</div>
          <div className="mt-3 text-xl font-semibold tracking-tight text-white">{formatDateLongEsMX(todayISO)}</div>
          <div className="mt-2 text-sm leading-relaxed text-white/70">{todayAgenda?.headline ?? "Sin registro."}</div>
          {todayAgenda?.detail ? <div className="mt-1 text-xs text-white/55">{todayAgenda.detail}</div> : null}

          <div className="mt-5 grid grid-cols-1 gap-3">
            <PanelTile
              title="Resumen"
              subtitle="Hoy · sombra dominante · últimos 14 días"
              meta={shadow?.name ? `Sombra dominante: ${shadow.name}` : undefined}
              onClick={() => setOpenPanel("resumen")}
            />
            <PanelTile
              title="Agenda (14 días)"
              subtitle="Movimiento y recaída sin juicio"
              meta={`${agendaCounts.movement} movimiento · ${agendaCounts.heavy} pesado · ${agendaCounts.silence} silencio · ${agendaCounts.neutral} neutro`}
              onClick={() => setOpenPanel("agenda")}
            />
            <PanelTile
              title="Indicadores (30 días)"
              subtitle="Mapas de marea (no desempeño)"
              meta="Cada indicador debe poder responder: “¿qué beneficio oculto sostiene esto?”"
              onClick={() => setOpenPanel("indicadores")}
            />
            <PanelTile
              title="Patrones"
              subtitle="Evidencia y tendencia"
              meta={topPatterns.length ? `Top: ${topPatterns[0]!.name}` : "Aún no hay patrones suficientes."}
              onClick={() => setOpenPanel("patrones")}
            />
            <PanelTile
              title="Intención vs Realidad"
              subtitle="7 días (visual) + 30 días (resumen)"
              onClick={() => setOpenPanel("intencion")}
            />
            <PanelTile
              title="Archivo visual"
              subtitle="Gráficas grandes viven aquí, no en Sesión"
              onClick={() => setOpenPanel("densidad")}
            />
            <PanelTile
              title="Práctica sugerida"
              subtitle={`${practice.minutes} min · ${practice.title}`}
              onClick={() => setOpenPanel("practica")}
            />
            <PanelTile
              title="Test del mes"
              subtitle="Rotación mensual (mock)"
              meta={featuredTest?.title ?? "Sin tests disponibles."}
              onClick={() => setOpenPanel("tests")}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate("/crisis")} className={pillClassName()}>
              Crisis
            </button>
            <button type="button" onClick={() => navigate("/boveda")} className={pillClassName()}>
              Bóveda
            </button>
            <button type="button" onClick={() => navigate("/mas")} className={pillClassName()}>
              Más
            </button>
          </div>
        </div>
      </div>

      <GlassSheet
        open={openPanel === "resumen"}
        title="Resumen"
        description="Lo mínimo para ver hoy + rastro."
        onClose={() => setOpenPanel(null)}
      >
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/8 ring-1 ring-white/10 px-5 py-4">
            <div className="text-[11px] tracking-[0.18em] text-white/55">HOY</div>
            <div className="mt-2 text-sm font-semibold tracking-tight text-white">{formatDateLongEsMX(todayISO)}</div>
            <div className="mt-2 text-sm text-white/70">{todayAgenda?.headline ?? "Sin registro."}</div>
            {todayAgenda?.detail ? <div className="mt-1 text-xs text-white/55">{todayAgenda.detail}</div> : null}
            <div className="mt-3 text-xs text-white/55">Si vas a entrar a ver métricas, que sea con intención.</div>
          </div>

          <div className="rounded-2xl bg-white/8 ring-1 ring-white/10 px-5 py-4">
            <div className="text-[11px] tracking-[0.18em] text-white/55">SOMBRA DOMINANTE (30d)</div>
            <div className="mt-2 text-sm font-semibold tracking-tight text-white">{shadow?.name ?? "—"}</div>
            <div className="mt-2 text-sm text-white/70">
              {shadow
                ? `Frecuencia 30d: ${shadow.frequency30d} · tendencia ${arrow(shadow.trend)}`
                : "Sin patrón suficiente todavía."}
            </div>
            {shadow ? (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(`/patrones/archivo?patternId=${encodeURIComponent(shadow.id)}`)}
                  className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 transition hover:bg-white/12"
                >
                  Revisar evidencia
                </button>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl bg-white/8 ring-1 ring-white/10 px-5 py-4">
            <div className="text-[11px] tracking-[0.18em] text-white/55">ÚLTIMOS 14 DÍAS</div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              <div>
                <div className="text-lg font-semibold tracking-tight text-white">{agendaCounts.movement}</div>
                <div className="text-[11px] text-white/55">movimiento</div>
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-white">{agendaCounts.heavy}</div>
                <div className="text-[11px] text-white/55">pesado</div>
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-white">{agendaCounts.silence}</div>
                <div className="text-[11px] text-white/55">silencio</div>
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-white">{agendaCounts.neutral}</div>
                <div className="text-[11px] text-white/55">neutro</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-white/55">No es calificación. Es rastro.</div>
          </div>

          <div className="rounded-2xl bg-white/8 ring-1 ring-white/10 px-5 py-4">
            <div className="text-[11px] tracking-[0.18em] text-white/55">CICLO SUGERIDO</div>
            <div className="mt-2 text-sm font-semibold tracking-tight text-white">12 semanas</div>
            <div className="mt-2 text-sm text-white/70">No para “sentirte bien”. Para ver repetición y elegir distinto.</div>
          </div>
        </div>
      </GlassSheet>

      <GlassSheet
        open={openPanel === "agenda"}
        title="Agenda"
        description="14 días. Movimiento y recaída sin juicio. Solo rastro."
        onClose={() => setOpenPanel(null)}
      >
        <div className="space-y-3">
          {agenda.map((d) => {
            const dot =
              d.tone === "movement"
                ? "bg-emerald-200/80"
                : d.tone === "heavy"
                  ? "bg-amber-200/80"
                  : d.tone === "silence"
                    ? "bg-sky-200/80"
                    : "bg-white/45";
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setOpenDayISO(d.date)}
                className="w-full rounded-2xl bg-white/5 px-5 py-4 text-left ring-1 ring-white/10 transition hover:bg-white/8 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
                    <div className="text-sm font-semibold tracking-tight text-white">{shortDateEsMX(d.date)}</div>
                  </div>
                  <div className="text-xs text-white/55">{d.detail ?? "—"}</div>
                </div>
                <div className="mt-2 text-sm text-white/75">{d.headline}</div>
                {d.tone === "movement" ? (
                  <div className="mt-2 text-xs text-white/55">Sin aplauso. Esto cuenta como evidencia.</div>
                ) : d.tone === "heavy" ? (
                  <div className="mt-2 text-xs text-white/55">No se arregla hoy. Se nombra hoy.</div>
                ) : d.tone === "silence" ? (
                  <div className="mt-2 text-xs text-white/55">Silencio no es vacío. Es una decisión.</div>
                ) : null}
              </button>
            );
          })}
        </div>
      </GlassSheet>

      <GlassSheet
        open={openPanel === "patrones"}
        title="Patrones"
        description="Evidencia antes que historia."
        onClose={() => setOpenPanel(null)}
      >
        <div className="space-y-3">
          {topPatterns.length ? (
            topPatterns.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/patrones/archivo?patternId=${encodeURIComponent(p.id)}`)}
                className="w-full rounded-2xl bg-white/5 px-5 py-4 text-left ring-1 ring-white/10 transition hover:bg-white/8 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold tracking-tight text-white">{p.name}</div>
                    <div className="mt-1 text-xs text-white/60">
                      {p.frequency30d} evento(s) · tendencia {arrow(p.trend)}
                    </div>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/55" aria-hidden />
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-5 py-4 text-sm text-white/70">
              Aún no hay patrones suficientes.
            </div>
          )}
          <div className="text-xs text-white/55">Toca un patrón para abrir evidencia.</div>
        </div>
      </GlassSheet>

      <GlassSheet
        open={openPanel === "indicadores"}
        title="Indicadores"
        description="Mapas de marea. No desempeño."
        onClose={() => setOpenPanel(null)}
      >
        <div className="space-y-3">
          {indicators.map((i) => {
            const t = trendFrom(i.values30d);
            const lbl = labelForTrend({ trend: t, kind: i.kind });
            const spark = i.kind === "negative" ? "text-amber-200" : i.kind === "neutral" ? "text-white/55" : "text-camel";
            return (
              <div key={i.id} className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold tracking-tight text-white">{i.title}</div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/80 ring-1 ring-white/10">
                    <span className="text-white/80">{arrow(t)}</span>
                    <span>{lbl}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <MiniSparkline values={i.values30d} className={spark} />
                </div>

                <div className="mt-4 rounded-2xl bg-black/25 ring-1 ring-white/10 px-4 py-4">
                  <div className="text-[11px] tracking-[0.18em] text-white/55">BENEFICIO OCULTO (HIPÓTESIS)</div>
                  <div className="mt-2 text-sm text-white/75 leading-relaxed">{i.shadowHypothesis}</div>
                  <div className="mt-3 text-[11px] text-white/55">Evidencia: {i.evidenceHint}</div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassSheet>

      <GlassSheet
        open={openPanel === "intencion"}
        title="Intención vs Realidad"
        description="7 días (visual) + 30 días (resumen)."
        onClose={() => setOpenPanel(null)}
      >
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/82 ring-1 ring-white/15 px-4 py-4">
            <StackedBarChart data={intentionBars} title="Intención vs Realidad" />
          </div>
          <div className="rounded-2xl bg-white/82 ring-1 ring-white/15 px-5 py-5">
            <div className="text-xs text-morning-blue">Resumen 30 días</div>
            <div className="mt-3 space-y-2">
              {intentionSummary.length ? (
                intentionSummary.map((x) => (
                  <div key={x.type} className="flex items-start justify-between gap-4">
                    <div className="text-sm font-semibold tracking-tight text-outer-space">{x.type}</div>
                    <div className="text-sm text-outer-space/70">
                      {x.pctNotAchieved}% no logrado{x.noClose ? ` · ${x.noClose} sin cierre` : ""}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-outer-space/70">Sin intención suficiente todavía.</div>
              )}
            </div>
            <div className="mt-3 text-xs text-outer-space/60">
              Si una intención se repite y no se cierra, el sistema lo trata como dato, no como falla.
            </div>
          </div>
        </div>
      </GlassSheet>

      <GlassSheet
        open={openPanel === "densidad"}
        title="Archivo visual"
        description="Gráficas grandes viven aquí, no en Sesión."
        onClose={() => setOpenPanel(null)}
      >
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/82 ring-1 ring-white/15 px-4 py-4">
            <Heatmap cells={heatmapCells} title="Densidad (heatmap semanal)" />
          </div>
          <div className="rounded-2xl bg-white/82 ring-1 ring-white/15 px-4 py-4">
            <Sparkline points={density30} title="Densidad emocional" subtitle="30 días" />
          </div>
        </div>
      </GlassSheet>

      <GlassSheet
        open={openPanel === "practica"}
        title="Práctica sugerida"
        description="Breve. Concreta. Sin anestesia."
        onClose={() => setOpenPanel(null)}
      >
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight text-white">{practice.title}</div>
              <div className="mt-1 text-sm text-white/70">{practice.subtitle}</div>
            </div>
            <div className="text-xs text-white/55">{practice.minutes} min</div>
          </div>
          <div className="mt-4 text-sm leading-relaxed text-white/80 whitespace-pre-line">{practice.prompt.trim()}</div>
          <div className="mt-6 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => {
                const currentId = practiceOverrideId ?? recommendedPracticeId;
                const idx = SHADOW_PRACTICES.findIndex((p) => p.id === currentId);
                const next = SHADOW_PRACTICES[(Math.max(0, idx) + 1) % SHADOW_PRACTICES.length]!;
                setPracticeOverrideId(next.id);
              }}
              className={quietButtonClassName()}
            >
              Otra
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/escribir?layer=${encodeURIComponent(practice.layer)}&practiceId=${encodeURIComponent(practice.id)}&prompt=${encodeURIComponent(practice.prompt)}`,
                )
              }
              className={primaryButtonClassName()}
            >
              Abrir en Escribir
            </button>
          </div>
        </div>
      </GlassSheet>

      <GlassSheet
        open={openPanel === "tests"}
        title="Tests"
        description="No diagnostican. Activan resonancia y evidencia."
        onClose={() => setOpenPanel(null)}
      >
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-5 py-5">
          <div className="text-[11px] tracking-[0.18em] text-white/55">ESTE MES (MOCK)</div>
          <div className="mt-2 text-sm font-semibold tracking-tight text-white">{featuredTest?.title ?? "—"}</div>
          <div className="mt-2 text-sm text-white/70">{featuredTest?.description ?? "Sin tests disponibles."}</div>
          <div className="mt-6">
            <button type="button" onClick={() => navigate("/tests")} className={primaryButtonClassName()}>
              Abrir tests
            </button>
          </div>
          <div className="mt-3 text-xs text-white/55">
            Banner de retención: en producto real, cada mes entra un test nuevo.
          </div>
        </div>
      </GlassSheet>

      <GlassSheet
        open={openDayISO !== null && openDay !== null}
        title={openDay ? formatDateLongEsMX(openDay.iso) : "Día"}
        description={openDay?.headline}
        onClose={() => setOpenDayISO(null)}
        zIndexClassName="z-[60]"
      >
        {openDay ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/8 ring-1 ring-white/10 px-4 py-4">
              <div className="text-[11px] tracking-[0.18em] text-white/55">RESUMEN</div>
              <div className="mt-2 text-sm text-white/80">{openDay.headline}</div>
              <div className="mt-2 text-xs text-white/55">
                {openDay.tone === "movement"
                  ? "Esto cuenta como movimiento, aunque sea incómodo."
                  : openDay.tone === "heavy"
                    ? "Si hoy fue pesado, no lo negocies con explicación."
                    : openDay.tone === "silence"
                      ? "Silencio: guardaste sin lectura inmediata."
                      : "Neutro: sin historia. Solo rastro."}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-4">
                <div className="text-[11px] tracking-[0.18em] text-white/55">RITUAL</div>
                {openDay.checkIn ? (
                  <div className="mt-2 space-y-1 text-sm text-white/75">
                    <div>Energía: {openDay.checkIn.energy}</div>
                    <div>Peso: {openDay.checkIn.emotionalWeight}</div>
                    <div>Claridad: {openDay.checkIn.clarity}</div>
                    <div className="text-xs text-white/55">
                      Dominante: {openDay.checkIn.dominantTags.length ? openDay.checkIn.dominantTags.join(" · ") : "—"}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-white/70">Sin check-in.</div>
                )}
              </div>

              <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-4">
                <div className="text-[11px] tracking-[0.18em] text-white/55">INTENCIÓN</div>
                {openDay.intention ? (
                  <div className="mt-2 text-sm text-white/75">
                    <div className="font-semibold tracking-tight text-white">{openDay.intention.intentionType}</div>
                    <div className="mt-1 text-xs text-white/55">
                      {openDay.intention.outcome
                        ? openDay.intention.outcome === "lo_hice"
                          ? "Lo hice"
                          : openDay.intention.outcome === "a_medias"
                            ? "A medias"
                            : "No lo hice"
                        : "Sin cierre"}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-white/70">Sin intención declarada.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] tracking-[0.18em] text-white/55">EVIDENCIA</div>
                  <div className="mt-1 text-xs text-white/55">
                    {openDay.entries.length ? `${openDay.entries.length} registro(s)` : "Sin registros"}
                  </div>
                </div>
                <div className="text-xs text-white/55">
                  {openDay.readingsCount ? `${openDay.readingsCount} lectura(s)` : "0 lecturas"}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {openDay.entries.length ? (
                  openDay.entries.slice(0, 6).map((e) => {
                    const practiceTitle = practiceTitleFromId(e.practiceId);
                    return (
                      <div key={e.id} className="rounded-2xl bg-black/25 ring-1 ring-white/10 px-4 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="text-sm font-semibold tracking-tight text-white">{labelForEntryType(e.type)}</div>
                          <div className="text-xs text-white/55">
                            {e.context} · {e.boundary} · {e.reaction} · peso {e.emotionalWeight}
                            {e.silenceMode ? " · silencio" : ""}
                            {practiceTitle ? ` · práctica: ${practiceTitle}` : e.practiceId ? " · práctica" : ""}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-white/75">{entryPreview(e)}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-white/70">
                    No hay evidencia. Si hoy pasó algo, regístralo sin adornarlo.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {openDay.latestReadingId ? (
                <button
                  type="button"
                  onClick={() => navigate(`/lecturas?readingId=${encodeURIComponent(openDay.latestReadingId!)}`)}
                  className={quietButtonClassName()}
                >
                  Ver lectura
                </button>
              ) : null}
              <button type="button" onClick={() => navigate("/escribir")} className={primaryButtonClassName()}>
                Ir a Escribir
              </button>
            </div>
          </div>
        ) : null}
      </GlassSheet>
    </div>
  );
}
