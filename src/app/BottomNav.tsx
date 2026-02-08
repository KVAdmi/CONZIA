import { NavLink } from "react-router-dom";
import { FilePenLine, Home, MessageCircle, Route } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "../utils/cn";
import { useConzia } from "../state/conziaStore";

type Item = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  kind?: "primary";
};

const ITEMS: Item[] = [
  { to: "/sesion", label: "Sesión", icon: Home },
  { to: "/consultorio", label: "Consultorio", icon: MessageCircle, kind: "primary" },
  { to: "/mesa", label: "Mesa", icon: FilePenLine },
  { to: "/proceso", label: "Proceso", icon: Route },
];

export default function BottomNav() {
  const { state } = useConzia();
  const [blocked, setBlocked] = useState<string | null>(null);

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
          const Icon = item.icon;
          const isBlocked = Boolean(state.activeDoor && item.to !== `/${state.activeDoor}`);

          if (item.kind === "primary") {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => {
                  if (!isBlocked) return;
                  e.preventDefault();
                  setBlocked(`Cierra ${activeDoorLabel ?? "la puerta actual"} antes de entrar a otra.`);
                }}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1.5 px-2",
                    isActive ? "text-white" : "text-white/80 hover:text-white",
                  )
                }
                aria-label={item.label}
              >
                <div className="h-14 w-14 rounded-2xl bg-[#7D5C6B] ring-1 ring-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.35)] grid place-items-center">
                  <Icon className="h-6 w-6 text-white" aria-hidden />
                </div>
                <div className="text-[11px] tracking-tight">{item.label}</div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => {
                if (!isBlocked) return;
                e.preventDefault();
                setBlocked(`Cierra ${activeDoorLabel ?? "la puerta actual"} antes de entrar a otra.`);
              }}
              className={({ isActive }) =>
                cn(
                  "flex w-16 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition",
                  isActive ? "text-white" : "text-white/75 hover:text-white",
                )
              }
              aria-label={item.label}
            >
              <Icon className="h-6 w-6" aria-hidden />
              <div className="text-[11px] tracking-tight">{item.label}</div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
