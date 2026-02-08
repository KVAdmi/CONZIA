import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Chip from "../components/ui/Chip";
import RadialProgress from "../components/ui/RadialProgress";
import Textarea from "../components/ui/Textarea";
import { conziaGuidanceProfile, todayPlanFromProfile } from "../engine/conziaMotor";
import { narrativeScore } from "../engine/observacion";
import { useConzia } from "../state/conziaStore";
import type { ConziaFriccion, ConziaTrap } from "../types/models";
import { createId } from "../utils/id";
import { toISODateOnly } from "../utils/dates";

const FRICCION_OPTS: Array<{ id: ConziaFriccion; label: string }> = [
  { id: "limites", label: "Límites" },
  { id: "abandono_propio", label: "Abandono propio" },
  { id: "control", label: "Control" },
  { id: "verguenza", label: "Vergüenza" },
  { id: "dependencia", label: "Dependencia" },
  { id: "autoengano", label: "Autoengaño" },
];

const TRAP_OPTIONS: Array<{ label: string; trap: ConziaTrap }> = [
  { label: "Actué sin nombrarlo", trap: "ACTION_WITHOUT_TRUTH" },
  { label: "Lo analicé sin cerrarlo", trap: "INFINITE_ANALYSIS" },
  { label: "Lo convertí en culpa", trap: "GUILT_PERFORMANCE" },
  { label: "Lo volví insight bonito", trap: "PRETTY_INSIGHT" },
];

function paceLabel(pace: string): string {
  if (pace === "FAST") return "Alto, directo";
  if (pace === "MEDIUM") return "Medio, sobrio";
  if (pace === "MEDIUM_SLOW") return "Medio-bajo, relacional";
  return "Variable, por patrón";
}

function doorLabel(door: string): string {
  if (door === "mesa") return "Mesa";
  return "Consultorio";
}

export default function ObservacionPage() {
  const navigate = useNavigate();
  const { state, dispatch, storageKey } = useConzia();

  const profile = state.profile;
  const process = useMemo(() => {
    const pick = state.activeProcessId
      ? state.processes.find((p) => p.id === state.activeProcessId)
      : undefined;
    return pick ?? state.processes[0] ?? null;
  }, [state.activeProcessId, state.processes]);

  useEffect(() => {
    if (!process) return;
    if (state.activeDoor === "observacion" && state.activeSessionId) return;
    if (state.activeDoor) return;

    const nowISO = new Date().toISOString();
    dispatch({
      type: "start_session",
      session: {
        id: createId("s"),
        process_id: process.id,
        date_key: toISODateOnly(new Date()),
        door: "observacion",
        closed: false,
        started_at: nowISO,
      },
    });
  }, [dispatch, process, state.activeDoor, state.activeSessionId]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [factLine, setFactLine] = useState("");
  const [friccionHoy, setFriccionHoy] = useState<ConziaFriccion | null>(null);
  const [trapSelected, setTrapSelected] = useState<ConziaTrap | null>(null);

  const score = useMemo(() => narrativeScore(factLine), [factLine]);
  const hechoValido = score <= 1;

  const progress = step === 1 ? 0.25 : step === 2 ? 0.5 : step === 3 ? 0.75 : 1;
  const percent = Math.round(progress * 100);

  const plan = useMemo(() => {
    if (!profile) return null;
    const guidance = conziaGuidanceProfile({
      archetypeDominant: profile.arquetipo_dominante,
      archetypeConfidence: profile.confianza,
      friccionPrincipal: profile.tema_base,
      costoDominante: profile.costo_dominante,
    });
    return todayPlanFromProfile(guidance);
  }, [profile]);

  const trapMatches = Boolean(plan && trapSelected && plan.trap === trapSelected);
  const friccionVariante = Boolean(profile && friccionHoy && friccionHoy !== profile.tema_base);

  const draftKey = useMemo(() => {
    if (!state.activeSessionId) return null;
    return `${storageKey}_draft_observacion_${state.activeSessionId}`;
  }, [state.activeSessionId, storageKey]);

  const draftLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!draftKey) return;
    if (draftLoadedRef.current === draftKey) return;
    draftLoadedRef.current = draftKey;

    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsedUnknown = JSON.parse(raw) as unknown;
      if (!parsedUnknown || typeof parsedUnknown !== "object") return;
      const parsed = parsedUnknown as Record<string, unknown>;

      const parsedStep = parsed.step;
      if (typeof parsedStep === "number" && [1, 2, 3, 4].includes(parsedStep)) {
        setStep(parsedStep as 1 | 2 | 3 | 4);
      }

      const parsedFact = parsed.factLine;
      if (typeof parsedFact === "string") setFactLine(parsedFact);

      const parsedFriccion = parsed.friccionHoy;
      if (typeof parsedFriccion === "string" && FRICCION_OPTS.some((o) => o.id === parsedFriccion)) {
        setFriccionHoy(parsedFriccion as ConziaFriccion);
      }

      const parsedTrap = parsed.trapSelected;
      if (typeof parsedTrap === "string" && TRAP_OPTIONS.some((t) => t.trap === parsedTrap)) {
        setTrapSelected(parsedTrap as ConziaTrap);
      }
    } catch {
      // ignore
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ step, factLine, friccionHoy, trapSelected }),
      );
    } catch {
      // ignore
    }
  }, [draftKey, factLine, friccionHoy, step, trapSelected]);

  function clearDraft() {
    if (!draftKey) return;
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
  }

  function closeWithoutSaving() {
    if (!state.activeSessionId || !process) return;
    clearDraft();
    const nowISO = new Date().toISOString();
    dispatch({ type: "close_session", sessionId: state.activeSessionId, closedAt: nowISO });
    dispatch({ type: "update_process", processId: process.id, patch: { last_closed_at: nowISO } });
    navigate("/sesion", { replace: true });
  }

  function closeWithEntry() {
    if (!state.activeSessionId || !process || !profile || !plan) return;
    if (!friccionHoy || !trapSelected) return;
    if (!factLine.trim() || !hechoValido) return;

    clearDraft();
    const nowISO = new Date().toISOString();
    dispatch({
      type: "add_entry_v1",
      entry: {
        id: createId("e"),
        process_id: process.id,
        session_id: state.activeSessionId,
        source: "puerta1_observacion",
        fact_line: factLine.trim(),
        hecho_valido: true,
        narrative_score: score,
        friccion_hoy: friccionHoy,
        friccion_variante: friccionVariante,
        trap_selected: trapSelected,
        trap_matches_archetype: trapMatches,
        today_plan: plan,
        created_at: nowISO,
        closed_at: nowISO,
      },
    });
    dispatch({ type: "close_session", sessionId: state.activeSessionId, closedAt: nowISO });
    dispatch({ type: "update_process", processId: process.id, patch: { last_closed_at: nowISO } });
    navigate("/sesion", { replace: true });
  }

  function closeSession() {
    if (step === 4) {
      closeWithEntry();
      return;
    }
    closeWithoutSaving();
  }

  const canContinue1 = factLine.trim().length >= 3 && hechoValido;
  const canContinue2 = Boolean(friccionHoy);
  const canContinue3 = Boolean(trapSelected);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-14">
      <div className="sticky top-0 z-20 -mx-4 px-4 pb-5 pt-10 bg-[#0b1220]/55 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4 text-white">
          <div className="min-w-0">
            <div className="text-[22px] font-semibold tracking-tight">Observación Inicial</div>
            <div className="mt-1 text-xs text-white/65">Sesión activa</div>
          </div>
          <Button variant="primary" size="sm" onClick={closeSession} type="button">
            Cerrar sesión
          </Button>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <RadialProgress value={progress} size={240} strokeWidth={16}>
          <div className="text-center text-white">
            <div className="text-xs tracking-[0.18em] text-white/60">PROGRESO</div>
            <div className="mt-2 text-4xl font-semibold tracking-tight">{percent}%</div>
            <div className="mt-2 text-xs text-white/65">Tu proceso está activo</div>
          </div>
        </RadialProgress>
      </div>

      {step === 1 ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Página 1/4 · Hecho en una línea</div>
          <div className="mt-3 text-lg font-semibold tracking-tight text-outer-space">
            No quiero una historia. Quiero el hecho.
          </div>
          <div className="mt-3 text-sm text-outer-space/70">Una frase. Observable.</div>

          <Textarea
            className="mt-5 min-h-[140px]"
            value={factLine}
            onChange={(e) => setFactLine(e.target.value)}
            placeholder="Hecho: qué se dijo / qué se hizo."
          />

          {!hechoValido && factLine.trim().length ? (
            <div className="mt-3 text-sm text-outer-space/75">No quiero una historia. Quiero el hecho.</div>
          ) : null}

          <div className="mt-6 flex justify-end">
            <Button variant="primary" disabled={!canContinue1} onClick={() => setStep(2)} type="button">
              Continuar
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Página 2/4 · Fricción activa hoy</div>
          <div className="mt-3 text-lg font-semibold tracking-tight text-outer-space">Elige una.</div>

          <div className="mt-5 flex flex-wrap gap-2">
            {FRICCION_OPTS.map((o) => (
              <Chip
                key={o.id}
                selected={friccionHoy === o.id}
                onClick={() => setFriccionHoy(o.id)}
                type="button"
              >
                {o.label}
              </Chip>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep(1)} type="button">
              Atrás
            </Button>
            <Button variant="primary" disabled={!canContinue2} onClick={() => setStep(3)} type="button">
              Seguir
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Página 3/4 · Mecanismo de huida</div>
          <div className="mt-3 text-lg font-semibold tracking-tight text-outer-space">Elige una.</div>

          <div className="mt-5 grid grid-cols-1 gap-2">
            {TRAP_OPTIONS.map((o) => {
              const isActive = trapSelected === o.trap;
              return (
                <button
                  key={o.trap}
                  type="button"
                  onClick={() => setTrapSelected(o.trap)}
                  className={
                    isActive
                      ? "w-full rounded-2xl bg-mint-cream ring-1 ring-gainsboro/70 px-4 py-4 text-left"
                      : "w-full rounded-2xl bg-white ring-1 ring-gainsboro/70 px-4 py-4 text-left transition hover:bg-mint-cream/50"
                  }
                  aria-pressed={isActive}
                >
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{o.label}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep(2)} type="button">
              Atrás
            </Button>
            <Button variant="primary" disabled={!canContinue3} onClick={() => setStep(4)} type="button">
              Ver plan
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Página 4/4 · Plan de conducción hoy</div>
          <div className="mt-3 text-lg font-semibold tracking-tight text-outer-space">Hoy CONZIA te va a guiar así</div>

          <div className="mt-5 space-y-3 rounded-2xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-5 py-4">
            <div className="text-sm text-outer-space/80">Ritmo: {paceLabel(plan?.pace ?? "")}</div>
            <div className="text-sm text-outer-space/80">
              Puerta recomendada: {doorLabel(plan?.recommendedDoor ?? "consultorio")}
            </div>
            <div className="text-sm text-outer-space/80">Corte: {plan?.cutLine ?? "—"}</div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep(3)} type="button">
              Atrás
            </Button>
            <div className="text-sm text-outer-space/70">Cierra la sesión para salir.</div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
