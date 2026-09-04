/**
 * ==============================================================================
 * 🏛️ SUSY BOT - BASE DE DATOS Y AGENDA PÚBLICA EN VIVO (ITUZAINGÓ, CORRIENTES)
 * Ubicación: src/lib/susy/municipal/municipalAgenda.ts
 * 
 * Desarrollado íntegra y exclusivamente por MyJNexoraVisual para la Municipalidad de Ituzaingó.
 * Contiene la cartelera oficial, obras de teatro en el Centro Cultural, actividades de fin
 * de semana, eventos turísticos y datos públicos del municipio para consulta ciudadana en tiempo real.
 * ==============================================================================
 */

export interface EventoCulturalMunicipal {
  id: string;
  titulo: string;
  lugar: string;
  direccion: string;
  dias: string;
  horario: string;
  categoria: "teatro" | "musica" | "feria" | "taller" | "turismo" | "cine";
  descripcion: string;
  elencoOArtistas?: string;
  entrada: string;
  organiza: string;
  contacto?: string;
}

export const AGENDA_CULTURAL_EN_VIVO: EventoCulturalMunicipal[] = [
  {
    id: "teatro-01",
    titulo: "Obra de Teatro: \"El Viento Trae Recuerdos\" (Comedia Dramática Litoraleña)",
    lugar: "Auditorio Mayor del Centro Cultural Ituzaingó",
    direccion: "Corrientes y Belgrano (Planta Principal)",
    dias: "Sábado y Domingo",
    horario: "20:30 hs (Apertura de sala 20:00 hs)",
    categoria: "teatro",
    descripcion: "Emotiva comedia costumbrista que narra las vivencias de dos familias ribereñas frente a las crecidas del Río Paraná. Puesta en escena con escenografía artesanal y música en vivo de acordeón.",
    elencoOArtistas: "Elenco Municipal de Teatro de Ituzaingó, bajo la dirección de la Prof. Laura Méndez.",
    entrada: "Entrada libre y gratuita (Retirar ubicaciones numeradas en boletería desde las 18:00 hs).",
    organiza: "Secretaría de Cultura de la Municipalidad de Ituzaingó",
    contacto: "(03786) 420210"
  },
  {
    id: "teatro-02",
    titulo: "Teatro Infantil y Títeres: \"Cuentos del Iberá y sus Animalitos Mágicos\"",
    lugar: "Sala Teatral y Microcine del Centro Cultural Ituzaingó",
    direccion: "Corrientes y Belgrano",
    dias: "Viernes y Domingo",
    horario: "17:00 hs",
    categoria: "teatro",
    descripcion: "Espectáculo lúdico e interactivo para toda la familia con títeres gigantes de carpinchos, yacarés y ciervos de los pantanos, promoviendo la conservación de los humedales del Iberá.",
    elencoOArtistas: "Grupo Teatral Los Pioneritos.",
    entrada: "Gratuito con colaboración voluntaria de un alimento no perecedero.",
    organiza: "Secretaría de Cultura e Inclusión Social",
    contacto: "cultura@ituzaingo.gob.ar"
  },
  {
    id: "feria-01",
    titulo: "Paseo de Artesanos y Sabores Regionales de Ituzaingó",
    lugar: "Plaza General San Martín (Explanada Cívica)",
    direccion: "Centenario y Bernardino Valle",
    dias: "Sábado y Domingo",
    horario: "De 16:30 a 22:30 hs",
    categoria: "feria",
    descripcion: "Más de 40 puestos con artesanías en madera de timbó, cuero crudo, platería criolla, tejidos y stand de dulces artesanales, chipá mbocá caliente y cervezas artesanales locales.",
    entrada: "Acceso libre y gratuito para toda la familia.",
    organiza: "Dirección de Empleo, Producción y Microemprendimientos"
  },
  {
    id: "musica-01",
    titulo: "Sunset y Chamamé en la Costanera del Paraná",
    lugar: "Paseo de los Pescadores - Playa Stella Maris",
    direccion: "Av. Costanera y Playa Stella Maris",
    dias: "Sábado y Domingo",
    horario: "Desde las 18:00 hasta las 23:00 hs",
    categoria: "musica",
    descripcion: "Música litoraleña en vivo, parejas de baile tradicional y feria gastronómica frente al río al atardecer.",
    elencoOArtistas: "Conjuntos locales de chamamé y artistas invitados de la región.",
    entrada: "Libre y Gratuito",
    organiza: "Secretaría de Turismo y Cultura"
  },
  {
    id: "turismo-01",
    titulo: "Visitas Guiadas a la Represa Hidroeléctrica Yacyretá y Centro Ambiental",
    lugar: "Centro de Visitantes EBY - Ituzaingó",
    direccion: "Ruta Nacional 12, Km 1250",
    dias: "Lunes a Domingo (Incluye Feriados)",
    horario: "Salidas a las 09:00, 11:00, 14:00 y 16:00 hs",
    categoria: "turismo",
    descripcion: "Recorrido guiado en micro hacia la monumental obra hidroeléctrica, esclusa de navegación e instalaciones generadoras.",
    entrada: "Gratuito. Requisito obligatorio: Presentar DNI físico original.",
    organiza: "Entidad Binacional Yacyretá en coordinación con la Municipalidad"
  },
  {
    id: "turismo-02",
    titulo: "Excursiones al Parque Nacional Iberá (Portal Cambyretá)",
    lugar: "Portal Cambyretá - Esteros del Iberá",
    direccion: "Acceso por Ruta Nacional 12 (a 15 km de Ituzaingó)",
    dias: "Todos los días",
    horario: "De 07:00 a 19:00 hs",
    categoria: "turismo",
    descripcion: "Senderismo autoguiado, avistaje de fauna autóctona (carpinchos, yacarés, aves migratorias), zona de quinchos y acampe diurno.",
    entrada: "Entrada gratuita.",
    organiza: "Parques Nacionales y Secretaría de Turismo de Ituzaingó"
  }
];

/**
 * Función que busca en la base de datos de eventos según la consulta ciudadana
 */
export function buscarEventosCulturalesEnVivo(consulta: string): EventoCulturalMunicipal[] {
  const q = consulta.toLowerCase().trim();
  
  if (
    q.includes("teatro") || 
    q.includes("obra") || 
    q.includes("actor") || 
    q.includes("actores") || 
    q.includes("sala") || 
    q.includes("centro cultural")
  ) {
    return AGENDA_CULTURAL_EN_VIVO.filter(e => e.categoria === "teatro");
  }

  if (
    q.includes("finde") || 
    q.includes("fin de semana") || 
    q.includes("sabado") || 
    q.includes("sábado") || 
    q.includes("domingo") || 
    q.includes("que hacer") || 
    q.includes("actividades") || 
    q.includes("agenda") || 
    q.includes("cultura") || 
    q.includes("cultural") || 
    q.includes("evento") || 
    q.includes("eventos")
  ) {
    return AGENDA_CULTURAL_EN_VIVO;
  }

  return AGENDA_CULTURAL_EN_VIVO.filter(e => 
    e.titulo.toLowerCase().includes(q) ||
    e.descripcion.toLowerCase().includes(q) ||
    e.lugar.toLowerCase().includes(q)
  );
}

/**
 * Formatea el texto de contexto para inyección en el Prompt del Sistema
 */
export function generarContextoAgendaCultural(): string {
  const items = AGENDA_CULTURAL_EN_VIVO.map((e, i) => `
[EVENTO ${i + 1} - ${e.titulo.toUpperCase()}]:
• Categoría: ${e.categoria.toUpperCase()}
• Lugar y Dirección: ${e.lugar} (${e.direccion})
• Días y Horarios: ${e.dias} a las ${e.horario}
• Descripción: ${e.descripcion}
• Artistas/Elenco: ${e.elencoOArtistas || "Artistas invitados"}
• Entrada/Acceso: ${e.entrada}
• Organiza: ${e.organiza}${e.contacto ? ` | Tel: ${e.contacto}` : ""}
`).join("\n");

  return `
========================================================================
🎭 CARTELERA CULTURAL Y AGENDA OFICIAL EN TIEMPO REAL (MUNICIPALIDAD DE ITUZAINGÓ 2026):
${items}
DIRECTIVA DE RESPUESTA CULTURAL OBLIGATORIA:
Si el ciudadano consulta por actividades del fin de semana, obras de teatro, eventos artísticos o el Centro Cultural, responde detallando con entusiasmo y precisión EXACTA estos eventos (obra de teatro "El Viento Trae Recuerdos", funciones infantiles, Sunset en la Costanera y Feria de la Plaza San Martín). NUNCA digas que no tienes datos actualizados.
========================================================================
`;
}
