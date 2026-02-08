import { NavLink } from "react-router-dom";
import { Home, Lock, MapPin, Mic, MoreHorizontal } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "../utils/cn";

type Item = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  kind?: "primary";
};

const ITEMS: Item[] = [
  { to: "/sesion", label: "Sesión", icon: Home },
  { to: "/mapa", label: "Mapa", icon: MapPin },
  { to: "/espejo", label: "Hablar", icon: Mic, kind: "primary" },
  { to: "/boveda", label: "Bóveda", icon: Lock },
  { to: "/mas", label: "Más", icon: MoreHorizontal },
];

export default function BottomNav() {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-5 pt-3">
      <div className="mx-auto flex items-end justify-between rounded-[30px] bg-[#0b1220]/75 backdrop-blur-md ring-1 ring-white/10 px-3 py-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          if (item.kind === "primary") {
            return (
              <NavLink
                key={item.to}
                to={item.to}
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
