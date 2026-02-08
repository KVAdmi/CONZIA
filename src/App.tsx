import { Navigate, Route, Routes } from "react-router-dom";
import { XmiProvider } from "./state/xmiStore";
import AppLayout from "./app/AppLayout";
import BovedaPage from "./pages/BovedaPage";
import ArchivoPage from "./pages/ArchivoPage";
import CajaEnfrentamientoPage from "./pages/CajaEnfrentamientoPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import EscribirPage from "./pages/EscribirPage";
import LecturasPage from "./pages/LecturasPage";
import PatronesArchivoPage from "./pages/PatronesArchivoPage";
import PerfilPage from "./pages/PerfilPage";
import TestsPage from "./pages/TestsPage";
import AccesoPage from "./pages/AccesoPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import PlanesPage from "./pages/PlanesPage";
import EntradaPage from "./pages/EntradaPage";
import DescargaPage from "./pages/DescargaPage";
import RepeticionPage from "./pages/RepeticionPage";
import SesionPage from "./pages/SesionPage";
import EspejoNegroPage from "./pages/EspejoNegroPage";
import MasPage from "./pages/MasPage";
import IntegracionPage from "./pages/IntegracionPage";
import IntegracionCompasPage from "./pages/IntegracionCompasPage";
import IntegracionHerramientasPage from "./pages/IntegracionHerramientasPage";
import IntegracionRitualPage from "./pages/IntegracionRitualPage";
import ArquetiposPage from "./pages/ArquetiposPage";
import ArquetipoChatPage from "./pages/ArquetipoChatPage";
import TeatroPage from "./pages/TeatroPage";
import CrisisPage from "./pages/CrisisPage";
import BootPage from "./pages/BootPage";
import OnboardingPage from "./pages/OnboardingPage";
import PlanesEntradaPage from "./pages/PlanesEntradaPage";
import CheckoutPage from "./pages/CheckoutPage";
import { AuthProvider, useAuth } from "./state/authStore";
import { SubscriptionProvider } from "./state/subscriptionStore";

export default function App() {
  return (
    <AuthProvider>
      <AuthedApp />
    </AuthProvider>
  );
}

function AuthedApp() {
  const auth = useAuth();
  const storageKey = auth.actorId === "local" ? "concia_v1_state" : `concia_v1_state_${auth.actorId}`;

  if (auth.status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-alabaster text-outer-space">
        <div className="text-sm text-outer-space/70">Cargando…</div>
      </div>
    );
  }

  return (
    <XmiProvider key={storageKey} storageKey={storageKey}>
      <SubscriptionProvider key={auth.actorId} actorId={auth.actorId}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route path="/" element={<AppLayout />}>
            <Route index element={<BootPage />} />
            <Route path="inicio" element={<BootPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="planes/elige" element={<PlanesEntradaPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="acceso" element={<AccesoPage />} />

            <Route path="sesion" element={<SesionPage />} />
            <Route path="mapa" element={<ArchivoPage />} />
            <Route path="espejo" element={<EspejoNegroPage />} />
            <Route path="mas" element={<MasPage />} />

            <Route path="integracion" element={<IntegracionPage />} />
            <Route path="integracion/compas" element={<IntegracionCompasPage />} />
            <Route path="integracion/herramientas" element={<IntegracionHerramientasPage />} />
            <Route path="integracion/ritual" element={<IntegracionRitualPage />} />

            <Route path="arquetipos" element={<ArquetiposPage />} />
            <Route path="arquetipos/:id" element={<ArquetipoChatPage />} />
            <Route path="teatro" element={<TeatroPage />} />
            <Route path="crisis" element={<CrisisPage />} />

            <Route path="entrada" element={<EntradaPage />} />
            <Route path="descarga" element={<DescargaPage />} />
            <Route path="repeticion" element={<RepeticionPage />} />
            <Route path="hoy" element={<Navigate to="/sesion" replace />} />
            <Route path="archivo" element={<Navigate to="/mapa" replace />} />
            <Route path="escribir" element={<EscribirPage />} />
            <Route path="lecturas" element={<LecturasPage />} />
            <Route path="patrones" element={<Navigate to="/mapa" replace />} />
            <Route path="patrones/archivo" element={<PatronesArchivoPage />} />
            <Route path="boveda" element={<BovedaPage />} />
            <Route path="caja" element={<CajaEnfrentamientoPage />} />
            <Route path="tests" element={<TestsPage />} />
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="planes" element={<PlanesPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </SubscriptionProvider>
    </XmiProvider>
  );
}
