import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, MessageCircle } from "lucide-react";
import MiniSparkline from "../components/charts/MiniSparkline";
import Modal from "../components/ui/Modal";
import RadialProgress from "../components/ui/RadialProgress";
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
	      <div className="sticky top-0 z-20 -mx-6 px-6 pb-4 pt-7 bg-[#0b1220]/35 backdrop-blur-md">
	        <div className="flex items-center justify-between gap-4 text-white">
	          <div className="min-w-0">
	            <div className="text-[22px] font-semibold tracking-tight">CONZIA</div>
	            <div className="mt-1 text-xs text-white/65">Inicio · Día {process?.day_index ?? 1}</div>
	          </div>
	          <div className="flex items-center gap-2">
	            <button
	              type="button"
	              onClick={() => setHelpOpen(true)}
	              className="rounded-2xl p-2 text-white/80 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white"
	              aria-label="Ayuda"
	            >
	              <MessageCircle className="h-5 w-5" aria-hidden />
	            </button>
	            <button
	              type="button"
	              onClick={() => setCofreOpen(true)}
	              className="rounded-2xl p-2 text-white/80 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white"
	              aria-label="Cofre"
	            >
	              <LockKeyhole className="h-5 w-5" aria-hidden />
	            </button>
	          </div>
	        </div>

        {process?.status === "closed" ? (
          <div className="mt-3 text-xs text-white/70">El día anterior fue cerrado.</div>
        ) : null}
      </div>

      <div className="mt-4 flex justify-center">
        <RadialProgress value={overallProgress} size={250} strokeWidth={18}>
          <div className="text-center text-white">
            <div className="text-xs tracking-[0.18em] text-white/60">TU PROCESO</div>
            <div className="mt-2 text-4xl font-semibold tracking-tight">{Math.round(overallProgress * 100)}%</div>
            <div className="mt-2 text-xs text-white/70">Tu proceso está activo</div>
            <div className="mt-1 text-xs text-white/55">No es lineal. Es acumulativo.</div>
          </div>
        </RadialProgress>
      </div>

	      <div className="mt-8 space-y-4">
	        <div className="rounded-[26px] bg-white/10 ring-1 ring-white/10 backdrop-blur-xl px-5 py-5 text-white">
	          <div className="text-xs tracking-[0.18em] text-white/60">DESAHOGO DE HOY</div>
	          <div className="mt-3 text-lg font-semibold tracking-tight">{hello}</div>
	          <div className="mt-2 text-sm text-white/75">
	            {challengeNeedsEvidence
	              ? "Tienes un reto activo. Necesitas evidencia para desbloquear el siguiente desahogo."
	              : "Tu sombra tiene algo que decirte. ¿Estás listo para escuchar?"}
	          </div>

	          <div className="mt-4 rounded-2xl bg-mint-cream/90 ring-1 ring-gainsboro/60 px-4 py-4 text-outer-space">
	            <div className="text-xs text-morning-blue">CONZIA</div>
	            <div className="mt-1 text-sm font-semibold tracking-tight whitespace-pre-line">
	              {latestDesahogo?.analysis.reflection ?? todayPlan?.cutLine ?? "—"}
	            </div>
	            <div className="mt-3 text-sm text-outer-space/80">
	              {latestDesahogo?.analysis.question ?? "¿Qué hecho vas a nombrar hoy, sin justificar?"}
	            </div>
	          </div>

	          {latestChallenge ? (
	            <div className="mt-4 text-xs text-white/70">
	              {challengeNeedsEvidence
	                ? `Reto activo · falta evidencia · vence ${toISODateOnly(new Date(latestChallenge.due_at))}`
	                : `Último reto: ${latestChallenge.status === "completed" ? "cumplido" : latestChallenge.status}`}
	            </div>
	          ) : null}

	          <div className="mt-5 grid grid-cols-2 gap-2">
	            <button
	              type="button"
	              onClick={() => navigate("/resultados")}
	              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/12"
	            >
	              Ver Oráculo
	            </button>
	            <button
	              type="button"
	              onClick={() => navigate("/desahogo")}
	              className="rounded-2xl bg-camel px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition hover:brightness-[0.98] active:scale-[0.99]"
	            >
	              IR AL DESAHOGO DE HOY
	            </button>
	          </div>

	          <div className="mt-4 flex items-center justify-between gap-3">
	            <button
	              type="button"
	              onClick={() => setAnalysisOpen(true)}
	              className="rounded-2xl px-3 py-2 text-xs text-white/85 ring-1 ring-white/15 transition hover:bg-white/10"
	            >
	              Patrón detectado
	            </button>
	            <button
	              type="button"
	              onClick={() => setCofreOpen(true)}
	              className="rounded-2xl px-3 py-2 text-xs text-white/85 ring-1 ring-white/15 transition hover:bg-white/10"
	            >
	              Abrir el Cofre
	            </button>
	          </div>
	        </div>

	        <div className="rounded-[26px] bg-white/10 ring-1 ring-white/10 backdrop-blur-xl px-5 py-5 text-white">
	          <div className="text-xs tracking-[0.18em] text-white/60">PATRONES QUE SE REPITEN</div>
	          <div className="mt-4 grid grid-cols-1 gap-3">
	            {FIXED_PATTERNS.map((pid) => {
	              const status = metrics?.patternStatus[pid] ?? "Iniciando";
	
	              return (
	                <div key={pid} className="rounded-2xl bg-[#0b1220]/55 ring-1 ring-white/10 px-4 py-4">
	                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold tracking-tight text-white">{PATTERN_LABEL[pid]}</div>
                      <div className="mt-1 text-xs text-white/65">{status}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPatternModal(pid)}
                      className="rounded-2xl px-3 py-2 text-xs text-white/85 ring-1 ring-white/15 transition hover:bg-white/10"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

	        <div className="rounded-[26px] bg-white/10 ring-1 ring-white/10 backdrop-blur-xl px-5 py-5 text-white">
	          <div className="text-xs tracking-[0.18em] text-white/60">CÓMO ESTÁS HOY</div>
	
	          <div className="mt-4 grid grid-cols-3 gap-2">
	            <div className="rounded-2xl bg-[#0b1220]/55 ring-1 ring-white/10 px-3 py-3">
	              <div className="text-[11px] text-white/65">Carga emocional</div>
	              <div className="mt-2 text-lg font-semibold tracking-tight">
	                {metrics?.cargaEmocionalHoy === null || metrics?.cargaEmocionalHoy === undefined
	                  ? "—"
	                  : metrics.cargaEmocionalHoy.toFixed(1)}
	              </div>
	            </div>
	            <div className="rounded-2xl bg-[#0b1220]/55 ring-1 ring-white/10 px-3 py-3">
	              <div className="text-[11px] text-white/65">Estabilidad</div>
	              <div className="mt-2 text-lg font-semibold tracking-tight">
	                {metrics?.estabilidadScore === null || metrics?.estabilidadScore === undefined
	                  ? "—"
	                  : `${metrics.estabilidadScore}/10`}
	              </div>
	            </div>
		            <div className="rounded-2xl bg-[#0b1220]/55 ring-1 ring-white/10 px-3 py-3">
		              <div className="text-[11px] text-white/65">Silencio</div>
		              <div className="mt-2 text-lg font-semibold tracking-tight">
                    {formatSilence(metrics?.silencioMinutos)}
                  </div>
		            </div>
		          </div>
		        </div>

	        <div className="rounded-[26px] bg-white/10 ring-1 ring-white/10 backdrop-blur-xl px-5 py-5 text-white">
	          <div className="flex items-center justify-between gap-4">
		            <div>
		              <div className="text-xs tracking-[0.18em] text-white/60">TU RITMO RECIENTE</div>
		              <div className="mt-2 text-sm text-white/70">Índice de salud (7 días)</div>
		            </div>
		          </div>
	          {metrics && metrics.chart.dataPoints >= 2 ? (
	            <div className="mt-4 text-camel">
	              <MiniSparkline values={metrics.chart.values.map((v) => v ?? 0)} />
	            </div>
	          ) : null}
	          {metrics && metrics.chart.dataPoints >= 7 ? null : (
	            <div className={metrics && metrics.chart.dataPoints >= 2 ? "mt-3 text-sm text-white/70" : "mt-4 text-sm text-white/70"}>
	              Aún construyendo tu línea base.
	            </div>
	          )}
	        </div>

        <div className="rounded-[26px] bg-white/10 ring-1 ring-white/10 backdrop-blur-xl px-5 py-5 text-white">
          <div className="text-xs tracking-[0.18em] text-white/60">PUERTAS</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(
              [
                { door: "observacion", title: "Observación", sub: "Ver sin intervenir" },
                { door: "consultorio", title: "Consultorio", sub: "Diálogo guiado" },
                { door: "mesa", title: "Mesa", sub: "Escritura estructurada" },
                { door: "proceso", title: "Proceso", sub: "Estado del día" },
              ] as const
            ).map((item) => {
              const done = closedDoorsToday.has(item.door);
              const blocked = item.door !== "observacion" && !observationDoneToday;
              const isRecommended =
                observationDoneToday && (item.door === "consultorio" || item.door === "mesa") && recommendedDoor === item.door;

              return (
                <button
                  key={item.door}
                  type="button"
                  onClick={() => goDoor(item.door)}
                  aria-disabled={blocked}
                  className={
                    blocked
                      ? "rounded-[22px] bg-[#0b1220]/55 ring-1 ring-white/10 px-4 py-4 text-left opacity-55"
                      : isRecommended
                        ? "rounded-[22px] bg-camel ring-1 ring-white/15 px-4 py-4 text-left shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:brightness-[0.98] active:scale-[0.99]"
                        : "rounded-[22px] bg-[#0b1220]/55 ring-1 ring-white/10 px-4 py-4 text-left transition hover:bg-[#0b1220]/65 active:scale-[0.99]"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold tracking-tight">{item.title}</div>
                      <div className="mt-1 text-xs text-white/70">{item.sub}</div>
                    </div>
                    <RadialProgress value={done ? 1 : 0} size={38} strokeWidth={6} />
                  </div>
                  {blocked ? <div className="mt-3 text-xs text-white/65">Bloqueada</div> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

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
