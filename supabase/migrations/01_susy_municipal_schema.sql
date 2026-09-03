-- ==============================================================================
-- ðŸ›ï¸ SUSY BOT - ESQUEMA DE BASE DE DATOS MUNICIPAL (ITUZAINGÃ“, CORRIENTES)
-- UbicaciÃ³n: supabase/migrations/01_susy_municipal_schema.sql
-- ==============================================================================

-- Habilitar extensiÃ³n de vectores para RAG semÃ¡ntico (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- Secuencia para nÃºmeros correlativos de tickets #ITU-XXX
CREATE SEQUENCE IF NOT EXISTS susy_ticket_seq START 101;

-- 1. RECLAMOS URBANOS CIUDADANOS (MÃ“DULO ZÃRATE)
CREATE TABLE IF NOT EXISTS susy_reclamos_urbanos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code TEXT NOT NULL UNIQUE DEFAULT ('ITU-' || nextval('susy_ticket_seq')::TEXT),
    citizen_id TEXT,
    tipo_reclamo TEXT NOT NULL CHECK (tipo_reclamo IN ('infraestructura', 'luminaria', 'bromatologia', 'transito', 'limpieza', 'general')),
    ubicacion_exacta TEXT NOT NULL,
    descripcion_vecino TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'inspeccionado', 'cuadrilla_asignada', 'resuelto', 'desestimado')),
    prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SESIONES DE ATENCIÃ“N VIRTUAL
CREATE TABLE IF NOT EXISTS susy_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id TEXT,
    channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'mobile', 'totem', 'qr', 'voice')),
    title TEXT DEFAULT 'Consulta Ciudadana ItuzaingÃ³',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. HISTORIAL DE DIÃLOGOS
CREATE TABLE IF NOT EXISTS susy_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES susy_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    audio_url TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    model_tag TEXT DEFAULT 'Ollama-Sovereign',
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. MEMORIA CONTINUA Y PERFIL CIUDADANO (ACCESIBILIDAD, TEA, NO VIDENTES)
CREATE TABLE IF NOT EXISTS susy_citizen_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id TEXT NOT NULL,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    embedding vector(768),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(citizen_id, memory_key)
);

-- 5. DIGESTO MUNICIPAL Y BASE DE CONOCIMIENTO (MÃ“DULO CÃ“RDOBA - RAG)
CREATE TABLE IF NOT EXISTS susy_municipal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL, -- Obras PÃºblicas, TrÃ¡nsito, Rentas, Salud, Turismo
    content TEXT NOT NULL,
    requirements JSONB DEFAULT '[]'::jsonb,
    steps JSONB DEFAULT '[]'::jsonb,
    contact_phone TEXT,
    contact_email TEXT,
    embedding vector(768),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ALERTAS Y ASISTENCIA SOS (DEFENSA CIVIL Y SALUD)
CREATE TABLE IF NOT EXISTS susy_sos_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    citizen_id TEXT,
    location JSONB DEFAULT '{}'::jsonb,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SINCRONIZACIÃ“N EFÃMERA QR
CREATE TABLE IF NOT EXISTS susy_sync_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    desktop_socket_id TEXT,
    session_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AUTHORIZED', 'CONSUMED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- ÃNDICES
CREATE INDEX IF NOT EXISTS idx_susy_reclamos_estado ON susy_reclamos_urbanos(estado);
CREATE INDEX IF NOT EXISTS idx_susy_reclamos_tipo ON susy_reclamos_urbanos(tipo_reclamo);
CREATE INDEX IF NOT EXISTS idx_susy_sessions_citizen ON susy_sessions(citizen_id);
CREATE INDEX IF NOT EXISTS idx_susy_messages_session ON susy_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_susy_docs_dept ON susy_municipal_documents(department);

-- FUNCIÃ“N DE BÃšSQUEDA SEMÃNTICA VECTORIAL
CREATE OR REPLACE FUNCTION match_susy_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_dept text default null
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  department TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    susy_municipal_documents.id,
    susy_municipal_documents.title,
    susy_municipal_documents.department,
    susy_municipal_documents.content,
    1 - (susy_municipal_documents.embedding <=> query_embedding) AS similarity
  FROM susy_municipal_documents
  WHERE susy_municipal_documents.is_active = true
    AND (filter_dept IS NULL OR susy_municipal_documents.department = filter_dept)
    AND 1 - (susy_municipal_documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- RLS
ALTER TABLE susy_reclamos_urbanos ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_citizen_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_municipal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_sync_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir crear reclamos vecinales" ON susy_reclamos_urbanos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir consultar reclamos por ticket" ON susy_reclamos_urbanos FOR SELECT USING (true);
CREATE POLICY "Permitir todo en sesiones" ON susy_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en mensajes" ON susy_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura pÃºblica de guÃ­as de trÃ¡mites" ON susy_municipal_documents FOR SELECT USING (is_active = true);
CREATE POLICY "Tokens QR efÃ­meros" ON susy_sync_tokens FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- ðŸ“‹ SEED INICIAL: DIGESTO MUNICIPAL & TELÃ‰FONOS DE ITUZAINGÃ“
-- ==============================================================================
INSERT INTO susy_municipal_documents (title, department, content, contact_phone, contact_email)
VALUES
(
  'RenovaciÃ³n y EmisiÃ³n de Licencia de Conducir',
  'TrÃ¡nsito',
  'Para renovar u obtener el carnet de conducir en ItuzaingÃ³ se requiere: 1. DNI original y fotocopia con domicilio en ItuzaingÃ³. 2. Constancia de grupo y factor sanguÃ­neo. 3. Tener libre de deuda municipal y no registrar multas pendientes. 4. AprobaciÃ³n del examen mÃ©dico y examen teÃ³rico-prÃ¡ctico para primeras licencias. Horario de atenciÃ³n: Lunes a viernes de 7:00 a 13:00 hs en la DirecciÃ³n de TrÃ¡nsito Municipal.',
  '03786-420040',
  'transito@ituzaingo.gob.ar'
),
(
  'AtenciÃ³n de Emergencias y Guardias MÃ©dicas',
  'Salud',
  'Guardia activa 24 horas en el Hospital Dr. Ricardo Billinghurst. DirecciÃ³n: Corrientes y Belgrano, ItuzaingÃ³. TelÃ©fono de emergencias: 107 o 03786-420033. Centros de AtenciÃ³n Primaria de la Salud (CAPS) en barrios Girasoles, ParanÃ¡, San Roque y Belgrano de 7:00 a 18:00 hs.',
  '107 / 03786-420033',
  'salud@ituzaingo.gob.ar'
),
(
  'Seguridad y Bomberos Voluntarios',
  'Defensa Civil',
  'Bomberos Voluntarios de ItuzaingÃ³: TelÃ©fono 100 o 03786-420022. ComisarÃ­a 1Âª ItuzaingÃ³: 03786-420044. ComisarÃ­a 2Âª (Barrio General San MartÃ­n): 03786-421222. Prefectura Naval Argentina (Puerto ItuzaingÃ³): 106 o 03786-420025. Guardia de Defensa Civil Municipal: 103.',
  '100 / 103 / 106',
  'defensacivil@ituzaingo.gob.ar'
),
(
  'Turismo Local: Portal CambyretÃ¡ y Central YacyretÃ¡',
  'Turismo',
  'Portal CambyretÃ¡ (Esteros del IberÃ¡): Ingreso por Ruta Nacional 12 km 1230, acceso con avistaje de fauna autÃ³ctona, carpinchos, yacarÃ©s y ciervos de los pantanos. Centro de Informes TurÃ­sticos Municipal: Peatonal y Centenario. Central HidroelÃ©ctrica YacyretÃ¡: Visitas guiadas gratuitas coordinadas en el Centro de Visitantes en Av. 9 de Julio.',
  '03786-420050',
  'turismo@ituzaingo.gob.ar'
)
ON CONFLICT DO NOTHING;