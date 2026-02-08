# Concia (visor web) — First minute experience (0–60s)

Este repo es un **visor web** para validar **flujo / estructura / ritual**. El producto final es **100% app nativa**. En el visor, la prioridad es: **dar valor primero** y mantener **progresivo > simultáneo**.

## Segundo 0–15: SESIÓN (valor en 30–60s)

Pantalla: `Sesión` (`/sesion`) (la ruta `/` redirige a `Inicio` y de ahí a Sesión)

El usuario ve (sin formularios a la vista):

- Una sola tarjeta: **“Tu próximo paso”**.
- Un prompt corto (una pregunta).
- CTA primario: **Hablar (Espejo Negro)** o **Escribir**.

Acción típica (1 tap):

1) Toca **Hablar** → abre `Espejo Negro` (`/espejo`).

## Segundo 15–45: ENTRADA (voz o texto)

Pantalla: `Espejo Negro` (`/espejo`) o `Descarga` (`/descarga`)

El usuario ve:

- Un prompt único.
- Una captura simple (voz mock / texto).
- CTA: **Guardar** (o **Guardar en silencio**).

Acción:

1) Habla o escribe 1–3 líneas.
2) Toca **Guardar**.

## Segundo 45–60: REFLEJO / SIGUIENTE PASO (opcional)

Después de guardar, Concia muestra:

- Mensaje: “Gracias. Esto no necesita respuesta todavía.”
- CTA opcional: **Pedir espejo breve** (formato fijo, sobrio).
- CTA opcional: **Estructurar (opcional)** → abre `Escribir` (`/escribir`) con el texto prellenado.

Regla: **la IA no irrumpe**. El usuario decide.

## Lo que NO pasa en el primer minuto (a propósito)

- No hay cuestionario obligatorio.
- No hay confrontación automática.
- No hay “patrones detectados” sin permiso del usuario.

Nota:

- El tablero duro vive en `Mapa` (`/mapa`) y se entra solo cuando el usuario decide verse.
- La confrontación ritual vive en `Caja` (`/caja`) y se entra por decisión + evidencia.
