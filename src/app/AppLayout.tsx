import { Navigate, Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import { useConzia } from "../state/conziaStore";
import type { DoorId } from "../types/models";
import { toISODateOnly } from "../utils/dates";

const ONBOARDING_DONE_KEY = "conzia_v1_onboarding_done";

function getFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function doorFromPathname(pathname: string): DoorId | null {
  if (pathname.startsWith("/sesion")) return "sesion";
  if (pathname.startsWith("/observacion")) return "observacion";
  if (pathname.startsWith("/consultorio")) return "consultorio";
  if (pathname.startsWith("/mesa")) return "mesa";
  if (pathname.startsWith("/proceso")) return "proceso";
  return null;
}

export default function AppLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const { state } = useConzia();

  const onboardingDone = getFlag(ONBOARDING_DONE_KEY);
  const registrationDone = Boolean(state.profile?.registrationDone);
  const diagnosisDone = Boolean(state.profile?.radar_completed_at);
  const phase2Ready = registrationDone && diagnosisDone;

  if (!onboardingDone && !pathname.startsWith("/onboarding")) {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingDone && !phase2Ready && !pathname.startsWith("/registro") && !pathname.startsWith("/onboarding")) {
    return <Navigate to="/registro" replace />;
  }

  const activeProcess = state.activeProcessId
    ? state.processes.find((p) => p.id === state.activeProcessId) ?? null
    : state.processes[0] ?? null;

  const todayKey = toISODateOnly(new Date());
  const observationDoneToday = Boolean(
    activeProcess &&
      state.sessions.some(
        (s) => s.process_id === activeProcess.id && s.date_key === todayKey && s.door === "observacion" && s.closed,
      ),
  );

  if (
    registrationDone &&
    activeProcess &&
    !observationDoneToday &&
    !state.activeDoor &&
    (pathname.startsWith("/consultorio") || pathname.startsWith("/mesa") || pathname.startsWith("/proceso"))
  ) {
    return <Navigate to="/observacion" replace />;
  }

  if (registrationDone && state.activeDoor) {
    const currentDoor = doorFromPathname(pathname);
    if (currentDoor && currentDoor !== state.activeDoor) {
      return <Navigate to={`/${state.activeDoor}`} replace />;
    }
  }

  const hideNav =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/desahogo") ||
    pathname.startsWith("/resultados") ||
    pathname.startsWith("/crisis");
  const contentPaddingBottom = hideNav ? "pb-0" : "pb-[140px]";

  return (
    <div className="min-h-screen bg-[#0b1220]">
      <div className="mx-auto w-full max-w-[420px] sm:py-8">
        <div className="relative h-[100svh] w-full overflow-hidden sm:h-[844px] sm:w-[390px] sm:rounded-[44px] ring-1 ring-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-slate-500 to-slate-950" />
          <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-white/35 blur-3xl" />
          <div className="absolute -right-28 top-16 h-[380px] w-[380px] rounded-full bg-white/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(255,255,255,0.20),transparent_55%),radial-gradient(900px_circle_at_90%_20%,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/35" />

          <div className={`absolute inset-0 overflow-y-auto ${contentPaddingBottom}`}>
            <Outlet />
          </div>

          {hideNav ? null : <BottomNav />}
        </div>
      </div>
    </div>
  );
}
