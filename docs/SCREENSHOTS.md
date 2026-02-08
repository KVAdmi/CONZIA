# Screenshots (antes / después)

Este documento sirve para capturar evidencia visual del rediseño progresivo del visor web.

## Cómo levantar el visor

1) Instala deps:

`npm i`

2) Arranca:

`npm run dev`

Si la terminal marca “Port 5173 is already in use”, usa:

`npm run dev -- --port 5174`

## Rutas a capturar

- INICIO: `/inicio`
- SESIÓN: `/sesion`
- ESPEJO NEGRO: `/espejo`
- MAPA: `/mapa`
- ESCRIBIR: `/escribir`
- LECTURAS: `/lecturas`
- MÁS: `/mas`
- CRISIS: `/crisis`
- PATRONES (legacy): `/patrones`
- CAJA: `/caja`

## Viewports recomendados

- Mobile: 390×844 (iPhone 12/13/14)
- Desktop: 1440×900

## Nombres de archivos (convención)

Guarda en:

- `docs/screenshots/before/`
- `docs/screenshots/after/`

Nombre sugerido:

- `inicio-mobile.png`
- `inicio-desktop.png`
- `sesion-mobile.png`
- `sesion-desktop.png`
- `espejo-mobile.png`
- `espejo-desktop.png`
- `mapa-mobile.png`
- `mapa-desktop.png`
- `archivo-mobile.png`
- `archivo-desktop.png`
- `escribir-mobile.png`
- `escribir-desktop.png`
- `lecturas-mobile.png`
- `lecturas-desktop.png`
- `mas-mobile.png`
- `mas-desktop.png`
- `crisis-mobile.png`
- `crisis-desktop.png`
- `patrones-legacy-mobile.png`
- `patrones-legacy-desktop.png`
- `caja-mobile.png`
- `caja-desktop.png`

## Nota sobre “Antes”

Si no tienes un snapshot previo (branch/zip), puedes dejar vacío `docs/screenshots/before/`.
El objetivo es que el equipo tenga, mínimo, el set “Después” como referencia del visor.
