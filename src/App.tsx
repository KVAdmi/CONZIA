import { Navigate, Route, Routes } from "react-router-dom";
import { ConziaProvider } from "./state/conziaStore";
import AppLayout from "./app/AppLayout";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import SesionPage from "./pages/SesionPage";
import BootPage from "./pages/BootPage";
import OnboardingPage from "./pages/OnboardingPage";
import { AuthProvider, useAuth } from "./state/authStore";
import RegistroPage from "./pages/RegistroPage";
import ConsultorioPage from "./pages/ConsultorioPage";
import MesaPage from "./pages/MesaPage";
import ProcesoPage from "./pages/ProcesoPage";
import ObservacionPage from "./pages/ObservacionPage";
import ResultadosPage from "./pages/ResultadosPage";
import DesahogoPage from "./pages/DesahogoPage";
import CrisisPage from "./pages/CrisisPage";
import SuenosPage from "./pages/SuenosPage";

export default function App() {
  return (
    <AuthProvider>
      <AuthedApp />
    </AuthProvider>
  );
}

function AuthedApp() {
  const auth = useAuth();
  const storageKey = auth.actorId === "local" ? "conzia_v1_state" : `conzia_v1_state_${auth.actorId}`;

  if (auth.status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-alabaster text-outer-space">
        <div className="text-sm text-outer-space/70">Cargando…</div>
      </div>
    );
  }

  return (
    <ConziaProvider key={storageKey} storageKey={storageKey}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="/" element={<AppLayout />}>
          <Route index element={<BootPage />} />
          <Route path="inicio" element={<BootPage />} />

          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="registro" element={<RegistroPage />} />

          <Route path="sesion" element={<SesionPage />} />
          <Route path="resultados" element={<ResultadosPage />} />
          <Route path="desahogo" element={<DesahogoPage />} />
          <Route path="suenos" element={<SuenosPage />} />
          <Route path="crisis" element={<CrisisPage />} />
          <Route path="observacion" element={<ObservacionPage />} />
          <Route path="consultorio" element={<ConsultorioPage />} />
          <Route path="mesa" element={<MesaPage />} />
          <Route path="proceso" element={<ProcesoPage />} />

          {/*
            Rutas heredadas / Fase 1:
            Se mantienen como redirect para evitar acceso a módulos fuera de alcance.
          */}
          <Route path="planes/elige" element={<Navigate to="/registro" replace />} />
          <Route path="mapa" element={<Navigate to="/sesion" replace />} />
          <Route path="espejo" element={<Navigate to="/sesion" replace />} />
          <Route path="boveda" element={<Navigate to="/sesion" replace />} />
          <Route path="sala" element={<Navigate to="/sesion" replace />} />
          <Route path="lecturas" element={<Navigate to="/sesion" replace />} />
          <Route path="tests" element={<Navigate to="/sesion" replace />} />
          <Route path="perfil" element={<Navigate to="/sesion" replace />} />
          <Route path="configuracion" element={<Navigate to="/sesion" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ConziaProvider>
  );
}
