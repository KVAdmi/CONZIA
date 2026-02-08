import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DoorClosed } from "lucide-react";
import RadialProgress from "../components/ui/RadialProgress";
import { useConzia } from "../state/conziaStore";
import { createId } from "../utils/id";
import { toISODateOnly } from "../utils/dates";
import type { ConziaObservationEntry, DoorId } from "../types/models";

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

  const recommendedDoor = latestObservation?.today_plan.recommendedDoor ?? null;

  const overallProgress = useMemo(() => {
    const doors: DoorId[] = ["observacion", "consultorio", "mesa", "proceso"];
    const done = doors.filter((d) => closedDoorsToday.has(d)).length;
    return done / doors.length;
  }, [closedDoorsToday]);

  function startDoor(door: DoorId) {
    if (!process) return;
    if (state.activeDoor) return;
    if (!observationDoneToday && door !== "observacion") return;

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

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14">
      <div className="text-white">
        <div className="text-[24px] font-semibold tracking-tight">Dashboard</div>
        <div className="mt-2 text-sm text-white/65">Día {process?.day_index ?? 1}</div>
        {process?.status === "closed" ? <div className="mt-3 text-sm text-white/70">El día anterior fue cerrado.</div> : null}
      </div>

      <div className="mt-7 flex justify-center">
        <RadialProgress value={overallProgress} size={260} strokeWidth={18}>
          <div className="text-center text-white">
            <div className="text-xs tracking-[0.18em] text-white/60">TU PROCESO</div>
            <div className="mt-2 text-4xl font-semibold tracking-tight">{Math.round(overallProgress * 100)}%</div>
            <div className="mt-2 text-xs text-white/70">Tu proceso está activo</div>
            <div className="mt-1 text-xs text-white/55">No es lineal. Es acumulativo.</div>
          </div>
        </RadialProgress>
      </div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() => startDoor("observacion")}
          className="w-full rounded-[26px] bg-[#0b1220]/72 ring-1 ring-white/12 backdrop-blur-xl px-5 py-5 text-left text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition hover:bg-[#0b1220]/80 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">PUERTA 1 — Observación Inicial</div>
              <div className="mt-1 text-xs text-white/65">Ver sin intervenir</div>
            </div>
            <RadialProgress value={observationDoneToday ? 1 : 0} size={44} strokeWidth={6} />
          </div>
        </button>

        <button
          type="button"
          disabled={!observationDoneToday}
          onClick={() => startDoor("consultorio")}
          className={
            observationDoneToday
              ? "w-full rounded-[26px] bg-white/10 ring-1 ring-white/10 px-5 py-5 text-left text-white transition hover:bg-white/12 active:scale-[0.99]"
              : "w-full rounded-[26px] bg-white/10 ring-1 ring-white/10 px-5 py-5 text-left text-white opacity-50 cursor-not-allowed"
          }
          aria-disabled={!observationDoneToday}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">
                Consultorio{recommendedDoor === "consultorio" && observationDoneToday ? " (recomendado)" : ""}
              </div>
              <div className="mt-1 text-xs text-white/65">
                {observationDoneToday ? "Diálogo guiado" : "Bloqueada hasta cerrar Observación Inicial"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DoorClosed className="h-5 w-5 text-white/70" aria-hidden />
              <RadialProgress value={closedDoorsToday.has("consultorio") ? 1 : 0} size={44} strokeWidth={6} />
            </div>
          </div>
        </button>

        <button
          type="button"
          disabled={!observationDoneToday}
          onClick={() => startDoor("mesa")}
          className={
            observationDoneToday
              ? "w-full rounded-[26px] bg-white/10 ring-1 ring-white/10 px-5 py-5 text-left text-white transition hover:bg-white/12 active:scale-[0.99]"
              : "w-full rounded-[26px] bg-white/10 ring-1 ring-white/10 px-5 py-5 text-left text-white opacity-50 cursor-not-allowed"
          }
          aria-disabled={!observationDoneToday}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">
                Mesa{recommendedDoor === "mesa" && observationDoneToday ? " (recomendado)" : ""}
              </div>
              <div className="mt-1 text-xs text-white/65">
                {observationDoneToday ? "Escritura estructurada" : "Bloqueada hasta cerrar Observación Inicial"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DoorClosed className="h-5 w-5 text-white/70" aria-hidden />
              <RadialProgress value={closedDoorsToday.has("mesa") ? 1 : 0} size={44} strokeWidth={6} />
            </div>
          </div>
        </button>

        <button
          type="button"
          disabled={!observationDoneToday}
          onClick={() => startDoor("proceso")}
          className={
            observationDoneToday
              ? "w-full rounded-[26px] bg-white/10 ring-1 ring-white/10 px-5 py-5 text-left text-white transition hover:bg-white/12 active:scale-[0.99]"
              : "w-full rounded-[26px] bg-white/10 ring-1 ring-white/10 px-5 py-5 text-left text-white opacity-50 cursor-not-allowed"
          }
          aria-disabled={!observationDoneToday}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">Proceso</div>
              <div className="mt-1 text-xs text-white/65">
                {observationDoneToday ? "Estado del día" : "Bloqueada hasta cerrar Observación Inicial"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DoorClosed className="h-5 w-5 text-white/70" aria-hidden />
              <RadialProgress value={closedDoorsToday.has("proceso") ? 1 : 0} size={44} strokeWidth={6} />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
