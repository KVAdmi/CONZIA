# Avance para Dirección (estado a 2026-02-11)

Repo: **CONZIA** (React + Vite + TypeScript).

## Resumen ejecutivo

- **Producto**: app de “shadow work” con módulos (Onboarding, Registro/Login, Sesión, Desahogo, Observación, Consultorio, Mesa, Resultados, Sueños, Crisis, Proceso).
- **Estado**: hay una base funcional (navegación, store local, puertas con cierre), pero conviven **dos líneas** (v1 local/seed vs integración Supabase/IA) con documentación/QA aún desalineadas.
- **Riesgo principal**: inconsistencias de flujo (rutas legacy, criterios de guard/estado) y dependencia de configuración (`.env`) para que Registro/Login funcionen.

## Qué está implementado (visible en rutas activas)

Rutas definidas en `src/App.tsx`:

- **Onboarding**: `src/pages/OnboardingPage.tsx` (4 slides, persistencia en `localStorage`).
- **Auth**:
  - Login email/pass (Supabase): `src/pages/LoginPage.tsx` + `src/services/supabase/auth.ts`.
  - Registro (Supabase Auth + POST perfil a REST): `src/pages/RegistroPage.tsx`.
  - OAuth callback (PKCE): `src/pages/AuthCallbackPage.tsx` + `src/state/authStore.tsx`.
- **Pago**: `src/pages/PaymentPage.tsx` (simulado: marca `registrationDone` y navega a Sesión).
- **Sesión y puertas (circuitos)**:
  - `src/pages/SesionPage.tsx`
  - `src/pages/ObservacionPage.tsx` (4 pasos, guarda entrada `puerta1_observacion`)
  - `src/pages/ConsultorioPage.tsx` (turnos + cierre, guarda entrada `consultorio`)
  - `src/pages/MesaPage.tsx` (escritura estructurada + cierre, guarda entrada `mesa`)
  - `src/pages/ProcesoPage.tsx` (cierre de día + export debug en DEV)
- **Módulos “experiencia”**:
  - Desahogo: `src/pages/DesahogoPage.tsx` (IA proxy con fallback, retos)
  - Resultados: `src/pages/ResultadosPage.tsx` (radar + hallazgos)
  - Sueños: `src/pages/SuenosPage.tsx` (endpoint `/api/ai/dream-analysis` en devserver)
  - Crisis: `src/pages/CrisisPage.tsx` (mock contención)

## Qué está parcial / por alinear

- **Docs/QA desalineados**:
  - `README.md` y `docs/QA_PHASE1_CHECKLIST.md` describen un v1 “100% local” y un flujo `/acceso` + más pasos de registro; el código actual usa `/login` y un registro distinto.
- **Rutas legacy**: existen páginas y navegación hacia rutas no definidas en `src/App.tsx` (ej. `/acceso` en páginas antiguas); se recomienda consolidar.
- **Pago / suscripción**: existe `src/state/subscriptionStore.tsx`, pero `PaymentPage` no lo usa aún (pago es simulado).
- **Supabase**:
  - `RegistroPage` hace POST directo a `rest/v1/usuarios` (requiere tabla/RLS correctas).
  - Falta especificación/documento de RLS + modelo DB real para evaluación de seguridad.

## Calidad y pruebas

- **Tests unitarios**: se agregó suite con `node:test` (`npm test`) cubriendo lógica pura (utils/engine/metrics/IA fallback y Supabase auth).  
  No hay aún tests de UI (React Testing Library/Vitest) ni e2e.

## Recomendación para evaluación

1) Ejecutar demo con `.env` configurado (Supabase + opcional IA) y validar “Happy Path” descrito en `docs/auditoria_2026-02-11/MANUAL_DE_USUARIO.md`.
2) Usar `docs/auditoria_2026-02-11/CUESTIONARIO_EVALUACION.md` como guía de preguntas/criterios.
3) Revisar `docs/auditoria_2026-02-11/AUDITORIA_TECNICA.md` para riesgos técnicos y mapa de módulos.

