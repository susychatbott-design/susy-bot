/**
 * ==============================================================================
 * 🏛️ SUSY BOT — TREN AGÉNTICO MUNICIPAL, ESCUCHA SOCIAL BARRIAL Y DIRECCIÓN DE PRENSA
 * Ubicación: src/lib/susy/municipal/ituzaingoCommandCenter.ts
 * Desarrollado por Nexora One (Tel: 3786414533 • nexoraone@nexativanews.com.ar)
 *
 * Inspirado en la arquitectura de despacho multi-agente de Nexora One Engine:
 * - Susy actúa como Directora General de Atención al Vecino y Directora de Prensa Municipal.
 * - Coordina un Tren Agéntico de 7 Agentes Especialistas asignados a los puestos clave
 *   del ejido municipal de Ituzaingó, Corrientes (100% aislados de Ituzaingó, Buenos Aires).
 * - Incluye Radar de Escucha Social y Termómetro de Ánimo Ciudadano por Barrio
 *   (los 20 barrios oficiales de Ituzaingó, Corrientes).
 * - Mantiene la Agenda Oficial de Actividades del Intendente (José Emilio Nicolás)
 *   y Viceintendente (María Luisa Ojeda).
 * ==============================================================================
 */

import { analyzeVecino, SusyEmotionalTone } from "../pnl/susyPnlEngine";

// ============================================================================
// 1. IDENTIDAD GEOGRÁFICA Y EJIDO OFICIAL DE ITUZAINGÓ, CORRIENTES
// ============================================================================
export const ITUZAINGO_CORRIENTES_IDENTITY = {
  ciudad: "Ituzaingó",
  provincia: "Corrientes",
  pais: "República Argentina",
  codigoPostal: "W3302",
  prefijoTelefonico: "03786",
  coordenadasPalacio: [-27.5843, -56.6836] as [number, number],
  direccionPalacio: "Av. Centenario 1519, frente a Plaza Gral. San Martín",
  fundacion: "24 de octubre de 1864 (Fundador: Don Bernardino Valle)",
  intendenteActual: "José Emilio Nicolás (Período 2025–2029)",
  viceintendenteActual: "María Luisa Ojeda",
  limitesGeograficos:
    "Norte: Río Paraná y Represa Binacional Yacyretá (límite con Ayolas, Paraguay); Sur: Esteros del Iberá (Portal Cambyretá); Conectividad vial: Ruta Nacional Nº 12.",
  advertenciaDesambiguacion:
    "ATENCIÓN ESTRICTA: Esta es la ciudad de Ituzaingó, Provincia de CORRIENTES (Capital de la Energía, costa del Río Paraná y Portal Cambyretá del Iberá). Queda terminantemente PROHIBIDO confundirla o mencionar datos del partido bonaerense de Ituzaingó (GBA, Tren Sarmiento, Autopista del Oeste, etc.).",
};

// ============================================================================
// 2. AGENDA OFICIAL DEL INTENDENTE Y ACTIVIDADES DEL EJECUTIVO MUNICIPAL
// ============================================================================
export interface ActividadIntendente {
  id: string;
  fechaHora: string;
  titulo: string;
  barrioOLugar: string;
  areaInvolucrada: string;
  estado: "En curso" | "Programada" | "Completada";
  resumenPrensa: string;
  beneficioVecinos: string;
}

export const AGENDA_INTENDENTE_ITUZAINGO: ActividadIntendente[] = [
  {
    id: "INT-ITU-01",
    fechaHora: "Hoy • 08:30 hs",
    titulo: "Supervisión de Pavimentación, Cordón Cuneta y Recambio Lumínico LED",
    barrioOLugar: "Barrio General Manuel Belgrano y Barrio San Jorge",
    areaInvolucrada: "Secretaría de Obras y Servicios Públicos",
    estado: "En curso",
    resumenPrensa:
      "El Intendente José Emilio Nicolás junto al equipo técnico de Obras Públicas recorre los frentes de obra de hormigonado, perfilado de calles y colocación de nuevas luminarias LED de alta potencia.",
    beneficioVecinos: "Mayor transitabilidad en días de lluvia y corredores nocturnos seguros para más de 600 familias.",
  },
  {
    id: "INT-ITU-02",
    fechaHora: "Hoy • 11:00 hs",
    titulo: "Mesa de Articulación Turística y Ambiental: Temporada Costanera y Portal Cambyretá",
    barrioOLugar: "Salón de Acuerdos del Palacio Municipal (Av. Centenario 1519)",
    areaInvolucrada: "Secretaría de Turismo, Cultura y Cámara de Prestadores del Iberá",
    estado: "Programada",
    resumenPrensa:
      "Reunión encabezada por el Ejecutivo Municipal con guías de sitio, sector hotelero y gastronómico para coordinar servicios en Playa Stella Maris, bajadas de lanchas y excursiones al Parque Nacional Iberá.",
    beneficioVecinos: "Impulso al empleo local, promoción comercial gratuita y fortalecimiento del ecoturismo.",
  },
  {
    id: "INT-ITU-03",
    fechaHora: "Mañana • 09:00 hs",
    titulo: "Operativo Integral 'El Municipio en tu Barrio': Salud, Zoonosis, Rentas y Acción Social",
    barrioOLugar: "Barrio Mil Viviendas (SUM Comunitario) y Barrio San Cayetano",
    areaInvolucrada: "Gabinete Municipal Completo y Atención Primaria de la Salud",
    estado: "Programada",
    resumenPrensa:
      "El Intendente y los secretarios de área atienden de forma directa a los vecinos con controles pediátricos, vacunación, asesoramiento de CUD, poda programada y desmalezamiento.",
    beneficioVecinos: "Descentralización de trámites municipales sin necesidad de trasladarse al casco céntrico.",
  },
  {
    id: "INT-ITU-04",
    fechaHora: "Viernes • 18:30 hs",
    titulo: "Entrega de Microcréditos y Herramientas a Emprendedores y Artesanos Locales",
    barrioOLugar: "Auditorio del Centro Cultural Ituzaingó (Corrientes y Belgrano)",
    areaInvolucrada: "Dirección de Producción, Empleo y Juventud",
    estado: "Programada",
    resumenPrensa:
      "Acto institucional encabezado por el Intendente José Emilio Nicolás y la Viceintendente María Luisa Ojeda para fortalecer a productores gastronómicos, carpinteros y artesanos del Paseo San Martín.",
    beneficioVecinos: "Apoyo directo a la economía familiar y generación de valor local en Ituzaingó.",
  },
  {
    id: "INT-ITU-05",
    fechaHora: "Sábado • 19:30 hs",
    titulo: "Inauguración de Nuevas Defensas Costeras, Miradores y Paseo Cultural Chamamecero",
    barrioOLugar: "Costanera Paranaguá y Playa Stella Maris",
    areaInvolucrada: "Intendencia, Obras Públicas, Turismo y Cultura",
    estado: "Programada",
    resumenPrensa:
      "Puesta en valor de luminarias solares, accesos inclusivos con rampas adaptadas y apertura de la agenda cultural de fin de semana frente al Río Paraná.",
    beneficioVecinos: "Espacio público renovado e inclusivo para las familias ituzaingueñas y visitantes.",
  },
];

// ============================================================================
// 3. TREN AGÉNTICO MUNICIPAL (PUESTOS CLAVE BAJO EL MANDO DE SUSY)
// ============================================================================
export interface AgenteMunicipalEspecialista {
  id: string;
  codigoAgente: string;
  nombrePuesto: string;
  secretaria: string;
  icono: string;
  estadoOperativo: "ACTIVO_EN_TERRENO" | "MONITOREANDO" | "GUARDIA_24HS";
  misionPrincipal: string;
  barriosPrioritarios: string[];
  kpisTiempoReal: {
    casosResueltosHoy: number;
    tiempoRespuestaPromedioMin: number;
    indiceEfectividadPct: number;
  };
  ultimoReporteASusy: string;
}

export const TREN_AGENTICO_SUSY: AgenteMunicipalEspecialista[] = [
  {
    id: "agent-prensa-redes",
    codigoAgente: "NEX-ITU-PRENSA-01",
    nombrePuesto: "Agente de Prensa Oficial, Escucha Social y Radar de Redes",
    secretaria: "Dirección de Prensa y Comunicación Institucional (Bajo mando directo de Susy)",
    icono: "📡",
    estadoOperativo: "MONITOREANDO",
    misionPrincipal:
      "Monitoreo en tiempo real del humor social en redes (Facebook, Instagram, portales locales y grupos vecinales de Ituzaingó), redacción de gacetillas oficiales y difusión de la agenda del Intendente.",
    barriosPrioritarios: ["Todo el Ejido Urbano", "Casco Céntrico", "Mil Viviendas", "Rincón Santa María"],
    kpisTiempoReal: {
      casosResueltosHoy: 42,
      tiempoRespuestaPromedioMin: 2,
      indiceEfectividadPct: 98,
    },
    ultimoReporteASusy:
      "Sentimiento altamente positivo (+82%) en Casco Céntrico y Costanera por eventos culturales y mejoras en playas; alerta temprana de reclamos de alumbrado en Barrio Iberá y desmalezado en Rincón Santa María.",
  },
  {
    id: "agent-obras-servicios",
    codigoAgente: "NEX-ITU-OBRAS-02",
    nombrePuesto: "Agente de Obras Públicas, Luminarias LED, Bacheo y Limpieza",
    secretaria: "Secretaría de Obras y Servicios Públicos",
    icono: "🚧",
    estadoOperativo: "ACTIVO_EN_TERRENO",
    misionPrincipal:
      "Despacho de cuadrillas de recambio LED, bacheo, perfilado de calles de tierra, zanjeo pluvial y recolección de restos de poda con permiso QR.",
    barriosPrioritarios: ["General Manuel Belgrano", "San Jorge", "Iberá", "Cazadores Correntinos"],
    kpisTiempoReal: {
      casosResueltosHoy: 31,
      tiempoRespuestaPromedioMin: 18,
      indiceEfectividadPct: 94,
    },
    ultimoReporteASusy:
      "Cuadrilla de Electrotecnia operando en Av. Centenario y Barrio Belgrano; camión recolector de ramas cubriendo zona norte.",
  },
  {
    id: "agent-transito-seguridad",
    codigoAgente: "NEX-ITU-VIAL-03",
    nombrePuesto: "Agente de Tránsito, Licencias CENAT y Seguridad Ciudadana",
    secretaria: "Dirección de Tránsito, Transporte y Guardia Urbana",
    icono: "🚓",
    estadoOperativo: "GUARDIA_24HS",
    misionPrincipal:
      "Emisión de turnos para Licencia Nacional de Conducir, control de carga y descarga, ordenamiento vial en acceso por Ruta 12 y corredores escolares.",
    barriosPrioritarios: ["Casco Céntrico", "General San Martín", "Bernardino Valle", "Acceso RN 12"],
    kpisTiempoReal: {
      casosResueltosHoy: 54,
      tiempoRespuestaPromedioMin: 4,
      indiceEfectividadPct: 97,
    },
    ultimoReporteASusy:
      "Tránsito fluido en Av. Centenario y 9 de Julio; turnera de licencias operando sin demoras de 07:00 a 13:00 hs.",
  },
  {
    id: "agent-rentas-comercio",
    codigoAgente: "NEX-ITU-RENTAS-04",
    nombrePuesto: "Agente de Hacienda, Rentas, Bromatología y Habilitaciones",
    secretaria: "Secretaría de Hacienda, Finanzas y Dirección de Comercio",
    icono: "🏛️",
    estadoOperativo: "MONITOREANDO",
    misionPrincipal:
      "Liquidación de tasas municipales, emisión de constancias de libre deuda en trámite, habilitaciones comerciales provisorias con QR y control bromatológico.",
    barriosPrioritarios: ["Casco Céntrico", "San Martín", "Villa Luisa", "Portal del Sol"],
    kpisTiempoReal: {
      casosResueltosHoy: 39,
      tiempoRespuestaPromedioMin: 3,
      indiceEfectividadPct: 96,
    },
    ultimoReporteASusy:
      "14 comercios locales actualizados en la Guía Comercial Oficial; emisión activa de permisos provisorios por 72 hs.",
  },
  {
    id: "agent-turismo-ibera",
    codigoAgente: "NEX-ITU-TURISMO-05",
    nombrePuesto: "Agente de Turismo, Playas del Paraná, Yacyretá y Portal Cambyretá",
    secretaria: "Secretaría de Turismo, Cultura y Deporte",
    icono: "🏖️",
    estadoOperativo: "ACTIVO_EN_TERRENO",
    misionPrincipal:
      "Atención al turista, estado de playas y balnearios (Stella Maris, Paranaguá), visitas guiadas a la Represa Yacyretá, Portal Cambyretá (Iberá) y cartelera del Centro Cultural.",
    barriosPrioritarios: ["Costanera", "La Florida", "Portal del Sol", "Casco Céntrico"],
    kpisTiempoReal: {
      casosResueltosHoy: 68,
      tiempoRespuestaPromedioMin: 1,
      indiceEfectividadPct: 99,
    },
    ultimoReporteASusy:
      "Playas habilitadas con servicio de guardavidas; salidas confirmadas a Represa Yacyretá (09, 11, 14 y 16 hs) y teatro gratuito en el Centro Cultural.",
  },
  {
    id: "agent-social-salud",
    codigoAgente: "NEX-ITU-SOCIAL-06",
    nombrePuesto: "Agente de Acción Social, Salud Comunitaria, Discapacidad (CUD/TEA) y Zoonosis",
    secretaria: "Secretaría de Acción Social, Desarrollo Humano y Salud",
    icono: "🤝",
    estadoOperativo: "ACTIVO_EN_TERRENO",
    misionPrincipal:
      "Acompañamiento inclusivo (TEA/Lazarillo), gestión del Certificado Único de Discapacidad (CUD), operativos sanitarios en salas barriales y campañas de zoonosis.",
    barriosPrioritarios: ["Mil Viviendas", "San Cayetano", "Virgen de Itatí", "Santa Rita de Casia"],
    kpisTiempoReal: {
      casosResueltosHoy: 27,
      tiempoRespuestaPromedioMin: 6,
      indiceEfectividadPct: 95,
    },
    ultimoReporteASusy:
      "Preparando operativo sanitario integral de mañana en SUM del Barrio Mil Viviendas; atención CUD activa en Acción Social.",
  },
  {
    id: "agent-defensa-civil",
    codigoAgente: "NEX-ITU-DEFCIVIL-07",
    nombrePuesto: "Agente de Defensa Civil, Alerta Hidrometeorológica y Red VHF/Mesh",
    secretaria: "Dirección de Defensa Civil y Guardia de Emergencias",
    icono: "🛟",
    estadoOperativo: "GUARDIA_24HS",
    misionPrincipal:
      "Monitoreo de altura del Río Paraná y caudales de Yacyretá, alertas por tormentas severas, prevención de incendios forestales y enlace con Bomberos (100), Policía (101) y Hospital (107).",
    barriosPrioritarios: ["Rincón Santa María", "Islas Malvinas", "Bajada de Lanchas", "Zona Costera"],
    kpisTiempoReal: {
      casosResueltosHoy: 19,
      tiempoRespuestaPromedioMin: 1,
      indiceEfectividadPct: 100,
    },
    ultimoReporteASusy:
      "Caudal del Río Paraná estable en parámetro normal; guardia preventiva 24 hs activa en canal 103.",
  },
];

// ============================================================================
// 4. TERMÓMETRO DE ÁNIMO SOCIAL POR BARRIO (ESCUCHA EN REDES + INTERACCIONES)
// ============================================================================
export type ClimaSocialBarrio = "POSITIVO" | "ESTABLE" | "ATENCION_REQUERIDA" | "URGENTE";

export interface HumorSocialBarrio {
  id: string;
  barrio: string;
  zona: "Centro / Costanera" | "Norte / Yacyretá" | "Sur / Ruta 12" | "Complejos Habitacionales";
  indiceAprobacion: number; // 0 a 100
  clima: ClimaSocialBarrio;
  emocionPredominante: SusyEmotionalTone;
  mencionesRedes24h: number;
  principalesTemasRedes: string[];
  tendenciaPrincipal: string;
  agenteAsignadoCodigo: string;
  ultimaActualizacion: string;
}

export const BARRIOS_HUMOR_SOCIAL_INICIAL: HumorSocialBarrio[] = [
  {
    id: "barrio-centro",
    barrio: "Casco Céntrico",
    zona: "Centro / Costanera",
    indiceAprobacion: 86,
    clima: "POSITIVO",
    emocionPredominante: "JOY",
    mencionesRedes24h: 142,
    principalesTemasRedes: ["Feria de Artesanos Plaza San Martín", "Iluminación Av. Centenario", "Obra teatral Centro Cultural"],
    tendenciaPrincipal: "Alta valoración en Instagram y Facebook por la agenda cultural gratuita y el ordenamiento del microcentro.",
    agenteAsignadoCodigo: "NEX-ITU-PRENSA-01",
    ultimaActualizacion: "Hace 4 min",
  },
  {
    id: "barrio-san-martin",
    barrio: "General José F. de San Martín",
    zona: "Centro / Costanera",
    indiceAprobacion: 83,
    clima: "POSITIVO",
    emocionPredominante: "CALM",
    mencionesRedes24h: 78,
    principalesTemasRedes: ["Recolección diferenciada", "Comercios habilitados", "Seguridad vial"],
    tendenciaPrincipal: "Conversación vecinal favorable sobre limpieza urbana y actividad comercial.",
    agenteAsignadoCodigo: "NEX-ITU-VIAL-03",
    ultimaActualizacion: "Hace 8 min",
  },
  {
    id: "barrio-belgrano",
    barrio: "General Manuel Belgrano",
    zona: "Centro / Costanera",
    indiceAprobacion: 79,
    clima: "POSITIVO",
    emocionPredominante: "JOY",
    mencionesRedes24h: 95,
    principalesTemasRedes: ["Obras de cordón cuneta", "Recambio LED en ejecución", "Visita del Intendente"],
    tendenciaPrincipal: "Repercusión positiva en grupos barriales por el avance de pavimentación y nuevas luces LED.",
    agenteAsignadoCodigo: "NEX-ITU-OBRAS-02",
    ultimaActualizacion: "Hace 5 min",
  },
  {
    id: "barrio-mil-viviendas",
    barrio: "Mil Viviendas",
    zona: "Complejos Habitacionales",
    indiceAprobacion: 74,
    clima: "ESTABLE",
    emocionPredominante: "CALM",
    mencionesRedes24h: 164,
    principalesTemasRedes: ["Operativo sanitario mañana", "Pedidos de poda", "Turnos de licencia"],
    tendenciaPrincipal: "Alta expectativa vecinal por el operativo 'El Municipio en tu Barrio' en el SUM comunitario.",
    agenteAsignadoCodigo: "NEX-ITU-SOCIAL-06",
    ultimaActualizacion: "Hace 3 min",
  },
  {
    id: "barrio-san-jorge",
    barrio: "San Jorge",
    zona: "Sur / Ruta 12",
    indiceAprobacion: 68,
    clima: "ATENCION_REQUERIDA",
    emocionPredominante: "CONFUSION",
    mencionesRedes24h: 89,
    principalesTemasRedes: ["Reposición de luminarias LED", "Perfilado de calles internas", "Fumigación preventiva"],
    tendenciaPrincipal: "Vecinos solicitan por Facebook reforzar el alumbrado en dos cuadras internas; cuadrilla ya asignada.",
    agenteAsignadoCodigo: "NEX-ITU-OBRAS-02",
    ultimaActualizacion: "Hace 6 min",
  },
  {
    id: "barrio-san-cayetano",
    barrio: "San Cayetano",
    zona: "Complejos Habitacionales",
    indiceAprobacion: 75,
    clima: "ESTABLE",
    emocionPredominante: "CALM",
    mencionesRedes24h: 63,
    principalesTemasRedes: ["Atención Primaria de la Salud", "Desmalezamiento de plaza", "Actividades deportivas"],
    tendenciaPrincipal: "Buen ánimo comunitario tras tareas de mantenimiento en espacios verdes.",
    agenteAsignadoCodigo: "NEX-ITU-SOCIAL-06",
    ultimaActualizacion: "Hace 11 min",
  },
  {
    id: "barrio-mbatareta",
    barrio: "Mbataretá",
    zona: "Centro / Costanera",
    indiceAprobacion: 81,
    clima: "POSITIVO",
    emocionPredominante: "CALM",
    mencionesRedes24h: 52,
    principalesTemasRedes: ["Corredor costero", "Recolección de ramas", "Seguridad nocturna"],
    tendenciaPrincipal: "Reconocimiento vecinal por la rapidez en el retiro de restos de poda.",
    agenteAsignadoCodigo: "NEX-ITU-OBRAS-02",
    ultimaActualizacion: "Hace 14 min",
  },
  {
    id: "barrio-ibera",
    barrio: "Barrio Iberá",
    zona: "Sur / Ruta 12",
    indiceAprobacion: 61,
    clima: "ATENCION_REQUERIDA",
    emocionPredominante: "ANGER",
    mencionesRedes24h: 112,
    principalesTemasRedes: ["Reclamo por luminarias apagadas", "Zanjeo y desagües pluviales", "Bacheo en esquina"],
    tendenciaPrincipal: "Reclamos activos en redes por luminarias apagadas tras la última lluvia; prioridad alta para Electrotecnia.",
    agenteAsignadoCodigo: "NEX-ITU-OBRAS-02",
    ultimaActualizacion: "Hace 2 min",
  },
  {
    id: "barrio-rincon-santa-maria",
    barrio: "Rincón Santa María",
    zona: "Norte / Yacyretá",
    indiceAprobacion: 64,
    clima: "ATENCION_REQUERIDA",
    emocionPredominante: "CONFUSION",
    mencionesRedes24h: 74,
    principalesTemasRedes: ["Frecuencia de recolección", "Desmalezado costero", "Bajada de lanchas"],
    tendenciaPrincipal: "Pedidos de refuerzo de desmalezado y mantenimiento del acceso hacia el río.",
    agenteAsignadoCodigo: "NEX-ITU-DEFCIVIL-07",
    ultimaActualizacion: "Hace 9 min",
  },
  {
    id: "barrio-bernardino-valle",
    barrio: "Bernardino Valle",
    zona: "Centro / Costanera",
    indiceAprobacion: 84,
    clima: "POSITIVO",
    emocionPredominante: "JOY",
    mencionesRedes24h: 47,
    principalesTemasRedes: ["Patrimonio histórico", "Limpieza de veredas", "Iluminación peatonal"],
    tendenciaPrincipal: "Clima vecinal muy favorable y alta participación en actividades culturales.",
    agenteAsignadoCodigo: "NEX-ITU-PRENSA-01",
    ultimaActualizacion: "Hace 15 min",
  },
  {
    id: "barrio-villa-luisa",
    barrio: "Villa Luisa",
    zona: "Centro / Costanera",
    indiceAprobacion: 78,
    clima: "POSITIVO",
    emocionPredominante: "CALM",
    mencionesRedes24h: 41,
    principalesTemasRedes: ["Habilitaciones comerciales", "Alumbrado público", "Recolección domiciliaria"],
    tendenciaPrincipal: "Conformidad con los servicios públicos y movimiento comercial estable.",
    agenteAsignadoCodigo: "NEX-ITU-RENTAS-04",
    ultimaActualizacion: "Hace 18 min",
  },
  {
    id: "barrio-islas-malvinas",
    barrio: "Islas Malvinas",
    zona: "Norte / Yacyretá",
    indiceAprobacion: 72,
    clima: "ESTABLE",
    emocionPredominante: "CALM",
    mencionesRedes24h: 58,
    principalesTemasRedes: ["Plazoleta del barrio", "Poda preventiva", "Señalización vial"],
    tendenciaPrincipal: "Solicitudes puntuales de poda preventiva cerca del tendido eléctrico.",
    agenteAsignadoCodigo: "NEX-ITU-DEFCIVIL-07",
    ultimaActualizacion: "Hace 12 min",
  },
  {
    id: "barrio-pedro-ferre",
    barrio: "Pedro Ferré",
    zona: "Complejos Habitacionales",
    indiceAprobacion: 76,
    clima: "ESTABLE",
    emocionPredominante: "CALM",
    mencionesRedes24h: 49,
    principalesTemasRedes: ["Barrido urbano", "Turnos municipales", "Vacunación antirrábica"],
    tendenciaPrincipal: "Buena recepción del cronograma de zoonosis y limpieza barrial.",
    agenteAsignadoCodigo: "NEX-ITU-SOCIAL-06",
    ultimaActualizacion: "Hace 16 min",
  },
  {
    id: "barrio-cazadores-correntinos",
    barrio: "Cazadores Correntinos",
    zona: "Sur / Ruta 12",
    indiceAprobacion: 66,
    clima: "ATENCION_REQUERIDA",
    emocionPredominante: "CONFUSION",
    mencionesRedes24h: 67,
    principalesTemasRedes: ["Arreglo de calles de ripio", "Cunetas pluviales", "Luminaria en parada"],
    tendenciaPrincipal: "Pedidos vecinales de repaso con motoniveladora en arterias principales.",
    agenteAsignadoCodigo: "NEX-ITU-OBRAS-02",
    ultimaActualizacion: "Hace 7 min",
  },
  {
    id: "barrio-santa-rita",
    barrio: "Santa Rita de Casia",
    zona: "Sur / Ruta 12",
    indiceAprobacion: 73,
    clima: "ESTABLE",
    emocionPredominante: "CALM",
    mencionesRedes24h: 44,
    principalesTemasRedes: ["Asistencia social", "Talleres comunitarios", "Alumbrado"],
    tendenciaPrincipal: "Participación activa de familias en talleres municipales y capilla barrial.",
    agenteAsignadoCodigo: "NEX-ITU-SOCIAL-06",
    ultimaActualizacion: "Hace 20 min",
  },
  {
    id: "barrio-san-francisco",
    barrio: "San Francisco de Asís",
    zona: "Sur / Ruta 12",
    indiceAprobacion: 75,
    clima: "ESTABLE",
    emocionPredominante: "CALM",
    mencionesRedes24h: 38,
    principalesTemasRedes: ["Recolección de residuos", "Zoonosis", "Espacios recreativos"],
    tendenciaPrincipal: "Estabilidad en servicios y buena valoración del mantenimiento de plazas.",
    agenteAsignadoCodigo: "NEX-ITU-OBRAS-02",
    ultimaActualizacion: "Hace 22 min",
  },
  {
    id: "barrio-virgen-itati",
    barrio: "Virgen de Itatí",
    zona: "Complejos Habitacionales",
    indiceAprobacion: 71,
    clima: "ESTABLE",
    emocionPredominante: "CALM",
    mencionesRedes24h: 55,
    principalesTemasRedes: ["Operativo descacharrado", "Fumigación", "Atención primaria"],
    tendenciaPrincipal: "Vecinos destacan el operativo preventivo contra el dengue.",
    agenteAsignadoCodigo: "NEX-ITU-SOCIAL-06",
    ultimaActualizacion: "Hace 13 min",
  },
  {
    id: "barrio-san-isidro",
    barrio: "San Isidro",
    zona: "Sur / Ruta 12",
    indiceAprobacion: 74,
    clima: "ESTABLE",
    emocionPredominante: "CALM",
    mencionesRedes24h: 36,
    principalesTemasRedes: ["Mantenimiento de calles", "Iluminación LED", "Seguridad"],
    tendenciaPrincipal: "Clima barrial tranquilo con pedidos puntuales de poda.",
    agenteAsignadoCodigo: "NEX-ITU-OBRAS-02",
    ultimaActualizacion: "Hace 25 min",
  },
  {
    id: "barrio-portal-del-sol",
    barrio: "Portal del Sol",
    zona: "Centro / Costanera",
    indiceAprobacion: 88,
    clima: "POSITIVO",
    emocionPredominante: "JOY",
    mencionesRedes24h: 118,
    principalesTemasRedes: ["Ocupación cabañas y hoteles", "Gastronomía costera", "Paseos náuticos"],
    tendenciaPrincipal: "Fuerte entusiasmo en redes por el movimiento turístico de fin de semana y playas impecables.",
    agenteAsignadoCodigo: "NEX-ITU-TURISMO-05",
    ultimaActualizacion: "Hace 5 min",
  },
  {
    id: "barrio-la-florida",
    barrio: "La Florida",
    zona: "Norte / Yacyretá",
    indiceAprobacion: 85,
    clima: "POSITIVO",
    emocionPredominante: "JOY",
    mencionesRedes24h: 82,
    principalesTemasRedes: ["Playas y paradores", "Visitas a Represa Yacyretá", "Sunset Costanera"],
    tendenciaPrincipal: "Excelente valoración de turistas y vecinos sobre la limpieza y seguridad costera.",
    agenteAsignadoCodigo: "NEX-ITU-TURISMO-05",
    ultimaActualizacion: "Hace 6 min",
  },
];

// ============================================================================
// 5. MOTOR EN VIVO DE ACTUALIZACIÓN BARRIAL, REGISTRO DE INTERACCIONES Y DESPACHO AGÉNTICO
// ============================================================================
const STORAGE_KEY_BARRIOS = "susy_ituzaingo_humor_barrios_v1";
const STORAGE_KEY_OPERATIONS_LOG = "susy_ituzaingo_agentic_ops_log_v1";

export interface RegistroOperacionAgentica {
  id: string;
  timestamp: string;
  canal: "VOZ_LIVE" | "CHAT_WEB" | "ESCANER_REDES";
  barrioDetectado: string;
  agenteAsignadoCodigo: string;
  agenteNombre: string;
  agenteIcono: string;
  consultaVecino: string;
  respuestaSusy: string;
  emocionDetectada: SusyEmotionalTone;
  urgencia: "NORMAL" | "ALTA" | "CRITICA";
  accionEjecutada: string;
  estado: "COMPLETADO" | "EN_ EJECUCION_TERRENO" | "DERIVADO_CUADRILLA";
}

const INITIAL_OPERATIONS_LOG: RegistroOperacionAgentica[] = [
  {
    id: "OP-ITU-904",
    timestamp: "Hace 2 min",
    canal: "VOZ_LIVE",
    barrioDetectado: "Barrio Iberá",
    agenteAsignadoCodigo: "NEX-ITU-OBRAS-02",
    agenteNombre: "Agente de Obras Públicas, Luminarias LED y Bacheo",
    agenteIcono: "🚧",
    consultaVecino: "Reclamo por dos luminarias LED apagadas en esquina tras la lluvia.",
    respuestaSusy: "Ticket #ITU-842 emitido y derivado a la cuadrilla de Electrotecnia Municipal.",
    emocionDetectada: "ANGER",
    urgencia: "ALTA",
    accionEjecutada: "Ticket de Reclamo Urbano #ITU-842 (Alumbrado Público)",
    estado: "DERIVADO_CUADRILLA",
  },
  {
    id: "OP-ITU-903",
    timestamp: "Hace 5 min",
    canal: "CHAT_WEB",
    barrioDetectado: "General Manuel Belgrano",
    agenteAsignadoCodigo: "NEX-ITU-RENTAS-04",
    agenteNombre: "Agente de Hacienda, Rentas y Permisos QR",
    agenteIcono: "🏛️",
    consultaVecino: "Solicitud de permiso provisorio de poda de ramas frente al domicilio.",
    respuestaSusy: "Permiso Provisorio #PERM-ITU-2026-418 emitido con validez de 72 hs y código QR.",
    emocionDetectada: "CALM",
    urgencia: "NORMAL",
    accionEjecutada: "Permiso Provisorio QR #PERM-ITU-2026-418",
    estado: "COMPLETADO",
  },
  {
    id: "OP-ITU-902",
    timestamp: "Hace 9 min",
    canal: "ESCANER_REDES",
    barrioDetectado: "Casco Céntrico",
    agenteAsignadoCodigo: "NEX-ITU-PRENSA-01",
    agenteNombre: "Agente de Prensa Oficial y Escucha Social",
    agenteIcono: "📡",
    consultaVecino: "Monitoreo de menciones en Instagram y Facebook sobre la Feria de Artesanos y obra teatral.",
    respuestaSusy: "Repercusión 86% positiva en Casco Céntrico. Informe elevado a Dirección de Prensa.",
    emocionDetectada: "JOY",
    urgencia: "NORMAL",
    accionEjecutada: "Actualización de Termómetro Barrial (+3% Casco Céntrico)",
    estado: "COMPLETADO",
  },
  {
    id: "OP-ITU-901",
    timestamp: "Hace 14 min",
    canal: "CHAT_WEB",
    barrioDetectado: "Mil Viviendas",
    agenteAsignadoCodigo: "NEX-ITU-VIAL-03",
    agenteNombre: "Agente de Tránsito y Licencias CENAT",
    agenteIcono: "🚓",
    consultaVecino: "Consulta de costos y turno para renovación de Licencia de Conducir Categoría B.",
    respuestaSusy: "Informado arancel CENAT + Tasa Municipal y emitido Turno #TURNO-ITU-2026-3102.",
    emocionDetectada: "CALM",
    urgencia: "NORMAL",
    accionEjecutada: "Comprobante Oficial de Turno #TURNO-ITU-2026-3102",
    estado: "COMPLETADO",
  },
];

export function obtenerBitacoraOperacionesAgenticas(): RegistroOperacionAgentica[] {
  if (typeof window === "undefined") return INITIAL_OPERATIONS_LOG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPERATIONS_LOG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_OPERATIONS_LOG;
}

function resolverAgenteParaConsulta(texto: string): AgenteMunicipalEspecialista {
  const t = texto.toLowerCase();
  if (/incendio|inundaci|cable|tormenta|alerta|defensa civil|emergencia|auxilio|103|100|107/.test(t)) {
    return TREN_AGENTICO_SUSY[6]; // NEX-ITU-DEFCIVIL-07
  }
  if (/bache|pozo|luz|luminaria|led|poda|rama|basura|calle|zanjeo|obra|cord[oó]n/.test(t)) {
    return TREN_AGENTICO_SUSY[1]; // NEX-ITU-OBRAS-02
  }
  if (/licencia|carnet|conducir|cenat|tr[aá]nsito|multa|estacionamiento|vial/.test(t)) {
    return TREN_AGENTICO_SUSY[2]; // NEX-ITU-VIAL-03
  }
  if (/tasa|rentas|libre deuda|comercio|habilitaci[oó]n|bromatolog|impuesto|pago/.test(t)) {
    return TREN_AGENTICO_SUSY[3]; // NEX-ITU-RENTAS-04
  }
  if (/turismo|playa|yacyret[aá]|iber[aá]|cambyret[aá]|teatro|cultura|chamam[eé]|hotel|caba[ñn]a/.test(t)) {
    return TREN_AGENTICO_SUSY[4]; // NEX-ITU-TURISMO-05
  }
  if (/salud|cud|discapacidad|tea|acci[oó]n social|vacuna|zoonosis|hospital/.test(t)) {
    return TREN_AGENTICO_SUSY[5]; // NEX-ITU-SOCIAL-06
  }
  return TREN_AGENTICO_SUSY[0]; // NEX-ITU-PRENSA-01 por defecto
}

export function registrarInteraccionEnTrenAgentico(params: {
  canal: "VOZ_LIVE" | "CHAT_WEB" | "ESCANER_REDES";
  consultaVecino: string;
  respuestaSusy?: string;
  barrioExplicito?: string;
}): RegistroOperacionAgentica {
  const { canal, consultaVecino, respuestaSusy = "", barrioExplicito } = params;
  const pulso = registrarPulsoSocialBarrial(consultaVecino, barrioExplicito);
  const pnl = analyzeVecino(consultaVecino);
  const agente = resolverAgenteParaConsulta(`${consultaVecino} ${respuestaSusy}`);

  let accionEjecutada = "Orientación y Respuesta Institucional Verificada";
  let estado: RegistroOperacionAgentica["estado"] = "COMPLETADO";

  if (/emitirPermisoProvisorio|PERM-ITU/i.test(respuestaSusy)) {
    accionEjecutada = "Emisión de Permiso Provisorio Municipal con QR (72 hs)";
  } else if (/emitirTurno|TURNO-ITU/i.test(respuestaSusy)) {
    accionEjecutada = "Asignación de Turno Presencial con Código QR";
  } else if (/registrarReclamoMunicipal|Ticket #ITU|bache|luminaria|led/i.test(`${consultaVecino} ${respuestaSusy}`)) {
    accionEjecutada = `Derivación a Cuadrilla (${agente.codigoAgente})`;
    estado = "DERIVADO_CUADRILLA";
  }

  const nuevoRegistro: RegistroOperacionAgentica = {
    id: `OP-ITU-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    canal,
    barrioDetectado: pulso.barrioImpactado,
    agenteAsignadoCodigo: agente.codigoAgente,
    agenteNombre: agente.nombrePuesto,
    agenteIcono: agente.icono,
    consultaVecino: consultaVecino.slice(0, 220),
    respuestaSusy: respuestaSusy
      .replace(/\[CALL_FUNCTION:[^\]]*\]/gi, "")
      .trim()
      .slice(0, 260) || "Procesado por el Tren Agéntico de Susy.",
    emocionDetectada: pnl.emotionalTone,
    urgencia: pnl.urgency,
    accionEjecutada,
    estado,
  };

  if (typeof window !== "undefined") {
    try {
      const actual = obtenerBitacoraOperacionesAgenticas();
      const actualizado = [nuevoRegistro, ...actual].slice(0, 60);
      localStorage.setItem(STORAGE_KEY_OPERATIONS_LOG, JSON.stringify(actualizado));
      window.dispatchEvent(new Event("susy_agentic_ops_updated"));
    } catch {}
  }

  return nuevoRegistro;
}

export function obtenerTermometroBarrial(): HumorSocialBarrio[] {
  if (typeof window === "undefined") return BARRIOS_HUMOR_SOCIAL_INICIAL;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BARRIOS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return BARRIOS_HUMOR_SOCIAL_INICIAL;
}

/**
 * Registra un pulso real de ánimo o mención ciudadana (desde redes o chat) e impacta
 * el termómetro del barrio mencionado usando el motor PNL de Susy.
 */
export function registrarPulsoSocialBarrial(
  textoMencion: string,
  barrioExplicito?: string
): { barrioImpactado: string; perfilDetectado: SusyEmotionalTone; nuevoIndice: number } {
  const lista = [...obtenerTermometroBarrial()];
  const pnl = analyzeVecino(textoMencion);
  const lower = textoMencion.toLowerCase();

  let targetIdx = lista.findIndex((b) =>
    barrioExplicito
      ? b.barrio.toLowerCase().includes(barrioExplicito.toLowerCase())
      : lower.includes(b.barrio.toLowerCase().replace("barrio ", "").replace("general ", ""))
  );

  if (targetIdx === -1) {
    targetIdx = 0; // Casco Céntrico por defecto
  }

  const actual = { ...lista[targetIdx] };
  let delta = 0;
  if (pnl.emotionalTone === "JOY") delta = +3;
  else if (pnl.emotionalTone === "CALM") delta = +1;
  else if (pnl.emotionalTone === "CONFUSION") delta = -2;
  else if (pnl.emotionalTone === "ANGER" || pnl.emotionalTone === "FEAR" || pnl.emotionalTone === "SADNESS") delta = -4;

  actual.indiceAprobacion = Math.max(25, Math.min(98, actual.indiceAprobacion + delta));
  actual.emocionPredominante = pnl.emotionalTone;
  actual.mencionesRedes24h += 1;
  actual.ultimaActualizacion = "Recién (Tiempo Real)";
  actual.tendenciaPrincipal = `Último pulso detectado (${pnl.emotionalTone}): "${textoMencion.slice(0, 90)}"`;

  if (actual.indiceAprobacion >= 78) actual.clima = "POSITIVO";
  else if (actual.indiceAprobacion >= 70) actual.clima = "ESTABLE";
  else if (actual.indiceAprobacion >= 55) actual.clima = "ATENCION_REQUERIDA";
  else actual.clima = "URGENTE";

  lista[targetIdx] = actual;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_BARRIOS, JSON.stringify(lista));
    } catch {}
  }

  return {
    barrioImpactado: actual.barrio,
    perfilDetectado: pnl.emotionalTone,
    nuevoIndice: actual.indiceAprobacion,
  };
}

/**
 * Construye el dossier ejecutivo compacto de Ituzaingó, Corrientes (Geografía, Intendente,
 * Prensa, Tren Agéntico y Termómetro de Ánimo por Barrio) optimizado para respetar
 * el presupuesto de tokens de Groq LPU (`on_demand` tier < 6000 TPM).
 */
export function generarContextoComandoMunicipalItuzaingo(userQuery = ""): string {
  const q = (userQuery || "").toLowerCase();
  const asksAgendaOrPress = /intendente|nicol[aá]s|ojeda|agenda|actividad|acto|obra|inaugur|prensa|gacetilla/i.test(q);
  const asksMoodOrAgents = /barrio|[aá]nimo|humor|redes|sentimiento|agente|tren|equipo|puesto|secretar/i.test(q);

  let extraBlocks = "";

  if (asksAgendaOrPress) {
    const agendaTexto = AGENDA_INTENDENTE_ITUZAINGO.map(
      (a) => `• [${a.fechaHora} - ${a.estado}] ${a.titulo} (${a.barrioOLugar}): ${a.resumenPrensa}`
    ).join("\n");
    extraBlocks += `\nAGENDA DETALLADA DEL INTENDENTE JOSÉ EMILIO NICOLÁS:\n${agendaTexto}\n`;
  }

  if (asksMoodOrAgents) {
    const agentesTexto = TREN_AGENTICO_SUSY.map(
      (ag) => `• [${ag.codigoAgente}] ${ag.nombrePuesto}: ${ag.ultimoReporteASusy}`
    ).join("\n");
    const resumenBarrios = BARRIOS_HUMOR_SOCIAL_INICIAL.map(
      (b) => `${b.barrio}: ${b.indiceAprobacion}% (${b.clima} - ${b.principalesTemasRedes[0]})`
    ).join(" | ");
    extraBlocks += `\nESTADO DEL TREN AGÉNTICO:\n${agentesTexto}\nTERMÓMETRO DE LOS 20 BARRIOS:\n${resumenBarrios}\n`;
  }

  return `
[CENTRO DE MANDO Y PRENSA MUNICIPAL — ITUZAINGÓ, CORRIENTES]
- Jurisdicción EXCLUSIVA: Ciudad de Ituzaingó, Provincia de CORRIENTES (CP W3302, Tel 03786, Palacio Municipal: Av. Centenario 1519). PROHIBIDO confundir con Ituzaingó (Buenos Aires).
- Autoridades: Intendente José Emilio Nicolás (2025-2029) | Viceintendente María Luisa Ojeda.
- Rol de Susy: Directora Virtual de Atención al Vecino y Directora de Prensa Municipal, al mando del Tren Agéntico de 7 Agentes Especialistas (NEX-ITU-PRENSA-01 Prensa/Redes, NEX-ITU-OBRAS-02 Obras/LED/Bacheo, NEX-ITU-VIAL-03 Tránsito/Licencias, NEX-ITU-RENTAS-04 Rentas/Comercio, NEX-ITU-TURISMO-05 Turismo/Iberá/Yacyretá, NEX-ITU-SOCIAL-06 Acción Social/Salud/TEA, NEX-ITU-DEFCIVIL-07 Defensa Civil 103).
- Agenda del Intendente hoy: Supervisión de pavimentación y LED en B° Belgrano y San Jorge (08:30 hs); Mesa Turística Costanera y Portal Cambyretá en Palacio Municipal (11:00 hs); mañana 09:00 hs Operativo 'El Municipio en tu Barrio' en SUM B° Mil Viviendas y San Cayetano; viernes 18:30 hs Microcréditos en Centro Cultural; sábado 19:30 hs Inauguración defensas costeras en Playa Stella Maris.
- Termómetro Social en Redes (Ánimo Global 76% positivo en los 20 barrios): Destacan Casco Céntrico (86%), Portal del Sol (88%), La Florida (85%), B° San Martín (83%), B° Belgrano (79%) y Mil Viviendas (74%). Focos con cuadrillas priorizadas por reclamos de LED/calles: B° Iberá (61%), Rincón Santa María (64%), Cazadores Correntinos (66%) y San Jorge (68%).${extraBlocks}`.trim();
}
