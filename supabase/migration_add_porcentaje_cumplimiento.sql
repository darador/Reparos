-- ========================================================
-- Migración: Agregar columna porcentaje_cumplimiento en Supabase
-- Ejecutar este script en el Editor SQL de Supabase (SQL Editor)
-- ========================================================

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS porcentaje_cumplimiento NUMERIC;

-- Recargar caché del esquema en PostgREST si fuera necesario
NOTIFY pgrst, 'reload schema';
