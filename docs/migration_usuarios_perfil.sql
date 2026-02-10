-- =====================================================
-- MIGRATION: Agregar campos de perfil a tabla usuarios
-- Fecha: 10 de febrero de 2026
-- Descripción: Campos para guardar datos del registro completo
-- =====================================================

-- 1. Agregar campos de perfil básico
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS tz text DEFAULT 'UTC';

-- 2. Agregar campos de fricción y costo
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS tema_base text,
ADD COLUMN IF NOT EXISTS costo_dominante text;

-- 3. Agregar campos de arquetipos
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS arquetipo_dominante text,
ADD COLUMN IF NOT EXISTS arquetipo_secundario text,
ADD COLUMN IF NOT EXISTS confianza integer,
ADD COLUMN IF NOT EXISTS estilo_conduccion text;

-- 4. Agregar campos de radar 4 pilares
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS archetype_scores jsonb,
ADD COLUMN IF NOT EXISTS dominant_archetype text,
ADD COLUMN IF NOT EXISTS shadow_archetype text;

-- 5. Agregar campos de proyección de sombra
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS shadow_traits jsonb,
ADD COLUMN IF NOT EXISTS shadow_mirror_text text;

-- 6. Agregar campos de control
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS radar_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS registration_done boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS actualizado_en timestamp with time zone DEFAULT now();

-- 7. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_uuid ON public.usuarios(uuid);
CREATE INDEX IF NOT EXISTS idx_usuarios_registration_done ON public.usuarios(registration_done);
CREATE INDEX IF NOT EXISTS idx_usuarios_arquetipo_dominante ON public.usuarios(arquetipo_dominante);

-- 8. Comentarios descriptivos
COMMENT ON COLUMN public.usuarios.tz IS 'Zona horaria del usuario (ej: America/Mexico_City)';
COMMENT ON COLUMN public.usuarios.tema_base IS 'Fricción dominante del usuario';
COMMENT ON COLUMN public.usuarios.costo_dominante IS 'Costo emocional dominante';
COMMENT ON COLUMN public.usuarios.arquetipo_dominante IS 'Arquetipo operativo dominante (guerrero/rey/amante/mago)';
COMMENT ON COLUMN public.usuarios.arquetipo_secundario IS 'Arquetipo operativo secundario';
COMMENT ON COLUMN public.usuarios.confianza IS 'Nivel de confianza en el arquetipo dominante';
COMMENT ON COLUMN public.usuarios.estilo_conduccion IS 'Estilo de conducción (Directo/Sobrio/Relacional/Reflexivo)';
COMMENT ON COLUMN public.usuarios.archetype_scores IS 'Scores de radar 4 pilares en formato {guerrero: 80, amante: 60, rey: 70, mago: 50}';
COMMENT ON COLUMN public.usuarios.dominant_archetype IS 'Arquetipo dominante según radar';
COMMENT ON COLUMN public.usuarios.shadow_archetype IS 'Arquetipo sombra según radar';
COMMENT ON COLUMN public.usuarios.shadow_traits IS 'Array de rasgos de sombra detectados por IA';
COMMENT ON COLUMN public.usuarios.shadow_mirror_text IS 'Texto completo de proyección de sombra (3 preguntas concatenadas)';
COMMENT ON COLUMN public.usuarios.radar_completed_at IS 'Timestamp de cuando se completó el radar 4 pilares';
COMMENT ON COLUMN public.usuarios.registration_done IS 'Indica si el usuario completó el registro completo';
COMMENT ON COLUMN public.usuarios.actualizado_en IS 'Última actualización del registro';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Después de ejecutar, puedes verificar con:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'usuarios' 
-- ORDER BY ordinal_position;
