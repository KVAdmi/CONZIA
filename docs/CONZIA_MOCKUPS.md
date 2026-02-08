# CONZIA — Mockups (imágenes)

Nota: los PNG y scripts aún se llaman `mirat_*` porque son **legacy** (se generaron antes del rename). Se regeneran con la marca CONZIA cuando lo pidamos.

Estas imágenes son **mockups rápidos** para visualizar layout y tono (no son UI final). Hay dos rutas visuales para decidir:

- **Light (Sala silenciosa)**: cálido, crema, sobrio (alineado a “sala silenciosa”).
- **Dark (Claroscuro)**: azul nocturno + acento naranja/dorado (alineado a la propuesta de Manus).

Además incluí una versión **Native v2** (estilo referencia: hero “foto” + bottom sheet + navegación inferior), para evitar el look “web con tabs”.

Las pantallas que incluí:

- Onboarding (entrada)
- Contrato cognitivo
- Acceso (login opcional + entrar sin cuenta)
- Sesión (dashboard “Tu próximo paso”)
- Menú lateral
- Espejo Negro (voz)
- Caja (corazón)

## Light (Sala silenciosa)

- `docs/mockups/mirat_light_onboarding.png`
- `docs/mockups/mirat_light_contrato.png`
- `docs/mockups/mirat_light_acceso.png`
- `docs/mockups/mirat_light_sesion.png`
- `docs/mockups/mirat_light_menu.png`
- `docs/mockups/mirat_light_espejo_negro.png`
- `docs/mockups/mirat_light_caja.png`

## Dark (Claroscuro)

- `docs/mockups/mirat_dark_onboarding.png`
- `docs/mockups/mirat_dark_contrato.png`
- `docs/mockups/mirat_dark_acceso.png`
- `docs/mockups/mirat_dark_sesion.png`
- `docs/mockups/mirat_dark_menu.png`
- `docs/mockups/mirat_dark_espejo_negro.png`
- `docs/mockups/mirat_dark_caja.png`

## Native v2 (hero + bottom sheet + navegación inferior)

- `docs/mockups/mirat_onboarding_native.png`
- `docs/mockups/mirat_login_native.png`
- `docs/mockups/mirat_dashboard_native.png`

## Cómo regenerarlos

Ejecuta:

`python3 docs/mockups/generate_mirat_mockups.py`

Para Native v2:

`python3 docs/mockups/generate_mirat_native_mockups.py`
