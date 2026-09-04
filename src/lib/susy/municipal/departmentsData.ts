/**
 * ==============================================================================
 * 🏛️ SUSY BOT - CATÁLOGO DE SECRETARÍAS, OFICINAS Y EVENTOS MUNICIPALES
 * Ubicación: src/lib/susy/municipal/departmentsData.ts
 * Municipio de Ituzaingó, Corrientes.
 * 100% Soberano, Abierto y Georreferenciado a Costo Cero (OpenStreetMap)
 * ==============================================================================
 */

export interface MunicipalEvent {
  id: string;
  title: string;
  category: string;
  dateStr: string;
  timeStr: string;
  locationName: string;
  address: string;
  coordinates: [number, number]; // [lat, lng]
  description: string;
  admission: "Gratuito" | "Con Inscripción" | "Arancelado";
  linkUrl?: string;
}


export interface MunicipalCommerce {
  id: string;
  name: string;
  category: "gastronomia" | "hoteleria" | "supermercado" | "indumentaria" | "servicios" | "construccion" | "salud";
  categoryLabel: string;
  address: string;
  coordinates: [number, number]; // [lat, lng] Ituzaingó
  schedule: string;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  habilitacionNumero: string;
  adheridoPromocion: boolean;
  descripcion: string;
  logoEmoji: string;
}

export interface MunicipalDepartment {
  id: string;
  name: string;
  shortName: string;
  icon: string; // Emoji representativo
  category: "gobierno" | "servicios" | "desarrollo" | "comunidad";
  leadTitle: string; // Titular o Responsable
  shortDesc: string;
  fullDesc: string;
  address: string;
  coordinates: [number, number]; // [lat, lng] Ituzaingó
  phone: string;
  whatsapp?: string;
  email: string;
  schedule: string;
  services: string[];
  events: MunicipalEvent[];
  quickPrompt: string;
}

export const MUNICIPAL_DEPARTMENTS: MunicipalDepartment[] = [
  {
    id: "comercio",
    name: "Dirección de Comercio, Industria y Habilitaciones",
    shortName: "Comercio & Pymes",
    icon: "🏪",
    category: "desarrollo",
    leadTitle: "Dirección de Comercio e Industria Municipal",
    shortDesc: "Guía comercial oficial, habilitaciones y promoción local",
    fullDesc: "Área encargada de habilitaciones comerciales e industriales, fiscalización y la Guía Comercial Oficial de Ituzaingó. Conecta a los comercios adheridos con vecinos y miles de turistas, difundiendo sus redes sociales y horarios de atención.",
    address: "Av. Centenario 1519 (Palacio Municipal)",
    coordinates: [-27.5843, -56.6836],
    phone: "(03786) 420090 int. 110",
    whatsapp: "5493786416610",
    email: "comercio@ituzaingo.gob.ar",
    schedule: "Lunes a Viernes de 7:00 a 13:00 hs",
    services: [
      "Guía Comercial Oficial Municipal con difusión gratuita para comercios habilitados",
      "Trámite express de Habilitaciones Comerciales provisorias y definitivas",
      "Inspecciones de bromatología, seguridad e higiene comercial",
      "Beneficios impositivos y promociones para comercios con tasa al día"
    ],
    events: [
      {
        id: "com-01",
        title: "Ronda de Negocios y Promoción Comercial 'Compre en Ituzaingó'",
        category: "Comercio",
        dateStr: "Próximo Miércoles",
        timeStr: "19:00 hs",
        locationName: "Centro Cultural Ituzaingó",
        address: "Corrientes y Belgrano",
        coordinates: [-27.5852, -56.6821],
        description: "Encuentro de comerciantes locales para articular promociones de temporada turística, cuotas y difusión en Susy Bot.",
        admission: "Gratuito"
      }
    ],
    quickPrompt: "Hola Susy, mostrame la Guía Comercial Oficial de Ituzaingó con los comercios habilitados, horarios de atención y redes sociales."
  },

  {
    id: "informatica",
    name: "Dirección de Informática y Modernización",
    shortName: "Informática & Tech",
    icon: "💻",
    category: "gobierno",
    leadTitle: "Dirección de Tecnologías de la Información",
    shortDesc: "Transformación digital, kioscos QR y conectividad",
    fullDesc: "Área técnica encargada de la soberanía tecnológica municipal, la red de fibra y Wi-Fi público en plazas, la plataforma ciudadana Susy Bot y la asistencia digital a vecinos y comerciantes.",
    address: "Av. Centenario 1519 (Palacio Municipal)",
    coordinates: [-27.5843, -56.6836],
    phone: "(03786) 420090 int. 115",
    whatsapp: "5493786416610",
    email: "modernizacion@ituzaingo.gob.ar",
    schedule: "Lunes a Viernes de 7:00 a 13:00 hs",
    services: [
      "Soporte y asesoramiento para trámites digitales municipales",
      "Puntos de Conectividad y Wi-Fi Libre en plazas y costanera",
      "Validación de firmas digitales y trámites web",
      "Atención técnica ciudadana de Susy Bot Kioscos"
    ],
    events: [
      {
        id: "inf-01",
        title: "Taller de Inclusión Digital y Trámites para Adultos Mayores",
        category: "Capacitación",
        dateStr: "Viernes Próximo",
        timeStr: "09:30 hs",
        locationName: "Centro Cultural Ituzaingó",
        address: "Corrientes y Belgrano",
        coordinates: [-27.5852, -56.6821],
        description: "Aprende a usar Susy Bot, consultar farmacias de turno, descargar tasas y solicitar turnos sin intermediarios.",
        admission: "Gratuito"
      }
    ],
    quickPrompt: "Hola Susy, contame sobre los servicios de la Dirección de Informática y Modernización, puntos de Wi-Fi y soporte tecnológico."
  },
  {
    id: "cultura",
    name: "Secretaría de Cultura",
    shortName: "Cultura & Arte",
    icon: "🎭",
    category: "comunidad",
    leadTitle: "Secretaría de Cultura Municipal",
    shortDesc: "Talleres, patrimonio histórico, corsos y festivales",
    fullDesc: "Impulsa la identidad correntina, la música litoraleña, las artes escénicas, las bibliotecas públicas y la coordinación del Carnaval y fiestas populares de Ituzaingó.",
    address: "Corrientes y Belgrano (Centro Cultural)",
    coordinates: [-27.5852, -56.6821],
    phone: "(03786) 420210",
    whatsapp: "5493786414346",
    email: "cultura@ituzaingo.gob.ar",
    schedule: "Lunes a Viernes de 8:00 a 12:00 y 16:00 a 20:00 hs",
    services: [
      "Inscripción a talleres municipales gratuitos (música, danza, teatro, pintura)",
      "Uso de salas de exposiciones y auditorio del Centro Cultural",
      "Registro de artistas, artesanos y ballets locales",
      "Organización del Carnaval de Ituzaingó y festivales patrios"
    ],
    events: [
      {
        id: "cul-01",
        title: "Encuentro de Chamamé y Feria de Artesanos en la Costanera",
        category: "Festival",
        dateStr: "Sábado y Domingo",
        timeStr: "18:00 a 23:00 hs",
        locationName: "Paseo de los Pescadores - Costanera",
        address: "Av. Costanera y Playa Stella Maris",
        coordinates: [-27.5790, -56.6875],
        description: "Música litoraleña en vivo, ballets locales y feria gastronómica tradicional frente al río Paraná.",
        admission: "Gratuito"
      }
    ],
    quickPrompt: "Hola Susy, informame sobre los talleres de la Secretaría de Cultura y los eventos artísticos de este fin de semana en Ituzaingó."
  },
  {
    id: "turismo",
    name: "Secretaría de Turismo",
    shortName: "Turismo & Iberá",
    icon: "🏖️",
    category: "desarrollo",
    leadTitle: "Secretaría de Turismo de Ituzaingó",
    shortDesc: "Playas, Portal Cambyretá (Iberá), Yacyretá y paseos náuticos",
    fullDesc: "Brinda hospitalidad de vanguardia a los visitantes, fiscaliza alojamientos habilitados, coordina el turismo ecológico en los Esteros del Iberá y actividades en las playas fluviales de Ituzaingó.",
    address: "Av. Centenario 2140 / Centro de Informes Costanera",
    coordinates: [-27.5795, -56.6872],
    phone: "+54 3786 51-9090",
    whatsapp: "5493786519090",
    email: "turismo@ituzaingo.gob.ar",
    schedule: "Lunes a Domingos de 7:00 a 21:00 hs (Horario Corrido)",
    services: [
      "Información sobre excursiones al Portal Cambyretá (Esteros del Iberá)",
      "Coordinación de visitas guiadas gratuitas a la Represa Hidroeléctrica Yacyretá",
      "Guía de prestadores náuticos, pesca deportiva y guardavidas en playas",
      "Registro oficial de cabañas, hoteles y campings habilitados"
    ],
    events: [
      {
        id: "tur-01",
        title: "Salida Guiada de Avistaje de Aves y Safaris en Portal Cambyretá",
        category: "Ecoturismo",
        dateStr: "Todos los Sábados",
        timeStr: "08:00 hs",
        locationName: "Ingreso Portal Cambyretá - Esteros del Iberá",
        address: "Ruta Nacional 12, km 1230",
        coordinates: [-27.7600, -56.8800],
        description: "Recorrido interpretativo por pastizales y lagunas del Iberá observando carpinchos, yacarés y aves amenazadas.",
        admission: "Con Inscripción"
      }
    ],
    quickPrompt: "Hola Susy, contame sobre los paseos turísticos, playas y salidas guiadas a los Esteros del Iberá coordinadas por la Secretaría de Turismo."
  },
  {
    id: "trabajo",
    name: "Oficina de Empleo, Trabajo y Producción",
    shortName: "Empleo & Producción",
    icon: "💼",
    category: "desarrollo",
    leadTitle: "Coordinación de Empleo y Desarrollo Productivo",
    shortDesc: "Bolsa de trabajo, oficios, ferias francas y microcréditos",
    fullDesc: "Conecta a los trabajadores locales con empresas e industrias de la región, fomenta el cooperativismo, microemprendimientos y la producción hortícola y pesquera sustentable.",
    address: "Av. Centenario 1519 (Palacio Municipal)",
    coordinates: [-27.5843, -56.6836],
    phone: "(03786) 420090 int. 112",
    whatsapp: "5493786416610",
    email: "empleo@ituzaingo.gob.ar",
    schedule: "Lunes a Viernes de 7:00 a 13:00 hs",
    services: [
      "Carga de Curriculum Vitae en la Bolsa Municipal de Empleo",
      "Cursos de formación profesional y oficios con certificación",
      "Asesoramiento para microemprendedores y Registro de Feriantes",
      "Programas de inserción laboral joven y pasantías"
    ],
    events: [
      {
        id: "tra-01",
        title: "Feria Franca Municipal de Productores Locales",
        category: "Economía Social",
        dateStr: "Miércoles y Sábados",
        timeStr: "07:30 a 12:30 hs",
        locationName: "Plaza San Martín",
        address: "Av. Centenario y Buenos Aires",
        coordinates: [-27.5840, -56.6830],
        description: "Venta directa de verduras frescas, panificados, miel de monte y artesanías a precios justos.",
        admission: "Gratuito"
      }
    ],
    quickPrompt: "Hola Susy, quisiera consultar sobre la Bolsa de Empleo Municipal, cursos de oficios disponibles y cómo registrar mi CV."
  },
  {
    id: "obras",
    name: "Secretaría de Obras y Servicios Públicos",
    shortName: "Obras Públicas",
    icon: "🚜",
    category: "servicios",
    leadTitle: "Secretaría de Obras y Servicios Públicos",
    shortDesc: "Bacheo, alumbrado, recolección, desagües y obras viales",
    fullDesc: "Responsable del mantenimiento de calles, redes de alumbrado público, limpieza urbana, erradicación de microbasurales, poda y ejecución de obras de infraestructura barrial.",
    address: "Posadas y Corrientes (Corralón / Obrador Municipal)",
    coordinates: [-27.5880, -56.6790],
    phone: "(03786) 420045",
    whatsapp: "5493786415050",
    email: "obraspublicas@ituzaingo.gob.ar",
    schedule: "Lunes a Viernes de 6:30 a 13:00 hs (Guardia de Alumbrado 24 hs)",
    services: [
      "Atención y reparación de alumbrado público y luminarias LED",
      "Cuadrillas de bacheo, enripiado y perfilado de calzadas",
      "Cronograma de recolección de ramas, pasto y escombros",
      "Mantenimiento de zanjas y desagües pluviales"
    ],
    events: [
      {
        id: "obr-01",
        title: "Operativo Barrial 'Ituzaingó Limpio' - Barrio Belgrano y San Jorge",
        category: "Operativo",
        dateStr: "Lunes a Jueves",
        timeStr: "07:00 a 13:00 hs",
        locationName: "Barrio Belgrano",
        address: "Av. Belgrano y Calle 12",
        coordinates: [-27.5890, -56.6750],
        description: "Descacharrado, poda preventiva, nivelación de calles y recambio de luminarias de sodio por tecnología LED.",
        admission: "Gratuito"
      }
    ],
    quickPrompt: "Hola Susy, necesito reportar un reclamo vecinal de alumbrado público / bacheo o consultar el cronograma de Obras Públicas."
  },
  {
    id: "accion_social",
    name: "Secretaría de Acción Social y Desarrollo Humano",
    shortName: "Acción Social",
    icon: "🤝",
    category: "comunidad",
    leadTitle: "Secretaría de Acción Social",
    shortDesc: "Asistencia directa, CUD, adultos mayores y programas familiares",
    fullDesc: "Acompaña a las familias en situación de vulnerabilidad, gestiona pensiones no contributivas, el Certificado Único de Discapacidad (CUD), áreas de niñez, género y comedores comunitarios.",
    address: "Belgrano y San Martín",
    coordinates: [-27.5858, -56.6815],
    phone: "(03786) 420080",
    whatsapp: "5493786417720",
    email: "accionsocial@ituzaingo.gob.ar",
    schedule: "Lunes a Viernes de 7:00 a 13:00 hs",
    services: [
      "Tramitación y asesoramiento del Certificado Único de Discapacidad (CUD)",
      "Asistencia alimentaria y social de emergencia",
      "Programas para adultos mayores y centros de día",
      "Área de Mujer, Género y Diversidad con asistencia legal y psicológica"
    ],
    events: [
      {
        id: "soc-01",
        title: "Junta Evaluadora de Discapacidad Itinerante (CUD)",
        category: "Trámite de Salud",
        dateStr: "Próximo Martes",
        timeStr: "08:00 a 12:00 hs",
        locationName: "Sede de Acción Social",
        address: "Belgrano y San Martín",
        coordinates: [-27.5858, -56.6815],
        description: "Evaluación médica y social interdisciplinaria para emisión y renovación del CUD sin tener que viajar a la capital.",
        admission: "Gratuito"
      }
    ],
    quickPrompt: "Hola Susy, necesito orientación sobre cómo tramitar el Certificado Único de Discapacidad (CUD) o solicitar asistencia en Acción Social."
  },
  {
    id: "educacion",
    name: "Dirección de Educación y Formación",
    shortName: "Educación",
    icon: "🎓",
    category: "comunidad",
    leadTitle: "Dirección de Educación Municipal",
    shortDesc: "Becas estudiantiles, apoyo escolar y convenios universitarios",
    fullDesc: "Coordina los centros de desarrollo infantil (CDI), puntos de apoyo pedagógico escolar, becas de transporte para estudiantes y extensiones áulicas de formación terciaria y universitaria.",
    address: "Av. Centenario 1519 (Palacio Municipal)",
    coordinates: [-27.5843, -56.6836],
    phone: "(03786) 420090 int. 118",
    email: "educacion@ituzaingo.gob.ar",
    schedule: "Lunes a Viernes de 7:30 a 13:00 hs",
    services: [
      "Inscripción al Programa de Becas Municipales Estudiantiles",
      "Centros de Apoyo Escolar Primario y Secundario en barrios",
      "Información sobre carreras y tecnicaturas a distancia (UNNE, UTN)",
      "Centros de Desarrollo Infantil (guarderías municipales de primera infancia)"
    ],
    events: [
      {
        id: "edu-01",
        title: "Expo Vocacional y Universitaria Ituzaingó 2026",
        category: "Educación",
        dateStr: "Viernes 18 de Septiembre",
        timeStr: "09:00 a 17:00 hs",
        locationName: "Polideportivo Municipal San Juan Bautista",
        address: "Calle 7 y Buenos Aires",
        coordinates: [-27.5895, -56.6810],
        description: "Oferta académica completa de universidades, institutos terciarios y centros de formación profesional de la región.",
        admission: "Gratuito"
      }
    ],
    quickPrompt: "Hola Susy, informame sobre el programa de becas estudiantiles municipales y carreras universitarias disponibles en Ituzaingó."
  },
  {
    id: "transito",
    name: "Dirección de Tránsito y Seguridad Vial",
    shortName: "Tránsito & Licencias",
    icon: "🚗",
    category: "servicios",
    leadTitle: "Dirección de Tránsito y Transporte",
    shortDesc: "Emisión de licencias de conducir, educación vial e inspección",
    fullDesc: "Responsable de la seguridad vial urbana, señalización, semaforización, inspección de transporte público y emisión/renovación de la Licencia Nacional de Conducir (CENAT).",
    address: "Av. Centenario y Belgrano",
    coordinates: [-27.5847, -56.6829],
    phone: "(03786) 420040",
    whatsapp: "5493786418830",
    email: "transito@ituzaingo.gob.ar",
    schedule: "Lunes a Viernes de 7:00 a 13:00 hs",
    services: [
      "Emisión y renovación de Licencia Nacional de Conducir",
      "Exámenes médicos, psicofísicos y pruebas prácticas de manejo",
      "Libre deuda de infracciones de tránsito",
      "Habilitación de taxis, remises y transporte escolar"
    ],
    events: [
      {
        id: "tra-01",
        title: "Jornada de Educación Vial y Casco Seguro para Motociclistas",
        category: "Seguridad Vial",
        dateStr: "Miércoles",
        timeStr: "10:00 hs",
        locationName: "Pista de Exámenes de Tránsito",
        address: "Av. Centenario y Belgrano",
        coordinates: [-27.5847, -56.6829],
        description: "Taller práctico de conducción defensiva y canje/entrega de cascos reglamentarios homologados.",
        admission: "Con Inscripción"
      }
    ],
    quickPrompt: "Hola Susy, quisiera consultar los requisitos, costos y solicitar un turno para renovar mi carnet de conducir en Tránsito."
  },
  {
    id: "juventud",
    name: "Dirección de Juventud",
    shortName: "Juventud & Deportes",
    icon: "⚡",
    category: "comunidad",
    leadTitle: "Dirección de Juventud Municipal",
    shortDesc: "Espacio Joven, torneos de esports, música y voluntariado",
    fullDesc: "Espacio de participación activa para jóvenes de 15 a 30 años, coordinando actividades deportivas, torneos de gaming/esports, talleres de liderazgo, orientación laboral y festejos estudiantiles.",
    address: "Polideportivo Municipal San Juan Bautista",
    coordinates: [-27.5895, -56.6810],
    phone: "(03786) 420090 int. 120",
    whatsapp: "5493786419940",
    email: "juventud@ituzaingo.gob.ar",
    schedule: "Lunes a Viernes de 8:00 a 12:00 y 16:00 a 21:00 hs",
    services: [
      "Espacio Joven con computadoras para estudio y conexión a internet",
      "Organización de la Estudiantina y Semana de la Juventud",
      "Talleres de streaming, creación de contenido y programación",
      "Torneos municipales de fútbol, básquet, vóley y esports"
    ],
    events: [
      {
        id: "juv-01",
        title: "Torneo Municipal Juvenil de Fútbol 5 y Básquet 3x3",
        category: "Deporte",
        dateStr: "Viernes y Sábado",
        timeStr: "17:00 hs",
        locationName: "Polideportivo San Juan Bautista",
        address: "Calle 7 y Buenos Aires",
        coordinates: [-27.5895, -56.6810],
        description: "Competencia barrial juvenil con trofeos, música y clínicas de iniciación deportiva.",
        admission: "Gratuito"
      }
    ],
    quickPrompt: "Hola Susy, contame qué actividades, talleres o torneos tiene la Dirección de Juventud en el Espacio Joven y Polideportivo."
  },
  {
    id: "prensa",
    name: "Dirección de Prensa y Comunicación Institucional",
    shortName: "Prensa & Noticias",
    icon: "📰",
    category: "gobierno",
    leadTitle: "Dirección de Prensa y Difusión Oficial",
    shortDesc: "Gacetillas oficiales, boletín municipal y noticias",
    fullDesc: "Canal oficial de información del Intendente y el Gabinete Municipal. Redacta comunicados, coordina ruedas de prensa con periodistas y mantiene informada a la ciudadanía a través de medios digitales y radiales.",
    address: "Av. Centenario 1519 (Palacio Municipal)",
    coordinates: [-27.5843, -56.6836],
    phone: "(03786) 420780",
    email: "prensa@ituzaingo.gob.ar",
    schedule: "Lunes a Viernes de 7:00 a 13:00 y 17:00 a 21:00 hs",
    services: [
      "Emisión y difusión de Gacetillas de Prensa Oficiales",
      "Acreditación de medios periodísticos locales y provinciales",
      "Publicación del Boletín Oficial Municipal",
      "Transmisiones en vivo de actos institucionales y conferencias"
    ],
    events: [
      {
        id: "pre-01",
        title: "Conferencia de Prensa Oficial: Lanzamiento de Temporada Turística",
        category: "Prensa",
        dateStr: "Próximo Jueves",
        timeStr: "10:30 hs",
        locationName: "Salón Auditorio del Palacio Municipal",
        address: "Av. Centenario 1519",
        coordinates: [-27.5843, -56.6836],
        description: "Presentación del calendario de eventos estivales, seguridad en playas y obras públicas para la ciudad.",
        admission: "Con Acreditación"
      }
    ],
    quickPrompt: "Hola Susy, mostrame las últimas gacetillas de prensa y comunicados oficiales publicados por el Municipio de Ituzaingó."
  },
  {
    id: "salud",
    name: "Secretaría de Salud y Prevención",
    shortName: "Salud & Farmacias",
    icon: "🏥",
    category: "servicios",
    leadTitle: "Secretaría de Salud Pública",
    shortDesc: "Hospital Billinghurst 107, Farmacias de Turno 24hs y CAPS",
    fullDesc: "Coordina la red de Centros de Atención Primaria de la Salud (CAPS), la articulación con el Hospital Cabecera Dr. Ricardo Billinghurst, las campañas de vacunación comunitaria y el cronograma de farmacias de guardia.",
    address: "Corrientes 1550 (Hospital) / Sede de Salud Municipal",
    coordinates: [-27.5861, -56.6812],
    phone: "Emergencias: 107 / Guardia: (03786) 420032",
    whatsapp: "5493786420032",
    email: "salud@ituzaingo.gob.ar",
    schedule: "Guardia Médica 24 hs los 365 días • CAPS: Lunes a Viernes de 7:00 a 19:00 hs",
    services: [
      "Guardia de emergencias médicas de adultos y pediatría 24 hs (Línea 107)",
      "Farmacias de turno rotativas 24 hs (Farmar, Del Pueblo, Ituzaingó, San Cayetano)",
      "Vacunación obligatoria de calendario en CAPS barriales",
      "Controles odontológicos, clínicos y ginecológicos en salitas"
    ],
    events: [
      {
        id: "sal-01",
        title: "Campaña Barrial de Vacunación Antigripal y Control de Presión",
        category: "Salud Comunitaria",
        dateStr: "Lunes a Viernes",
        timeStr: "08:00 a 12:30 hs",
        locationName: "CAPS Barrio San Jorge",
        address: "Calle 3 y Esquina Las Heras",
        coordinates: [-27.5890, -56.6870],
        description: "Atención médica gratuita, control de glucemia, vacunación de calendario y entrega de botiquines.",
        admission: "Gratuito"
      }
    ],
    quickPrompt: "Hola Susy, informame qué farmacia está de turno hoy en Ituzaingó, teléfonos de guardia del Hospital 107 y salitas CAPS."
  },
  {
    id: "hacienda",
    name: "Secretaría de Hacienda, Finanzas y Rentas",
    shortName: "Hacienda & Rentas",
    icon: "🏛️",
    category: "gobierno",
    leadTitle: "Secretaría de Hacienda y Finanzas",
    shortDesc: "Tasas municipales, patentes, libre deuda y habilitaciones",
    fullDesc: "Administra el presupuesto municipal, la liquidación de Tasas por Servicios a la Propiedad, patentes de automotores y motovehículos, planes de regularización fiscal y habilitaciones de comercios.",
    address: "Av. Centenario 1519 (Palacio Municipal - Esquina Bernardino Valle)",
    coordinates: [-27.5843, -56.6836],
    phone: "(03786) 420780 / 420090 int. 108",
    whatsapp: "5493786416610",
    email: "contribuyentes@ituzaingo.gob.ar",
    schedule: "Lunes a Viernes de 7:00 a 13:00 hs",
    services: [
      "Emisión y pago de boletas de Tasas Inmobiliarias y Alumbrado",
      "Radicación, liquidación y bajas de patentes de automotores y motos",
      "Emisión de Certificados de Libre Deuda Fiscal",
      "Habilitaciones comerciales, bromatológicas e industriales"
    ],
    events: [
      {
        id: "hac-01",
        title: "Plan de Regularización de Tasas 'Vecino Al Día' con Descuentos",
        category: "Fiscal",
        dateStr: "Vigente todo el mes",
        timeStr: "07:00 a 13:00 hs",
        locationName: "Cajas del Palacio Municipal",
        address: "Av. Centenario 1519",
        coordinates: [-27.5843, -56.6836],
        description: "Descuento del 20% por pago anual anticipado y planes de hasta 12 cuotas sin interés para contribuyentes.",
        admission: "Gratuito"
      }
    ],
    quickPrompt: "Hola Susy, cómo puedo consultar mi estado de deuda de tasas municipales, patentes o solicitar un plan de pago."
  }
];

export function getDepartmentById(id: string): MunicipalDepartment | undefined {
  return MUNICIPAL_DEPARTMENTS.find((d) => d.id === id);
}

export function getAllMunicipalEvents(): MunicipalEvent[] {
  return MUNICIPAL_DEPARTMENTS.flatMap((d) => d.events);
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} metros`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}

export function getOsmDirectionsUrl(lat: number, lng: number, userLat?: number, userLng?: number): string {
  if (userLat && userLng) {
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLat}%2C${userLng}%3B${lat}%2C${lng}`;
  }
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

export function getUniversalGpsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}


export const MUNICIPAL_COMMERCE_LIST: MunicipalCommerce[] = [
  {
    id: "com-01",
    name: "Restaurante y Parrilla El Pescador",
    category: "gastronomia",
    categoryLabel: "Gastronomía & Pescados de Río",
    address: "Av. Costanera y Buenos Aires",
    coordinates: [-27.5792, -56.6865],
    schedule: "Martes a Domingos de 11:30 a 15:30 y 20:00 a 01:00 hs",
    phone: "(03786) 421050",
    whatsapp: "5493786421050",
    instagram: "elpescadorituzaingo",
    facebook: "ParrillaElPescadorItuzaingo",
    habilitacionNumero: "HAB-ITU-2024-819",
    adheridoPromocion: true,
    descripcion: "Especialidad en surubí, dorado a la parrilla, pacú y empanadas de pescado tradicionales frente al río Paraná.",
    logoEmoji: "🐟"
  },
  {
    id: "com-02",
    name: "Hotel & Cabañas Portal del Sol",
    category: "hoteleria",
    categoryLabel: "Hotelería & Alojamiento",
    address: "Av. Centenario 2850",
    coordinates: [-27.5810, -56.6890],
    schedule: "Recepción 24 hs los 365 días",
    phone: "(03786) 420340",
    whatsapp: "5493786420340",
    instagram: "portaldelsolituzaingo",
    website: "https://portaldelsol.ituzaingo.ar",
    habilitacionNumero: "HAB-ITU-2023-412",
    adheridoPromocion: true,
    descripcion: "Habitaciones climatizadas, piscina, parque arbolado y desayuno regional incluido a metros de las playas.",
    logoEmoji: "🏨"
  },
  {
    id: "com-03",
    name: "Supermercado El Puente",
    category: "supermercado",
    categoryLabel: "Supermercados & Alimentos",
    address: "Av. 9 de Julio y Corrientes",
    coordinates: [-27.5835, -56.6810],
    schedule: "Lunes a Sábados de 08:00 a 13:00 y 16:30 a 21:00 hs",
    phone: "(03786) 420180",
    whatsapp: "5493786420180",
    facebook: "SupermercadoElPuenteItu",
    habilitacionNumero: "HAB-ITU-2022-105",
    adheridoPromocion: true,
    descripcion: "Carnicería de primera calidad, panadería propia, frutas seleccionadas y todos los medios de pago.",
    logoEmoji: "🛒"
  },
  {
    id: "com-04",
    name: "Ferretería y Corralón Ituzaingó",
    category: "construccion",
    categoryLabel: "Ferretería & Construcción",
    address: "Av. Centenario 1750",
    coordinates: [-27.5845, -56.6825],
    schedule: "Lunes a Viernes de 07:30 a 12:30 y 15:30 a 19:30 hs • Sábados de 08:00 a 13:00 hs",
    phone: "(03786) 420450",
    whatsapp: "5493786420450",
    instagram: "ferreteriaituzaingo",
    habilitacionNumero: "HAB-ITU-2021-998",
    adheridoPromocion: true,
    descripcion: "Materiales eléctricos, plomería, pinturas, herramientas y entregas a domicilio en todos los barrios.",
    logoEmoji: "🔨"
  },
  {
    id: "com-05",
    name: "Heladería y Cafetería Colonial",
    category: "gastronomia",
    categoryLabel: "Helados Artesanales & Café",
    address: "Peatonal Centenario y Belgrano",
    coordinates: [-27.5842, -56.6832],
    schedule: "Todos los días de 09:00 a 02:00 hs",
    phone: "(03786) 420990",
    whatsapp: "5493786420990",
    instagram: "heladoscolonial.itu",
    habilitacionNumero: "HAB-ITU-2024-301",
    adheridoPromocion: true,
    descripcion: "Helados artesanales premiados, café de especialidad, medialunas caseras y waffles en pleno centro.",
    logoEmoji: "🍦"
  },
  {
    id: "com-06",
    name: "Farmacia y Perfumería Del Pueblo",
    category: "salud",
    categoryLabel: "Farmacia & Perfumería",
    address: "Av. Centenario y Belgrano",
    coordinates: [-27.5846, -56.6828],
    schedule: "Lunes a Sábados de 08:00 a 22:00 hs (Guardia 24hs según cronograma)",
    phone: "(03786) 420310",
    whatsapp: "5493786420310",
    facebook: "FarmaciaDelPuebloItuzaingo",
    habilitacionNumero: "HAB-ITU-2020-055",
    adheridoPromocion: true,
    descripcion: "Medicamentos de todas las obras sociales, atención farmacéutica profesional, dermocosmética y perfumería.",
    logoEmoji: "💊"
  },
  {
    id: "com-07",
    name: "Boutique y Moda Iguazú",
    category: "indumentaria",
    categoryLabel: "Indumentaria & Calzado",
    address: "Calle Buenos Aires 1120",
    coordinates: [-27.5848, -56.6840],
    schedule: "Lunes a Sábados de 08:30 a 12:30 y 17:00 a 21:00 hs",
    phone: "(03786) 421220",
    whatsapp: "5493786421220",
    instagram: "boutiqueiguazu.itu",
    habilitacionNumero: "HAB-ITU-2023-670",
    adheridoPromocion: true,
    descripcion: "Ropa informal, trajes de baño de temporada, calzados y accesorios para toda la familia.",
    logoEmoji: "👗"
  }
];

export function getAllMunicipalCommerce(): MunicipalCommerce[] {
  return MUNICIPAL_COMMERCE_LIST;
}

