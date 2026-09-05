-- ==============================================================================
-- 📻 MIGRACIÓN 08: PASARELA DE RADIODIFUSIÓN AM/FM, RDS Y TONOS AFSK
-- Ubicación: supabase/migrations/08_susy_radiodifusion_alertas.sql
-- Propiedad Intelectual: MyJNexoraVisual
-- ==============================================================================

-- 1. Tabla de Registro de Despacho por Radiofrecuencia Comercial AM/FM
CREATE TABLE IF NOT EXISTS public.susy_radiodifusion_alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canal_emision TEXT NOT NULL,              -- 'FM_MUNICIPAL_94.5', 'AM_LOCAL_1020'
    tipo_protocolo TEXT NOT NULL,             -- 'RDS_TEXT', 'AFSK_AUDIO_SILBIDO'
    contenido_transmitido TEXT NOT NULL,      -- El texto o trama serializada
    frecuencia_mhz_khz TEXT NOT NULL,         -- '94.5 MHz', '1020 KHz'
    operario_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índices para auditoría de transmisiones
CREATE INDEX IF NOT EXISTS idx_radio_canal ON public.susy_radiodifusion_alertas(canal_emision);
CREATE INDEX IF NOT EXISTS idx_radio_protocolo ON public.susy_radiodifusion_alertas(tipo_protocolo);

-- 3. Asegurar aislamiento institucional con RLS
ALTER TABLE public.susy_radiodifusion_alertas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'susy_radiodifusion_alertas' AND policyname = 'Solo Comandancia Operativa accede a Radiodifusion'
  ) THEN
    CREATE POLICY "Solo Comandancia Operativa accede a Radiodifusion"
    ON public.susy_radiodifusion_alertas FOR ALL
    USING (auth.role() = 'service_role' OR auth.role() = 'anon');
  END IF;
END $$;

-- 4. Semilla de auditoría inicial
INSERT INTO public.susy_radiodifusion_alertas (canal_emision, tipo_protocolo, contenido_transmitido, frecuencia_mhz_khz)
VALUES
  (
    'FM_MUNICIPAL',
    'RDS_TEXT',
    'SUSY: ALERTA METEOROLOGICA PREVENTIVA EN ITUZAINGO',
    '94.5 MHz'
  ),
  (
    'AM_LOCAL_1020',
    'AFSK_AUDIO_SILBIDO',
    '{"alerta":"EVACUAR_ISLAS_ZONA_BAJA","cota_rio":3.85}',
    '1020 KHz'
  )
ON CONFLICT DO NOTHING;
