import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Range from "../components/ui/Range";
import Select from "../components/ui/Select";
import Textarea from "../components/ui/Textarea";
import { useConzia } from "../state/conziaStore";
import { createId } from "../utils/id";
import { toISODateOnly } from "../utils/dates";
import type { EntryBoundary, EntryContext, RepeatSignal } from "../types/models";

const CONTEXTS: EntryContext[] = ["familia", "trabajo", "pareja", "social", "yo"];
const BOUNDARIES: EntryBoundary[] = ["tiempo", "respeto", "cuerpo", "dinero", "decision", "intimidad"];
const REPEAT: RepeatSignal[] = ["no", "creo_que_si", "si"];

function repeatLabel(v: RepeatSignal): string {
  if (v === "no") return "No";
  if (v === "creo_que_si") return "Creo que sí";
  return "Sí";
}

export default function MesaPage() {
  const navigate = useNavigate();
  const { state, dispatch, storageKey } = useConzia();

  const process = useMemo(() => {
    const pick = state.activeProcessId
      ? state.processes.find((p) => p.id === state.activeProcessId)
      : undefined;
    return pick ?? state.processes[0] ?? null;
  }, [state.activeProcessId, state.processes]);

  useEffect(() => {
    if (!process) return;
    if (state.activeDoor === "mesa" && state.activeSessionId) return;
    if (state.activeDoor) return;

    const nowISO = new Date().toISOString();
    dispatch({
      type: "start_session",
      session: {
        id: createId("s"),
        process_id: process.id,
        date_key: toISODateOnly(new Date()),
        door: "mesa",
        closed: false,
        started_at: nowISO,
      },
    });
  }, [dispatch, process, state.activeDoor, state.activeSessionId]);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [hecho, setHecho] = useState("");
  const [contexto, setContexto] = useState<EntryContext>("yo");
  const [limite, setLimite] = useState<EntryBoundary>("respeto");
  const [rol, setRol] = useState("");
  const [peso, setPeso] = useState(6);
  const [repeticion, setRepeticion] = useState<RepeatSignal>("no");
  const [status, setStatus] = useState<string | null>(null);

  const draftKey = useMemo(() => {
    if (!state.activeSessionId) return null;
    return `${storageKey}_draft_mesa_${state.activeSessionId}`;
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
      if (typeof parsedStep === "number" && [0, 1, 2].includes(parsedStep)) {
        setStep(parsedStep as 0 | 1 | 2);
      }

      const parsedHecho = parsed.hecho;
      if (typeof parsedHecho === "string") setHecho(parsedHecho);

      const parsedContexto = parsed.contexto;
      if (typeof parsedContexto === "string" && CONTEXTS.includes(parsedContexto as EntryContext)) {
        setContexto(parsedContexto as EntryContext);
      }

      const parsedLimite = parsed.limite;
      if (typeof parsedLimite === "string" && BOUNDARIES.includes(parsedLimite as EntryBoundary)) {
        setLimite(parsedLimite as EntryBoundary);
      }

      const parsedRol = parsed.rol;
      if (typeof parsedRol === "string") setRol(parsedRol);

      const parsedPeso = parsed.peso;
      if (typeof parsedPeso === "number" && Number.isFinite(parsedPeso)) {
        const clamped = Math.min(10, Math.max(0, Math.round(parsedPeso)));
        setPeso(clamped);
      }

      const parsedRepeticion = parsed.repeticion;
      if (typeof parsedRepeticion === "string" && REPEAT.includes(parsedRepeticion as RepeatSignal)) {
        setRepeticion(parsedRepeticion as RepeatSignal);
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
        JSON.stringify({
          step,
          hecho,
          contexto,
          limite,
          rol,
          peso,
          repeticion,
        }),
      );
    } catch {
      // ignore
    }
  }, [contexto, draftKey, hecho, limite, peso, repeticion, rol, step]);

  function clearDraft() {
    if (!draftKey) return;
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
  }

  const canContinue = hecho.trim().length >= 3 && rol.trim().length >= 2;

  const progressLabel = useMemo(() => {
    if (step === 0) return "Preparación";
    if (step === 1) return "Escritura";
    return "Cierre";
  }, [step]);

  function closeWithoutSaving() {
    if (!state.activeSessionId || !process) return;
    clearDraft();
    const nowISO = new Date().toISOString();
    dispatch({ type: "close_session", sessionId: state.activeSessionId, closedAt: nowISO });
    dispatch({ type: "update_process", processId: process.id, patch: { last_closed_at: nowISO } });
    navigate("/sesion", { replace: true });
  }

  function closeSession() {
    if (step === 2 && canContinue) {
      saveAndClose();
      return;
    }
    closeWithoutSaving();
  }

  function saveAndClose() {
    if (!state.activeSessionId || !process) return;
    const clean = hecho.trim();
    if (clean.length < 3) {
      setStatus("Escribe un hecho concreto.");
      return;
    }
    if (rol.trim().length < 2) {
      setStatus("Completa el rol.");
      return;
    }

    const nowISO = new Date().toISOString();
    clearDraft();
    dispatch({
      type: "add_entry_v1",
      entry: {
        id: createId("e"),
        process_id: process.id,
        session_id: state.activeSessionId,
        source: "mesa",
        hecho: clean,
        contexto,
        limite,
        rol: rol.trim(),
        peso,
        repeticion_flag: repeticion,
        created_at: nowISO,
      },
    });
    dispatch({ type: "close_session", sessionId: state.activeSessionId, closedAt: nowISO });
    dispatch({
      type: "update_process",
      processId: process.id,
      patch: { last_closed_at: nowISO },
    });
    navigate("/sesion", { replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-14">
      <div className="sticky top-0 z-20 -mx-4 px-4 pb-4 pt-10 bg-[#0b1220]/55 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4 text-white">
          <div className="min-w-0">
            <div className="text-[22px] font-semibold tracking-tight">Mesa — Escritura Estructurada</div>
            <div className="mt-1 text-xs text-white/65">Sesión activa</div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/10">
              <span className="inline-block h-2 w-2 rounded-full bg-white/60" aria-hidden />
              {progressLabel} · Preparación → Escritura → Cierre
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={closeSession} type="button">
            Cerrar sesión
          </Button>
        </div>
      </div>

      {step === 0 ? (
        <Card className="mt-4 p-6">
          <div className="text-xs text-morning-blue">Preparación</div>
          <div className="mt-3 text-lg font-semibold tracking-tight text-outer-space">
            Una línea. Un hecho. Sin explicar.
          </div>
          <div className="mt-3 text-sm text-outer-space/70">Entras, escribes, cierras.</div>

          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={() => setStep(1)} type="button">
              Empezar
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="mt-4 p-6">
          <div className="text-xs text-morning-blue">Escritura</div>
          <div className="mt-2 text-sm text-outer-space/70">Campos obligatorios. Sin narrativa.</div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="text-xs font-medium text-outer-space/70">Hecho (observable)</div>
              <Textarea
                className="mt-2 min-h-[160px]"
                value={hecho}
                onChange={(e) => setHecho(e.target.value)}
                placeholder="Qué pasó. Qué se dijo. Qué se hizo."
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="text-xs font-medium text-outer-space/70">Contexto</div>
                <Select className="mt-2" value={contexto} onChange={(e) => setContexto(e.target.value as EntryContext)}>
                  {CONTEXTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <div className="text-xs font-medium text-outer-space/70">Límite tocado</div>
                <Select className="mt-2" value={limite} onChange={(e) => setLimite(e.target.value as EntryBoundary)}>
                  {BOUNDARIES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <div className="text-xs font-medium text-outer-space/70">Rol (en una palabra)</div>
                <Input className="mt-2" value={rol} onChange={(e) => setRol(e.target.value)} placeholder="hijo, jefa, pareja, amigo…" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="text-xs font-medium text-outer-space/70">Peso (0–10)</div>
                <div className="mt-3 flex items-center gap-3">
                  <Range value={peso} onChange={setPeso} ariaLabel="Peso" />
                  <div className="w-10 text-right text-sm font-medium text-outer-space">{peso}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-outer-space/70">¿Se repite?</div>
                <Select className="mt-2" value={repeticion} onChange={(e) => setRepeticion(e.target.value as RepeatSignal)}>
                  {REPEAT.map((v) => (
                    <option key={v} value={v}>
                      {repeatLabel(v)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {status ? <div className="mt-4 text-sm text-outer-space/75">{status}</div> : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep(0)} type="button">
              Atrás
            </Button>
            <Button variant="primary" disabled={!canContinue} onClick={() => setStep(2)} type="button">
              Ver cierre
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="mt-4 p-6">
          <div className="text-xs text-morning-blue">Cierre</div>
          <div className="mt-2 text-sm text-outer-space/70">Esto queda registrado como hecho.</div>

          <div className="mt-5 rounded-2xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-5 py-4">
            <div className="text-sm font-semibold tracking-tight text-outer-space">{hecho.trim()}</div>
            <div className="mt-2 text-xs text-outer-space/60">
              {contexto} · {limite} · rol {rol.trim()} · peso {peso} · {repeatLabel(repeticion)}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep(1)} type="button">
              Editar
            </Button>
            <div className="text-sm text-outer-space/70">Cierra la sesión para salir.</div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
