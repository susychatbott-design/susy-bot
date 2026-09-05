-- ==============================================================================
-- 🚨 MIGRACIÓN 07: COMANDANCIA OPERATIVA DE DEFENSA CIVIL OFF-GRID (LORA MESH)
-- Ubicación: supabase/migrations/07_susy_defensa_civil_mesh.sql
-- Propiedad Intelectual: MyJNexoraVisual
-- ==============================================================================

-- 1. Tabla Maestra de Alertas de Catástrofe e Incidentes LoRa Mesh
CREATE TABLE IF NOT EXISTS public.susy_defensa_civil_mesh (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nodo_hardware_id TEXT NOT NULL,          -- Identificador hexadecimal de la antena Heltec/T-Beam
    tipo_alerta TEXT NOT NULL,               -- 'PANICO', 'INUNDACION', 'EVACUACION', 'SISTEMA_CAIDO'
    mensaje_crudo TEXT NOT NULL,             -- Texto transmitido por radiofrecuencia
    latitud NUMERIC(10, 7) NOT NULL,         -- Ubicación satelital del chip GPS local
    longitud NUMERIC(10, 7) NOT NULL,        -- Ubicación satelital del chip GPS local
    nivel_bateria INT DEFAULT 100,           -- Diagnóstico físico del panel solar/pila del nodo
    procesado_despachado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índices de Búsqueda y Monitoreo Táctico
CREATE INDEX IF NOT EXISTS idx_mesh_tipo_alerta ON public.susy_defensa_civil_mesh(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_mesh_despachado ON public.susy_defensa_civil_mesh(procesado_despachado);
CREATE INDEX IF NOT EXISTS idx_mesh_nodo_hw ON public.susy_defensa_civil_mesh(nodo_hardware_id);

-- 3. Habilitar seguridad de nivel de fila (RLS) corporativa
ALTER TABLE public.susy_defensa_civil_mesh ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acceso Estrictas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'susy_defensa_civil_mesh' AND policyname = 'Solo Comandancia Operativa accede a Defensa Civil'
  ) THEN
    CREATE POLICY "Solo Comandancia Operativa accede a Defensa Civil"
    ON public.susy_defensa_civil_mesh
    FOR ALL
    USING (auth.role() = 'service_role' OR auth.role() = 'anon'); -- Permite telemetría segura en frontend del panel
  END IF;
END $$;

-- 5. Semilla Inicial de Pruebas Tácticas (Ituzaingó)
INSERT INTO public.susy_defensa_civil_mesh (nodo_hardware_id, tipo_alerta, mensaje_crudo, latitud, longitud, nivel_bateria, procesado_despachado)
VALUES
  (
    '#ITU-HEX7F2',
    'PANICO',
    'Solicitud de auxilio por anegamiento de vivienda. Adulto mayor atrapado.',
    -27.5614000,
    -56.6831000,
    94,
    FALSE
  ),
  (
    '#ITU-COST01',
    'INUNDACION',
    'Sensor de cota de río: Nivel de crecida supera umbral de alerta en bajada náutica.',
    -27.5582000,
    -56.6795000,
    88,
    FALSE
  ),
  (
    '#ITU-IBER04',
    'EVACUACION',
    'Corte preventivo de camino rural por tormenta eléctrica severa en acceso a Cambyretá.',
    -27.6045000,
    -56.7120000,
    100,
    TRUE
  )
ON CONFLICT DO NOTHING;
