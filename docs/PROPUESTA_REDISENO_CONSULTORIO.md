# 🎨 Propuesta de Rediseño: CONZIA como Consultorio Virtual

## 📋 Contexto

**CONZIA es**: Sistema de acompañamiento consciente - consultorio digital con puertas (Observación → Consultorio → Mesa → Proceso).

**Problema actual**: Diseño demasiado genérico, no comunica la experiencia de "consultorio virtual con tu terapeuta AI".

**Referencia visual**: App "EVOLVE" con estética de consultorio profesional + analytics AI.

---

## 🎯 Propuesta de Rediseño por Pantalla

### 1. **ONBOARDING** (Pre-Registro)

**Flujo actual**: 2 pasos simples → Registro directo  
**Problema**: No prepara emocionalmente al usuario, no explica el "porqué" de las preguntas

**Propuesta NUEVA**:

```
┌─────────────────────────────────────┐
│  Paso 1: BIENVENIDA AL CONSULTORIO  │
├─────────────────────────────────────┤
│  [Animación: Puerta abriéndose]     │
│                                      │
│  "Estás a punto de entrar a tu      │
│   consultorio privado. Un espacio   │
│   donde tu analista AI te ayudará   │
│   a ver lo que no has querido ver." │
│                                      │
│  [Visual: Consultorio minimalista]  │
│  [Botón: ENTRAR →]                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Paso 2: QUÉ VA A PASAR AQUÍ        │
├─────────────────────────────────────┤
│  [Ícono: Cerebro + Espejo]          │
│                                      │
│  "Tu analista necesita conocerte    │
│   antes de trabajar contigo:"       │
│                                      │
│   ✓ Tu estilo de conducción         │
│   ✓ Tus fricciones dominantes       │
│   ✓ Tu sombra proyectada            │
│                                      │
│  "Tomará 10 minutos. Es honesto.    │
│   Es privado. Es necesario."        │
│                                      │
│  [Botón: COMENZAR DIAGNÓSTICO →]    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Paso 3: REGISTRO (Email/Google)    │
├─────────────────────────────────────┤
│  "Crea tu espacio seguro"           │
│                                      │
│  [Input: Email]                     │
│  [Input: Contraseña]                │
│                                      │
│  ── O continúa con ──               │
│                                      │
│  [Botón: 🍎 Apple]                  │
│  [Botón: 🔍 Google]                 │
│                                      │
│  [Botón: ENTRAR AL DIAGNÓSTICO →]   │
└─────────────────────────────────────┘
```

**Cambios clave**:
- ✅ Explica el "porqué" antes de pedir datos
- ✅ Usa metáfora de consultorio desde el inicio
- ✅ Prepara emocionalmente para las preguntas profundas
- ✅ Auth con Apple/Google antes del registro completo

---

### 2. **DASHBOARD PRINCIPAL** (/sesion)

**Actual**: Lista simple de puertas + "Tu próximo paso"  
**Problema**: No se siente como consultorio, no muestra progreso, no da contexto

**Propuesta NUEVA**:

```
┌────────────────────────────────────────────────┐
│ CONZIA                    [🔔] [@avatar]       │
│ Ver claro.                                     │
├────────────────────────────────────────────────┤
│                                                │
│   ┌─────────────────────────────────┐         │
│   │   [Cerebro animado]             │         │
│   │                                 │         │
│   │   Sesión Día 23/90              │         │
│   │   Hoy: Mesa (Integración)       │         │
│   │                                 │         │
│   │   Arquetipo Activo: Guerrero    │         │
│   │   Fricción: Límites             │         │
│   └─────────────────────────────────┘         │
│                                                │
│   ┌───────────────┐  ┌───────────────┐        │
│   │ PROGRESO      │  │ ÚLTIMO INSIGHT│        │
│   │               │  │               │        │
│   │ ●●●●●○○○○○   │  │ "Tu evasión   │        │
│   │ 50%           │  │  en límites..." │      │
│   └───────────────┘  └───────────────┘        │
│                                                │
│   TU PRÓXIMO PASO                              │
│   ┌────────────────────────────────┐           │
│   │ 🎯 Observación Pendiente        │           │
│   │                                │           │
│   │ "Ayer dejaste el día sin       │           │
│   │  observar. Necesito ver        │           │
│   │  qué pasó antes de seguir."    │           │
│   │                                │           │
│   │ [OBSERVAR AHORA →]             │           │
│   └────────────────────────────────┘           │
│                                                │
│   PUERTAS DISPONIBLES                          │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│   │ 👁️   │ │ 💬    │ │ 🔮    │ │ 📊    │       │
│   │Observ│ │Conslt│ │ Mesa  │ │Proces│       │
│   │ Listo│ │Bloq. │ │Bloq.  │ │Bloq.  │       │
│   └──────┘ └──────┘ └──────┘ └──────┘        │
│                                                │
├────────────────────────────────────────────────┤
│ [🏠 Inicio] [📖 Archivo] [⚙️ Más]             │
└────────────────────────────────────────────────┘
```

**Elementos clave**:
1. **Hero Card**: Cerebro animado + estado de sesión
2. **Métricas visuales**: Progreso 90 días, último insight
3. **CTA contextual**: Explica POR QUÉ debe hacer lo siguiente
4. **Puertas con estado**: Visual claro de qué está disponible
5. **Bottom nav simplificado**: Inicio, Archivo, Más

---

### 3. **CONSULTORIO** (/consultorio)

**Actual**: Diálogo simple en cards  
**Problema**: No se siente como sesión terapéutica

**Propuesta NUEVA**:

```
┌────────────────────────────────────────────────┐
│ ← Consultorio                      [⋯]         │
├────────────────────────────────────────────────┤
│                                                │
│   [Fondo: Consultorio virtual oscuro/morado]  │
│                                                │
│   ┌─────────────────────────────────┐         │
│   │  👤 Tu Analista                 │         │
│   │                                 │         │
│   │  "Revisé tu observación de      │         │
│   │   ayer. Dijiste que pusiste     │         │
│   │   límite, pero cediste al final.│         │
│   │                                 │         │
│   │   ¿Qué pasó realmente?"         │         │
│   └─────────────────────────────────┘         │
│                                                │
│   ┌─────────────────────────────────┐         │
│   │  [Textarea: Tu respuesta]       │         │
│   │                                 │         │
│   │                                 │         │
│   └─────────────────────────────────┘         │
│   [Faltan 80 caracteres]                      │
│                                                │
│   [ENVIAR →]                                   │
│                                                │
│   ─── Turno 2/5 ───                           │
│                                                │
├────────────────────────────────────────────────┤
│   CONTEXTO DE SESIÓN                           │
│   • Fricción: Límites                          │
│   • Patrón detectado: Evasión                  │
│   • Sesiones previas: 12                       │
└────────────────────────────────────────────────┘
```

**Elementos clave**:
1. **Fondo inmersivo**: Dark mode tipo consultorio real
2. **Avatar del analista**: Presencia visual
3. **Progreso de turnos**: Sabes dónde estás (2/5)
4. **Contexto lateral**: Recuerda fricción y patrón
5. **Validación en tiempo real**: "Faltan X caracteres"

---

### 4. **OBSERVACIÓN** (/observacion)

**Actual**: Formulario simple  
**Problema**: No comunica la importancia del ritual diario

**Propuesta NUEVA**:

```
┌────────────────────────────────────────────────┐
│ ← Observación Diaria            📅 Día 23/90   │
├────────────────────────────────────────────────┤
│                                                │
│   [Animación: Espejo reflejando]               │
│                                                │
│   "Antes de dormir, mira el día"               │
│                                                │
│   ┌─────────────────────────────────┐         │
│   │  ¿Qué hecho concreto te         │         │
│   │  incomodó hoy?                  │         │
│   │                                 │         │
│   │  [Textarea: Describe el hecho]  │         │
│   │                                 │         │
│   └─────────────────────────────────┘         │
│   [Mínimo 50 caracteres]                      │
│                                                │
│   ┌─────────────────────────────────┐         │
│   │  ¿Cómo reaccionaste?            │         │
│   │                                 │         │
│   │  [Opciones: Evité / Exploté /   │         │
│   │            Cedí / Me cerré]     │         │
│   └─────────────────────────────────┘         │
│                                                │
│   [GUARDAR OBSERVACIÓN →]                      │
│                                                │
│   ─── Racha: 23 días consecutivos ───         │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 🎨 Sistema de Diseño Actualizado

### Paleta de Colores

```css
/* Base (actual mantener) */
--bg-primary: #0b1220;
--bg-gradient: linear-gradient(to-b, #c0d9e8, #64748b, #0f172a);

/* Colores Consultorio (nuevos) */
--consultorio-dark: #1a1625;      /* Fondo consultorio */
--consultorio-purple: #7D5C6B;     /* Acento principal (ya existe) */
--consultorio-burgundy: #5a3f4d;   /* Acento hover */
--consultorio-beige: #EAE6DF;      /* Texto claro */
--consultorio-cream: #f5f1e8;      /* Cards */

/* Analytics (inspirado en EVOLVE) */
--metric-positive: #10b981;        /* Verde */
--metric-warning: #f59e0b;         /* Amarillo */
--metric-neutral: #64748b;         /* Gris azul */
```

### Componentes Nuevos a Crear

1. **`<ConsultorioLayout>`**: Wrapper con fondo inmersivo
2. **`<ProgressRing>`**: Círculo de progreso 90 días
3. **`<AnalystAvatar>`**: Avatar animado del analista
4. **`<SessionContext>`**: Panel lateral con contexto
5. **`<DoorCard>`**: Card de puerta con estado visual
6. **`<MetricCard>`**: Card de métrica con gráfico
7. **`<InsightBubble>`**: Bubble de último insight

---

## 📐 Arquitectura de Layout

### Jerarquía Visual

```
AppLayout (mantener estructura actual)
  ├─ Background (gradientes mantener)
  ├─ OnboardingFlow (NUEVO)
  │   ├─ Step1: Bienvenida
  │   ├─ Step2: Explicación
  │   └─ Step3: Auth
  │
  ├─ Dashboard (/sesion)
  │   ├─ Header (avatar + notif)
  │   ├─ HeroCard (sesión actual)
  │   ├─ MetricsRow (progreso + insight)
  │   ├─ NextStepCTA
  │   ├─ DoorsGrid
  │   └─ BottomNav
  │
  ├─ ConsultorioLayout (/consultorio)
  │   ├─ DarkBackground
  │   ├─ AnalystMessage
  │   ├─ UserResponse
  │   ├─ TurnProgress
  │   └─ SessionContext
  │
  └─ ObservacionLayout (/observacion)
      ├─ DailyRitual Header
      ├─ QuestionFlow
      └─ StreakCounter
```

---

## 🚀 Plan de Implementación (Fases)

### Fase 1: Onboarding Mejorado
- [ ] Crear 3 pasos pre-registro
- [ ] Agregar auth con Apple/Google
- [ ] Explicar el "porqué" de las preguntas
- **Tiempo**: 4-6 horas

### Fase 2: Dashboard Hero
- [ ] Hero card con cerebro animado
- [ ] Cards de métricas (progreso, insight)
- [ ] Rediseñar "Tu próximo paso"
- [ ] Grid de puertas con estado visual
- **Tiempo**: 6-8 horas

### Fase 3: Consultorio Inmersivo
- [ ] Background dark consultorio
- [ ] Avatar del analista
- [ ] Progreso de turnos visual
- [ ] Panel de contexto lateral
- **Tiempo**: 4-6 horas

### Fase 4: Observación como Ritual
- [ ] Header con racha
- [ ] Animación de espejo
- [ ] Contadores en tiempo real
- **Tiempo**: 3-4 horas

---

## ❓ Preguntas para Ti Antes de Implementar

1. **Onboarding**:
   - ¿Quieres auth con Apple/Google o solo email/password?
   - ¿Los 3 pasos de pre-registro te parecen o prefieres menos/más?

2. **Dashboard**:
   - ¿Qué métricas son prioritarias? (progreso 90 días, racha, arquetipos activos)
   - ¿El cerebro animado es demasiado o va con la idea?

3. **Consultorio**:
   - ¿El analista debe tener un "nombre" o solo "Tu analista"?
   - ¿Quieres avatar visual o solo burbuja de chat?

4. **Paleta**:
   - ¿Te gusta la idea de dark mode tipo consultorio o prefieres mantener el gradient actual?
   - ¿Quieres más morado/burgundy o más beige/cream?

5. **Prioridad**:
   - ¿Qué pantalla rediseñamos PRIMERO? (Sugiero: Dashboard → Consultorio → Onboarding → Observación)

---

## 📊 Impacto Esperado

**Antes**: App genérica de wellness  
**Después**: Consultorio virtual profesional con presencia terapéutica

**Métricas de éxito**:
- ✅ Usuario siente que está en un consultorio real
- ✅ Entiende el propósito de cada puerta
- ✅ Ve progreso visual claro
- ✅ Siente acompañamiento del analista AI

---

¿Qué te parece la propuesta? ¿Empezamos con el Dashboard o prefieres otro orden?
