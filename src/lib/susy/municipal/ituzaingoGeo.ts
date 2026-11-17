/**
 * ==============================================================================
 * 🗺️ GEOLOCALIZACIÓN Y REFERENCIAS URBANAS SOBERANAS DE ITUZAINGÓ, CORRIENTES
 * Ubicación: src/lib/susy/municipal/ituzaingoGeo.ts
 *
 * Convierte coordenadas GPS en referencias humanas reconocibles por el vecino:
 * Barrio, Zona y entrecalles / arterias principales de Ituzaingó.
 * ==============================================================================
 */

export interface GeoLocationRef {
  barrio: string;
  zona: string;
  referenciaCercana: string;
  descripcionUrbana: string;
}

interface BarrioPoligonoCentro {
  barrio: string;
  zona: string;
  lat: number;
  lng: number;
  radioKm: number;
  entreCallesFrecuentes: string;
}

// Centroides aproximados de los 20 barrios y zonas principales de Ituzaingó (Corrientes)
const BARRIOS_GEO_DATA: BarrioPoligonoCentro[] = [
  {
    barrio: "Casco Céntrico",
    zona: "Centro / Costanera",
    lat: -27.5843,
    lng: -56.6836,
    radioKm: 0.9,
    entreCallesFrecuentes: "Av. Centenario, 9 de Julio, Corrientes y Belgrano (Plaza San Martín)",
  },
  {
    barrio: "General San Martín",
    zona: "Centro / Costanera",
    lat: -27.5815,
    lng: -56.6885,
    radioKm: 0.8,
    entreCallesFrecuentes: "Av. San Martín y Belgrano",
  },
  {
    barrio: "Bernardino Valle",
    zona: "Centro / Costanera",
    lat: -27.5792,
    lng: -56.6820,
    radioKm: 0.7,
    entreCallesFrecuentes: "Bernardino Valle y Av. Centenario",
  },
  {
    barrio: "Villa Luisa",
    zona: "Centro / Costanera",
    lat: -27.5880,
    lng: -56.6790,
    radioKm: 0.8,
    entreCallesFrecuentes: "Buenos Aires y Pellegrini",
  },
  {
    barrio: "Portal del Sol",
    zona: "Centro / Costanera",
    lat: -27.5750,
    lng: -56.6900,
    radioKm: 1.0,
    entreCallesFrecuentes: "Av. Costanera Paranaguá y Antártida Argentina",
  },
  {
    barrio: "Mbataretá",
    zona: "Centro / Costanera",
    lat: -27.5765,
    lng: -56.6770,
    radioKm: 0.8,
    entreCallesFrecuentes: "Costanera Stella Maris y calle Corrientes",
  },
  {
    barrio: "La Florida",
    zona: "Norte / Costanera",
    lat: -27.5720,
    lng: -56.6840,
    radioKm: 1.1,
    entreCallesFrecuentes: "Zona Balnearia La Florida y Playa Grande",
  },
  {
    barrio: "General Manuel Belgrano",
    zona: "Oeste / Belgrano",
    lat: -27.5910,
    lng: -56.6920,
    radioKm: 1.0,
    entreCallesFrecuentes: "Av. Belgrano y calle Libertad",
  },
  {
    barrio: "Mil Viviendas",
    zona: "Complejos Habitacionales",
    lat: -27.5960,
    lng: -56.6860,
    radioKm: 1.2,
    entreCallesFrecuentes: "SUM Comunitario y Av. 3 de Abril",
  },
  {
    barrio: "San Cayetano",
    zona: "Complejos Habitacionales",
    lat: -27.5990,
    lng: -56.6800,
    radioKm: 0.9,
    entreCallesFrecuentes: "Capilla San Cayetano y calle Neuquén",
  },
  {
    barrio: "Virgen de Itatí",
    zona: "Complejos Habitacionales",
    lat: -27.6020,
    lng: -56.6850,
    radioKm: 0.9,
    entreCallesFrecuentes: "Manzanas de Itatí y calle Santa Fe",
  },
  {
    barrio: "Barrio Iberá",
    zona: "Sur / Acceso RN 12",
    lat: -27.6040,
    lng: -56.6910,
    radioKm: 1.1,
    entreCallesFrecuentes: "Acceso RN 12 y calle Posadas",
  },
  {
    barrio: "San Jorge",
    zona: "Sur / Acceso RN 12",
    lat: -27.6080,
    lng: -56.6870,
    radioKm: 1.0,
    entreCallesFrecuentes: "Calle San Jorge y prolongación Av. Centenario",
  },
  {
    barrio: "Santa Rita de Casia",
    zona: "Sur / Acceso RN 12",
    lat: -27.6110,
    lng: -56.6950,
    radioKm: 1.2,
    entreCallesFrecuentes: "Capilla Santa Rita y calle Entre Ríos",
  },
  {
    barrio: "San Francisco de Asís",
    zona: "Sur / Acceso RN 12",
    lat: -27.6140,
    lng: -56.6900,
    radioKm: 1.1,
    entreCallesFrecuentes: "Sector Sur camino a RN 12",
  },
  {
    barrio: "San Isidro",
    zona: "Sur / Acceso RN 12",
    lat: -27.6160,
    lng: -56.6830,
    radioKm: 1.2,
    entreCallesFrecuentes: "Límite Sur periurbano",
  },
  {
    barrio: "Cazadores Correntinos",
    zona: "Oeste / Periurbano",
    lat: -27.5930,
    lng: -56.7020,
    radioKm: 1.3,
    entreCallesFrecuentes: "Calle Cazadores Correntinos y calle Mitre",
  },
  {
    barrio: "Paraná",
    zona: "Norte / Costera",
    lat: -27.5780,
    lng: -56.6690,
    radioKm: 1.0,
    entreCallesFrecuentes: "Ribera del Río Paraná",
  },
  {
    barrio: "Rincón Santa María",
    zona: "Norte / Yacyretá",
    lat: -27.5650,
    lng: -56.6450,
    radioKm: 2.5,
    entreCallesFrecuentes: "Acceso a Complejo Yacyretá y Bajada de Lanchas",
  },
  {
    barrio: "Islas Malvinas",
    zona: "Norte / Yacyretá",
    lat: -27.5710,
    lng: -56.6580,
    radioKm: 1.5,
    entreCallesFrecuentes: "Camino a Central Hidroeléctrica Yacyretá",
  },
];

// Cálculo de distancia euclidiana / haversine rápida (en km)
function distanciaHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio tierra km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Traduce coordenadas crudas (-27.58, -56.68) a una referencia amigable para el vecino de Ituzaingó
 */
export function resolverReferenciaUrbanaItuzaingo(
  lat: number,
  lng: number
): GeoLocationRef {
  // Buscar el barrio más cercano
  let barrioCercano = BARRIOS_GEO_DATA[0];
  let menorDistancia = Infinity;

  for (const b of BARRIOS_GEO_DATA) {
    const dist = distanciaHaversineKm(lat, lng, b.lat, b.lng);
    if (dist < menorDistancia) {
      menorDistancia = dist;
      barrioCercano = b;
    }
  }

  // Si está a más de 6 km de Ituzaingó urbano, identificar si es Ruta 12, Ruta 41 o Rural
  if (menorDistancia > 5.5) {
    if (lat < -27.65) {
      return {
        barrio: "Zona Rural / Ruta Provincial 41",
        zona: "Ruta 41 (Hacia Portal Galarza / Carlos Pellegrini)",
        referenciaCercana: "Ruta Prov. 41 / Zona Rural de Ituzaingó",
        descripcionUrbana: "Sector rural sobre Ruta Provincial 41",
      };
    }
    return {
      barrio: "Corredor Ruta Nacional 12",
      zona: "Ruta Nacional 12 (Km 1230-1250)",
      referenciaCercana: "Acceso RN 12 / Portal Cambyretá",
      descripcionUrbana: "Corredor vial sobre Ruta Nacional 12",
    };
  }

  const cercaniaTexto =
    menorDistancia < 0.4
      ? `En pleno ${barrioCercano.barrio}`
      : `Inmediaciones de ${barrioCercano.barrio} (${barrioCercano.entreCallesFrecuentes})`;

  return {
    barrio: barrioCercano.barrio,
    zona: barrioCercano.zona,
    referenciaCercana: barrioCercano.entreCallesFrecuentes,
    descripcionUrbana: `${cercaniaTexto} [${barrioCercano.zona}]`,
  };
}
