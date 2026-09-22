-- ========================================================
-- FTTH Reparos - Script de Esquema e Inicialización Supabase
-- Base de Datos PostgreSQL
-- ========================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: SECTORES / RESPONSABLES
CREATE TABLE IF NOT EXISTS public.responsible_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'contractor', -- 'contractor', 'engineering', 'cto_team', 'redesign', 'other'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA: TIPOS DE REPARO
CREATE TABLE IF NOT EXISTS public.repair_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: ESTADOS DE REPARO (V1: PENDIENTE, VERIFICACIÓN RESUELTO, FINALIZADO)
CREATE TABLE IF NOT EXISTS public.repair_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'closed'
    order_index INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA: PROYECTOS FTTH
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sigest TEXT NOT NULL,
    poligono TEXT NOT NULL,
    distrito TEXT,
    central TEXT,
    titulo TEXT,
    ejecutor TEXT,
    ctos_count INT NOT NULL DEFAULT 0,
    alimentacion TEXT DEFAULT 'SI',
    situacion_operativa TEXT NOT NULL DEFAULT 'En ejecución',
    fecha_asignacion TIMESTAMPTZ,
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT DEFAULT 'Usuario Sistema'
);

-- 5. TABLA: REPAROS / INCIDENCIAS
CREATE TABLE IF NOT EXISTS public.repairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    repair_type_id UUID REFERENCES public.repair_types(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Normal', -- 'Normal', 'Alta', 'Crítica'
    solicitante TEXT,
    current_responsible_id UUID REFERENCES public.responsible_parties(id) ON DELETE SET NULL,
    current_status_id UUID NOT NULL REFERENCES public.repair_statuses(id),
    fecha_informado TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_compromiso TIMESTAMPTZ,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT DEFAULT 'Usuario Sistema'
);

-- 6. TABLA: HISTORIAL DE EVENTOS / HITOS
CREATE TABLE IF NOT EXISTS public.repair_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_id UUID NOT NULL REFERENCES public.repairs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'creation', 'follow_up', 'resolution', 'closure', 'reiteration', etc.
    previous_responsible_id UUID REFERENCES public.responsible_parties(id) ON DELETE SET NULL,
    new_responsible_id UUID REFERENCES public.responsible_parties(id) ON DELETE SET NULL,
    previous_status_id UUID REFERENCES public.repair_statuses(id) ON DELETE SET NULL,
    new_status_id UUID REFERENCES public.repair_statuses(id) ON DELETE SET NULL,
    verification_result TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT DEFAULT 'Usuario Sistema'
);

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_repairs_project_id ON public.repairs(project_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status_id ON public.repairs(current_status_id);
CREATE INDEX IF NOT EXISTS idx_repairs_responsible_id ON public.repairs(current_responsible_id);
CREATE INDEX IF NOT EXISTS idx_repair_events_repair_id ON public.repair_events(repair_id);

-- DATOS SEMILLAS INICIALES (CATÁLOGOS OFICIALES V1)

-- Responsables Oficiales V1
INSERT INTO public.responsible_parties (id, name, type) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Obras', 'contractor'),
  ('a2222222-2222-2222-2222-222222222222', 'Ingeniería', 'engineering'),
  ('a3333333-3333-3333-3333-333333333333', 'Equipo Despliegue', 'cto_team')
ON CONFLICT (name) DO NOTHING;

-- Tipos de Reparo Oficiales V1
INSERT INTO public.repair_types (id, name, description) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Falta poste', 'Falta colocación o reemplazo de poste en vía pública'),
  ('b2222222-2222-2222-2222-222222222222', 'Falta cruce americano', 'Falta tendido de cruce aéreo/subterráneo'),
  ('b3333333-3333-3333-3333-333333333333', 'Falta HUB', 'Instalación pendiente del nodo de distribución HUB'),
  ('b4444444-4444-4444-4444-444444444444', 'HUB sin potencia', 'HUB instalado pero sin señal óptica requerida'),
  ('b5555555-5555-5555-5555-555555555555', 'Problemas de potencia', 'Atenuación de fibra fuera de tolerancias de norma'),
  ('b6666666-6666-6666-6666-666666666666', 'Rediseño', 'Requiere revisión o modificación del plano por imprevisto en campo'),
  ('b7777777-7777-7777-7777-777777777777', 'Poste podrido', 'Poste deteriorado o en riesgo de caída'),
  ('b8888888-8888-8888-8888-888888888888', 'Otro', 'Otros problemas operativos generales')
ON CONFLICT (name) DO NOTHING;

-- Estados Oficiales V1
INSERT INTO public.repair_statuses (id, name, category, order_index) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'PENDIENTE', 'pending', 1),
  ('c7777777-7777-7777-7777-777777777777', 'VERIFICACIÓN RESUELTO', 'resolved', 2),
  ('c8888888-8888-8888-8888-888888888888', 'FINALIZADO', 'closed', 3)
ON CONFLICT (name) DO NOTHING;
