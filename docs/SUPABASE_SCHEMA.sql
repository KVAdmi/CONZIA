-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Last updated: 10 de febrero de 2026

-- =====================================================
-- TABLA: usuarios
-- Sincronizada automáticamente con auth.users mediante trigger handle_new_user
-- =====================================================
CREATE TABLE public.usuarios (
  id bigint NOT NULL DEFAULT nextval('usuarios_id_seq'::regclass),
  uuid uuid NOT NULL UNIQUE,
  email text,
  nombre text,
  apodo text,
  foto text,
  rol text DEFAULT 'user'::text,
  plan text DEFAULT 'free'::text,
  country text DEFAULT 'MX'::text,
  tz text DEFAULT 'UTC'::text,
  tema_base text,
  costo_dominante text,
  arquetipo_dominante text,
  arquetipo_secundario text,
  confianza integer,
  estilo_conduccion text,
  archetype_scores jsonb,
  dominant_archetype text,
  shadow_archetype text,
  shadow_traits jsonb,
  shadow_mirror_text text,
  radar_completed_at timestamp with time zone,
  registration_done boolean DEFAULT false,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_uuid_fkey FOREIGN KEY (uuid) REFERENCES auth.users(id)
);

-- =====================================================
-- TABLA: processes
-- Representa el proceso de 90 días de un usuario
-- =====================================================
CREATE TABLE public.processes (
  id bigint NOT NULL DEFAULT nextval('processes_id_seq'::regclass),
  user_uuid uuid NOT NULL,
  estado text NOT NULL DEFAULT 'activo'::text,
  day_index integer NOT NULL DEFAULT 1,
  last_session_id bigint,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT processes_pkey PRIMARY KEY (id),
  CONSTRAINT processes_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES auth.users(id)
);

-- =====================================================
-- TABLA: sessions
-- Cada sesión representa una puerta/actividad específica
-- =====================================================
CREATE TABLE public.sessions (
  id bigint NOT NULL DEFAULT nextval('sessions_id_seq'::regclass),
  user_uuid uuid NOT NULL,
  process_id bigint NOT NULL,
  puerta text NOT NULL,
  arquetipo text,
  status text NOT NULL DEFAULT 'open'::text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  summary jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES auth.users(id),
  CONSTRAINT sessions_process_id_fkey FOREIGN KEY (process_id) REFERENCES public.processes(id)
);

-- =====================================================
-- TABLA: entries
-- Registros de actividad dentro de cada sesión
-- kind puede ser: 'answer', 'freewrite', 'reflection', etc.
-- =====================================================
CREATE TABLE public.entries (
  id bigint NOT NULL DEFAULT nextval('entries_id_seq'::regclass),
  user_uuid uuid NOT NULL,
  session_id bigint NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT entries_pkey PRIMARY KEY (id),
  CONSTRAINT entries_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES auth.users(id),
  CONSTRAINT entries_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================
-- 1. RLS (Row Level Security) está habilitado en todas las tablas
-- 2. Las policies permiten a cada usuario acceder solo a sus propios datos
-- 3. El trigger handle_new_user crea automáticamente un registro en usuarios
--    cuando se registra un nuevo usuario en auth.users
-- 4. El campo payload en entries es jsonb flexible para diferentes tipos de datos
