import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, MessageCircle, Eye, Home, LayoutGrid, Settings, Bell, MessageSquare, Target, TrendingUp, ArrowRight, Activity, Search, Sparkles } from "lucide-react";
import MiniSparkline from "../components/charts/MiniSparkline";
import Modal from "../components/ui/Modal";
import RadialProgress from "../components/ui/RadialProgress";
import MetricCard from "../components/ui/MetricCard";
import SessionHeroCard from "../components/dashboard/SessionHeroCard";
import DoorCard from "../components/dashboard/DoorCard";
import NextStepCTA from "../components/dashboard/NextStepCTA";
import { conziaGuidanceProfile, todayPlanFromProfile } from "../engine/conziaMotor";
import { computeMetrics } from "../metrics/computeMetrics";
import { useConzia } from "../state/conziaStore";
import { createId } from "../utils/id";
import { toISODateOnly } from "../utils/dates";
import type {
  ConziaEntry,
  ConziaFriccion,
  ConziaObservationEntry,
  ConziaPatternTag,
  ConziaTrap,
  DoorId,
} from "../types/models";

type PatternId = ConziaPatternTag;

const FIXED_PATTERNS: ConziaPatternTag[] = ["rumiacion", "evitacion", "aislamiento"];

const PATTERN_LABEL: Record<PatternId, string> = {
  rumiacion: "Rumiación",
  evitacion: "Evitación",
  aislamiento: "Aislamiento",
};

const PATTERN_KEYWORDS: Record<PatternId, string[]> = {
  rumiacion: ["darle vueltas", "rumia", "rumiacion", "sobrepienso", "sobrepens", "no paro de pensar"],
  evitacion: ["evite", "evitar", "me fui", "evadi", "ignorar", "no quise ver", "autoengano"],
  aislamiento: ["me aisle", "me encerre", "me aleje", "no conteste", "no respondi", "desconecte"],
};

const FRICCION_LABEL: Record<ConziaFriccion, string> = {
  limites: "Límites",
  abandono_propio: "Abandono propio",
  control: "Control",
  verguenza: "Vergüenza",
  dependencia: "Dependencia",
  autoengano: "Autoengaño",
};

const TRAP_LABEL: Record<ConziaTrap, string> = {
  ACTION_WITHOUT_TRUTH: "Actué sin nombrarlo",
  INFINITE_ANALYSIS: "Lo analicé sin cerrarlo",
  GUILT_PERFORMANCE: "Lo convertí en culpa",
  PRETTY_INSIGHT: "Lo volví insight bonito",
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function trapToPattern(trap: ConziaTrap): PatternId {
  if (trap === "INFINITE_ANALYSIS") return "rumiacion";
  if (trap === "GUILT_PERFORMANCE") return "aislamiento";
  return "evitacion";
}

function tagsForEntry(entry: ConziaEntry): PatternId[] {
  const tags = new Set<PatternId>();

  const text =
    entry.source === "consultorio" || entry.source === "mesa"
      ? entry.hecho
      : entry.source === "quick"
        ? entry.fact_line
        : entry.source === "desahogo"
          ? entry.text
        : entry.source === "puerta1_observacion"
          ? entry.fact_line
          : "";

  const norm = normalizeText(text);
  if (norm) {
    (Object.keys(PATTERN_KEYWORDS) as PatternId[]).forEach((pid) => {
      if (PATTERN_KEYWORDS[pid].some((kw) => norm.includes(kw))) tags.add(pid);
    });
  }

  if (entry.source === "puerta1_observacion") {
    tags.add(trapToPattern(entry.trap_selected));
    if (entry.friccion_hoy === "autoengano") tags.add("evitacion");
    if (entry.friccion_hoy === "verguenza" || entry.friccion_hoy === "abandono_propio") tags.add("aislamiento");
    if (entry.friccion_hoy === "dependencia") tags.add("aislamiento");
  }

  return [...tags];
}

function entrySourceLabel(source: ConziaEntry["source"]): string {
  if (source === "consultorio") return "Consultorio";
  if (source === "mesa") return "Mesa";
  if (source === "puerta1_observacion") return "Observación Inicial";
  if (source === "quick") return "Desahogo rápido";
  if (source === "desahogo") return "Desahogo";
  return "Entrada";
}

function formatDateTimeEsMX(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function SesionPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useConzia();

  const todayKey = toISODateOnly(new Date());

  const process = useMemo(() => {
    const pick = state.activeProcessId
      ? state.processes.find((p) => p.id === state.activeProcessId)
      : undefined;
    return pick ?? state.processes[0] ?? null;
  }, [state.activeProcessId, state.processes]);

  const closedDoorsToday = useMemo(() => {
    if (!process) return new Set<DoorId>();
    return new Set(
      state.sessions
        .filter((s) => s.process_id === process.id && s.date_key === todayKey && s.closed)
        .map((s) => s.door),
    );
  }, [process, state.sessions, todayKey]);

  const observationDoneToday = closedDoorsToday.has("observacion");

  const latestObservation = useMemo(() => {
    if (!process) return null;
    const entries = state.entriesV1.filter(
      (e): e is ConziaObservationEntry => e.source === "puerta1_observacion" && e.process_id === process.id,
    );
    const byToday = entries.filter((e) => toISODateOnly(new Date(e.created_at)) === todayKey);
    byToday.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return byToday[0] ?? null;
  }, [process, state.entriesV1, todayKey]);

  const fallbackPlan = useMemo(() => {
    if (!state.profile) return null;
    const guidance = conziaGuidanceProfile({
      archetypeDominant: state.profile.arquetipo_dominante,
      archetypeConfidence: state.profile.confianza,
      friccionPrincipal: state.profile.tema_base,
      costoDominante: state.profile.costo_dominante,
    });
    return todayPlanFromProfile(guidance);
  }, [state.profile]);

  const todayPlan = latestObservation?.today_plan ?? fallbackPlan;
  const recommendedDoor = todayPlan?.recommendedDoor ?? null;
  const trapSelected = latestObservation?.trap_selected ?? null;

  const overallProgress = useMemo(() => {
    const doors: DoorId[] = ["observacion", "consultorio", "mesa", "proceso"];
    const done = doors.filter((d) => closedDoorsToday.has(d)).length;
    return done / doors.length;
  }, [closedDoorsToday]);

  function startDoor(door: DoorId) {
    if (!process) return;
    if (state.activeDoor) return;

    if (process.status === "closed") {
      dispatch({
        type: "update_process",
        processId: process.id,
        patch: { status: "open", day_index: (process.day_index ?? 1) + 1 },
      });
    }

    const nowISO = new Date().toISOString();
    const sessionId = createId("s");
    dispatch({
      type: "start_session",
      session: {
        id: sessionId,
        process_id: process.id,
        date_key: todayKey,
        door,
        closed: false,
        started_at: nowISO,
      },
    });
    navigate(`/${door}`);
  }

  function goDoor(door: DoorId) {
    if (door !== "observacion" && !observationDoneToday) {
      navigate("/observacion");
      return;
    }
    startDoor(door);
  }

  const [helpOpen, setHelpOpen] = useState(false);
  const [cofreOpen, setCofreOpen] = useState(false);
  const [patternModal, setPatternModal] = useState<PatternId | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const hello = state.profile?.alias ? `Hola, ${state.profile.alias}` : "Hola";

  const entriesForProcess = useMemo(() => {
    if (!process) return [] as ConziaEntry[];
    return state.entriesV1.filter((e) => e.process_id === process.id);
  }, [process, state.entriesV1]);

  const entriesByRecency = useMemo(() => {
    const list = entriesForProcess.slice();
    list.sort((a, b) => ((a.created_at ?? "") < (b.created_at ?? "") ? 1 : -1));
    return list;
  }, [entriesForProcess]);

  const taggedRecency = useMemo(() => {
    return entriesByRecency.map((e) => ({ entry: e, tags: tagsForEntry(e) }));
  }, [entriesByRecency]);

  const patternDetails = useMemo(() => {
    if (!patternModal) return [];
    return taggedRecency
      .filter((r) => r.tags.includes(patternModal))
      .slice(0, 10)
      .map((r) => r.entry);
  }, [patternModal, taggedRecency]);

  const metrics = useMemo(() => {
    if (!process) return null;
    return computeMetrics({
      entries: state.entriesV1,
      sessions: state.sessions,
      processId: process.id,
      todayKey,
    });
  }, [process, state.entriesV1, state.sessions, todayKey]);

  const latestDesahogo = useMemo(() => {
    if (!process) return null;
    const list = state.entriesV1.filter(
      (e): e is Extract<ConziaEntry, { source: "desahogo" }> => e.source === "desahogo" && e.process_id === process.id,
    );
    list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return list[0] ?? null;
  }, [process, state.entriesV1]);

  const latestChallenge = useMemo(() => {
    if (!process) return null;
    const list = state.challenges.filter((c) => c.process_id === process.id);
    list.sort((a, b) => (a.accepted_at < b.accepted_at ? 1 : -1));
    return list[0] ?? null;
  }, [process, state.challenges]);

  const challengeNeedsEvidence = Boolean(
    latestChallenge &&
      latestChallenge.status === "active" &&
      !(latestChallenge.evidence && latestChallenge.evidence.trim().length >= 3),
  );

  function formatSilence(mins: number | null | undefined): string {
    if (mins === null || mins === undefined) return "—";
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <div className="min-h-[100svh] px-6 pb-14">
      {/* Header mejorado */}
      <div className="sticky top-0 z-20 -mx-6 px-6 pb-4 pt-7 bg-[#0b1220]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-white">CONZIA</div>
            <div className="mt-0.5 text-xs text-white/50">Ver claro.</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="relative rounded-full p-2 text-white/70 ring-1 ring-white/10 transition hover:bg-white/5 hover:text-white"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setCofreOpen(true)}
              className="rounded-full bg-white/10 p-2 text-white/90 ring-1 ring-white/15 transition hover:bg-white/15"
              aria-label="Perfil"
            >
              <div className="h-6 w-6 flex items-center justify-center text-xs font-semibold">
                {state.profile?.alias?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Card - Estado de Sesión */}
      <div className="mt-6">
        <SessionHeroCard
          dayIndex={process?.day_index ?? 1}
          totalDays={90}
          currentDoor={observationDoneToday ? "Observación completa" : "Pendiente"}
          arquetipo={
            state.profile?.arquetipo_dominante
              ? `${state.profile.arquetipo_dominante.charAt(0).toUpperCase()}${state.profile.arquetipo_dominante.slice(1)}`
              : undefined
          }
          friccion={
            state.profile?.tema_base
              ? FRICCION_LABEL[state.profile.tema_base as ConziaFriccion]
              : undefined
          }
        />
      </div>

      {/* Métricas */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <MetricCard>
          <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Progreso</div>
          <div className="flex items-baseline gap-1">
            <div className="text-2xl font-semibold text-white">{Math.round(overallProgress * 100)}</div>
            <div className="text-sm text-white/50">%</div>
          </div>
          <div className="mt-1 text-xs text-white/60">Hoy</div>
        </MetricCard>

        <MetricCard>
          <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Racha</div>
          <div className="flex items-baseline gap-1">
            <div className="text-2xl font-semibold text-white">{process?.day_index ?? 1}</div>
            <div className="text-sm text-white/50">días</div>
          </div>
          <div className="mt-1 text-xs text-white/60">Consecutivos</div>
        </MetricCard>
      </div>

      {/* Tu Próximo Paso - CTA Contextual */}
      <div className="mt-6">
        <NextStepCTA
          title={observationDoneToday ? "Consultorio Disponible" : "Observación Pendiente"}
          message={
            observationDoneToday
              ? "Tu analista revisó tu observación. Es momento de profundizar en lo que nombraste."
              : "Ayer dejaste el día sin observar. Necesito ver qué pasó antes de seguir con el análisis."
          }
          actionLabel={observationDoneToday ? "ENTRAR AL CONSULTORIO" : "OBSERVAR AHORA"}
          onAction={() => (observationDoneToday ? goDoor("consultorio") : navigate("/observacion"))}
          variant={observationDoneToday ? "info" : "warning"}
        />
      </div>

      {/* Puertas Disponibles */}
      <div className="mt-8">
        <div className="text-xs tracking-wider text-white/50 uppercase mb-4">Puertas</div>
        <div className="grid grid-cols-2 gap-3">
          <DoorCard
            icon={<Eye className="h-6 w-6" />}
            label="Observación"
            status={observationDoneToday ? "completed" : "available"}
            onClick={() => goDoor("observacion")}
          />
          <DoorCard
            icon={<MessageCircle className="h-6 w-6" />}
            label="Consultorio"
            status={observationDoneToday ? "available" : "locked"}
            onClick={() => goDoor("consultorio")}
          />
          <DoorCard
            icon={<LayoutGrid className="h-6 w-6" />}
            label="Mesa"
            status={closedDoorsToday.has("consultorio") ? "available" : "locked"}
            onClick={() => goDoor("mesa")}
          />
          <DoorCard
            icon={<Home className="h-6 w-6" />}
            label="Proceso"
            status={closedDoorsToday.has("mesa") ? "available" : "locked"}
            onClick={() => goDoor("proceso")}
          />
        </div>
      </div>

      {/* Reflection Card - Consultorio Voice */}
      <div className="mt-6">
        {(latestDesahogo?.analysis.reflection || todayPlan?.cutLine) && (
          <div className="rounded-[28px] bg-gradient-to-br from-white/5 to-white/10 ring-1 ring-white/10 backdrop-blur-xl px-6 py-5 text-white">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-camel/20 p-2.5">
                <MessageSquare className="h-5 w-5 text-camel" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-white/60 mb-2">Reflexión del Analista</div>
                <div className="text-sm leading-relaxed text-white/90 whitespace-pre-line">
                  {latestDesahogo?.analysis.reflection ?? todayPlan?.cutLine ?? ""}
                </div>
                {latestDesahogo?.analysis?.question && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-sm italic text-white/70">
                    "{latestDesahogo.analysis.question}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Challenge Status */}
        {latestChallenge && (
          <div className="mt-4 rounded-[28px] bg-white/5 ring-1 ring-white/10 px-5 py-3 flex items-center gap-3">
            <Target className="h-4 w-4 text-camel" />
            <div className="flex-1 text-sm text-white/80">
              {challengeNeedsEvidence
                ? `Reto activo · falta evidencia · vence ${toISODateOnly(new Date(latestChallenge.due_at))}`
                : `Último reto: ${latestChallenge.status === "completed" ? "cumplido" : latestChallenge.status}`}
            </div>
          </div>
        )}
      </div>

      {/* Pattern Detection Section */}
      <div className="mt-6">
        <div className="rounded-[28px] bg-white/5 ring-1 ring-white/10 backdrop-blur-xl px-6 py-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-xs font-medium tracking-[0.15em] text-white/50 uppercase">Patrones</div>
              <div className="text-sm text-white/70 mt-1">Mecanismos que se repiten</div>
            </div>
            <TrendingUp className="h-5 w-5 text-camel/60" />
          </div>

          <div className="space-y-3">
            {FIXED_PATTERNS.map((pid) => {
              const status = metrics?.patternStatus[pid] ?? "Iniciando";
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setPatternModal(pid)}
                  className="w-full rounded-[22px] bg-white/5 hover:bg-white/10 ring-1 ring-white/10 px-5 py-4 text-left transition group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white group-hover:text-camel transition">
                        {PATTERN_LABEL[pid]}
                      </div>
                      <div className="mt-1 text-xs text-white/60">{status}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-camel group-hover:translate-x-0.5 transition" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Emotional State Today */}
        <div className="mt-6 rounded-[28px] bg-white/5 ring-1 ring-white/10 backdrop-blur-xl px-6 py-6">
          <div className="text-xs font-medium tracking-[0.15em] text-white/50 uppercase mb-5">Cómo estás hoy</div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[20px] bg-white/5 ring-1 ring-white/10 px-4 py-4 text-center">
              <div className="text-[11px] text-white/60 mb-2">Carga emocional</div>
              <div className="text-2xl font-semibold text-white">
                {metrics?.cargaEmocionalHoy === null || metrics?.cargaEmocionalHoy === undefined
                  ? "—"
                  : metrics.cargaEmocionalHoy.toFixed(1)}
              </div>
            </div>
            <div className="rounded-[20px] bg-white/5 ring-1 ring-white/10 px-4 py-4 text-center">
              <div className="text-[11px] text-white/60 mb-2">Estabilidad</div>
              <div className="text-2xl font-semibold text-white">
                {metrics?.estabilidadScore === null || metrics?.estabilidadScore === undefined
                  ? "—"
                  : `${metrics.estabilidadScore}/10`}
              </div>
            </div>
            <div className="rounded-[20px] bg-white/5 ring-1 ring-white/10 px-4 py-4 text-center">
              <div className="text-[11px] text-white/60 mb-2">Silencio</div>
              <div className="text-2xl font-semibold text-white">
                {formatSilence(metrics?.silencioMinutos)}
              </div>
            </div>
          </div>
        </div>

        {/* Health Trend Chart */}
        <div className="mt-6 rounded-[28px] bg-white/5 ring-1 ring-white/10 backdrop-blur-xl px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-medium tracking-[0.15em] text-white/50 uppercase">Tu ritmo</div>
              <div className="text-sm text-white/70 mt-1">Índice de salud (7 días)</div>
            </div>
            <Activity className="h-5 w-5 text-camel/60" />
          </div>
          
          {metrics && metrics.chart.dataPoints >= 2 ? (
            <div className="mt-4 text-camel">
              <MiniSparkline values={metrics.chart.values.map((v) => v ?? 0)} />
            </div>
          ) : null}
          
          {metrics && metrics.chart.dataPoints < 7 && (
            <div className="mt-3 text-sm text-white/60 italic">
              Aún construyendo tu línea base...
            </div>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAnalysisOpen(true)}
            className="rounded-[24px] bg-white/5 hover:bg-white/10 ring-1 ring-white/10 px-5 py-4 text-left transition group"
          >
            <Search className="h-5 w-5 text-camel mb-2" />
            <div className="text-sm font-medium text-white group-hover:text-camel transition">
              Patrón detectado
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => navigate("/resultados")}
            className="rounded-[24px] bg-white/5 hover:bg-white/10 ring-1 ring-white/10 px-5 py-4 text-left transition group"
          >
            <Sparkles className="h-5 w-5 text-camel mb-2" />
            <div className="text-sm font-medium text-white group-hover:text-camel transition">
              Ver Oráculo
            </div>
          </button>
        </div>
      </div>

      {/* Modals */}

      <Modal
        open={helpOpen}
        title="Ayuda"
        description="Una cosa por sesión."
        onClose={() => setHelpOpen(false)}
      >
        <div className="space-y-3 text-sm text-outer-space/80">
          <div>Entra a una puerta. Sostén el circuito. Cierra.</div>
          <div>Si te bloqueas, vuelve a la puerta activa y usa “Cerrar sesión”.</div>
          {import.meta.env.DEV ? (
            <div className="text-xs text-outer-space/60">DEV: Proceso incluye exportación del estado persistido.</div>
          ) : null}
        </div>
      </Modal>

      <Modal open={cofreOpen} title="Cofre" description="Próximamente." onClose={() => setCofreOpen(false)}>
        <div className="text-sm text-outer-space/80">Próximamente.</div>
      </Modal>

      <Modal
        open={Boolean(patternModal)}
        title={patternModal ? PATTERN_LABEL[patternModal] : "Detalles"}
        description="Últimas entradas relacionadas."
        onClose={() => setPatternModal(null)}
      >
        <div className="space-y-3">
          {patternDetails.length ? (
            patternDetails.map((e) => {
              const text =
                e.source === "consultorio" || e.source === "mesa"
                  ? e.hecho
                  : e.source === "quick"
                    ? e.fact_line
                    : e.source === "desahogo"
                      ? e.text
                    : e.source === "puerta1_observacion"
                      ? e.fact_line
                      : "";
              return (
                <div key={e.id} className="rounded-2xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-3">
                  <div className="text-xs text-outer-space/60">{entrySourceLabel(e.source)}</div>
                  <div className="mt-1 text-sm font-semibold tracking-tight text-outer-space">{text}</div>
                  <div className="mt-1 text-xs text-outer-space/60">{formatDateTimeEsMX(e.created_at)}</div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-outer-space/70">Aún sin datos suficientes.</div>
          )}
        </div>
      </Modal>

      <Modal
        open={analysisOpen}
        title="Patrón detectado"
        description="Resumen de conducción (desde Observación Inicial)."
        onClose={() => setAnalysisOpen(false)}
      >
        {latestObservation ? (
          <div className="space-y-3 text-sm text-outer-space/80">
            <div>Fricción hoy: {FRICCION_LABEL[latestObservation.friccion_hoy]}</div>
            <div>Mecanismo: {TRAP_LABEL[latestObservation.trap_selected]}</div>
            <div>Puerta recomendada: {latestObservation.today_plan.recommendedDoor === "mesa" ? "Mesa" : "Consultorio"}</div>
            <div>Corte: {latestObservation.today_plan.cutLine}</div>
          </div>
        ) : (
          <div className="text-sm text-outer-space/70">Completa Observación Inicial para ver esto.</div>
        )}
      </Modal>
    </div>
  );
}
