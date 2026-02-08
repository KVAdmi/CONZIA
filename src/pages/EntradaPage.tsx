import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useAuth } from "../state/authStore";

export default function EntradaPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const authed = auth.status === "authenticated";

  return (
    <div className="min-h-[calc(100vh-40px)]">
      <div className="mx-auto max-w-xl px-4 pb-14 pt-10">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-white/70 ring-1 ring-gainsboro/60 shadow-sm grid place-items-center overflow-hidden backdrop-blur-md">
              <img
                src={`${import.meta.env.BASE_URL}brand/concia-logo.png`}
                alt=""
                className="h-6 w-6 object-contain"
                aria-hidden
                loading="eager"
              />
            </div>
            <div className="text-xs text-morning-blue">Concia</div>
          </div>

          <Button
            size="sm"
            variant="quiet"
            onClick={() => navigate(authed ? "/perfil" : "/acceso")}
            aria-label={authed ? "Abrir perfil" : "Iniciar sesión o crear cuenta"}
          >
            <User className="h-4 w-4" aria-hidden />
            {authed ? "Cuenta" : "Entrar"}
          </Button>
        </div>

        <h1 className="mt-10 text-3xl font-semibold tracking-tight text-outer-space font-serif">
          Aquí no tienes que ser coherente.
        </h1>
        <p className="mt-4 text-lg text-outer-space/80 leading-relaxed">Tienes que ser honesta.</p>

        <div className="mt-9">
          <Button
            variant="primary"
            className="w-full justify-center py-4 text-base"
            onClick={() => navigate("/descarga")}
          >
            Escribir sin estructura
          </Button>
          <p className="mt-3 text-xs text-outer-space/60">
            Aquí no hay respuestas correctas. Solo partes de ti que merecen ser vistas con curiosidad, no con vergüenza.
          </p>
        </div>

        <div className="mt-8">
          <div className="text-xs text-morning-blue">Otras puertas</div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => navigate("/repeticion")}
              className="rounded-2xl bg-white/65 ring-1 ring-gainsboro/60 px-4 py-4 text-left backdrop-blur-md transition hover:bg-white/75"
            >
              <div className="text-sm font-semibold tracking-tight text-outer-space">Algo se repite</div>
              <div className="mt-1 text-sm text-outer-space/70">
                Ver evidencia. Entrar a Caja solo si hay permiso.
              </div>
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/descarga?prompt=${encodeURIComponent(
                    "No sé qué me pasa. No lo ordenes. Escríbelo como salga.",
                  )}`,
                )
              }
              className="rounded-2xl bg-white/65 ring-1 ring-gainsboro/60 px-4 py-4 text-left backdrop-blur-md transition hover:bg-white/75"
            >
              <div className="text-sm font-semibold tracking-tight text-outer-space">No sé qué me pasa</div>
              <div className="mt-1 text-sm text-outer-space/70">
                Descarga sin juicio. Sin etiquetas.
              </div>
            </button>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Button variant="quiet" onClick={() => navigate("/archivo")}>
            Ver archivo
          </Button>
          <Button variant="quiet" onClick={() => navigate("/boveda")}>
            Ir a Bóveda
          </Button>
        </div>
      </div>
    </div>
  );
}
