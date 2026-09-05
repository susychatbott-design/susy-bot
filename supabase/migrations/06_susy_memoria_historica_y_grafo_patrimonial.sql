-- ==============================================================================
-- 🏛️ MIGRACIÓN 06: MÓDULO DE IDENTIDAD HISTÓRICA, MEMORIA COLECTIVA Y GRAFO PATRIMONIAL
-- Ubicación: supabase/migrations/06_susy_memoria_historica_y_grafo_patrimonial.sql
-- Propiedad Intelectual: MyJNexoraVisual
-- ==============================================================================

-- 1. Asegurar la tabla del Grafo del Digesto
CREATE TABLE IF NOT EXISTS public.susy_grafo_digesto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad_origen TEXT NOT NULL,
  relacion TEXT NOT NULL,
  entidad_destino TEXT NOT NULL,
  contenido_normativo TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índices de Búsqueda Rápida Relacional
CREATE INDEX IF NOT EXISTS idx_grafo_origen ON public.susy_grafo_digesto(entidad_origen);
CREATE INDEX IF NOT EXISTS idx_grafo_destino ON public.susy_grafo_digesto(entidad_destino);
CREATE INDEX IF NOT EXISTS idx_grafo_relacion ON public.susy_grafo_digesto(relacion);

-- 3. Inserción Idempotente del Grafo Patrimonial e Histórico de Ituzaingó
INSERT INTO public.susy_grafo_digesto (entidad_origen, relacion, entidad_destino, contenido_normativo)
VALUES
  (
    'Bernardino Valle',
    'DONÓ_TIERRAS_Y_FUNDÓ',
    'Fundación Oficial de Ituzaingó (1864)',
    'Ley Provincial del 24 de Octubre de 1864: El gobernador Manuel Ignacio Lagraña aprueba la fundación de Ituzaingó en terrenos donados por Don Bernardino Valle en el paraje Tranquea de Loreto, reservando parcelas para plaza, templo, escuela y juzgado.'
  ),
  (
    'Batalla de Ituzaingó (20 de Febrero de 1827)',
    'DIO_NOMBRE_A',
    'Denominación Oficial de la Ciudad',
    'Decreto de Nomenclatura Histórica: La ciudad toma su nombre en homenaje a la victoria militar del Ejército Republicano Argentino en 1827. Etimología guaraní: I-tu-zaingó (aguas que caen o salto de agua colgante).'
  ),
  (
    'Pueblo Guaraní y Raíces Ancestrales',
    'POBLÓ_PREVIAMENTE',
    'Riberas del Alto Paraná y Cuenca del Iberá',
    'Registro Antropológico y Patrimonial: Preexistencia étnica mbyá-guaraní y comunidades de las Misiones Jesuíticas. Legado vivo en el idioma, toponimia, plantas medicinales y cosmovisión del río Paraná e Iberá (Ý berá).'
  ),
  (
    'Pioneros Portuarios y Madereros',
    'FORJARON_LA_ECONOMÍA',
    'Puerto Ituzaingó y Alto Paraná',
    'Crónica Histórica Fluvial: Ituzaingó como puerto de amarre estratégico para jangadas y vapores de pasajeros y cargas a finales del siglo XIX, núcleo del desarrollo maderero y comercial pionero.'
  ),
  (
    'Identidad Chamamecera y Tradición Viva',
    'PATRIMONIO_CULTURAL_INTANGIBLE',
    'Música, Poesía y Festivales Tradicionales',
    'Resolución de Protección Cultural: El chamamé, declarado Patrimonio Cultural Inmaterial de la Humanidad (UNESCO), es el latido identitario de Ituzaingó, celebrado en el Festival de la Energía, peñas y centros culturales.'
  ),
  (
    'Represa Hidroeléctrica Yacyretá',
    'TRANSFORMÓ_RADICALMENTE',
    'Modernización Urbana y Geografía Regional',
    'Tratado de Yacyretá y Obras Complementarias: La construcción de la central hidroeléctrica binacional desde fines de los 70 transformó la villa en Capital de la Energía, construyendo nuevos barrios, defensas costeras y avenidas.'
  ),
  (
    'Esteros del Iberá (Portal Cambyretá)',
    'CONSTITUYE_EL_PATRIMONIO_NATURAL',
    'Reserva Natural y Ecoturismo Mundial',
    'Ley de Áreas Naturales Protegidas: Ituzaingó es el acceso norte al Parque Iberá por Cambyretá, santuario ecológico de pastizales, humedales y fauna autóctona protegida.'
  )
ON CONFLICT DO NOTHING;
