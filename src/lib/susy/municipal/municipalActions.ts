/**
 * ==============================================================================
 * 🏛️ SUSY BOT - MÓDULO TRANSACCIONAL DE GESTIÓN MUNICIPAL
 * Ubicación: src/lib/susy/municipal/municipalActions.ts
 * Emisión de Turnos, Permisos Provisorios con QR y Gacetillas de Prensa
 * 100% Código Abierto • Cero Costo • Validable y Autónomo
 * ==============================================================================
 */

export interface MunicipalTurno {
  id: string; // #TURNO-ITU-2026-XXXX
  departmentId: string;
  departmentName: string;
  citizenName: string;
  citizenDni: string;
  citizenPhone: string;
  procedureType: string;
  dateStr: string;
  timeSlot: string;
  requirements: string[];
  status: "confirmado" | "atendido" | "cancelado";
  createdAt: string;
}

export type TipoPermisoProvisorio =
  | "poda_ramas"
  | "carga_descarga"
  | "libre_deuda_tramite"
  | "uso_espacio_publico"
  | "habilitacion_provisoria";

export interface PermisoProvisorio {
  id: string; // #PERM-ITU-2026-XXXX
  tipo: TipoPermisoProvisorio;
  titulo: string;
  titularNombre: string;
  titularDni: string;
  titularDomicilio: string;
  titularTelefono: string;
  motivoDetalle: string;
  fechaEmision: string;
  fechaVencimiento: string;
  validezHoras: number;
  qrVerificationToken: string;
  estado: "activo" | "vencido" | "revocado";
  condiciones: string[];
}

export interface GacetillaPrensa {
  id: string; // #GACETILLA-ITU-2026-XXXX
  titulo: string;
  bajada: string;
  categoria: "Institucional" | "Obras" | "Turismo" | "Salud" | "Cultura" | "Comunidad";
  fecha: string;
  cuerpo: string;
  voceroCita?: string;
  contactoPrensa: string;
  publicado: boolean;
  destacado?: boolean;
}

// Semillas iniciales de gacetillas oficiales
const INITIAL_GACETILLAS: GacetillaPrensa[] = [
  {
    id: "GAC-ITU-2026-001",
    titulo: "La Municipalidad de Ituzaingó amplía el corredor costero y optimiza servicios turísticos",
    bajada: "Se habilitan nuevos accesos peatonales seguros y bajadas con señalética inclusiva en Playa Stella Maris.",
    categoria: "Turismo",
    fecha: "Hoy, 10:00 hs",
    cuerpo: "En el marco del plan de fortalecimiento de la infraestructura ribereña, el Municipio de Ituzaingó concluyó las tareas de adecuación de paseos costeros, luminarias solares y puestos de guardavidas. Los trabajos coordinados por Obras Públicas y Turismo buscan garantizar una temporada segura y accesible para vecinos y turistas de todo el país.",
    voceroCita: "'Cada metro de costanera mejorado representa más trabajo, turismo sustentable y orgullo para los ituzaingueños', destacaron las autoridades.",
    contactoPrensa: "prensa@ituzaingo.gob.ar • Tel: (03786) 420780",
    publicado: true,
    destacado: true
  },
  {
    id: "GAC-ITU-2026-002",
    titulo: "Avanza el operativo barrial 'Ituzaingó Limpio' con recolección diferenciada y descacharrado",
    bajada: "Cuadrillas municipales recorren los barrios Belgrano y San Jorge con tareas de poda preventiva y fumigación.",
    categoria: "Obras",
    fecha: "Ayer, 16:30 hs",
    cuerpo: "La Secretaría de Obras y Servicios Públicos, en articulación con Salud y Acción Social, continúa con el cronograma intensivo de saneamiento urbano. Se recuerda a los vecinos depositar ramas y restos de desmalezamiento en los horarios estipulados para agilizar la labor de las cuadrillas.",
    voceroCita: "'El compromiso vecinal es fundamental para mantener limpia y protegida nuestra ciudad', informaron desde Obras Públicas.",
    contactoPrensa: "obraspublicas@ituzaingo.gob.ar • Tel: (03786) 420045",
    publicado: true
  },
  {
    id: "GAC-ITU-2026-003",
    titulo: "Susy Bot suma emisión de turnos digitales y permisos provisorios con validación QR",
    bajada: "La Dirección de Informática y Modernización activa un sistema soberano para evitar filas y agilizar gestiones ciudadanas.",
    categoria: "Institucional",
    fecha: "Esta semana",
    cuerpo: "Con el objetivo de simplificar trámites administrativos que no requieren presencialidad extensa, el Municipio integró a su asistente virtual Susy Bot la emisión de turnos para licencias y rentas, además de permisos provisorios de poda y carga comercial con código QR verificable en calle por inspectores.",
    voceroCita: "'La tecnología debe estar al servicio directo del vecino, ahorrando tiempo y eliminando trabas burocráticas', remarcaron desde el área de Modernización.",
    contactoPrensa: "modernizacion@ituzaingo.gob.ar",
    publicado: true,
    destacado: true
  }
];

// Semillas iniciales de permisos provisorios demostrativos
const INITIAL_PERMISOS: PermisoProvisorio[] = [
  {
    id: "PERM-ITU-2026-104",
    tipo: "poda_ramas",
    titulo: "Permiso Provisorio de Poda y Depósito de Ramas en Vía Pública",
    titularNombre: "Carlos Alberto Gómez",
    titularDni: "28.450.119",
    titularDomicilio: "Av. Centenario 2340, Ituzaingó",
    titularTelefono: "3786-459011",
    motivoDetalle: "Poda correctiva de dos árboles que interfieren con cableado aéreo y desagüe pluvial.",
    fechaEmision: "04/09/2026 09:15 hs",
    fechaVencimiento: "07/09/2026 09:15 hs",
    validezHoras: 72,
    qrVerificationToken: "ITU-PODA-28450119-2026-A91X",
    estado: "activo",
    condiciones: [
      "Los restos de poda deben apilarse ordenadamente frente al domicilio sin obstruir la vereda peatonal ni cuneta pluvial.",
      "El retiro por parte de la cuadrilla municipal se realizará dentro del plazo de 72 horas.",
      "Queda prohibida la quema de ramas o restos vegetales en vía pública (Ord. Mun. 412/18)."
    ]
  }
];

// Semillas iniciales de turnos
const INITIAL_TURNOS: MunicipalTurno[] = [
  {
    id: "TURNO-ITU-2026-089",
    departmentId: "transito",
    departmentName: "Dirección de Tránsito y Seguridad Vial",
    citizenName: "Mariana Soledad Ramos",
    citizenDni: "34.120.884",
    citizenPhone: "3786-512030",
    procedureType: "Renovación Licencia de Conducir (Cat. B)",
    dateStr: "Lunes 07/09/2026",
    timeSlot: "08:30 hs",
    requirements: [
      "DNI original y fotocopia con domicilio en Ituzaingó",
      "Boleta de CENAT abonada previamente",
      "Licencia anterior o denuncia de extravío",
      "Libre deuda de tasas e infracciones de tránsito"
    ],
    status: "confirmado",
    createdAt: "04/09/2026 08:00 hs"
  }
];

// Almacenamiento en memoria con sincronización en localStorage (Navegador)
class MunicipalStore {
  private turnos: MunicipalTurno[] = [...INITIAL_TURNOS];
  private permisos: PermisoProvisorio[] = [...INITIAL_PERMISOS];
  private gacetillas: GacetillaPrensa[] = [...INITIAL_GACETILLAS];

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const savedTurnos = localStorage.getItem("susy_municipal_turnos");
      if (savedTurnos) this.turnos = JSON.parse(savedTurnos);

      const savedPermisos = localStorage.getItem("susy_municipal_permisos");
      if (savedPermisos) this.permisos = JSON.parse(savedPermisos);

      const savedGacetillas = localStorage.getItem("susy_municipal_gacetillas");
      if (savedGacetillas) this.gacetillas = JSON.parse(savedGacetillas);
    } catch (e) {
      console.warn("No se pudo cargar de localStorage:", e);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("susy_municipal_turnos", JSON.stringify(this.turnos));
      localStorage.setItem("susy_municipal_permisos", JSON.stringify(this.permisos));
      localStorage.setItem("susy_municipal_gacetillas", JSON.stringify(this.gacetillas));
    } catch (e) {
      console.warn("Error guardando en localStorage:", e);
    }
  }

  // Turnos
  public getTurnos(): MunicipalTurno[] {
    return [...this.turnos];
  }

  public addTurno(data: Omit<MunicipalTurno, "id" | "createdAt" | "status">): MunicipalTurno {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const id = `TURNO-ITU-2026-${randomSuffix}`;
    const newTurno: MunicipalTurno = {
      ...data,
      id,
      status: "confirmado",
      createdAt: new Date().toLocaleString("es-AR")
    };
    this.turnos.unshift(newTurno);
    this.saveToStorage();
    return newTurno;
  }

  // Permisos Provisorios
  public getPermisos(): PermisoProvisorio[] {
    return [...this.permisos];
  }

  public addPermiso(data: {
    tipo: TipoPermisoProvisorio;
    titularNombre: string;
    titularDni: string;
    titularDomicilio: string;
    titularTelefono: string;
    motivoDetalle: string;
    validezHoras?: number;
  }): PermisoProvisorio {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const id = `PERM-ITU-2026-${randomSuffix}`;
    const horas = data.validezHoras || 72;
    const now = new Date();
    const vencimiento = new Date(now.getTime() + horas * 60 * 60 * 1000);

    const titulosMap: Record<TipoPermisoProvisorio, string> = {
      poda_ramas: "Permiso Provisorio de Poda y Depósito de Ramas en Vía Pública",
      carga_descarga: "Permiso Transitorio de Carga, Descarga y Mudanza Urbana",
      libre_deuda_tramite: "Constancia Provisoria de Libre Deuda en Trámite Administrativo",
      uso_espacio_publico: "Permiso Provisorio de Uso Comunitario de Espacio Verde",
      habilitacion_provisoria: "Constancia Provisoria de Actividad Comercial Iniciada"
    };

    const condicionesMap: Record<TipoPermisoProvisorio, string[]> = {
      poda_ramas: [
        "Los restos de poda deben apilarse ordenadamente frente al domicilio sin obstruir la vereda peatonal ni cuneta pluvial.",
        "El retiro por parte de la cuadrilla municipal se realizará dentro del plazo de 72 horas.",
        "Queda prohibida la quema de ramas o restos vegetales en vía pública (Ord. Mun. 412/18)."
      ],
      carga_descarga: [
        "El vehículo de carga debe estacionar paralelamente al cordón sin obstruir garajes ni rampas de personas con discapacidad.",
        "Horario autorizado de carga/descarga: 06:00 a 09:00 hs y 14:00 a 17:00 hs.",
        "El permisionario responde por la integridad del asfalto y vereda."
      ],
      libre_deuda_tramite: [
        "Válido exclusivamente para trámites internos municipales en curso durante 72 horas.",
        "No exime del pago final ni de la regularización definitiva en la Caja Municipal.",
        "Sujeto a verificación por la Secretaría de Hacienda y Rentas."
      ],
      uso_espacio_publico: [
        "El solicitante se compromete a dejar el predio en idénticas condiciones de higiene y orden.",
        "Prohibida la venta de bebidas alcohólicas sin habilitación bromatológica expresa.",
        "No se permite exceder los niveles sonoros permitidos por Ordenanza Municipal."
      ],
      habilitacion_provisoria: [
        "Válido mientras se completan las inspecciones de Bomberos y Bromatología.",
        "Debe exhibirse en el local comercial en lugar visible.",
        "No autoriza el expendio fuera del rubro declarado."
      ]
    };

    const cleanDni = data.titularDni.replace(/\D/g, "");
    const token = `ITU-${data.tipo.toUpperCase()}-${cleanDni || "CIUDADANO"}-${Date.now().toString(36).toUpperCase()}`;

    const newPermiso: PermisoProvisorio = {
      id,
      tipo: data.tipo,
      titulo: titulosMap[data.tipo] || "Permiso Municipal Provisorio",
      titularNombre: data.titularNombre,
      titularDni: data.titularDni,
      titularDomicilio: data.titularDomicilio,
      titularTelefono: data.titularTelefono,
      motivoDetalle: data.motivoDetalle,
      fechaEmision: now.toLocaleString("es-AR"),
      fechaVencimiento: vencimiento.toLocaleString("es-AR"),
      validezHoras: horas,
      qrVerificationToken: token,
      estado: "activo",
      condiciones: condicionesMap[data.tipo] || ["Cumplir con las normativas municipales vigentes."]
    };

    this.permisos.unshift(newPermiso);
    this.saveToStorage();
    return newPermiso;
  }

  // Gacetillas
  public getGacetillas(): GacetillaPrensa[] {
    return [...this.gacetillas];
  }

  public addGacetilla(data: Omit<GacetillaPrensa, "id" | "fecha">): GacetillaPrensa {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const id = `GAC-ITU-2026-${randomSuffix}`;
    const newGacetilla: GacetillaPrensa = {
      ...data,
      id,
      fecha: new Date().toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) + " hs"
    };
    this.gacetillas.unshift(newGacetilla);
    this.saveToStorage();
    return newGacetilla;
  }
}

export const municipalStore = new MunicipalStore();
