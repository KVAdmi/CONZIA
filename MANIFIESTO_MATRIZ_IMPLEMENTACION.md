# CONZIA — Matriz de implementación (Documento maestro vs visor web)

Este repo es un **visor web** para validar **flujo / estructura / ritual**. El producto final es **100% app nativa**.

Fuente de verdad (producto): `CONZIA_DOCUMENTO_MAESTRO.md`.

## Leyenda de estado

- **Hecho (visor)**: existe, funciona, se ve “lleno” con data mock.
- **Parcial (visor)**: existe pero falta rigor (ritual completo, trazabilidad total, detalle dedicado, etc.).
- **Mock (visor)**: existe como UI/flujo, pero sin backend real (o con datos simulados).
- **Pendiente (fase 2)**: requiere backend / nativo / seguridad / monetización real.

## Resumen ejecutivo (para dirección)

- El visor ahora corre en un **shell tipo app nativa** (contenedor “teléfono” + **navegación inferior**).
- **Sesión** (`/sesion`) es la pantalla principal: **“Tu próximo paso”** (1 CTA), no cuestionario.
- **Espejo Negro** (`/espejo`): entrada por voz (mock) → transcripción → guardar → espejo opcional.
- **Descarga** (`/descarga`) y **Escribir** (`/escribir`) siguen: estructura es **opcional** y secuencial.
- **Mapa** (`/mapa`): tablero duro (Agenda + Indicadores + gráficas). No se abre por defecto.
- **Consultorio** (`/consultorio`): confrontación guiada (alias de Caja por ahora).
- **Proceso** (`/proceso`): ruta activa (qué sigue).
- **Sala** (`/sala`): contención sin drama (mock).
- IA real:
  - **Lecturas**: **Parcial (visor)**. Se puede pedir lectura desde **Escribir** y se genera por **proxy local** (dev server) con fallback a mock.
  - **Historia espejo (Caja)**: **Parcial (visor)**. Botón “Generar (IA)” (proxy local) con fallback a mock.
  - **Gobernanza real** (pgvector, Edge Functions, safety pipeline automático): **Pendiente (fase 2)**.

---

## 0) Reglas transversales (stack / UX / datos)

| Requisito del manifiesto | Estado | Dónde vive / notas |
|---|---|---|
| Stack visor: React + Vite + TS + Tailwind | Hecho (visor) | `package.json`, `vite.config.ts`, `tailwind.config.ts` |
| UI sin librerías pesadas | Hecho (visor) | Componentes propios en `src/components/ui/` |
| Data mock desde día 1 (app “llena”) | Hecho (visor) | `src/data/seeds.json`, `src/data/seed.ts`, store `localStorage` en `src/state/conziaStore.tsx` (key `conzia_v1_state` en `src/App.tsx`) |
| Animaciones suaves (gráficas/transiciones) | Hecho (visor) | `src/components/charts/*` + `framer-motion` |
| Todo en español MX, tono sobrio | Parcial (visor) | Copy UI mayormente sobrio; faltan ajustes finos (microcopy uniforme, menos “UI empresarial”) |
| No gamifica / no infantiliza / sin emojis en UI | Parcial (visor) | UI sin gamificación; algunos docs tienen emojis (no afecta UI). Revisión final de copy pendiente |
| Responsive mobile + desktop | Parcial (visor) | Tailwind responsive; falta “pulido de saturación” (chips/espacio/jerarquía) |

---

## 1) Navegación (CONZIA)

| Elemento | Estado | Dónde vive / notas |
|---|---|---|
| Navegación inferior: Sesión / Proceso / Espejo / Mapa / Bóveda | Hecho (visor) | `src/app/AppLayout.tsx` + `src/app/BottomNav.tsx` |
| Inicio (onboarding) | Hecho (visor) | `src/pages/InicioPage.tsx` (`/inicio`) |
| Sesión (tu próximo paso) | Hecho (visor) | `src/pages/SesionPage.tsx` (`/sesion`) |
| Espejo Negro (voz mock) | Mock (visor) | `src/pages/EspejoNegroPage.tsx` (`/espejo`) |
| Proceso (ruta activa) | Hecho (visor) | `src/pages/RepeticionPage.tsx` (`/proceso`) |
| Consultorio (alias de Caja) | Hecho (visor) | `src/pages/CajaEnfrentamientoPage.tsx` (`/consultorio`) |
| Rutas legacy (compat) | Hecho (visor) | `/hoy → /sesion`, `/archivo → /mapa`, `/patrones → /mapa` (redirects en `src/App.tsx`) |

---

## 1 bis) Mapa / Dashboard de conciencia (tablero global)

| Entregable (dirección shadow work) | Estado | Dónde vive / notas |
|---|---|---|
| Vista global “Mapa” | Hecho (visor) | `src/pages/ArchivoPage.tsx` (reusada) + ruta `/mapa` |
| Agenda (14 días) “qué pasó hoy” | Hecho (visor) | `src/pages/ArchivoPage.tsx` (resumen por día) |
| Detalle por día (modal) | Hecho (visor) | `src/pages/ArchivoPage.tsx` (abre evidencia + ritual del día) |
| Indicadores 30 días (5–7) con tendencia | Hecho (visor) | `src/pages/ArchivoPage.tsx` (sparklines) |
| “Beneficio oculto” como hipótesis por indicador | Parcial (visor) | Hoy es copy fijo; en fase 2 se sostendrá con evidencia determinística + voz oficial |
| Práctica sugerida (shadow work) | Hecho (visor) | `src/content/shadowPractices.ts` + UI en `src/pages/ArchivoPage.tsx` |
| Intención vs Realidad (visual) | Hecho (visor) | `src/pages/ArchivoPage.tsx` (Stacked bars 7 días + resumen 30 días) |
| Banner “Test del mes” / rotación mensual | Hecho (visor) | `src/pages/ArchivoPage.tsx` (mock) + CTA a `/tests` |
| Archivo visual (heatmap + densidad 30 días) | Hecho (visor) | `src/pages/ArchivoPage.tsx` (colapsado por defecto) |

---

## 2) Módulo SESIÓN (pantalla principal)

| Entregable del manifiesto | Estado | Dónde vive / notas |
|---|---|---|
| “Tu próximo paso” (1 CTA) | Hecho (visor) | `src/pages/SesionPage.tsx` (Espejo/Mesa, Consultorio sugerido con evidencia) |
| Espejo Negro como entrada principal | Mock (visor) | `src/pages/EspejoNegroPage.tsx` (voz simulada + transcripción) |
| Sala (sin drama) | Mock (visor) | `src/pages/CrisisPage.tsx` (`/sala`) |
| Safety pipeline automático (bloquea confrontación si hay riesgo) | Pendiente (fase 2) | Requiere backend/orquestador + detección real |

---

## 3) Módulo ESCRIBIR (registro cognitivo)

| Entregable del manifiesto | Estado | Dónde vive / notas |
|---|---|---|
| Descarga (expresión libre, sin examen) | Hecho (visor) | `src/pages/DescargaPage.tsx` (`/descarga`, modo sala sin header) |
| Estructurar (opcional, colapsado) | Hecho (visor) | `src/pages/EscribirPage.tsx` (toggle “Estructurar”) |
| Capa (5 capas) sin saturación | Hecho (visor) | `src/pages/EscribirPage.tsx` (picker en Sheet, no dropdown visible) |
| Hecho vs Historia (separación) | Hecho (visor) | `src/pages/EscribirPage.tsx` (campos al activar “Estructurar”) |
| Campos estructurados: contexto/límite/reacción/peso/¿se repite? | Hecho (visor) | `src/pages/EscribirPage.tsx` (solo al activar “Estructurar”) |
| Tags: selector con búsqueda (máx 3) | Hecho (visor) | `src/pages/EscribirPage.tsx` (Sheet “Tags”) |
| Botones: Guardar / Guardar y pedir lectura / Sellar en Bóveda | Hecho (visor) | `src/pages/EscribirPage.tsx` |
| Modo silencio (guarda sin lectura inmediata) | Hecho (visor) | `src/pages/EscribirPage.tsx` |
| Entrada por voz (mock UI + transcripción simulada) | Hecho (visor) | `src/pages/DescargaPage.tsx` y `src/pages/EscribirPage.tsx` |
| Mecánica anti-justificación (“sin porque”) | Parcial (visor) | Hay hints; falta opción explícita “sin ‘porque’” y scoring de justificación (fase 2) |

---

## 4) Módulo LECTURAS (respuesta IA + biblioteca)

| Entregable del manifiesto | Estado | Dónde vive / notas |
|---|---|---|
| Lectura del día (formato fijo) | Hecho (visor) | `src/pages/LecturasPage.tsx` (muestra lectura seed y lecturas generadas) |
| 6 bloques: contención / lo que veo / patrón / evitación / pregunta / acción mínima | Hecho (visor) | Render en `src/pages/LecturasPage.tsx` |
| Trazabilidad “Basado en: [IDs]” | Parcial (visor) | Para lecturas generadas: `basedOnEntryIds`; en seed no siempre existe |
| Verdades incómodas + feedback | Hecho (visor) | `src/content/truths.ts` + `truthFeedback` en `src/state/conziaStore.tsx` |
| Narrativa personal (timeline filtrable) | Hecho (visor) | `src/pages/LecturasPage.tsx` (filtros + picos + silencios) |
| Lecturas semanal/mensual agregadas | Pendiente (fase 2) | Requiere orquestación y jobs/backend |
| “Capítulos” de narrativa personal | Pendiente (fase 2) | Requiere motor y persistencia real |

---

## 5) Módulo PATRONES (tablero real)

| Entregable del manifiesto | Estado | Dónde vive / notas |
|---|---|---|
| Cards de patrones activos (mínimo 6) | Hecho (visor) | `src/pages/PatronesPage.tsx` (lista simple + “Revisar archivo”) |
| “Ver evidencia” (entradas que lo sustentan) | Hecho (visor) | `src/pages/PatronesArchivoPage.tsx` (sección “Evidencia”) |
| Ciclos de repetición (timeline) | Pendiente (visor) | Falta timeline dedicado de apariciones por patrón (fase 2 UX / datos). |
| Estancamiento vs movimiento (métrica) | Hecho (visor) | `src/pages/PatronesArchivoPage.tsx` (sección “Movimiento”) |
| Intención vs Realidad | Hecho (visor) | `src/pages/PatronesPage.tsx` (resumen colapsado) |
| Gráficas animadas (heatmap/barras/línea) | Hecho (visor) | `src/pages/PatronesArchivoPage.tsx` (sección “Gráficas”) |
| Detalle dedicado de patrón (pantalla/archivo) | Hecho (visor) | Ruta `src/pages/PatronesArchivoPage.tsx` (`/patrones/archivo`) |
| “Por qué” verificable por patrón (trazabilidad) | Pendiente (fase 2) | Requiere retrieval determinístico real (pgvector) + evidencias |

---

## 6) Módulo BÓVEDA (privacidad absoluta)

| Entregable del manifiesto | Estado | Dónde vive / notas |
|---|---|---|
| Copy fijo “no existe para el sistema” | Hecho (visor) | `src/pages/BovedaPage.tsx` |
| Notas selladas (lista + abrir) | Hecho (visor) | `src/pages/BovedaPage.tsx` |
| Modo Ceniza (escribir y destruir) | Hecho (visor) | `src/pages/BovedaPage.tsx` |
| PIN/biometría (mock UI) | Hecho (visor) | `src/pages/BovedaPage.tsx` |
| Cifrado/exportación segura/biometría real | Pendiente (fase 2) | Nativo + storage seguro + threat model |
| Exclusión total de analítica/IA | Hecho (visor) | A nivel de flujo: Bóveda no pasa por `services/ai/*` |

---

## 7) Caja de Enfrentamiento (módulo corazón)

| Entregable del manifiesto | Estado | Dónde vive / notas |
|---|---|---|
| Estructura 3 capas: evidencia → patrón → historia espejo | Hecho (visor) | `src/pages/CajaEnfrentamientoPage.tsx` |
| Evidencia (3–5 eventos) conectados | Hecho (visor) | Selección por `pattern.evidenceEntryIds` o similitud simple |
| Confrontación amorosa pero cruda | Parcial (visor) | Hoy es heurística por patrón; en fase 2 lo redacta voz oficial con evidencia |
| Historia espejo con highlights | Parcial (visor) | Seed + botón “Generar (IA)” (proxy local) |
| Preguntas (resonancia) | Hecho (visor) | `src/pages/CajaEnfrentamientoPage.tsx` |
| 2 rutas de salida (acción mínima / pregunta profunda) | Hecho (visor) | Modales + Ruta B abre Escribir |
| Pantalla “modo sala” (sin navegación visible) | Hecho (visor) | En web: `/caja` sin header/tabs globales. En nativo: full-screen real (fase 2). |
| Ruta B se convierte en entrada estructurada | Parcial (visor) | Ruta B prellena Escribir (`/escribir?...&prompt=`). Falta ligar entrada ↔ patrón (fase 2). |

---

## 8) Tests (con propósito)

| Entregable del manifiesto | Estado | Dónde vive / notas |
|---|---|---|
| Biblioteca por tema (límites, apego, evitación, etc.) | Hecho (visor) | `src/content/tests.ts`, UI en `src/pages/TestsPage.tsx` |
| Tests cortos y largos (5–12 / 20–40) | Hecho (visor) | Seeds en `src/content/tests.ts` |
| Resultado: “Esto sugiere…” + conexión con patrón + CTA | Hecho (visor) | Modal de resultado en `src/pages/TestsPage.tsx` |
| Lectura IA desde resultado del test (formato fijo) | Hecho (visor) | `src/pages/TestsPage.tsx` genera lectura con `generateTestReading()` (proxy local si hay llave, fallback mock). Se guarda como `Reading` tipo `test` y se ve en `/lecturas`. |
| Tests como disparadores de Caja | Hecho (visor) | CTA a `/caja?patternId=...` |
| Descubribilidad (no escondidos) | Hecho (visor) | Card “Test del mes” en `src/pages/HoyPage.tsx` + banner en `src/pages/ArchivoPage.tsx` + menú Cuenta en `src/app/Header.tsx` |
| Personalización real por historia/patrones | Pendiente (fase 2) | Requiere backend y memoria narrativa |

---

## 9) Auth + planes (monetización)

| Entregable del manifiesto | Estado | Dónde vive / notas |
|---|---|---|
| Login/registro email+password | Parcial (visor) | UI + integración Supabase: `src/pages/AccesoPage.tsx` (depende de `.env`). Acceso visible desde menú “Cuenta” (`src/app/Header.tsx`). |
| Google Sign-In | Parcial (visor) | UI + PKCE callback: `src/pages/AuthCallbackPage.tsx` (depende de credenciales) |
| Apple Sign-In (si hay Google en iOS) | Pendiente (fase 2) | Nativo iOS |
| “Entrar sin cuenta” (modo local) | Hecho (visor) | `src/pages/AccesoPage.tsx` |
| Paywall 2 planes (99/129) | Hecho (visor) | `src/pages/PlanesPage.tsx` |
| Trial 7 días | Mock (visor) | `src/state/subscriptionStore.tsx` (localStorage) |
| RevenueCat + IAP Apple/Google | Pendiente (fase 2) | Nativo + backend/entitlements reales |
| Asistencia terceros (IGS/Azisted) | Pendiente (fase 2) | Integración real + términos + UX de derivación |

---

## 10) IA gobernada (contrato cognitivo)

| Entregable del manifiesto | Estado | Dónde vive / notas |
|---|---|---|
| Una sola voz oficial visible (Claude Sonnet) | Parcial (visor) | Proxy local usa Anthropic para lecturas/historia (si hay llave); falta producción |
| Metadatos internos (Groq) sin redacción visible | Pendiente (fase 2) | No implementado en visor (solo preparado en manifiesto) |
| Evidencia por retrieval determinístico (pgvector) | Pendiente (fase 2) | En visor hay heurística local; pgvector + RLS va en backend |
| Orquestador IA en Edge Functions (router/costos/frecuencia) | Pendiente (fase 2) | No hay Edge Functions en producción aún |
| Cache semántico por usuario (sin texto crudo) | Pendiente (fase 2) | No implementado |
| Bóveda excluida de todo pipeline | Hecho (visor) | En flujo/UI; falta enforcement backend (fase 2) |
| Safety pipeline automático (bloquea confrontación si hay riesgo) | Pendiente (fase 2) | Hoy hay Modo Crisis manual; falta detección y bloqueo automático |

---

## Notas de “saturación” (lo que se ve cargado)

Esto no es “faltante funcional”; es **jerarquía/ritual**.

Acciones recomendadas (visor → nativo):

1) **Progresive disclosure**: en HOY mostrar 1 gráfica + 1 card clave y mover el resto a “Ver detalle”.
2) **Chips**: limitar sugerencias visibles (ej. 6) y usar un panel secundario (drawer/modal) para el resto.
3) **Secuencia**: HOY debe sentirse como sesión: *Estado → Pulso → Intención → (opcional) Alertas → Cierre*.
4) **Evidencia > KPI**: menos contadores, más texto con peso y trazabilidad.
