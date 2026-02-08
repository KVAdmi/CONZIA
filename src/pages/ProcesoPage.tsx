import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useConzia } from "../state/conziaStore";
import { createId } from "../utils/id";
import { toISODateOnly } from "../utils/dates";

const THEME_LABEL: Record<string, string> = {
  limites: "Límites",
  abandono_propio: "Abandono propio",
  control: "Control",
  verguenza: "Vergüenza",
  dependencia: "Dependencia",
  autoengano: "Autoengaño",
};

export default function ProcesoPage() {
  const navigate = useNavigate();
  const { state, dispatch, storageKey } = useConzia();
  const [devStatus, setDevStatus] = useState<string | null>(null);

  const process = useMemo(() => {
    const pick = state.activeProcessId
      ? state.processes.find((p) => p.id === state.activeProcessId)
      : undefined;
    return pick ?? state.processes[0] ?? null;
  }, [state.activeProcessId, state.processes]);

  useEffect(() => {
    if (!process) return;
    if (state.activeDoor === "proceso" && state.activeSessionId) return;
    if (state.activeDoor) return;

    const nowISO = new Date().toISOString();
    dispatch({
      type: "start_session",
      session: {
        id: createId("s"),
        process_id: process.id,
        date_key: toISODateOnly(new Date()),
        door: "proceso",
        closed: false,
        started_at: nowISO,
      },
    });
  }, [dispatch, process, state.activeDoor, state.activeSessionId]);

  const themeLabel = process ? (THEME_LABEL[process.tema_activo] ?? process.tema_activo) : "—";

  const recentClosed = useMemo(() => {
    if (!process) return [];
    return state.sessions
      .filter((s) => s.process_id === process.id && s.closed)
      .slice()
      .sort((a, b) => (a.closed_at ?? "") < (b.closed_at ?? "") ? 1 : -1)
      .slice(0, 5);
  }, [process, state.sessions]);

  const entryCount = useMemo(() => {
    if (!process) return 0;
    return state.entriesV1.filter((e) => e.process_id === process.id).length;
  }, [process, state.entriesV1]);

  function closeDoor() {
    if (!state.activeSessionId || !process) return;
    const nowISO = new Date().toISOString();
    dispatch({ type: "close_session", sessionId: state.activeSessionId, closedAt: nowISO });
    dispatch({ type: "update_process", processId: process.id, patch: { last_closed_at: nowISO } });
    navigate("/sesion", { replace: true });
  }

  function closeDay() {
    if (!state.activeSessionId || !process) return;
    const nowISO = new Date().toISOString();
    dispatch({ type: "close_session", sessionId: state.activeSessionId, closedAt: nowISO });
    dispatch({
      type: "update_process",
      processId: process.id,
      patch: { status: "closed", last_closed_at: nowISO },
    });
    navigate("/sesion", { replace: true });
  }

  async function exportDebugJson() {
    let raw = "";
    try {
      raw = localStorage.getItem(storageKey) ?? "";
    } catch {
      raw = "";
    }

    if (!raw) {
      setDevStatus("Sin estado persistido.");
      return;
    }

    try {
      await navigator.clipboard.writeText(raw);
      setDevStatus("Debug JSON copiado al portapapeles.");
      return;
    } catch {
      // fallback: descarga
    }

    try {
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "conzia-debug.json";
      a.click();
      URL.revokeObjectURL(url);
      setDevStatus("Debug JSON descargado.");
    } catch {
      setDevStatus("No se pudo exportar debug JSON.");
    }
  }

  useEffect(() => {
    if (!devStatus) return;
    const t = window.setTimeout(() => setDevStatus(null), 2200);
    return () => window.clearTimeout(t);
  }, [devStatus]);

  return (
    <div className="min-h-[100svh] px-4 pb-14">
      <div className="sticky top-0 z-20 -mx-4 px-4 pb-4 pt-10 bg-[#0b1220]/55 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4 text-white">
          <div className="min-w-0">
            <div className="text-[22px] font-semibold tracking-tight">Proceso — Estado del Día</div>
            <div className="mt-1 text-xs text-white/65">Sesión activa</div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/10">
              <span className="inline-block h-2 w-2 rounded-full bg-white/60" aria-hidden />
              Revisión → Cierre del día
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={closeDoor} type="button">
            Cerrar sesión
          </Button>
        </div>
      </div>

      <Card className="mt-4 p-6">
        <div className="text-xs text-morning-blue">Estado del día</div>
        <div className="mt-2 text-lg font-semibold tracking-tight text-outer-space">{themeLabel}</div>
        <div className="mt-2 text-sm text-outer-space/70">Día {process?.day_index ?? 1}</div>
        <div className="mt-2 text-sm text-outer-space/70">Entradas guardadas: {entryCount}</div>
        <div className="mt-4 text-xs text-outer-space/60">
          Último cierre: {process?.last_closed_at ? process.last_closed_at : "—"}
        </div>
        <div className="mt-2 text-xs text-outer-space/60">Estado: {process?.status === "closed" ? "cerrado" : "abierto"}</div>
      </Card>

      <Card className="mt-4 p-6">
        <div className="text-xs text-morning-blue">Cierre del día</div>
        <div className="mt-2 text-sm text-outer-space/70">
          “Cerrar día” marca el proceso como cerrado. No es obligatorio en cada puerta.
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={closeDay} disabled={process?.status === "closed"} type="button">
            Cerrar día
          </Button>
        </div>
      </Card>

      {import.meta.env.DEV ? (
        <Card className="mt-4 p-6">
          <div className="text-xs text-morning-blue">DEV</div>
          <div className="mt-2 text-sm text-outer-space/70">Exportar estado persistido para debug.</div>
          {devStatus ? <div className="mt-3 text-sm text-outer-space/75">{devStatus}</div> : null}
          <div className="mt-5 flex justify-end">
            <Button variant="quiet" onClick={exportDebugJson} type="button">
              Export debug JSON
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="mt-4 p-6">
        <div className="text-xs text-morning-blue">Cierres recientes</div>
        <div className="mt-2 text-sm text-outer-space/70">
          No es historial para recordar. Es evidencia de cierre.
        </div>

        <div className="mt-4 space-y-2">
          {recentClosed.length ? (
            recentClosed.map((s) => (
              <div key={s.id} className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-3">
                <div className="text-sm font-semibold tracking-tight text-outer-space">{s.door.toUpperCase()}</div>
                <div className="mt-1 text-xs text-outer-space/60">
                  {s.date_key} · {s.closed_at ?? "—"}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-outer-space/70">Aún no hay cierres.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
