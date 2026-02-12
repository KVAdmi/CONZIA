# Manual de usuario (demo/QA) — CONZIA

Este manual está pensado para que dirección/QA pueda **recorrer el producto** y validar flujos.

## 0) Antes de empezar (setup)

1) Instalar deps: `npm i`
2) Crear `.env` desde `.env.example` (mínimo para registro/login):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3) Correr: `npm run dev`

Opcional (IA en devserver):
- `ANTHROPIC_API_KEY` (server-only, sin prefijo `VITE_`).

## 1) Reset para repetir demo

En DevTools → Application → Local Storage:
- borrar `conzia_v1_onboarding_done`
- borrar `conzia_v1_state` y/o `conzia_v1_state_<userId>` (si existe)
- borrar `conzia_v1_auth_session` (si estabas con Supabase)

Recarga la página.

## 2) Flujo recomendado (Happy Path)

### A) Onboarding

- Al abrir la app por primera vez, se muestra `/onboarding`.
- Puedes avanzar con “Continuar” o “Omitir”.
- Al finalizar, navega a `/login`.

### B) Registro

En `/login` toca “Crea tu cuenta” → `/registro`.

- **Paso 1**: nombre completo + email + contraseña.
- **Paso 2**: 3 preguntas (cada una mínimo 80 caracteres).
- “Finalizar Diagnóstico” crea cuenta (Supabase) y guarda perfil (REST `usuarios`), luego navega a `/pago`.

### C) Pago (simulado)

En `/pago`:
- Selecciona un plan.
- “Suscribirse ahora” simula 2s y navega a `/sesion`.

### D) Sesión (hub)

En `/sesion` verás módulos:
- **Desahogo**
- **Sueños**
- **Análisis** (Resultados)
- **Retos** (Proceso)

## 3) Puertas (circuitos guiados)

> Regla: antes de entrar a Consultorio/Mesa/Proceso, el sistema puede forzar **Observación** si no la cerraste hoy.

### Observación (`/observacion`)

- Paso 1: “Hecho en una línea” (sin justificar).
- Paso 2: seleccionar fricción del día.
- Paso 3: seleccionar trampa.
- Paso 4: cerrar sesión (guarda entrada y regresa a `/sesion`).

### Consultorio (`/consultorio`)

- Paso 0: Encuadre.
- Turno 1: hecho.
- Turno 2: rol.
- Turno 3: contexto/límite/peso/repetición.
- Cierre: guarda entrada y vuelve a `/sesion`.

### Mesa (`/mesa`)

- Preparación → Escritura (campos obligatorios) → Cierre.
- Guarda entrada y vuelve a `/sesion`.

### Proceso (`/proceso`)

- Muestra tema activo, día, entradas guardadas y cierres recientes.
- “Cerrar día” marca el proceso como cerrado.
- En DEV aparece “Export debug JSON” (copia/descarga el estado persistido).

## 4) Módulos experiencia

### Desahogo (`/desahogo`)

- Escribe un texto (mínimo ~12 caracteres).
- “Entregar” dispara análisis (proxy IA en dev o fallback local).
- Puedes aceptar un reto (24h). Si hay reto activo, puedes capturar evidencia y cerrarlo.

### Resultados (`/resultados`)

- Muestra radar 4 arquetipos y hallazgos de sombra (si existen en perfil).
- CTA: volver a sesión o ir a desahogo.

### Sueños (`/suenos`)

- Describe un sueño (mínimo ~20 caracteres) y ejecuta “Interpretar y Visualizar”.
- Si IA está disponible en devserver, devuelve interpretación + imagen + símbolos y guarda una lectura.

### Crisis (`/crisis`)

- Pantalla de contención mock: elige una opción para simular el flujo.

