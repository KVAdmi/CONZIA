# Concia (v1 visor)

Concia es un sistema cognitivo personal: registra, observa, contrasta y devuelve conciencia estructurada sobre vida emocional, conductual y decisional. No es journaling, no es wellness, no es una app motivacional.

La v1 es **100% local** con data mock (seed JSON) y persistencia en `localStorage`.

## Correr en local

```bash
npm i
npm run dev
```

## Ver en Android (APK wrapper)

Este repo es un visor web. Para verlo en un móvil Android como APK (WebView), usa el wrapper en `android/`.

1) Genera build con rutas relativas + sincroniza assets:

```bash
npm run android:prepare
```

2) Genera APK debug:

```bash
cd android
./gradlew assembleDebug
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Stack

- React + Vite + TypeScript
- Tailwind (sin librerías UI pesadas)
- Animaciones: Framer Motion (gráficas y transiciones suaves)

## Estructura

- `src/app/` shell tipo app nativa (contenedor “teléfono” + navegación inferior)
- `src/pages/` pantallas: Inicio, Sesión, Espejo Negro, Mapa, Bóveda, Caja, Más, Integración, Arquetipos, Crisis
- `src/types/models.ts` contrato de datos
- `src/data/seeds.json` data mock (se “mueve” a hoy para que la app siempre se vea llena)
- `src/state/xmiStore.tsx` store local + persistencia
- `src/services/ai/` IA mock (estructura lista para reemplazar por IA real)

## Datos mock y persistencia

- El seed vive en `src/data/seeds.json`.
- En `src/data/seed.ts` se ajustan fechas para que el último día del seed caiga en “hoy”.
- El estado se guarda en `localStorage` (key: `concia_v1_state`).

Para reiniciar el demo: borra `localStorage` o elimina la key `concia_v1_state`.

## IA real (fase 2)

En v1 no hay API real. La carpeta `src/services/ai/` expone funciones con el “contrato” mínimo:

- `classifyEntry()`
- `detectPatterns()`
- `generateReading()`
- `generateMirrorStory()`
- `generateAlerts()`

Para migrar a IA real:

1) Mantén el formato fijo de lectura (bloques).
2) Sustituye implementación, no la interfaz.
3) Asegura tono: sobrio, firme, sin emojis, sin clichés, no cómplice.

## IA real (opcional en el visor web)

Este repo es un **visor web**. Si quieres probar IA real sin exponer llaves en el navegador, el dev server de Vite expone un proxy local (solo en `npm run dev`).

1) Copia `./.env.example` → `./.env`.
2) Llena `ANTHROPIC_API_KEY` (y opcionalmente `GROQ_API_KEY`).
3) Corre `npm run dev`.

Nota: **no uses prefijo `VITE_`** para llaves de IA. Todo lo que empiece con `VITE_` puede llegar al frontend.

## Supabase (.env)

La v1 no usa Supabase todavía, pero el repo deja variables listas para fase 2.

- Copia `./.env.example` a `./.env` y llena valores.
- Usa prefijo `VITE_` para exponer variables al frontend.
