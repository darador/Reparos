-- ========================================================
-- MIGRACIÓN: MÓDULO PENDIENTE MOP + CARGA MOP
-- ========================================================

-- 1. TABLA: mop_ctos
CREATE TABLE IF NOT EXISTS public.mop_ctos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sigest TEXT NOT NULL,
    poligono TEXT NOT NULL,
    cto TEXT NOT NULL,
    central TEXT,
    pelo TEXT,
    instalacion_toa TEXT,
    certificacion_toa TEXT,
    responsable_cto TEXT,
    categoria_origen TEXT NOT NULL, -- 'Certifcar', 'Instalar y Certificar', 'Adelantar', 'Dem Trab Ter', 'Demorado'
    estado TEXT NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'COMPLETADO', 'CON REPARO'
    observacion TEXT,
    is_ausente BOOLEAN NOT NULL DEFAULT false,
    fecha_primera_aparicion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_ultima_aparicion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_ultima_importacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_ultimo_cambio_estado TIMESTAMPTZ,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mop_ctos_sigest_poligono_cto UNIQUE (sigest, poligono, cto)
);

-- ÍNDICES DE RENDIMIENTO PARA PENDIENTE MOP
CREATE INDEX IF NOT EXISTS idx_mop_ctos_responsable ON public.mop_ctos(responsable_cto);
CREATE INDEX IF NOT EXISTS idx_mop_ctos_central ON public.mop_ctos(central);
CREATE INDEX IF NOT EXISTS idx_mop_ctos_estado ON public.mop_ctos(estado);
CREATE INDEX IF NOT EXISTS idx_mop_ctos_categoria ON public.mop_ctos(categoria_origen);
CREATE INDEX IF NOT EXISTS idx_mop_ctos_ausente ON public.mop_ctos(is_ausente);
CREATE INDEX IF NOT EXISTS idx_mop_ctos_sigest_poligono ON public.mop_ctos(sigest, poligono);

-- 2. TABLA: mop_import_history
CREATE TABLE IF NOT EXISTS public.mop_import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    total_records INT NOT NULL DEFAULT 0,
    new_records INT NOT NULL DEFAULT 0,
    updated_records INT NOT NULL DEFAULT 0,
    absent_records INT NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL DEFAULT 'Usuario Sistema',
    result_status TEXT NOT NULL DEFAULT 'success',
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mop_import_history_created_at ON public.mop_import_history(created_at DESC);
