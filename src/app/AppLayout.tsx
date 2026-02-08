import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function AppLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const hideNav =
    pathname.startsWith("/inicio") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/planes/elige") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/acceso");
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
