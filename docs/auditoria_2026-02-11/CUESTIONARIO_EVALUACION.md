# Cuestionario de evaluación (Dirección / QA)

Usa este documento como guía de preguntas para evaluar avance, riesgos y claridad del producto.

## A) Producto (visión y consistencia)

- ¿El tono es consistente con `PRODUCT_SPEC.md` (sobrio, firme, sin clichés)?
- ¿La app “cierra circuitos” o tiende a convertirse en journaling abierto?
- ¿Hay claridad de qué es “v1 demo” vs “fase 2” (Supabase/IA real/pagos)?

## B) Flujo (Happy Path)

1) Onboarding:
   - ¿Hay contrato claro y sin fricción excesiva?
2) Registro/Login:
   - ¿Se entiende qué datos se piden y por qué?
   - ¿Hay forma de “modo demo/local” si Supabase no está configurado?
3) Pago:
   - ¿Qué significa pagar hoy (habilita algo real o es placeholder)?
4) Sesión:
   - ¿El usuario entiende “qué hacer ahora” sin explicaciones largas?

## C) Guardas y seguridad de experiencia (anti-loop)

- ¿Se respeta “una puerta por sesión” (no saltar sin cerrar)?
- ¿La redirección forzada a Observación (antes de otras puertas) se percibe correcta o invasiva?
- ¿Los drafts se recuperan bien tras refresh/cierre?

## D) Datos (privacidad y persistencia)

- ¿Qué se guarda en `localStorage`? (perfil, sesiones, entradas, drafts)
- ¿Qué se envía a Supabase? (Auth + tabla `usuarios`)
- ¿Hay ruta clara de borrado/exportación del estado del usuario?
- ¿Hay separación real entre “contenido terapéutico” y “métricas”?

## E) Seguridad (técnica)

- Supabase:
  - ¿Existe diseño de tabla `usuarios` y políticas RLS documentadas?
  - ¿Qué campos son PII y cómo se protegen?
- Secretos:
  - ¿Las llaves server-only están fuera del frontend (sin prefijo `VITE_`)?
- IA:
  - ¿Hay disclaimers y manejo de “crisis” (risk_flag) sin prometer terapia?

## F) Calidad (pruebas y observabilidad)

- ¿La suite `npm test` pasa y cubre módulos clave (utils/engine/metrics/IA/supabase)?
- ¿Se registran eventos DEV útiles sin filtrar PII? (`conziaStore` devLog)
- ¿Hay plan para UI tests / e2e (Playwright) antes de release?

## G) Técnica (mantenibilidad)

- ¿El código está alineado con la documentación actual o hay “dos productos” conviviendo?
- ¿Hay páginas legacy no ruteadas que deban borrarse o aislarse?
- ¿Hay un mapa claro de módulos y dependencias? (ver `MAPA_DE_FUNCIONES.md`)

## Checklist rápido (sí/no)

- [ ] Puedo correr `npm run dev` y completar onboarding → registro → pago → sesión.
- [ ] Puedo cerrar Observación y luego entrar a Consultorio/Mesa sin bloqueos raros.
- [ ] Refresh en mitad de una puerta recupera draft o permite cerrar sin perderse.
- [ ] `npm test` pasa.
- [ ] Existe documento de modelo Supabase + RLS (pendiente si no existe).

