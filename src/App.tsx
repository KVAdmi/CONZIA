import { Navigate, Route, Routes } from "react-router-dom";
import { ConziaProvider } from "./state/conziaStore";
import AppLayout from "./app/AppLayout";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import SesionPage from "./pages/SesionPage";
import { AuthProvider, useAuth } from "./state/authStore";
import ConsultorioPage from "./pages/ConsultorioPage";
import MesaPage from "./pages/MesaPage";
import ProcesoPage from "./pages/ProcesoPage";
import ObservacionPage from "./pages/ObservacionPage";
import DesahogoPage from "./pages/DesahogoPage";
import CrisisPage from "./pages/CrisisPage";

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

  // TEMPORALMENTE: Saltar autenticación y ir directo a la app
  const isAuthenticated = true;
  const entryPath = "/sesion";

  return (
    <ConziaProvider key={storageKey} storageKey={storageKey}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="/" element={<AppLayout />}>
          {/* ✅ Entry point directo a la app */}
          <Route index element={<Navigate to="/sesion" replace />} />
          <Route path="inicio" element={<Navigate to="/sesion" replace />} />

          {/* TEMPORALMENTE DESHABILITADAS: onboarding, acceso, registro, resultados, planes */}

          {/* ✅ Rutas principales de la app (sin guards) */}
          <Route path="sesion" element={<SesionPage />} />
          <Route path="desahogo" element={<DesahogoPage />} />
          <Route path="crisis" element={<CrisisPage />} />
          <Route path="observacion" element={<ObservacionPage />} />
          <Route path="consultorio" element={<ConsultorioPage />} />
          <Route path="mesa" element={<MesaPage />} />
          <Route path="proceso" element={<ProcesoPage />} />

          {/* Redirects heredados */}
          <Route path="mapa" element={<Navigate to="/sesion" replace />} />
          <Route path="espejo" element={<Navigate to="/sesion" replace />} />
          <Route path="boveda" element={<Navigate to="/sesion" replace />} />
          <Route path="sala" element={<Navigate to="/sesion" replace />} />
          <Route path="lecturas" element={<Navigate to="/sesion" replace />} />
          <Route path="tests" element={<Navigate to="/sesion" replace />} />
          <Route path="perfil" element={<Navigate to="/sesion" replace />} />
          <Route path="configuracion" element={<Navigate to="/sesion" replace />} />

          {/* ✅ Catch-all consistente: no regresar a "/" */}
          <Route path="*" element={<Navigate to={entryPath} replace />} />
        </Route>
      </Routes>
    </ConziaProvider>
  );
}
