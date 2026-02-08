import { ChevronRight, LogIn, LogOut, Settings, Shield, Sparkles, User, Wind } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/authStore";

function ItemButton(props: { title: string; subtitle?: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="flex w-full items-center justify-between gap-4 rounded-3xl bg-[#0b1220]/72 px-5 py-4 text-left ring-1 ring-white/10 backdrop-blur-xl transition hover:bg-[#0b1220]/78 active:scale-[0.995]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
          {props.icon}
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight text-white">{props.title}</div>
          {props.subtitle ? <div className="mt-1 text-xs text-white/60">{props.subtitle}</div> : null}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-white/50" aria-hidden />
    </button>
  );
}

export default function MasPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const accountLabel = useMemo(() => {
    if (auth.status === "authenticated") {
      const email = auth.user?.email ?? "Cuenta";
      return email.length > 22 ? `${email.slice(0, 19)}…` : email;
    }
    return "Modo local";
  }, [auth.status, auth.user?.email]);

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[26px] font-semibold tracking-tight text-white">Más</div>
          <div className="mt-2 text-sm text-white/65">{accountLabel}</div>
        </div>
      </div>

      <div className="mt-7 space-y-3">
        <div className="text-[11px] tracking-[0.18em] text-white/55">MÓDULOS</div>
        <ItemButton
          title="Crisis"
          subtitle="Sin drama. Con acción."
          icon={<Wind className="h-4 w-4 text-white/80" aria-hidden />}
          onClick={() => navigate("/crisis")}
        />
        <ItemButton
          title="Lecturas"
          subtitle="Espejo en formato fijo."
          icon={<Sparkles className="h-4 w-4 text-white/80" aria-hidden />}
          onClick={() => navigate("/lecturas")}
        />
        <ItemButton
          title="Integración"
          subtitle="Compás de valores · herramientas · ritual."
          icon={<Shield className="h-4 w-4 text-white/80" aria-hidden />}
          onClick={() => navigate("/integracion")}
        />
        <ItemButton
          title="Arquetipos"
          subtitle="Laboratorio · teatro de sombras."
          icon={<User className="h-4 w-4 text-white/80" aria-hidden />}
          onClick={() => navigate("/arquetipos")}
        />
      </div>

      <div className="mt-8 space-y-3">
        <div className="text-[11px] tracking-[0.18em] text-white/55">PRIVACIDAD</div>
        <ItemButton
          title="Bóveda"
          subtitle="Fuera del sistema."
          icon={<Shield className="h-4 w-4 text-white/80" aria-hidden />}
          onClick={() => navigate("/boveda")}
        />
      </div>

      <div className="mt-8 space-y-3">
        <div className="text-[11px] tracking-[0.18em] text-white/55">CUENTA</div>
        <ItemButton
          title="Perfil"
          subtitle="Preferencias personales."
          icon={<User className="h-4 w-4 text-white/80" aria-hidden />}
          onClick={() => navigate("/perfil")}
        />
        <ItemButton
          title="Configuración"
          subtitle="Exportar · borrar · seguridad."
          icon={<Settings className="h-4 w-4 text-white/80" aria-hidden />}
          onClick={() => navigate("/configuracion")}
        />
      </div>

      <div className="mt-8">
        {auth.status !== "authenticated" ? (
          <button
            type="button"
            onClick={() => navigate("/acceso")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-4 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/12"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Entrar
          </button>
        ) : (
          <button
            type="button"
            onClick={async () => {
              await auth.signOut();
              navigate("/sesion");
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-4 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/12"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </button>
        )}
      </div>
    </div>
  );
}
