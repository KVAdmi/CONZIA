# CONZIA — PRODUCT_SPEC (resumen técnico)

## Propósito

CONZIA no busca que el usuario se sienta bien. Busca que vea claro.

No es:

- journaling
- bienestar / motivacional
- gamificación
- tests psicológicos como producto principal

Sí es:

- sistema cognitivo personal (registro + contraste + conciencia estructurada)

## Tono (regla)

- Sobrio, firme, sin drama
- Amoroso pero crudo (no cómplice)
- Sin emojis, sin clichés, sin “todo va a estar bien”
- Señalamiento basado en evidencia (hechos + repetición)

## Identidad visual (Balanced Harmony)

Uso obligatorio:

- Alabaster `#DBDFD5` (fondos base)
- Mint Cream `#EDF3EB` (descanso visual)
- Camel `#C9A176` (acento consciente)
- White `#FEFEFE` (cards)
- Gainsboro `#D5E1E2` (bordes/divisores)
- Morning Blue `#899E9D` (estado informativo)
- Outer Space `#374343` (texto principal / foco)

Prohibido: gradientes emocionales, colores “felices”, verde éxito/rojo error tipo app fitness.

## Navegación (nativo)

- Sesión
- Mapa
- Hablar (Espejo Negro)
- Bóveda
- Más

En **Más** viven: Lecturas, Integración, Arquetipos, Tests, Perfil, Configuración, Planes.

## Módulos (v1)

### Inicio (onboarding)

Objetivo: establecer tono + contrato cognitivo.

- Una promesa clara (sin wellness)
- CTA único: entrar a Sesión

### Sesión (tu próximo paso)

Objetivo: una sesión guiada (no dashboard, no cuestionario).

- 1 tarjeta principal: “Tu próximo paso”
- CTA: Hablar (Espejo Negro) o Escribir
- Caja sugerida solo con evidencia (sin forzar)
- Acceso a Crisis (sin drama, con acción)

### Espejo Negro (entrada por voz)

Objetivo: bypass del filtro intelectual.

- Captura de voz (mock en visor)
- Transcripción editable
- Guardar (silencio opcional)
- Pedir espejo breve (opcional)

### Escribir / Descarga (entrada por texto)

Regla: el textarea no va solo; siempre hay estructura.

Capas (selector):

- Desahogo libre
- Algo me incomodó
- Quería hacer algo distinto
- Hoy sí lo hice
- No quise ver esto

Campos:

- contexto, límite tocado, reacción, peso emocional, repetición (no/creo que sí/sí), tags
- modos con intención: intención + resultado + bloqueo

Acciones:

- Guardar (sin lectura)
- Guardar y pedir lectura (IA mock)
- Guardar en Bóveda (sin análisis)

Incluye: voz (mock) + “Modo silencio”.

### Lecturas (IA + biblioteca)

Secciones:

- Lectura del día (formato fijo por bloques)
- Verdades incómodas (cards + feedback)
- Narrativa personal (timeline filtrable por capa/patrón/picos/silencios)

### Mapa (Archivo + Patrones)

Debe verse lleno con mock data:

- Cards de patrones activos (≥6) con CTA “Ver evidencia”
- Ciclos de repetición (timeline)
- Estancamiento vs Movimiento
- Intención vs Realidad (panel)
- Gráficas animadas: heatmap, barras de frecuencia, línea densidad 30 días

### Bóveda (privacidad absoluta)

Reglas:

- No se analiza
- No entra a métricas
- No se usa para patrones

UI:

- Texto fijo de exclusión
- “Sellar” nota
- Lista de notas selladas
- Modo “Ceniza” (escribir y destruir)
- PIN/biometría (mock)

### Caja de Enfrentamiento (corazón)

Estructura:

1) Lo que pasó (evidencia: 3–5 eventos)
2) El patrón (nombre + explicación breve)
3) Historia espejo (ficticia, más clara; patrón subrayado)

Incluye:

- preguntas (“¿te resonó?”, “¿en qué parte te viste?”, “¿qué justificaste sin querer?”)
- confrontación sobria (amorosa pero cruda)
- cierre con 2 rutas: Acción mínima / Pregunta profunda para escribir

### Integración

- Compás de valores
- Herramientas por patrón (micro‑intervenciones)
- Ritual de liberación (cierre simbólico)

### Arquetipos (avanzado)

- Laboratorio (chat en personaje)
- Teatro de sombras (actúas como la sombra; lectura posterior)

### Crisis

- Respirar 60s
- 5 líneas sin filtro
- Lectura inmediata (contención)
- Contactos (mock)

## Modelo de datos (contrato)

Definido en `src/types/models.ts`:

- `Entry`
- `Intention`
- `Pattern`
- `Reading`
- `VaultNote`
- `MirrorStory`

Seed JSON en `src/data/seeds.json` con contenido suficiente para “app llena”.
