# Auditoría técnica (módulo por módulo) — 2026-02-11

Objetivo: dar visibilidad **técnica** (arquitectura, módulos, funciones clave, riesgos) para evaluación.

> Para el listado completo de exports por archivo ver `docs/auditoria_2026-02-11/MAPA_DE_FUNCIONES.md` (auto-generado).

## 1) Arquitectura y entrypoints

### `src/main.tsx`

- Función `Router({ children })`: decide `HashRouter` vs `BrowserRouter` según:
  - `window.location.protocol === "file:"` (APK/WebView local) o
  - `window.location.host === "appassets.androidplatform.net"` (Android assets).

### `src/App.tsx`

- `App()`: wrap con `AuthProvider` y render de `AuthedApp`.
- `AuthedApp()`:
  - Lee estado auth (`useAuth()`).
  - Define `storageKey` del store principal: `conzia_v1_state` (local) o `conzia_v1_state_<userId>` (Supabase).
  - Monta `ConziaProvider` (store local/persistido).
  - Define rutas activas principales:
    - `/onboarding`, `/login`, `/registro`, `/pago`
    - puertas: `/sesion`, `/observacion`, `/consultorio`, `/mesa`, `/proceso`
    - módulos: `/resultados`, `/desahogo`, `/suenos`, `/crisis`
    - `/auth/callback` (OAuth)
  - Mantiene redirects para rutas heredadas fuera de alcance (evita acceso “fase 1 legacy”).

### `src/app/AppLayout.tsx` (guardas + shell)

Funciones clave:

- `getFlag(key)`: lectura segura de flags desde `localStorage`.
- `doorFromPathname(pathname)`: mapea pathname a `DoorId` (para consistencia con `activeDoor`).
- `AppLayout()` aplica guardas:
  - Onboarding obligatorio (`conzia_v1_onboarding_done`).
  - Acceso controlado por `phase2Ready = registrationDone && diagnosisDone`:
    - `registrationDone`: `state.profile?.registrationDone`
    - `diagnosisDone`: `state.profile?.radar_completed_at`
  - “Una puerta por sesión”: si `state.activeDoor` existe, bloquea navegación a otras puertas.
  - Forza Observación antes de Consultorio/Mesa/Proceso si no hay observación cerrada hoy.

## 2) Estado (stores) y persistencia

### `src/state/conziaStore.tsx` (store principal)

Rol: store local con `useReducer`, persistencia `localStorage`, migración simple de schema, y acciones para puertas.

Funciones/partes relevantes:

- Migración/normalización:
  - `isRecord()`, `migrateFriccionId()`, `migrateArchetypeId()`, `normalizePersisted()`
  - Objetivo: back-compat con valores antiguos (`p_001...`) y variantes de arquetipos.
- Persistencia:
  - `toPersistedState(state)`: define qué se guarda (no persiste `activeDoor`, y `activeSessionId` solo si la sesión está abierta).
  - `getInitialState(storageKey)`: mezcla seed (`loadSeedData()`) con persisted state si existe.
- Reducer `reducer(state, action)`:
  - CRUD de entries/intenciones/checkins/lecturas/bóveda.
  - Flujo de puertas: `start_session`, `close_session`, `add_entry_v1`, `add_challenge`, etc.
  - Perfil: `set_profile`, `update_profile`.
- API pública:
  - `ConziaProvider({ storageKey })`
  - Hooks: `useConzia()`, `useConziaLookup()`, `useConziaDerived()`

Hallazgo:
- El seed llena data “v1” (`entries`, `patterns`, etc.) pero `profile` inicia en `null`. La app depende del registro para habilitar flujo.

### `src/state/authStore.tsx` (auth)

Rol: capa de autenticación con Supabase opcional.

Funciones clave:

- `loadSession()/saveSession()`: persistencia de sesión Supabase en `localStorage`.
- `isExpired(session)`: refresh cuando expira (con margen 30s).
- `AuthProvider`:
  - Bootstrap: intenta refresh si sesión expirada.
  - `signInWithEmail()`, `signUpWithEmail()`: email/password.
  - `signInWithGoogle()`: PKCE (`generateCodeVerifier`, `createCodeChallenge`) + `buildOAuthAuthorizeUrl`.
  - `exchangeOAuthCode(code)`: `exchangeCodeForSession`.
  - `continueLocal()`: fuerza modo local.

Hallazgo:
- UI actual de `src/pages/LoginPage.tsx` usa directamente `signInWithPassword()` y no esta capa; hay duplicidad y riesgo de comportamiento inconsistente.

### `src/state/subscriptionStore.tsx` (suscripción)

Rol: selección de plan + trial de 7 días, persistido por actorId.

Hallazgo:
- `PaymentPage` no usa este store; pago es simulado vía `update_profile`.

## 3) Servicios (Supabase / IA)

### `src/services/supabase/config.ts`

- `getSupabaseConfig()`:
  - Lee `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
  - Normaliza URL (sin `/` final).
  - Devuelve `configured: boolean`.

Nota técnica:
- Se agregó lectura compatible con Node (`process.env`) para habilitar tests unitarios y scripts.

### `src/services/supabase/auth.ts`

Objetivo: wrapper de endpoints Supabase Auth vía `fetch`.

Funciones exportadas:

- `signInWithPassword(email, password)`
- `signUpWithPassword(email, password)` (soporta payload “session anidada” y payload “tokens top-level”)
- `refreshSession(refreshToken)`
- `exchangeCodeForSession(authCode, codeVerifier)` (PKCE)
- `signOut(accessToken)`
- `buildOAuthAuthorizeUrl({ provider, redirectTo, codeChallenge })`

Riesgos / observaciones:
- El módulo depende de `.env` de frontend (prefijo `VITE_`). Es correcto para anon key, pero exige cuidado: **nunca** meter llaves server-only con `VITE_`.

### `src/services/ai/*` + `devserver/aiProxy.ts`

Diseño:
- En frontend: funciones “contrato” (reading/reflection/test-reading/shadow-traits/desahogo/mirror-story).
- En dev: proxy Vite (`conziaAiProxyPlugin`) para evitar exponer llaves, con fallbacks locales cuando falla `fetch`.

Funciones clave (contrato):
- `generateReading()`, `generateReflection()`, `generateTestReading()`
- `generateMirrorStory()`
- `extractShadowTraits()`
- `analyzeDesahogo()`
- Heurísticas: `classifyEntry()`, `detectPatterns()`, `generateAlerts()`

Observaciones:
- Los fallbacks están implementados y permiten que la app funcione sin IA real (degradación controlada).
- En devserver el endpoint de sueños existe: `/api/ai/dream-analysis`.

## 4) Motor, métricas y utilidades

### `src/engine/conziaMotor.ts`

- `conziaGuidanceProfile(...)`: define pacing, puerta default, y “trap” según arquetipo/confianza.
- `todayPlanFromProfile(profile)`: ajusta puerta recomendada según mes (1→observación, 3→proceso).
- `cutLineForTrap(trap)`: línea de corte por “trampa”.
- `getArchetypeLabel()`, `getArchetypeDescription()`: labels/copy.

### `src/engine/observacion.ts`

- `narrativeScore(text)`: heurística simple para penalizar narrativa (conectores, longitud, >2 frases).

### `src/metrics/computeMetrics.ts`

- `computeMetrics({ entries, sessions, processId, todayKey, now })`: métricas agregadas (carga emocional, estabilidad, silencio, conteos/tag 7d, chart).

### `src/utils/*`

- `dates.ts`: parsing seguro para `YYYY-MM-DD` en local (evita bug UTC).
- `pkce.ts`: `generateCodeVerifier()` + `createCodeChallenge()` (SHA-256 + base64url).
- `id.ts`: `createId(prefix)` (UUID o fallback).
- `cn.ts`: helper de clases.
- `useTypewriter.ts`: hook UI (no auditado a profundidad; depende de render/tiempo).

## 5) UI (componentes y páginas)

### UI primitives

Directorio `src/components/ui/`:
- Button/Card/Input/Textarea/Select/Range/Modal/Sheet/GlassSheet/etc.
- Son wrappers estilados (Tailwind) con props simples.

Directorio `src/components/charts/`:
- Charts SVG/Canvas-like (sparklines, heatmap, line, etc.).

### Páginas activas (rutas)

- `BootPage`: decide `/onboarding` / `/registro` / puerta activa / `/sesion`.
- `OnboardingPage`: wizard + flag `conzia_v1_onboarding_done`.
- `LoginPage`: login email/pass (Supabase); Google/Apple están como UI placeholder.
- `RegistroPage`:
  - `canGoNext()`: validación por step.
  - `handleFinalize()`: `signUpWithPassword()` + POST a `rest/v1/usuarios` + `dispatch(set_profile)` + `navigate("/pago")`.
- `PaymentPage`: mock de pago + `dispatch(update_profile)` + `navigate("/sesion")`.
- `ObservacionPage`:
  - Construye sesión activa (si no hay puerta activa).
  - Draft local por `storageKey + sessionId`.
  - `closeWithEntry()` crea entrada `puerta1_observacion` + cierra sesión.
- `ConsultorioPage` / `MesaPage`:
  - Circuitos con draft + validación + guardado de entrada + cierre.
- `ProcesoPage`:
  - Cierre de puerta/día; export debug JSON en DEV.
- `ResultadosPage`: radar y “oráculo” a partir de `archetype_scores` y/o derivación.
- `DesahogoPage`: análisis IA (proxy o fallback) + generación/aceptación de reto.
- `SuenosPage`: interpretación + visual (proxy IA) + guarda lectura.
- `CrisisPage`: mock.

## 6) Hallazgos principales (para priorizar)

1) **Desalineación docs ↔ código**: manuales/checklists describen un flujo distinto al actual.
2) **Duplicidad Auth**: `authStore` existe pero `LoginPage` no lo usa; riesgo de “dos verdades”.
3) **Legacy acumulado**: muchas páginas existen pero están fuera de rutas o redirigidas; aumenta superficie de mantenimiento.
4) **Dependencia de `.env`**: sin Supabase configurado, Registro/Login no cumplen el flujo (solo muestran error).
5) **Supabase REST**: `RegistroPage` hace POST directo a `/rest/v1/usuarios`; requiere RLS/tabla bien definida para no exponer datos.

## 7) Recomendaciones (orden sugerido)

- Consolidar flujo Auth (una sola fuente de verdad: `authStore` + UI coherente).
- Alinear documentación (Manual + QA checklist) con rutas reales (`/login`, pasos de registro, etc.).
- Definir y documentar modelo Supabase + RLS (tabla `usuarios`, campos, políticas).
- Definir “modo demo/local” (si Supabase no está configurado, permitir avanzar con perfil local).
- Agregar pruebas UI/e2e cuando se instale tooling (Vitest + RTL / Playwright).

