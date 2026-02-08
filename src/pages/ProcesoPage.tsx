import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useConzia } from "../state/conziaStore";
import { createId } from "../utils/id";
import { toISODateOnly } from "../utils/dates";

const THEME_LABEL: Record<string, string> = {
  p_001: "Falta de límites",
  p_002: "Apego a aprobación",
  p_003: "Evitación activa",
  p_004: "Rumiación circular",
  p_005: "Autoanulación",
  p_006: "Qué dirán estructural",
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
    <div className="min-h-[100svh] px-6 pb-10 pt-14">
      <div className="flex items-center justify-between gap-3 text-white">
        <div>
          <div className="text-[26px] font-semibold tracking-tight">Proceso</div>
          <div className="mt-1 text-sm text-white/65">Estado mínimo. Avance por cierres.</div>
        </div>
        <Button variant="quiet" size="sm" onClick={closeDoor} type="button">
          Cerrar
        </Button>
      </div>

      <Card className="mt-7 p-6">
        <div className="text-xs text-morning-blue">Proceso activo</div>
        <div className="mt-2 text-lg font-semibold tracking-tight text-outer-space">{themeLabel}</div>
        <div className="mt-2 text-sm text-outer-space/70">
          Día {process?.day_index ?? 1} · Entradas guardadas: {entryCount}
        </div>
        <div className="mt-4 text-xs text-outer-space/60">
          Último cierre: {process?.last_closed_at ? process.last_closed_at : "—"}
        </div>
        <div className="mt-2 text-xs text-outer-space/60">Estado: {process?.status === "closed" ? "cerrado" : "abierto"}</div>

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

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={closeDoor} type="button">
            Volver a Sesión
          </Button>
        </div>
      </Card>
    </div>
  );
}
