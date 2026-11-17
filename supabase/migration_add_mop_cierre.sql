-- ========================================================
-- MIGRACIÓN: MODIFICACIÓN FUNCIONAL PENDIENTE MOP - CIERRE POR ACTUALIZACIÓN
-- Permite marcar registros ausentes como CERRADO POR ACTUALIZACIÓN
-- conservando el estado operativo anterior, observaciones e historial.
-- ========================================================

-- 1. Agregar campos de trazabilidad para cierre por actualización si no existen
ALTER TABLE public.mop_ctos
ADD COLUMN IF NOT EXISTS is_cerrado_por_actualizacion BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_cierre_actualizacion TIMESTAMPTZ;

-- 2. Migrar registros que ya estaban marcados como ausentes
UPDATE public.mop_ctos
SET 
  is_cerrado_por_actualizacion = is_ausente,
  fecha_cierre_actualizacion = CASE 
    WHEN is_ausente = true AND fecha_cierre_actualizacion IS NULL THEN updated_at
    ELSE fecha_cierre_actualizacion 
  END
WHERE is_ausente = true;

-- 3. Crear índices para optimizar consultas de registros vigentes vs cerrados
CREATE INDEX IF NOT EXISTS idx_mop_ctos_cerrado_act ON public.mop_ctos(is_cerrado_por_actualizacion);
CREATE INDEX IF NOT EXISTS idx_mop_ctos_vigentes ON public.mop_ctos(is_cerrado_por_actualizacion, estado);
CREATE INDEX IF NOT EXISTS idx_mop_ctos_fecha_cierre ON public.mop_ctos(fecha_cierre_actualizacion);

-- 4. Comentarios descriptivos
COMMENT ON COLUMN public.mop_ctos.is_cerrado_por_actualizacion IS 'Indica si la CTO dejó de aparecer en la última importación de Excel (cerrada operativamente).';
COMMENT ON COLUMN public.mop_ctos.fecha_cierre_actualizacion IS 'Fecha y hora exacta en la que la CTO fue marcada como cerrada por actualización.';
