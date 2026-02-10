import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Input from "../components/ui/Input";
import SegmentedControl from "../components/ui/SegmentedControl";
import { useAuth } from "../state/authStore";

type Mode = "login" | "signup";

const ACCESS_DONE_KEY = "conzia_v1_access_done";

function primaryButtonClassName(): string {
  return "w-full rounded-2xl bg-[#7D5C6B] px-5 py-4 text-center text-sm font-semibold tracking-wide text-white ring-1 ring-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:bg-[#6f5160] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none";
}

function quietButtonClassName(): string {
  return "w-full rounded-2xl bg-white/10 px-5 py-4 text-center text-sm font-semibold tracking-wide text-white ring-1 ring-white/12 transition hover:bg-white/12 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none";
}

const darkFieldClassName =
  "bg-white/10 text-white ring-white/12 placeholder:text-white/35 focus:ring-white/25 disabled:bg-white/8 disabled:ring-white/10";

function markAccessDone() {
  try {
    localStorage.setItem(ACCESS_DONE_KEY, "1");
  } catch {
    // ignore
  }
}

export default function AccesoPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const nextPathRaw = params.get("next") ?? "/inicio";
  const nextPath = nextPathRaw.startsWith("/") ? nextPathRaw : "/inicio";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "login") {
        const res = await auth.signInWithEmail(email, password);
        if (!res.ok) {
          setError(res.message);
          return;
        }
        markAccessDone();
        navigate(nextPath, { replace: true });
        return;
      }

      const res = await auth.signUpWithEmail(email, password);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      if (res.kind === "needs_email_confirmation") {
        setInfo("Cuenta creada. Revisa tu correo para confirmar antes de entrar.");
        return;
      }
      markAccessDone();
      navigate(nextPath, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14 flex flex-col">
      <button
        type="button"
        onClick={() => {
          if (window.history.length <= 1) {
            navigate("/inicio");
            return;
          }
          navigate(-1);
        }}
        className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/12"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver
      </button>

      <div className="mt-10 flex items-center gap-3 text-white">
        <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/12 backdrop-blur-md">
          <img
            src={`${import.meta.env.BASE_URL}brand/conzia-logo.png`}
            alt="CONZIA"
            className="h-10 w-10 object-contain"
            loading="eager"
          />
        </div>
        <div>
          <div className="text-[26px] font-semibold tracking-tight">Acceso</div>
          <div className="mt-1 text-sm text-white/65">CONZIA — Ver claro</div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <div className="text-[11px] tracking-[0.18em] text-white/55">MODO</div>
          <div className="mt-3">
            <SegmentedControl
              value={mode}
              onChange={(v) => setMode(v as Mode)}
              ariaLabel="Modo de acceso"
              options={[
                { value: "login", label: "Entrar" },
                { value: "signup", label: "Crear cuenta" },
              ]}
            />
          </div>

          {!auth.configured ? (
            <div className="mt-4 rounded-2xl bg-white/8 ring-1 ring-white/10 px-4 py-3 text-sm text-white/70">
              Supabase no está configurado en este entorno. Puedes continuar en modo local.
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <div>
              <div className="text-xs font-medium text-white/75">Correo</div>
              <Input
                className={`mt-2 ${darkFieldClassName}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                inputMode="email"
                autoComplete="email"
                disabled={!auth.configured || busy}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-white/75">Contraseña</div>
              <Input
                className={`mt-2 ${darkFieldClassName}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                disabled={!auth.configured || busy}
              />
              <div className="mt-2 text-xs text-white/55">En nativo: cifrado y sesión segura.</div>
            </div>
          </div>

          {error ? <div className="mt-4 text-sm text-white/80">{error}</div> : null}
          {info ? <div className="mt-4 text-sm text-white/80">{info}</div> : null}

          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={submit}
              className={primaryButtonClassName()}
              disabled={busy || !auth.configured || !email.trim() || !password}
            >
              {busy ? "Procesando…" : mode === "login" ? "CONTINUAR" : "CREAR CUENTA"}
            </button>
            <button
              type="button"
              onClick={() => {
                auth.continueLocal();
                markAccessDone();
                navigate(nextPath, { replace: true });
              }}
              className={quietButtonClassName()}
            >
              ENTRAR SIN CUENTA
            </button>

            <button
              type="button"
              onClick={async () => {
                setBusy(true);
                try {
                  markAccessDone();
                  const res = await auth.signInWithGoogle();
                  if (!res.ok) setError(res.message);
                } finally {
                  setBusy(false);
                }
              }}
              disabled={!auth.configured || busy}
              className={quietButtonClassName()}
            >
              CONTINUAR CON GOOGLE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
