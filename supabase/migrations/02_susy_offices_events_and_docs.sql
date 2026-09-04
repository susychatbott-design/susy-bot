-- ==============================================================================
-- 🏛️ SUSY BOT - MIGRACIÓN: OFICINAS, EVENTOS, TURNOS, PERMISOS Y GACETILLAS
-- Ubicación: supabase/migrations/02_susy_offices_events_and_docs.sql
-- ==============================================================================

-- 1. TABLA DE OFICINAS Y SECRETARÍAS MUNICIPALES
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

-- 2. TABLA DE EVENTOS Y ACTIVIDADES GEOLOCALIZADAS
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

-- 3. TABLA DE TURNOS CIUDADANOS
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

-- 4. TABLA DE PERMISOS Y CONSTANCIAS PROVISORIAS CON CÓDIGO QR
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

-- 5. TABLA DE GACETILLAS DE PRENSA Y COMUNICADOS OFICIALES
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

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_susy_events_dept ON susy_municipal_events(department_id);
CREATE INDEX IF NOT EXISTS idx_susy_turnos_dni ON susy_municipal_turnos(citizen_dni);
CREATE INDEX IF NOT EXISTS idx_susy_permisos_dni ON susy_permisos_provisorios(titular_dni);
CREATE INDEX IF NOT EXISTS idx_susy_permisos_qr ON susy_permisos_provisorios(qr_verification_token);
CREATE INDEX IF NOT EXISTS idx_susy_gacetillas_cat ON susy_gacetillas_prensa(categoria);

-- SEGURIDAD RLS
ALTER TABLE susy_municipal_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_municipal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_municipal_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_permisos_provisorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE susy_gacetillas_prensa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de dependencias" ON susy_municipal_departments FOR SELECT USING (true);
CREATE POLICY "Lectura pública de eventos" ON susy_municipal_events FOR SELECT USING (is_active = true);
CREATE POLICY "Gestión de turnos ciudadanos" ON susy_municipal_turnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Consulta y emisión de permisos con QR" ON susy_permisos_provisorios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura pública de gacetillas de prensa" ON susy_gacetillas_prensa FOR SELECT USING (publicado = true);
