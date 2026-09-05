/**
 * ==============================================================================
 * 🏛️ SUSY BOT - MÓDULO DE IDENTIDAD HISTÓRICA Y MEMORIA COLECTIVA
 * Ubicación: src/lib/susy/municipal/municipalHistory.ts
 * 
 * Grafo Patrimonial del Digesto y Archivo Histórico de Ituzaingó, Corrientes.
 * Propiedad Intelectual: MyJNexoraVisual
 * ==============================================================================
 */

export interface HistoricalNode {
  entidad_origen: string;
  relacion: string;
  entidad_destino: string;
  contenido: string;
  categoria: "fundacion" | "batalla" | "guarani" | "pioneros" | "chamame" | "yacyreta" | "patrimonio";
}

export const GRAFO_PATRIMONIAL_ITUZAINGO: HistoricalNode[] = [
  {
    entidad_origen: "Bernardino Valle",
    relacion: "DONÓ_TIERRAS_Y_FUNDÓ",
    entidad_destino: "Fundación Oficial de Ituzaingó (1864)",
    contenido: "Don Bernardino Valle, visionario hacendado y comerciante naviero, solicitó al Gobierno de la Provincia de Corrientes la fundación del pueblo en el paraje conocido como 'Trinchera de San José' o 'Tranquea de Loreto'. El 24 de octubre de 1864, el gobernador Manuel Ignacio Lagraña promulgó la Ley de fundación oficial de Ituzaingó, cediendo don Bernardino los terrenos para plaza pública, iglesia, juzgado de paz y escuela.",
    categoria: "fundacion"
  },
  {
    entidad_origen: "Batalla de Ituzaingó (20 de Febrero de 1827)",
    relacion: "DIO_NOMBRE_A",
    entidad_destino: "Toponimia y Denominación de la Ciudad",
    contenido: "El nombre 'Ituzaingó' fue elegido en honor a la célebre Batalla de Ituzaingó (Guerra con el Imperio del Brasil, 1827), donde las tropas republicanas argentinas al mando de Carlos María de Alvear vencieron al ejército imperial. La voz guaraní 'I-tu-zaingó' se traduce tradicionalmente como 'cascada o salto de agua colgante' o 'agua que cae'.",
    categoria: "batalla"
  },
  {
    entidad_origen: "Pueblo Guaraní y Raíces Ancestrales",
    relacion: "POBLÓ_PREVIAMENTE",
    entidad_destino: "Riberas del Alto Paraná y Cuenca del Iberá",
    contenido: "Mucho antes de la colonización criolla, estas tierras ribereñas estaban habitadas por comunidades de la nación Guaraní (mbyá y guaraníes de las Misiones Jesuíticas). Su legado perdura en la toponimia, el idioma guaraní hablado cotidianamente, la medicina con hierbas nativas y el respeto místico por el río Paraná ('padre de las aguas') y el gran humedal del Iberá ('Ý berá' = aguas brillantes).",
    categoria: "guarani"
  },
  {
    entidad_origen: "Pioneros Portuarios y Madereros",
    relacion: "FORJARON_LA_ECONOMÍA",
    entidad_destino: "Puerto Ituzaingó y Alto Paraná",
    contenido: "A finales del siglo XIX y principios del XX, Ituzaingó se consolidó como puerto estratégico de recalada obligatoria para los vapores fluviales que navegaban hacia Posadas y el Alto Paraná. Pioneros obrajeros, balseros y comerciantes levantaron los primeros almacenes de ramos generales, jangadas de madera de ley y muelles que dieron sustento a las familias pioneras.",
    categoria: "pioneros"
  },
  {
    entidad_origen: "Identidad Chamamecera y Tradición Viva",
    relacion: "PATRIMONIO_CULTURAL_INTANGIBLE",
    entidad_destino: "Música, Poesía y Festivales Tradicionales",
    contenido: "Ituzaingó es corazón de la cultura chamamecera declarada Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO. Sede del Festival de la Energía, peñas costeras y jineteadas. Músicos como Salvador Miqueri, Tránsito Cocomarola y las guitarras orilleras son recordados con orgullo en el Centro Cultural y en cada fogón.",
    categoria: "chamame"
  },
  {
    entidad_origen: "Represa Hidroeléctrica Yacyretá",
    relacion: "TRANSFORMÓ_RADICALMENTE",
    entidad_destino: "Modernización Urbana y Geografía Regional",
    contenido: "A partir de la década de 1970 y 1980, el Tratado de Yacyretá y la construcción de la central binacional argentino-paraguaya transformaron por completo la estructura social y económica de Ituzaingó. La ciudad multiplicó su población, se construyeron modernas avenidas, complejos habitacionales (Barrios de Mil Viviendas), tendidos de alta tensión y defensas costeras que dieron nacimiento a las extensas playas turísticas actuales.",
    categoria: "yacyreta"
  },
  {
    entidad_origen: "Esteros del Iberá (Portal Cambyretá)",
    relacion: "CONSTITUYE_EL_PATRIMONIO_NATURAL",
    entidad_destino: "Reserva Natural y Ecoturismo Mundial",
    contenido: "Ituzaingó es la puerta de entrada norte al Gran Parque Iberá a través del Portal Cambyretá. Un paraíso virgen de pastizales, lagunas y embalsados donde conviven ciervos de los pantanos, carpinchos, yacarés y cientos de especies de aves protegidas bajo leyes municipales y provinciales de conservación estricta.",
    categoria: "patrimonio"
  }
];

/**
 * Genera el bloque de contexto histórico y memoria colectiva para el motor de inferencia
 */
export function generarContextoPatrimonialHistorico(): string {
  const lineas = GRAFO_PATRIMONIAL_ITUZAINGO.map(nodo => {
    return `• [${nodo.entidad_origen}] --(${nodo.relacion})--> [${nodo.entidad_destino}]:
  ${nodo.contenido}`;
  });

  return `
================================================================================
🏛️ GRAFO PATRIMONIAL DEL DIGESTO: IDENTIDAD HISTÓRICA Y MEMORIA COLECTIVA
================================================================================
${lineas.join("\n\n")}

DIRECTIVAS DEL GUÍA CULTURAL OFICIAL (MÓDULO 6):
1. Rol Patrimonial: Responder con orgullo, rigor histórico y tono docente institucional sobre el pasado de la ciudad.
2. Fundador y Origen: Reconocer a Don Bernardino Valle (24 de octubre de 1864) y la Ley de fundación del Gob. Lagraña.
3. Batalla y Nombre: Explicar el origen en la Batalla de Ituzaingó de 1827 y la etimología guaraní ("aguas que caen / salto de agua").
4. Raíces Guaraníes y Chamamé: Celebrar la herencia originaria y la música chamamecera como alma de la comunidad.
5. Transformación de Yacyretá: Narrar con equilibrio el paso de villa portuaria y maderera a Capital de la Energía Limpia y portal ecoturístico.
================================================================================`;
}
