# Concia — Documento maestro de producto (v1.0)

Estado: Borrador para alineación.

Audiencia: Dirección de producto, diseño, ingeniería (iOS/Android), IA.

Objetivo de este documento: ser la única fuente para construir Concia sin convertirla en “cuestionario/encuesta”. Concia se diseña como **sesión guiada de trabajo de sombra**: contención breve, confrontación clara, salida accionable.

---

## 0) Qué es Concia (y qué no)

### Qué es

Concia es un **sistema cognitivo personal** para trabajo de sombra individual: registra hechos, observa repetición, contrasta intención vs realidad y devuelve conciencia estructurada, con una IA **amorosa pero cruda** (no cómplice, no clínica).

### Qué no es

- Una app de journaling libre “para sentirte mejor”.
- Una app de bienestar/motivacional.
- Una app de tests como producto principal.
- Una terapia, diagnóstico o promesa clínica.
- Un dashboard de KPIs “empresariales”.

### Frase madre (operativa)

Concia no te dice qué hacer. Te muestra lo que ya estás haciendo. Y te deja decidir.

---

## 1) Principios no negociables (para evitar el efecto “encuesta”)

1) **Una acción principal por sesión**: la app guía a un “siguiente paso” claro; lo demás es secundario.

2) **Una pregunta por pantalla** (progresivo > simultáneo): la estructura aparece en secuencia, no como formulario.

3) **Estructura invisible**: primero habla/escribe; después el sistema propone estructura y el usuario solo confirma/corrige (opcional).

4) **Evidencia primero**: ningún patrón/afirmación sin ancla en entradas reales (IDs/fechas).

5) **Confrontación con cuidado**: firme, sobria; sin drama, sin clichés, sin premios, sin gamificación.

6) **Bóveda fuera del sistema**: lo sellado no se analiza, no se aprende, no se mide, no se usa.

7) **Ritual antes que insight**: la sesión humana mínima precede cualquier lectura “dura”.

---

## 2) Arquitectura de experiencia (cómo se usa)

### Core loop (sesión)

1) **Sesión / “Tu Próximo Paso”**
2) **Entrada** (Espejo Negro voz o Descarga en texto)
3) **Espejo** (lectura corta: “lo que veo” + 1 pregunta)
4) **Caja** (si hay repetición/estancamiento) o **Cierre**
5) **Salida**: acción mínima hoy o pregunta profunda para escribir
6) **Registro**: queda evidencia para Mapa/Patrones

### Bucles semanales/mensuales

- Lectura semanal (agregada): movimiento vs estancamiento, silencios, patrón dominante.
- Revisión mensual: intención vs realidad (tendencia), “frase espejo” del mes, test recomendado (si aplica).

---

## 3) Navegación (IA/IAU: Information Architecture + User Intent)

### Regla

No hay “tab bar” que invite a explorar por aburrimiento. La navegación existe para sostener el foco, no para mostrar módulos.

### Estructura propuesta (nativo)

- **Pantalla principal**: `Sesión` (dinámica) — siempre abre aquí.
- **Invocación rápida**: botón persistente “Crisis” + entrada rápida “Hablar” (Espejo Negro).
- **Menú lateral** (invocado): Mapa, Caja (historial), Lecturas, Arquetipos, Integración, Bóveda, Tests, Ajustes.

### Estructura compatible con el visor web actual (si se mantiene header)

Para no reescribir todo de golpe:

- `Hoy` se renombra conceptualmente a **Sesión** (aunque el tab siga diciendo Hoy temporalmente).
- `Descarga` se convierte en **Entrada** principal (Espejo Negro en texto/voz).
- `Archivo` se reafirma como **Mapa** (no tab).

---

## 4) Mapa completo de pantallas (blueprint con IDs)

La app se especifica en pantallas con IDs estables para implementación.

### 4.1 Onboarding

**OB-01 — Entrada**
- UI: fondo sobrio, una frase (tono), CTA único “Entrar”.
- Función: establecer atmósfera y foco.

**OB-02 — Contrato cognitivo**
- UI: conversación corta (2–3 burbujas).
- Copy obligatorio: “No soy un asistente. No estoy aquí para hacerte sentir cómodo. Estoy aquí para ayudarte a mirar lo que evitas.”
- Acciones: “Acepto” / “No ahora”.

**OB-03 — Nombre y privacidad**
- UI: “¿Cómo debería llamarte?” + “Datos en tu dispositivo” + opción de backup futuro.
- Acciones: guardar nombre.

**OB-04 — Permisos (opt-in)**
- Notificaciones (solo si se activa “Mapeo de ecos”).
- Micrófono (si el usuario quiere Espejo Negro por voz).

**OB-05 — Línea base (primer ejercicio)**
- UI: Espejo Negro (voz) o texto (si no da permiso).
- Prompt base: “¿Qué es lo que más deseas en este momento, sin justificarte?”
- Salida: lectura breve + “Ir a Sesión”.

### 4.2 Sesión (principal)

**SE-01 — Sesión / “Tu Próximo Paso”**
- Arriba: “Estado actual” (1 selector simple; no 10 inputs).
- Centro: tarjeta principal “Tu Próximo Paso” (CTA).
- Abajo (secundario): “Mapa”, “Bóveda”, “Refugio”.
- Estados de tarjeta (ejemplos):
  - `silencio`: “No has entrado en X días. Hoy solo habla 60s.”
  - `intencion_fallida`: “Ayer no lo hiciste. Nombra el bloqueo sin explicar.”
  - `repeticion`: “Esto se repitió 3 veces. Entra a Caja.”
  - `movimiento`: “Hoy hubo cambio. Captura qué hiciste distinto.”
- Acciones:
  - CTA principal: abre `IN-01` (Entrada).
  - CTA secundaria (si aplica): abre `CA-01` (Caja).
- Métricas visibles aquí: 1 sola (ej. densidad 7 días colapsada).

### 4.3 Entrada (Espejo Negro / Descarga)

**IN-01 — Espejo Negro (voz)**
- UI: pantalla limpia; botón de grabar “mantener para hablar”; onda sutil; contador.
- Flujo:
  1) prompt incisivo (1 sola frase)
  2) grabación
  3) transcripción (editable)
  4) “Insight breve” + 1 pregunta
  5) “Guardar”
- Regla: el usuario puede guardar sin lectura si elige “silencio”.

**IN-02 — Descarga (texto)**
- UI: textarea sin campos; microcopy: “No te expliques. Nombra el hecho.”
- Botones:
  - Guardar
  - Guardar y pedir espejo (lectura)
  - Sellar en Bóveda
- Post-guardar: opción “Estructurar (opcional)” (no obligatorio).

**IN-03 — Estructurar (opcional, secuencial)**
- UI por pasos (no formulario):
  1) contexto (1 selección)
  2) límite tocado (1 selección)
  3) reacción (1 selección)
  4) peso emocional (1 slider)
  5) ¿se repite? (toggle)
  6) tags (máx 3)
- Acciones: confirmar/editar.

### 4.4 Espejo (lecturas)

**RE-01 — Lectura inmediata (breve)**
- Formato fijo (min):
  - Contención sobria (1 párrafo)
  - Lo que veo (hecho)
  - Pregunta única
- Salidas:
  - “Cerrar”
  - “Ir a Caja” (si la lectura detecta repetición con evidencia)
  - “Escribir” (pregunta profunda)

**RE-02 — Biblioteca de lecturas**
- Lista filtrable por: evento, intención, patrón, semanal/mensual.
- Cada lectura: “Basado en: …” (IDs/fechas, sin exponer contenido completo).

### 4.5 Caja (corazón)

**CA-01 — Caja de Enfrentamiento**
- Pantalla modo sala (sin navegación).
- Capa 1: evidencia (3–5 eventos resumidos; con fecha).
- Capa 2: patrón (nombre humano + descripción breve).
- Capa 3: historia espejo (ficticia, más clara; con subrayados).
- Confrontación (copy sobrio):
  - “No te están minimizando: tú estás negociando tu lugar.”
  - “No es mala suerte: es elección repetida desde miedo.”
- Preguntas:
  - “¿Te resuena?”
  - “¿En qué parte te viste?”
  - “¿Qué justificaste sin querer?”
- Salida:
  - Ruta A: “Acción mínima hoy”
  - Ruta B: “Comprensión” (pregunta profunda → `IN-02` prellenado)

**CA-02 — Historial de cajas**
- Lista por fecha/patrón.
- Reabrir caja (solo lectura; sin regenerar si no se pide).

### 4.6 Mapa (Archivo/Patrones)

**MA-01 — Mapa (tablero global)**
- Agenda 14 días: resumen diario (movimiento, recaída, silencio, evidencia).
- Indicadores 30/60 días (5–7):
  - densidad emocional
  - intención vs realidad
  - silencios
  - patrón dominante
  - movimiento vs estancamiento
- Banner “Test del mes” (sin urgencia).

**MA-02 — Patrones activos (cards)**
- Cards (≥6): nombre, frecuencia, contexto dominante, tendencia.
- CTA: “Ver evidencia” → `MA-03`.

**MA-03 — Detalle de patrón**
- Evidencia (timeline)
- Contextos (distribución)
- Movimiento vs estancamiento (métrica con explicación humana)
- CTA: “Entrar a Caja”

### 4.7 Integración

**IG-01 — Compás de valores**
- UI: brújula/radar; valores definidos tras avances.
- Cada valor: origen (fecha + “por qué lo elegí”).
- CTA: “Aplicar hoy” (pregunta concreta vinculada a un evento próximo).

**IG-02 — Herramientas**
- Biblioteca corta, directa, activada por patrón.
- Formatos: guión breve, plantilla de frase, ejercicio 90s.

**IG-03 — Ritual de liberación**
- UI: objeto simbólico (palabra/creencia) + 3 acciones (quemar/romper/soltar).
- Interacción: animación + hápticos.
- Post: “qué valor pones en su lugar” → sugiere `IG-01`.

### 4.8 Arquetipos (avanzado)

**AR-01 — Laboratorio de arquetipos**
- Galería de “personas” de sombra: imagen abstracta + nombre.
- CTA: abrir chat.

**AR-02 — Chat con arquetipo**
- Regla: el arquetipo no rompe personaje.
- UI distinta al guía principal.

**AR-03 — Teatro de sombras**
- Escenario → “actúa como…” (voz) → lectura posterior.
- Reutiliza Espejo Negro (infra de voz).

### 4.9 Bóveda

**VA-01 — Bóveda**
- Texto fijo: “Esto no existe para Concia.”
- Lista de notas selladas.
- Modo ceniza (escribir y destruir).
- PIN/biometría (nativo real; en visor mock).

### 4.10 Crisis / Refugio

**CR-01 — Crisis (modal/pantalla)**
- Opciones:
  - respirar 60s
  - 5 líneas sin filtro
  - lectura inmediata (contención)
  - contactar a alguien (lista personal)
  - recursos (si se incluye)
- Regla: tono sobrio, no clínica, sin prometer.

### 4.11 Tests (con propósito)

**TS-01 — Biblioteca de tests**
- Temas: límites, apego, evitación, rumiación, autoestima, desgaste.
- Tests cortos y largos.

**TS-02 — Resultado**
- No etiqueta: “Esto sugiere… / Esto no te define…”
- Conecta con patrón probable.
- CTA: “Entrar a Caja”.

---

## 5) Diseño (sistema visual y tono)

### Tono de voz (sistema)

- Sobrio, firme, sin drama.
- Amoroso pero crudo (no cómplice).
- Sin emojis, sin clichés, sin “todo va a estar bien”.
- Frases cortas, concretas, verificables.

### Diseño (reglas de UI)

- Mucho aire. Pocas decisiones por pantalla.
- CTA principal claro; secundarias discretas.
- Progresivo: colapsar lo analítico; expandir solo cuando el usuario elige.

### Paleta (decisión pendiente, pero se exige coherencia)

Concia debe escoger 1 paleta oficial y aplicarla en todo (app + marketing). En este repo hoy conviven paletas; eso se resuelve al cerrar identidad de Concia.

Recomendación para Concia (por alineación con “sala silenciosa”):

- Fondo base cálido (hueso/crema) + texto profundo (marrón/negro suave).
- Acento sobrio (ciruela/terracota) para CTA y foco.
- Sin verdes/rojos tipo fitness.

---

## 6) Modelo de datos (contrato)

Este contrato define lo mínimo para que todo sea trazable (evidencia) sin convertirse en “formulario”.

### Entidades núcleo

- `Entry`
  - `id`, `createdAt`, `source` (`voice|text`), `rawText`
  - `transcript` (si voz), `audioRef` (si existe)
  - `context` (opcional/confirmado), `boundary` (opcional/confirmado), `reaction` (opcional/confirmado)
  - `emotionalWeight` (0–100), `energy` (0–100), `clarity` (0–100)
  - `repeatSignal` (`no|maybe|yes`), `tags` (máx 3)
  - `isVault` (si fue sellado) + `vaultMeta` (solo local)

- `Intention`
  - `id`, `date`, `intentionText`
  - `result` (`done|partial|not_done`), `blocker` (enum), `note`

- `Pattern`
  - `id`, `name`, `description`
  - `strength` (0–1), `trend` (`up|down|flat`)
  - `evidenceEntryIds` (3–20)
  - `contexts` (distribución), `movementScore`

- `Reading`
  - `id`, `type` (`event|intention|pattern|weekly|monthly|test`)
  - `blocks` (texto por bloque, formato fijo)
  - `basedOnEntryIds` (trazabilidad)
  - `severity` (0–1), `createdAt`

- `MirrorStory`
  - `id`, `patternId`, `text`, `highlights` (rangos)
  - `basedOnEntryIds`

- `Archetype`
  - `id`, `name`, `personaPrompt`, `imageRef`
  - `discoveredFromEntryIds`

- `ValueCompass`
  - `values[]` (nombre + definición breve + fecha + origen)

- `Ritual`
  - `id`, `type` (`burn|break|release`), `beliefText`, `completedAt`
  - `resultingValue` (opcional)

- `Test`, `TestResult`
  - `testId`, `answers`, `score`, `insightText`, `linkedPatternId?`

### Exclusión Bóveda

Todo `Entry.isVault=true`:

- no entra a pattern detection
- no entra a lecturas
- no entra a métricas

---

## 7) Motor de IA (por capas, gobernado)

### Objetivo

Evitar “chat infinito” y evitar lecturas sin evidencia.

### Capas (pipeline)

1) **Ingesta** (texto/transcripción)
2) **Extracción ligera** (entidades/temas) para sugerir estructura invisible
3) **Detección de repetición** (ventanas 14/30/60 días) con trazabilidad
4) **Generación de lectura** (formato fijo) cuando el usuario lo pide o cuando toca por reglas explícitas
5) **Historia espejo** (solo dentro de Caja)
6) **Acción mínima** (siempre) + enlace a herramienta
7) **Safety gate** (si hay señales de riesgo, degradar a contención + Crisis)

### Reglas de disparo (ejemplos)

- “Caja sugerida” cuando:
  - patrón activo con ≥3 evidencias en 14 días
  - intención fallida repetida (≥2 veces) + mismo bloqueo
  - silencios prolongados + densidad previa alta

- “Lectura inmediata” solo si:
  - usuario la pide, o
  - está en Caja, o
  - está en Modo Crisis (contención)

### Calidad (contrato de salida)

Toda lectura/historia:

- debe citar evidencia interna (IDs/fechas)
- debe mantener tono (sobrio, firme)
- debe terminar con 1 pregunta y 1 acción mínima

---

## 8) Voz (Espejo Negro)

### UX

- Mantener para grabar (reduce fricción).
- Transcripción editable (control del usuario).
- Separar claramente:
  - “Lo que dijiste” (texto)
  - “Lo que delata” (insight)

### Señales útiles (si el proveedor las entrega)

- pausas
- velocidad de habla
- variación de tono
- quiebres (silencios antes de palabras específicas)

### Regla de interpretación

La voz no “diagnostica”; sugiere hipótesis: “Noté una pausa al decir X. ¿Qué evitaste ahí?”

---

## 9) Gráficas y métricas (para el usuario, sin KPI empresarial)

### Dónde viven

- `Sesión`: 1 gráfica suave, colapsada por defecto (7 días).
- `Mapa`: todo lo duro (30/60 días).

### Gráficas mínimas

- Densidad emocional (línea, 7/30 días)
- Intención vs realidad (barras apiladas, 7/30 días)
- Silencios (heatmap simple: días sin entrada / días con entrada)
- Patrones activos (frecuencia + tendencia)
- Movimiento vs estancamiento (score explicado en lenguaje humano)

---

## 10) APIs / Integraciones (recomendación y abstracciones)

No se casa la app con un proveedor; se define una interfaz.

- `LLMProvider` (lecturas, historia espejo, copy de notificaciones)
  - estrategia: modelo barato para clasificación; modelo de “voz oficial” para lecturas/caja
- `STTProvider` (voz → texto + metadatos)
- `ImageProvider` (arquetipos/oráculo, si se implementa)
- `PushProvider` (notificaciones; opt-in)
- `Storage` (local seguro + sync opt-in)

Optimización de costos:

- cache semántico por usuario (sin texto crudo cuando se pueda)
- rate limits por día/sesión
- batch semanal/mensual

---

## 11) Notificaciones (Mapeo de ecos) — proactivo sin ser spam

### Diseño

Solo con opt-in. Pocas. Buenas. Contextuales.

### Lógica

Evento próximo registrado + patrón correlacionado → notificación de preparación:

“Mañana tienes X. Aquí suele aparecer Y. Tu valor guía es Z. ¿Qué sería una decisión mínima desde Z?”

---

## 12) Seguridad y privacidad (mínimo viable y fase 2)

MVP (local):

- datos locales (persistencia)
- exportación local
- borrado total

Fase 2 (nativo):

- cifrado fuerte en reposo (Vault)
- biometría real
- sync opt-in con RLS estricto (si existe backend)

---

## 13) Métricas de éxito (producto, no vanidad)

### Activación

- Finalización de onboarding (OB-05 completado) > 90%
- Tiempo a primera sesión completa < 3 min

### Retención (semanal)

- % usuarios que completan ≥3 sesiones en 7 días
- % usuarios que entran a Caja cuando se sugiere (sin forzar)

### Profundidad (calidad)

- % lecturas guardadas con trazabilidad completa
- % acciones mínimas registradas (no “logros”, solo evidencia)

### Seguridad

- % sesiones que disparan safety gate y degradan correctamente a contención

---

## 14) Decisiones pendientes (para cerrar antes de construir)

1) Paleta oficial Concia (una sola).
2) Arquitectura final de navegación (menú lateral vs tabs en visor).
3) Proveedor(es) de IA (y router por capas).
4) Alcance v1 (qué entra) vs v2 (arquetipos/oráculo/voz avanzada).
