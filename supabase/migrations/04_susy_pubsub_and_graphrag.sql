-- ==============================================================================
-- 🏛️ SUSY BOT - MIGRACIÓN 04: PUB/SUB NATIVO (LISTEN/NOTIFY) & GRAPHRAG RELACIONAL
-- Ubicación: supabase/migrations/04_susy_pubsub_and_graphrag.sql
-- 
-- 100% IDEMPOTENTE Y COMPATIBLE CON SUPABASE POSTGRESQL.
-- ==============================================================================

-- 0. Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ==============================================================================
-- 1. PUB/SUB NATIVO POSTGRES (REEMPLAZO DE KAFKA - MESA DE ENTRADAS Y RECLAMOS URBANOS ITUZAINGÓ)
-- ==============================================================================

CREATE OR REPLACE FUNCTION notify_nuevo_reclamo_urbano()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_payload JSONB;
BEGIN
  v_payload := jsonb_build_object(
    'event', 'NUEVO_RECLAMO_REGISTRADO',
    'id', NEW.id,
    'ticket_code', NEW.ticket_code,
    'citizen_id', NEW.citizen_id,
    'tipo_reclamo', NEW.tipo_reclamo,
    'ubicacion_exacta', NEW.ubicacion_exacta,
    'descripcion_vecino', NEW.descripcion_vecino,
    'estado', NEW.estado,
    'prioridad', NEW.prioridad,
    'metadata', NEW.metadata,
    'created_at', NEW.created_at
  );

  PERFORM pg_notify('nuevo_reclamo_canal', v_payload::text);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_susy_reclamos_notify ON susy_reclamos_urbanos;
CREATE TRIGGER trg_susy_reclamos_notify
AFTER INSERT ON susy_reclamos_urbanos
FOR EACH ROW
EXECUTE FUNCTION notify_nuevo_reclamo_urbano();

-- ==============================================================================
-- 2. TABLA RELACIONAL DE GRAPHRAG: DIGESTO MUNICIPAL (ITUZAINGÓ)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS susy_grafo_digesto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad_origen TEXT NOT NULL,
  relacion TEXT NOT NULL,
  entidad_destino TEXT NOT NULL,
  contenido_normativo TEXT NOT NULL,
  vector_asociado vector(384),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grafo_origen ON susy_grafo_digesto(entidad_origen);
CREATE INDEX IF NOT EXISTS idx_grafo_destino ON susy_grafo_digesto(entidad_destino);
CREATE INDEX IF NOT EXISTS idx_grafo_relacion ON susy_grafo_digesto(relacion);

-- ==============================================================================
-- 3. FUNCIÓN RPC GRAPHRAG RECURSIVA (CTE RECURSIVA VÁLIDA EN POSTGRESQL)
-- ==============================================================================

CREATE OR REPLACE FUNCTION buscar_graphrag_digesto_recursivo(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.55,
  max_seed_nodes INT DEFAULT 3,
  max_depth INT DEFAULT 2
)
RETURNS TABLE (
  profundidad INT,
  nodo_origen TEXT,
  tipo_relacion TEXT,
  nodo_destino TEXT,
  normativa TEXT,
  similitud_coseno FLOAT,
  ruta_grafo TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE GrafoExpansion AS (
    -- 1. Nodos Semilla envueltos en subconsulta para admitir ORDER BY / LIMIT en el ancla
    SELECT
      1 AS depth,
      semilla.entidad_origen,
      semilla.relacion,
      semilla.entidad_destino,
      semilla.contenido_normativo,
      semilla.similarity,
      (semilla.entidad_origen || ' --[' || semilla.relacion || ']--> ' || semilla.entidad_destino) AS path,
      ARRAY[semilla.id] AS visited_ids
    FROM (
      SELECT
        g.id,
        g.entidad_origen,
        g.relacion,
        g.entidad_destino,
        g.contenido_normativo,
        (1 - (g.vector_asociado <=> query_embedding))::FLOAT AS similarity
      FROM susy_grafo_digesto g
      WHERE g.is_active = TRUE
        AND (g.vector_asociado IS NULL OR (1 - (g.vector_asociado <=> query_embedding)) > match_threshold)
      ORDER BY g.vector_asociado <=> query_embedding ASC
      LIMIT max_seed_nodes
    ) semilla

    UNION ALL

    -- 2. Expansión Recursiva de Nodos Vecinos Vinculados
    SELECT
      ge.depth + 1,
      vecino.entidad_origen,
      vecino.relacion,
      vecino.entidad_destino,
      vecino.contenido_normativo,
      (ge.similarity * 0.9)::FLOAT AS similarity,
      (ge.path || ' ==> ' || vecino.entidad_origen || ' --[' || vecino.relacion || ']--> ' || vecino.entidad_destino) AS path,
      ge.visited_ids || vecino.id
    FROM susy_grafo_digesto vecino
    INNER JOIN GrafoExpansion ge 
      ON (vecino.entidad_origen = ge.entidad_destino OR vecino.entidad_destino = ge.entidad_origen)
    WHERE ge.depth < max_depth
      AND vecino.is_active = TRUE
      AND NOT (vecino.id = ANY(ge.visited_ids))
  )
  SELECT 
    GrafoExpansion.depth AS profundidad,
    GrafoExpansion.entidad_origen AS nodo_origen,
    GrafoExpansion.relacion AS tipo_relacion,
    GrafoExpansion.entidad_destino AS nodo_destino,
    GrafoExpansion.contenido_normativo AS normativa,
    GrafoExpansion.similarity AS similitud_coseno,
    GrafoExpansion.path AS ruta_grafo
  FROM GrafoExpansion
  ORDER BY GrafoExpansion.depth ASC, GrafoExpansion.similarity DESC;
END;
$$;

-- ==============================================================================
-- 4. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
-- ==============================================================================
ALTER TABLE susy_grafo_digesto ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'susy_grafo_digesto' AND policyname = 'Lectura pública del Grafo del Digesto'
  ) THEN
    CREATE POLICY "Lectura pública del Grafo del Digesto" 
    ON susy_grafo_digesto FOR SELECT 
    USING (is_active = TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'susy_grafo_digesto' AND policyname = 'Inserción administrativa del Grafo'
  ) THEN
    CREATE POLICY "Inserción administrativa del Grafo" 
    ON susy_grafo_digesto FOR INSERT 
    WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- 5. SEMILLA INICIAL: GRAPHRAG DE ORDENANZAS DE ITUZAINGÓ
-- ==============================================================================
INSERT INTO susy_grafo_digesto (entidad_origen, relacion, entidad_destino, contenido_normativo)
VALUES
  (
    'Habilitación Comercial de Gastronomía',
    'EXIGE_TASA',
    'Tasa de Seguridad e Higiene (Rentas)',
    'Ordenanza Impositiva Municipal N° 412/2025: Todo local gastronómico habilitado debe abonar la Tasa de Seguridad e Higiene bimestral con Libre de Deuda.'
  ),
  (
    'Habilitación Comercial de Gastronomía',
    'REGULA',
    'Bromatología y Carnet Sanitario',
    'Código de Bromatología Municipal N° 108: El personal de manipulación de alimentos debe contar con Curso Oficial de Manipulación de Alimentos y Carnet Sanitario vigente emitido por el CAPS o Hospital Billinghurst.'
  ),
  (
    'Bromatología y Carnet Sanitario',
    'SANCIONA',
    'Clausura Preventiva y Multas Categoría A',
    'Ordenanza de Faltas N° 215: La detección de alimentos sin cadena de frío o personal sin libreta sanitaria amerita clausura preventiva inmediata de hasta 72 horas hábiles.'
  ),
  (
    'Obras Privadas y Edificación Urbana',
    'REGULA',
    'Línea de Edificación y Retiro de Calzada',
    'Código de Planeamiento Urbano de Ituzaingó N° 340: Todo frente sobre avenidas principales (Centenario, 9 de Julio) debe respetar 3 metros de retiro y no obstaculizar veredas peatonales.'
  ),
  (
    'Uso de Espacios Públicos y Playas',
    'COMPLEMENTA',
    'Prefectura Naval y Seguridad Acuática',
    'Ordenanza de Costanera y Balnearios N° 519: Solo está permitido el baño en playas habilitadas con guardavidas (Playa Brava, Playa Morena) de 8:00 a 20:00 hs durante temporada estival.'
  )
ON CONFLICT DO NOTHING;
