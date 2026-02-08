import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FilePenLine, MessageCircle, Route } from "lucide-react";
import { useConzia } from "../state/conziaStore";
import { createId } from "../utils/id";
import { toISODateOnly } from "../utils/dates";
import type { DoorId } from "../types/models";

const THEME_LABEL: Record<string, string> = {
  p_001: "Falta de límites",
  p_002: "Apego a aprobación",
  p_003: "Evitación activa",
  p_004: "Rumiación circular",
  p_005: "Autoanulación",
  p_006: "Qué dirán estructural",
};

export default function SesionPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useConzia();

  const profile = state.profile;
  const process = useMemo(() => {
    const pick = state.activeProcessId
      ? state.processes.find((p) => p.id === state.activeProcessId)
      : undefined;
    return pick ?? state.processes[0] ?? null;
  }, [state.activeProcessId, state.processes]);

  const themeId = process?.tema_activo ?? profile?.tema_base ?? "";
  const themeLabel = THEME_LABEL[themeId] ?? "Proceso activo";

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
        date_key: toISODateOnly(new Date()),
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
        <div className="text-[28px] font-semibold tracking-tight">Hola, {profile?.alias ?? "—"}.</div>
        <div className="mt-2 text-sm text-white/65">Una cosa por sesión. Entra. Sostén. Cierra.</div>
      </div>

      <div className="mt-7 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] tracking-[0.18em] text-white/55">PROCESO ACTIVO</div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {themeLabel}
            </div>
            <div className="mt-3 text-sm leading-relaxed text-white/70">
              Día {process?.day_index ?? 1}. No buscamos “sentirse bien”. Buscamos ver claro.
            </div>
          </div>
          <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/10">
            <span className="inline-block h-2 w-2 rounded-full bg-white/60" aria-hidden />
            Fase 1
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => startDoor("consultorio")}
            className="w-full rounded-2xl bg-[#7D5C6B] px-5 py-4 text-left text-sm font-semibold tracking-wide text-white ring-1 ring-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:bg-[#6f5160] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4" aria-hidden />
                CONSULTORIO
              </span>
              <ArrowRight className="h-4 w-4 text-white/85" aria-hidden />
            </div>
            <div className="mt-2 text-xs text-white/60">Diálogo guiado (3 turnos) + cierre.</div>
          </button>

          <button
            type="button"
            onClick={() => startDoor("mesa")}
            className="w-full rounded-2xl bg-white/5 px-5 py-4 text-left text-sm font-semibold tracking-wide text-white ring-1 ring-white/10 transition hover:bg-white/8 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <FilePenLine className="h-4 w-4" aria-hidden />
                MESA
              </span>
              <ArrowRight className="h-4 w-4 text-white/70" aria-hidden />
            </div>
            <div className="mt-2 text-xs text-white/60">Escritura estructurada + cierre.</div>
          </button>

          <button
            type="button"
            onClick={() => startDoor("proceso")}
            className="w-full rounded-2xl bg-white/5 px-5 py-4 text-left text-sm font-semibold tracking-wide text-white ring-1 ring-white/10 transition hover:bg-white/8 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <Route className="h-4 w-4" aria-hidden />
                PROCESO
              </span>
              <ArrowRight className="h-4 w-4 text-white/70" aria-hidden />
            </div>
            <div className="mt-2 text-xs text-white/60">Estado mínimo + avance por cierres.</div>
          </button>
        </div>
      </div>
    </div>
  );
}
