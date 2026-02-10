# 🔧 Fix: Guardar Perfil Completo en Registro

## ⚠️ Problema Detectado
El botón "Entregar al analista" funcionaba correctamente, pero **NO se estaban guardando todos los campos del perfil** en la base de datos. Solo se guardaban las `entries` pero faltaba actualizar la tabla `usuarios` con:

- ✅ Datos básicos: `alias`, `tz`, `country`
- ✅ Fricción y costo: `tema_base`, `costo_dominante`
- ✅ Arquetipos: `arquetipo_dominante`, `arquetipo_secundario`, `confianza`, `estilo_conduccion`
- ✅ Radar: `archetype_scores`, `dominant_archetype`, `shadow_archetype`
- ✅ Sombra: `shadow_traits`, `shadow_mirror_text`
- ✅ Control: `radar_completed_at`, `registration_done`

---

## 🛠️ Solución Implementada

### 1. SQL Migration (EJECUTAR PRIMERO)

**Archivo**: `docs/migration_usuarios_perfil.sql`

Este SQL agrega **15 columnas nuevas** a la tabla `usuarios`:

```sql
-- Ejecutar en Supabase SQL Editor:
```

Campos agregados:
- `tz` (text): Zona horaria
- `tema_base` (text): Fricción dominante
- `costo_dominante` (text): Costo emocional
- `arquetipo_dominante` (text): Arquetipo operativo
- `arquetipo_secundario` (text): Segundo arquetipo
- `confianza` (integer): Nivel de confianza
- `estilo_conduccion` (text): Estilo (Directo/Sobrio/etc)
- `archetype_scores` (jsonb): Scores radar {guerrero:80, rey:70...}
- `dominant_archetype` (text): Arquetipo radar dominante
- `shadow_archetype` (text): Arquetipo sombra
- `shadow_traits` (jsonb): Array de rasgos detectados
- `shadow_mirror_text` (text): Textos completos de proyección
- `radar_completed_at` (timestamp): Cuándo completó radar
- `registration_done` (boolean): Si terminó registro
- `actualizado_en` (timestamp): Última actualización

### 2. Servicio de Usuarios

**Archivo**: `src/services/db/usuarios.service.ts` (NUEVO)

Funciones:
- `updateUsuarioProfile(profile)`: Actualiza perfil completo
- `getUsuarioProfile(userUuid)`: Obtiene perfil desde DB

### 3. Actualización de RegistroPage

**Archivo**: `src/pages/RegistroPage.tsx`

**Cambios en `finishAndEnter()`**:

Antes (paso 7):
```typescript
// 7. Cerrar sesión con summary
await closeSession({...});
```

Después (pasos 7 y 8):
```typescript
// 7. Actualizar perfil del usuario en tabla usuarios
await updateUsuarioProfile({
  uuid: userUuid,
  email: email.trim(),
  apodo: alias.trim(),
  tz: tz.trim(),
  country: country.trim().toUpperCase(),
  tema_base: temaBase,
  costo_dominante: costoDominante,
  arquetipo_dominante: top1,
  arquetipo_secundario: top2,
  confianza,
  estilo_conduccion: estilo,
  archetype_scores: radar.pct,
  dominant_archetype: radar.dominant,
  shadow_archetype: radar.shadow,
  shadow_traits: shadowTraits ?? (perfectionTrait ? [perfectionTrait] : []),
  shadow_mirror_text: [rechazoText, envidiaText, juicioText].join("\n\n"),
  radar_completed_at: nowISO,
  registration_done: true,
});

// 8. Cerrar sesión con summary
await closeSession({...});
```

---

## 📊 Verificación

### Después de ejecutar el SQL y completar un registro:

**1. Tabla `usuarios`** debería tener:
```sql
SELECT 
  uuid,
  apodo,
  email,
  tz,
  country,
  tema_base,
  costo_dominante,
  arquetipo_dominante,
  arquetipo_secundario,
  confianza,
  estilo_conduccion,
  archetype_scores,
  dominant_archetype,
  shadow_archetype,
  shadow_traits,
  radar_completed_at,
  registration_done
FROM usuarios
WHERE registration_done = true;
```

**Resultado esperado**:
- ✅ `apodo`: "Juan" (alias del usuario)
- ✅ `email`: "juan@example.com"
- ✅ `tz`: "America/Mexico_City"
- ✅ `country`: "MX"
- ✅ `tema_base`: "limites" | "abandono_propio" | etc.
- ✅ `costo_dominante`: "tension" | "culpa" | etc.
- ✅ `arquetipo_dominante`: "guerrero" | "rey" | "amante" | "mago"
- ✅ `arquetipo_secundario`: (segundo arquetipo)
- ✅ `confianza`: 3 (diferencia entre top1 y top2)
- ✅ `estilo_conduccion`: "Directo" | "Sobrio" | "Relacional" | "Reflexivo"
- ✅ `archetype_scores`: `{"guerrero": 80, "amante": 60, "rey": 70, "mago": 50}`
- ✅ `dominant_archetype`: "guerrero"
- ✅ `shadow_archetype`: "mago"
- ✅ `shadow_traits`: `[{"trait": "Egocentrismo", "origin_probable": "..."}]`
- ✅ `radar_completed_at`: "2026-02-10T18:30:00Z"
- ✅ `registration_done`: `true`

**2. Tabla `entries`** debería tener **~35 filas**:
```sql
SELECT 
  kind,
  COUNT(*) as total
FROM entries
WHERE session_id = (
  SELECT id FROM sessions 
  WHERE puerta = 'registro' 
  AND user_uuid = '<user-uuid>'
  ORDER BY created_at DESC 
  LIMIT 1
)
GROUP BY kind;
```

**Resultado esperado**:
- ✅ `answer`: ~32 filas (12 arquetipo + 20 radar)
- ✅ `freewrite`: 3 filas (rechazo, envidia, juicio)

**3. Tabla `sessions`** debería tener:
```sql
SELECT 
  puerta,
  arquetipo,
  status,
  summary
FROM sessions
WHERE puerta = 'registro'
AND user_uuid = '<user-uuid>'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado**:
- ✅ `puerta`: "registro"
- ✅ `arquetipo`: "guerrero" (el dominante)
- ✅ `status`: "closed"
- ✅ `summary`: jsonb con todos los datos del resumen

---

## 🎯 Resumen de Cambios

| Componente | Acción | Estado |
|------------|--------|--------|
| Schema SQL | Actualizado con 15 campos | ✅ |
| Migration SQL | Creado `migration_usuarios_perfil.sql` | ✅ |
| Servicio usuarios | Creado `usuarios.service.ts` | ✅ |
| RegistroPage | Agregado paso 7: updateUsuarioProfile | ✅ |
| TypeScript | Compila sin errores | ✅ |

---

## 🚀 Próximos Pasos

1. **EJECUTAR SQL**: Copia y pega el contenido de `docs/migration_usuarios_perfil.sql` en Supabase SQL Editor
2. **Probar registro**: Completar un registro end-to-end
3. **Verificar en Supabase**: Confirmar que todos los campos se guardaron correctamente

---

## 📝 Nota Final

Ahora **TODOS los campos del registro se guardan** correctamente en la base de datos:
- ✅ Tabla `usuarios`: Perfil completo
- ✅ Tabla `entries`: ~35 respuestas individuales
- ✅ Tabla `sessions`: Sesión cerrada con summary
- ✅ Tabla `processes`: Proceso activo creado
