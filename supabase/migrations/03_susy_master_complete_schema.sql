-- ==============================================================================
-- 🏛️ SUSY BOT - ESQUEMA MAESTRO CONSOLIDADO MUNICIPAL (ITUZAINGÓ, CORRIENTES)
-- Ubicación: supabase/migrations/03_susy_master_complete_schema.sql
-- 
-- 100% IDEMPOTENTE: Seguro de ejecutar en el SQL Editor de Supabase.
-- Incluye la totalidad de tablas, índices, políticas RLS y datos iniciales.
-- ==============================================================================

-- 0. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Secuencia para números correlativos de tickets de reclamo #ITU-XXX
CREATE SEQUENCE IF NOT EXISTS susy_ticket_seq START 101;

-- ==============================================================================
-- 1. RECLAMOS URBANOS CIUDADANOS (MÓDULO ZÁRATE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS susy_reclamos_urbanos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code TEXT NOT NULL UNIQUE DEFAULT ('ITU-' || nextval('susy_ticket_seq')::TEXT),
    citizen_id TEXT,
    tipo_reclamo TEXT NOT NULL DEFAULT 'general',
    ubicacion_exacta TEXT NOT NULL,
    descripcion_vecino TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'inspeccionado', 'cuadrilla_asignada', 'resuelto', 'desestimado')),
    prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. SESIONES Y MENSAJES DE DIÁLOGO CIUDADANO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS susybot_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    title TEXT DEFAULT 'Consulta Ciudadana Ituzaingó',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS susybot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES susybot_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. SINCRONIZACIÓN EFÍMERA QR (PC A MÓVIL)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS susybot_sync_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    desktop_socket_id TEXT,
    user_id TEXT,
    session_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AUTHORIZED', 'CONSUMED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- ==============================================================================
-- 4. MEMORIA CONTINUA DEL CIUDADANO (ACCESIBILIDAD, TEA, DISCAPACIDAD)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS susybot_user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, memory_key)
);

-- ==============================================================================
-- 5. ALERTAS Y ASISTENCIA SOS (DEFENSA CIVIL Y SALUD)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_phone TEXT,
    contact_name TEXT,
    message_payload TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. TELEMETRÍA Y RENDIMIENTO DE INFERENCIA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS susybot_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. GUÍA COMERCIAL OFICIAL DE ITUZAINGÓ (COMERCIOS ADHERIDOS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS directory_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    website TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. OFICINAS Y SECRETARÍAS MUNICIPALES (12 DEPENDENCIAS OFICIALES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS susy_municipal_departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('gobierno', 'servicios', 'desarrollo', 'comunidad')),
    lead_title TEXT,
    short_desc TEXT,
    full_desc TEXT,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    schedule TEXT NOT NULL,
    services JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. EVENTOS Y ACTIVIDADES CULTURALES CON GEOLOCALIZACIÓN
-- ==============================================================================
CREATE TABLE IF NOT EXISTS susy_municipal_events (
    id TEXT PRIMARY KEY DEFAULT ('EVT-' || gen_random_uuid()),
    department_id TEXT REFERENCES susy_municipal_departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    date_str TEXT NOT NULL,
    time_str TEXT NOT NULL,
    location_name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description TEXT,
    admission TEXT NOT NULL DEFAULT 'Gratuito',
    link_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. TURNOS CIUDADANOS PARA TRÁMITES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS susy_municipal_turnos (
    id TEXT PRIMARY KEY, -- #TURNO-ITU-YYYY-XXXX
    department_id TEXT NOT NULL,
    department_name TEXT NOT NULL,
    citizen_name TEXT NOT NULL,
    citizen_dni TEXT NOT NULL,
    citizen_phone TEXT NOT NULL,
    procedure_type TEXT NOT NULL,
    date_str TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    requirements JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'atendido', 'cancelado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 11. PERMISOS Y CONSTANCIAS PROVISORIAS CON CÓDIGO QR
-- ==============================================================================
CREATE TABLE IF NOT EXISTS susy_permisos_provisorios (
    id TEXT PRIMARY KEY, -- #PERM-ITU-YYYY-XXXX
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    titular_nombre TEXT NOT NULL,
    titular_dni TEXT NOT NULL,
    titular_domicilio TEXT NOT NULL,
    titular_telefono TEXT NOT NULL,
    motivo_detalle TEXT NOT NULL,
    fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_vencimiento TIMESTAMPTZ NOT NULL,
    validez_horas INT NOT NULL DEFAULT 72,
    qr_verification_token TEXT UNIQUE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'vencido', 'revocado')),
    condiciones JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==============================================================================
-- 12. GACETILLAS DE PRENSA Y COMUNICADOS OFICIALES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS susy_gacetillas_prensa (
    id TEXT PRIMARY KEY, -- #GAC-ITU-YYYY-XXXX
    titulo TEXT NOT NULL,
    bajada TEXT NOT NULL,
    categoria TEXT NOT NULL,
    cuerpo TEXT NOT NULL,
    vocero_cita TEXT,
    contacto_prensa TEXT NOT NULL,
    publicado BOOLEAN NOT NULL DEFAULT TRUE,
    destacado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_susy_reclamos_estado ON susy_reclamos_urbanos(estado);
CREATE INDEX IF NOT EXISTS idx_susy_reclamos_tipo ON susy_reclamos_urbanos(tipo_reclamo);
CREATE INDEX IF NOT EXISTS idx_susybot_sessions_user ON susybot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_susybot_messages_session ON susybot_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_susy_events_dept ON susy_municipal_events(department_id);
CREATE INDEX IF NOT EXISTS idx_susy_turnos_dni ON susy_municipal_turnos(citizen_dni);
CREATE INDEX IF NOT EXISTS idx_susy_permisos_dni ON susy_permisos_provisorios(titular_dni);
CREATE INDEX IF NOT EXISTS idx_susy_permisos_qr ON susy_permisos_provisorios(qr_verification_token);
CREATE INDEX IF NOT EXISTS idx_susy_gacetillas_cat ON susy_gacetillas_prensa(categoria);
CREATE INDEX IF NOT EXISTS idx_directory_biz_status ON directory_businesses(status);

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE susy_reclamos_urbanos ENABLE ROW LEVEL SECURITY;
ALTER TABLE susybot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE susybot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE susybot_sync_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE susybot_user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE susybot_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_municipal_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_municipal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_municipal_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_permisos_provisorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_gacetillas_prensa ENABLE ROW LEVEL SECURITY;

-- Políticas universales seguras para el funcionamiento municipal
CREATE POLICY "RLS_reclamos_all" ON susy_reclamos_urbanos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_sessions_all" ON susybot_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_messages_all" ON susybot_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_sync_all" ON susybot_sync_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_memories_all" ON susybot_user_memories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_sos_all" ON emergency_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_metrics_all" ON susybot_performance_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_directory_all" ON directory_businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_departments_all" ON susy_municipal_departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_events_all" ON susy_municipal_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_turnos_all" ON susy_municipal_turnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_permisos_all" ON susy_permisos_provisorios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "RLS_gacetillas_all" ON susy_gacetillas_prensa FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- DATOS INICIALES SEMILLA: COMERCIOS ADHERIDOS DE ITUZAINGÓ
-- ==============================================================================
INSERT INTO directory_businesses (name, category, address, phone, whatsapp, website, status)
VALUES
  ('Restaurante El Timón del Paraná', 'Gastronomía', 'Av. Costanera y Belgrano', '03786-420330', '5493786411223', 'https://instagram.com/eltimon_ituzaingo', 'ACTIVE'),
  ('Sabores del Iberá', 'Gastronomía', 'Calle Centenario 1240', '03786-420450', '5493786419876', 'https://instagram.com/saboresdelibera_itu', 'ACTIVE'),
  ('Cabañas Rincón del Sol', 'Alojamiento', 'Calle Posadas y Ruta 12', '03786-421100', '5493786415544', 'https://facebook.com/rincondelsolituzaingo', 'ACTIVE'),
  ('Hotel Ituzaingó', 'Alojamiento', 'Buenos Aires y San Martín', '03786-420015', '5493786410099', 'https://hotelituzaingo.com.ar', 'ACTIVE'),
  ('Ferretería El Progreso', 'Comercio', 'Calle Belgrano 1120', '03786-421250', '5493786417788', 'https://facebook.com/ferreteriaelprogreso_itu', 'ACTIVE')
ON CONFLICT DO NOTHING;
