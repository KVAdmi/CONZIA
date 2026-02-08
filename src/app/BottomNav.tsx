import { NavLink, useNavigate } from "react-router-dom";
import { DoorClosed, DoorOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "../utils/cn";
import { useConzia } from "../state/conziaStore";
import { toISODateOnly } from "../utils/dates";

type Item = {
  to: string;
  label: string;
};

const ITEMS: Item[] = [
  { to: "/sesion", label: "Inicio" },
  { to: "/consultorio", label: "Consultorio" },
  { to: "/mesa", label: "Mesa" },
  { to: "/proceso", label: "Proceso" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { state } = useConzia();
  const [blocked, setBlocked] = useState<string | null>(null);
  const todayKey = toISODateOnly(new Date());

  const activeProcessId =
    state.activeProcessId ?? state.processes[0]?.id ?? null;

  const observationDoneToday = useMemo(() => {
    if (!activeProcessId) return true;
    return state.sessions.some(
      (s) =>
        s.process_id === activeProcessId &&
        s.date_key === todayKey &&
        s.door === "observacion" &&
        s.closed,
    );
  }, [activeProcessId, state.sessions, todayKey]);

  const activeDoorLabel = useMemo(() => {
    if (!state.activeDoor) return null;
    return ITEMS.find((i) => i.to === `/${state.activeDoor}`)?.label ?? null;
  }, [state.activeDoor]);

  useEffect(() => {
    if (!blocked) return;
    const t = window.setTimeout(() => setBlocked(null), 2200);
    return () => window.clearTimeout(t);
  }, [blocked]);

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-5 pt-3">
      {blocked ? (
        <div className="mb-2 flex justify-center">
          <div className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md">
            {blocked}
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex items-end justify-between rounded-[30px] bg-[#0b1220]/75 backdrop-blur-md ring-1 ring-white/10 px-3 py-3">
        {ITEMS.map((item) => {
          const blockedByDoor = Boolean(state.activeDoor && item.to !== `/${state.activeDoor}`);
          const blockedByObservation = !observationDoneToday && (item.to === "/consultorio" || item.to === "/mesa" || item.to === "/proceso");
          const isBlocked = blockedByDoor || blockedByObservation;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => {
                if (!isBlocked) return;
                e.preventDefault();
                if (blockedByObservation) {
                  navigate("/observacion");
                  return;
                }
                setBlocked(`Cierra ${activeDoorLabel ?? "la puerta actual"} antes de entrar a otra.`);
              }}
              aria-label={item.label}
              aria-disabled={isBlocked}
              className={({ isActive }) =>
                cn(
                  "flex w-16 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition",
                  isActive ? "text-white" : "text-white/75 hover:text-white",
                  isBlocked ? "opacity-40 cursor-not-allowed hover:text-white/75" : "",
                )
              }
            >
              {({ isActive }) => {
                const Icon = isActive ? DoorOpen : DoorClosed;
                return (
                  <>
                    <div
                      className={cn(
                        "grid place-items-center h-12 w-12 rounded-2xl ring-1 ring-white/10 transition",
                        isActive ? "bg-camel text-white ring-white/15" : "bg-white/10 text-white/80",
                      )}
                    >
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="text-[11px] tracking-tight">{item.label}</div>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
