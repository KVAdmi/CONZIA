import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAuth } from "../state/authStore";

export default function AuthCallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const errorDescription = params.get("error_description");
    const errorParam = params.get("error");

    if (errorDescription || errorParam) {
      setError(errorDescription ?? errorParam ?? "OAuth falló.");
      return;
    }

    if (!code) {
      setError("OAuth incompleto: falta el código de autorización.");
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await auth.exchangeOAuthCode(code);
      if (cancelled) return;
      if (!res.ok) {
        setError(res.message);
        return;
      }
      navigate("/", { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, navigate, params]);

  return (
    <div className="min-h-screen px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Card className="p-6">
        <h2 className="text-sm font-semibold tracking-tight">Conectando…</h2>
        <p className="mt-1 text-sm text-outer-space/70">
          Cerrando el acceso. No hagas nada todavía.
        </p>
        {error ? (
          <div className="mt-4 rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-3">
            <div className="text-sm font-medium text-outer-space">No se pudo completar</div>
            <div className="mt-1 text-sm text-outer-space/75">{error}</div>
            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={() => navigate("/acceso", { replace: true })}>
                Volver a Acceso
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-outer-space/70">Validando…</div>
        )}
        </Card>
      </div>
    </div>
  );
}
