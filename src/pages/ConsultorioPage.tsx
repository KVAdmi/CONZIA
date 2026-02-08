import { useEffect, useMemo, useState } from "react";
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

export default function ConsultorioPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useConzia();

  const process = useMemo(() => {
    const pick = state.activeProcessId
      ? state.processes.find((p) => p.id === state.activeProcessId)
      : undefined;
    return pick ?? state.processes[0] ?? null;
  }, [state.activeProcessId, state.processes]);

  useEffect(() => {
    if (!process) return;
    if (state.activeDoor === "consultorio" && state.activeSessionId) return;
    if (state.activeDoor) return;

    const nowISO = new Date().toISOString();
    dispatch({
      type: "start_session",
      session: {
        id: createId("s"),
        process_id: process.id,
        date_key: toISODateOnly(new Date()),
        door: "consultorio",
        closed: false,
        started_at: nowISO,
      },
    });
  }, [dispatch, process, state.activeDoor, state.activeSessionId]);

  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);

  const [hecho, setHecho] = useState("");
  const [contexto, setContexto] = useState<EntryContext>("yo");
  const [limite, setLimite] = useState<EntryBoundary>("respeto");
  const [rol, setRol] = useState("");
  const [peso, setPeso] = useState(6);
  const [repeticion, setRepeticion] = useState<RepeatSignal>("no");

  const canTurn1 = hecho.trim().length >= 3;
  const canTurn2 = rol.trim().length >= 2;

  function closeWithoutSaving() {
    if (!state.activeSessionId || !process) return;
    const nowISO = new Date().toISOString();
    dispatch({ type: "close_session", sessionId: state.activeSessionId, closedAt: nowISO });
    dispatch({
      type: "update_process",
      processId: process.id,
      patch: { last_closed_at: nowISO },
    });
    navigate("/sesion", { replace: true });
  }

  function closeWithEntry() {
    if (!state.activeSessionId || !process) return;
    const nowISO = new Date().toISOString();
    dispatch({
      type: "add_entry_v1",
      entry: {
        id: createId("e"),
        process_id: process.id,
        session_id: state.activeSessionId,
        source: "consultorio",
        hecho: hecho.trim(),
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
      patch: { day_index: (process.day_index ?? 1) + 1, last_closed_at: nowISO },
    });
    navigate("/sesion", { replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-14 pt-10">
      <div className="flex items-center justify-between gap-3 text-white">
        <div>
          <div className="text-[26px] font-semibold tracking-tight">Consultorio</div>
          <div className="mt-1 text-sm text-white/65">Diálogo guiado. 3 turnos. Cierre obligatorio.</div>
        </div>
        <Button variant="quiet" size="sm" onClick={closeWithoutSaving} type="button">
          Cerrar
        </Button>
      </div>

      {step === 0 ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Encuadre</div>
          <div className="mt-3 text-lg font-semibold tracking-tight text-outer-space">
            No quiero una historia. Quiero el hecho.
          </div>
          <div className="mt-3 text-sm text-outer-space/70">
            Responde una cosa a la vez. Luego cierras.
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={() => setStep(1)} type="button">
              Empezar
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Turno 1</div>
          <div className="mt-2 text-sm font-semibold tracking-tight text-outer-space">¿Qué pasó?</div>
          <div className="mt-1 text-sm text-outer-space/70">Una línea. Observable. Sin justificar.</div>
          <Textarea
            className="mt-4 min-h-[160px]"
            value={hecho}
            onChange={(e) => setHecho(e.target.value)}
            placeholder="Hecho: qué se dijo / qué se hizo."
          />
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep(0)} type="button">
              Atrás
            </Button>
            <Button variant="primary" disabled={!canTurn1} onClick={() => setStep(2)} type="button">
              Continuar
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Turno 2</div>
          <div className="mt-2 text-sm font-semibold tracking-tight text-outer-space">Contexto y límite</div>

          <div className="mt-5 space-y-4">
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

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep(1)} type="button">
              Atrás
            </Button>
            <Button variant="primary" disabled={!canTurn2} onClick={() => setStep(3)} type="button">
              Continuar
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Turno 3</div>
          <div className="mt-2 text-sm font-semibold tracking-tight text-outer-space">Peso y repetición</div>

          <div className="mt-5 space-y-5">
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

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep(2)} type="button">
              Atrás
            </Button>
            <Button variant="primary" onClick={() => setStep(4)} type="button">
              Ver cierre
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="mt-7 p-6">
          <div className="text-xs text-morning-blue">Cierre</div>
          <div className="mt-2 text-sm text-outer-space/70">Esto queda registrado como hecho.</div>

          <div className="mt-5 rounded-2xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-5 py-4">
            <div className="text-sm font-semibold tracking-tight text-outer-space">{hecho.trim()}</div>
            <div className="mt-2 text-xs text-outer-space/60">
              {contexto} · {limite} · rol {rol.trim()} · peso {peso} · {repeatLabel(repeticion)}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setStep(3)} type="button">
              Editar
            </Button>
            <Button variant="primary" onClick={closeWithEntry} type="button">
              Cerrar consultorio
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
