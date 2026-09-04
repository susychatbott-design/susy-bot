-- ==============================================================================
-- 🏛️ SUSY BOT - MIGRACIÓN 05: CUARENTENA REPUTACIONAL Y AUDITORÍA POLÍTICA
-- Ubicación: supabase/migrations/05_susy_cuarentena_reputacional.sql
-- 
-- 100% IDEMPOTENTE: Seguro de ejecutar en el SQL Editor de Supabase.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.susy_cuarentena_reputacional (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    input_ciudadano TEXT NOT NULL,
    categoria_ataque TEXT NOT NULL, -- 'insulto', 'difamacion_politica'
    nivel_riesgo TEXT DEFAULT 'medio',
    aprobado_para_analisis BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.susy_cuarentena_reputacional ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'susy_cuarentena_reputacional' 
      AND policyname = 'Solo administradores con service_role ven la cuarentena'
  ) THEN
    CREATE POLICY "Solo administradores con service_role ven la cuarentena" 
    ON public.susy_cuarentena_reputacional 
    FOR SELECT 
    USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'susy_cuarentena_reputacional' 
      AND policyname = 'Insercion permitida para service_role y anon'
  ) THEN
    CREATE POLICY "Insercion permitida para service_role y anon" 
    ON public.susy_cuarentena_reputacional 
    FOR INSERT 
    WITH CHECK (true);
  END IF;
END $$;
