# Auditoría CONZIA — 2026-02-11

Paquete de documentación para evaluación (técnica + producto) del repo **CONZIA**.

## Archivos

- `docs/auditoria_2026-02-11/AVANCE_PARA_DIRECCION.md`: resumen ejecutivo (qué está listo, qué falta, riesgos).
- `docs/auditoria_2026-02-11/AUDITORIA_TECNICA.md`: auditoría módulo por módulo (responsabilidades, hallazgos).
- `docs/auditoria_2026-02-11/MAPA_DE_FUNCIONES.md`: mapa de exports (auto-generado).
- `docs/auditoria_2026-02-11/TESTS_PREGUNTAS.md`: lista de tests y preguntas del producto (auto-generado desde contenido).
- `docs/auditoria_2026-02-11/MANUAL_DE_USUARIO.md`: manual para demo/QA (paso a paso).
- `docs/auditoria_2026-02-11/CUESTIONARIO_EVALUACION.md`: preguntas de evaluación para dirección/QA.

## Comandos útiles

- Correr app: `npm run dev`
- Typecheck: `npm run typecheck`
- Tests (unitarios, Node): `npm test`

## Regenerar docs auto

- Mapa de funciones: `npm run docs:function-map`
- Tests + preguntas (contenido): `npm run docs:test-questions`

