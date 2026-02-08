# CONZIA — QA Fase 1 (DEMO LOOP)

Objetivo: detectar loops, bloqueos y datos basura **antes** de tocar cualquier feature.

Regla madre (recordatorio):
- Cada puerta = circuito cerrado (entrada → proceso guiado → cierre → salida).
- “Una cosa por sesión”: no se permite brincar de puerta sin cerrar.

## Preparación
- [ ] Ejecutar `npm run dev` (web) o `npm run android:prepare` (Android).
- [ ] (Opcional DEV) Para reiniciar el estado: abrir `/registro?reset=1` y usar **Resetear**.

## A) Usuario nuevo — Happy Path (obligatorio)
- [ ] **OB1**: ver copy exacto “Acompañamiento para ver lo que evitas.”
- [ ] **OB2**: ver contrato: “CONZIA no es terapia. No diagnostica. No te endulza.”
- [ ] Checkbox obligatorio: “Acepto trabajar sin justificarme.”
- [ ] CTA “Entrar” deshabilitado hasta aceptar.
- [ ] Entrar → navega a `/registro`.

### Registro (R1–R3)
- [ ] **R1**: completar email + contraseña + alias + tz + país.
- [ ] **R2**: seleccionar tema_base (1 de 6) y costo_dominante (1).
- [ ] **R3**: responder 12 preguntas.
- [ ] Resultado NO etiqueta “eres X”; sí muestra: “Tu estilo de conducción inicial será: Directo/Sobrio/Relacional/Reflexivo”.
- [ ] Finalizar R3 crea Proceso Activo Día 1 y navega a `/sesion` (Inicio).

### Inicio (Home) → Puertas
- [ ] En `/sesion` (Inicio) se ve: dashboard con progreso + puertas.
- [ ] Entrar a **Consultorio**.
- [ ] Completar 3 turnos + ver **Cierre**.
- [ ] Cerrar Consultorio → vuelve a `/sesion`.

- [ ] Entrar a **Mesa**.
- [ ] Completar campos obligatorios.
- [ ] Cerrar Mesa → vuelve a `/sesion`.

- [ ] Entrar a **Proceso**.
- [ ] Ver: proceso activo (tema), día, cantidad de entradas, cierres recientes.
- [ ] Cerrar día (botón “Cerrar día”) → vuelve a `/sesion`.
- [ ] Iniciar una nueva puerta (Consultorio o Mesa) → `day_index` debe aumentar.

## B) Guard “una cosa por sesión” (brutal y útil)
- [ ] Con una puerta abierta, intentar abrir otra puerta desde el footer → debe bloquear con mensaje “Cierra X…”.
- [ ] Back del navegador (mientras una puerta está abierta) no debe permitir saltar a otra puerta.
- [ ] Botón “Cerrar” dentro de la puerta siempre funciona (no se bloquea).

## C) Persistencia — Refresh/Restart (anti-stuck)
En cada punto, hacer refresh / reiniciar (web: refresh; Android: cerrar/reabrir).

- [ ] Refresh en **Inicio**: mantiene perfil, proceso activo y entradas.
- [ ] Refresh en **Consultorio** (en Turno 2): no debe romper; debe volver a la misma puerta sin perder el avance.
- [ ] Refresh en **Mesa** con campos llenos (antes del cierre): no debe romper; debe volver a la misma puerta sin perder el avance.
- [ ] Refresh en **Proceso**: no rompe; mantiene proceso/entradas/cierres.

Anti-stuck:
- [ ] Si una sesión está marcada como cerrada, `activeDoor` no queda pegado tras refresh.

## D) Debug DEV (solo desarrollo)
- [ ] En DEV, en Proceso aparece “Export debug JSON”.
- [ ] Export genera un JSON (descarga o copia) con el estado persistido.
- [ ] En consola (solo DEV) se ven eventos:
  - `door_opened`
  - `door_closed`
  - `process_closed`
  - `registration_done`
  - `reset_phase1`
