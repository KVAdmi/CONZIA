import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { useConziaDerived } from "../state/conziaStore";
import { ChevronDown, ClipboardList, Settings, User } from "lucide-react";
import { useAuth } from "../state/authStore";
import { useSubscription } from "../state/subscriptionStore";

type Tab = { to: string; label: string };

const TABS: Tab[] = [
  { to: "/hoy", label: "Hoy" },
  { to: "/descarga", label: "Escribir" },
  { to: "/lecturas", label: "Lecturas" },
  { to: "/patrones", label: "Patrones" },
  { to: "/boveda", label: "Bóveda" },
];

export default function Header() {
  const { latestDate } = useConziaDerived();
  const auth = useAuth();
  const sub = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const title = useMemo(() => {
    const match = TABS.find((t) => location.pathname.startsWith(t.to));
    return match?.label ?? "CONZIA";
  }, [location.pathname]);

  useEffect(() => {
    function onDocMouseDown(ev: MouseEvent) {
      const target = ev.target as Node | null;
      if (!target) return;
      if (!menuRef.current) return;
      if (menuRef.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const accountLabel = useMemo(() => {
    if (auth.status === "authenticated") {
      const email = auth.user?.email ?? "Cuenta";
      return email.length > 22 ? `${email.slice(0, 19)}…` : email;
    }
    return "Entrar";
  }, [auth.status, auth.user?.email]);

  const planLabel = useMemo(() => {
    if (sub.state.selectedPlan === "conzia_asistencia") return "Plan: CONZIA + Asistencia";
    if (sub.state.selectedPlan === "conzia_total") return "Plan: CONZIA Sistema";
    if (sub.derived.trialActive) return "Trial activo";
    return "Modo básico";
  }, [sub.derived.trialActive, sub.state.selectedPlan]);

  return (
    <header className="sticky top-0 z-30 border-b border-gainsboro/60 bg-white/55 backdrop-blur-md">
      <div className="px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-mint-cream"
            aria-label="Ir a Inicio"
          >
            <div className="h-9 w-9 rounded-xl bg-white/80 ring-1 ring-gainsboro/60 shadow-sm grid place-items-center overflow-hidden">
              <img
                src={`${import.meta.env.BASE_URL}brand/conzia-logo.png`}
                alt=""
                className="h-6 w-6 object-contain"
                aria-hidden
                loading="eager"
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-tight text-outer-space">CONZIA</div>
              <div className="text-xs text-morning-blue">Ver claro</div>
            </div>
          </button>

          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-xl px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-white/80 text-outer-space shadow-sm ring-1 ring-gainsboro/60"
                      : "text-outer-space/70 hover:bg-white/60 hover:text-outer-space",
                  )
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:block text-right">
            <div className="text-xs text-morning-blue">{title}</div>
            <div className="text-xs text-outer-space/70">{latestDate || "—"}</div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm text-outer-space shadow-sm ring-1 ring-gainsboro/60 transition hover:bg-white/90"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <span className="hidden sm:inline">{accountLabel}</span>
              <ChevronDown className="h-4 w-4 text-outer-space/70" aria-hidden />
            </button>
            {open ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md shadow-card ring-1 ring-gainsboro/60"
              >
                <div className="px-4 py-3 border-b border-gainsboro/60">
                  <div className="text-xs text-morning-blue">{planLabel}</div>
                  <div className="mt-1 text-xs text-outer-space/60">
                    {auth.status === "authenticated" ? "Con cuenta" : "Sin cuenta"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/perfil");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-outer-space transition hover:bg-mint-cream"
                  role="menuitem"
                >
                  <User className="h-4 w-4 text-outer-space/70" aria-hidden />
                  Perfil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/planes");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-outer-space transition hover:bg-mint-cream"
                  role="menuitem"
                >
                  <span className="h-4 w-4 inline-flex items-center justify-center text-outer-space/70" aria-hidden>
                    $
                  </span>
                  Planes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/tests");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-outer-space transition hover:bg-mint-cream"
                  role="menuitem"
                >
                  <ClipboardList className="h-4 w-4 text-outer-space/70" aria-hidden />
                  Tests
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/configuracion");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-outer-space transition hover:bg-mint-cream"
                  role="menuitem"
                >
                  <Settings className="h-4 w-4 text-outer-space/70" aria-hidden />
                  Configuración
                </button>
                {auth.status !== "authenticated" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate("/acceso");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-outer-space transition hover:bg-mint-cream border-t border-gainsboro/70"
                    role="menuitem"
                  >
                    <User className="h-4 w-4 text-outer-space/70" aria-hidden />
                    Entrar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setOpen(false);
                      await auth.signOut();
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-outer-space transition hover:bg-mint-cream border-t border-gainsboro/70"
                    role="menuitem"
                  >
                    <User className="h-4 w-4 text-outer-space/70" aria-hidden />
                    Cerrar sesión
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
