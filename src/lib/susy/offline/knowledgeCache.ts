/**
 * ========================================================================
 * 🌾 SUSYBOT OFFLINE KNOWLEDGE CACHE & DELTA SYNC ENGINE
 * Ubicación: /src/lib/nora/offline/knowledgeCache.ts
 * 
 * Gestiona el almacenamiento local en IndexedDB del teléfono/PC del usuario:
 * 1. Base enciclopédica escolar universal (Matemáticas, Historia, Ciencias, RAE).
 * 2. Cápsulas de actualización delta de Nexativa News y novedades locales.
 * 3. Proyectos áulicos y secuencias pedagógicas de consulta rápida.
 * ========================================================================
 */

export interface OfflineKnowledgeItem {
  id: string;
  category: "noticias" | "educacion" | "salud" | "tramites" | "general";
  title: string;
  content: string;
  updatedAt: string;
}

const DB_NAME = "SusybotLocalKnowledge";
const DB_VERSION = 1;
const STORE_NAME = "knowledge_deltas";

// Base de conocimiento enciclopédica predeterminada para funcionamiento 100% offline
const INITIAL_OFFLINE_KNOWLEDGE: OfflineKnowledgeItem[] = [
  {
    id: "civico_ituzaingo_emergencias",
    category: "salud",
    title: "Guía de Emergencias y Servicios de Ituzaingó",
    content: "Hospital Dr. Ricardo Billinghurst (Urgencias 24 hs: Tel 107 / 03786-420033). Bomberos Voluntarios (Tel 100 / 03786-420022). Comisaría 1ª (03786-420044). Comisaría 2ª Bº San Martín (03786-421222). Defensa Civil (103). Prefectura Naval Puerto Ituzaingó (106 / 03786-420025). Mesa de Entradas Municipal: Lunes a Viernes 7 a 13 hs.",
    updatedAt: new Date().toISOString()
  },
  {
    id: "civico_ituzaingo_transito",
    category: "tramites",
    title: "Trámites de Licencia de Conducir Ituzaingó",
    content: "Requisitos carnet: DNI original y copia con domicilio en Ituzaingó, grupo sanguíneo, libre de deuda de tasas y multas, examen médico y teórico-práctico. Oficina de Tránsito Municipal de 7 a 13 hs.",
    updatedAt: new Date().toISOString()
  },
  {
    id: "civico_ituzaingo_turismo",
    category: "general",
    title: "Turismo Ituzaingó: Portal Cambyretá y Central Yacyretá",
    content: "Portal Cambyretá (Esteros del Iberá): Ingreso por RN 12 km 1230. Avistaje de fauna autóctona (carpinchos, yacarés). Central Yacyretá: Visitas guiadas en Centro de Visitantes en Av. 9 de Julio. Informes turísticos: Peatonal y Centenario.",
    updatedAt: new Date().toISOString()
  },
  {
    id: "edu_matematicas_basica",
    category: "educacion",
    title: "Principios y Fórmulas Matemáticas Fundamentales",
    content: "Teorema de Pitágoras: a² + b² = c² (para triángulos rectángulos). Área del círculo: A = π * r². Ecuación cuadrática: x = (-b ± √(b² - 4ac)) / (2a). Jerarquía de operaciones: 1. Paréntesis, 2. Potencias/Raíces, 3. Multiplicación/División, 4. Suma/Resta.",
    updatedAt: new Date().toISOString()
  },
  {
    id: "edu_lengua_rae",
    category: "educacion",
    title: "Reglas de Acentuación y Gramática Española",
    content: "Agudas: acento en la última sílaba, llevan tilde si terminan en n, s o vocal. Graves/Llanas: acento en la penúltima sílaba, llevan tilde si NO terminan en n, s o vocal. Esdrújulas y Sobreesdrújulas: siempre llevan tilde. Uso de B/V, C/S/Z y concordancia de género y número.",
    updatedAt: new Date().toISOString()
  },
  {
    id: "edu_historia_argentina",
    category: "educacion",
    title: "Hitos de la Historia Argentina y Correntina",
    content: "25 de Mayo de 1810: Revolución de Mayo y Primer Gobierno Patrio. 9 de Julio de 1816: Declaración de la Independencia en Tucumán. Historia de Ituzaingó, Corrientes: Fundada en 1864 por Bernardino Valle. Cabecera de la Represa Hidroeléctrica Yacyretá y Portal Norte a los Esteros del Iberá.",
    updatedAt: new Date().toISOString()
  },
  {
    id: "edu_ciencias_naturales",
    category: "educacion",
    title: "Biología, Química y Física Fundamental",
    content: "Fotosíntesis: 6CO2 + 6H2O + luz solar -> C6H12O6 + 6O2. Leyes de Newton: 1. Inercia, 2. F = m*a, 3. Acción y Reacción. Estructura celular: Membrana, Citoplasma, Núcleo (con ADN) y Mitocondrias.",
    updatedAt: new Date().toISOString()
  },
  {
    id: "civico_ituzaingo_emergencias",
    category: "salud",
    title: "Guía de Emergencias y Servicios de Ituzaingó",
    content: "Hospital Ricardo Billinghurst Ituzaingó. Comisaría 1ra y 2da. Bomberos Voluntarios Ituzaingó. Portal San Antonio hacia Esteros del Iberá. Trámites municipales y centros de salud de atención primaria.",
    updatedAt: new Date().toISOString()
  }
];

function openKnowledgeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB no está disponible en este entorno."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("category", "category", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Inicializa la base de datos offline con conocimientos base
 */
export async function initializeOfflineKnowledge(): Promise<void> {
  try {
    const db = await openKnowledgeDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const item of INITIAL_OFFLINE_KNOWLEDGE) {
      store.put(item);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn("[Offline Knowledge Init Warn]:", error);
  }
}

/**
 * Guarda o actualiza un lote de noticias y cápsulas delta en la base local
 */
export async function saveOfflineDeltas(items: OfflineKnowledgeItem[]): Promise<void> {
  try {
    const db = await openKnowledgeDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const item of items) {
      store.put(item);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn("[Save Offline Deltas Warn]:", error);
  }
}

const STOP_WORDS = new Set([
  "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "con", "para", "por",
  "que", "qué", "como", "cómo", "donde", "dónde", "cuando", "cuándo", "nora", "hola",
  "buen", "buenos", "dias", "tardes", "noches", "sobre", "entre", "hacer", "puedes",
  "decirme", "cual", "cuál", "quien", "quién", "este", "esta", "estos", "estas",
  "algo", "todo", "nada", "pero", "sino", "bien", "gracias", "favor", "quiero",
  "saber", "explicar", "explicame", "ayuda", "duda", "tema", "punto", "consulta"
]);

/**
 * Busca información relevante en la base local para responder offline (RAG Local)
 */
export async function searchOfflineKnowledge(query: string): Promise<string> {
  try {
    const db = await openKnowledgeDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const allItems: OfflineKnowledgeItem[] = request.result || [];
        const cleanWords = query
          .toLowerCase()
          .replace(/[¿?¡!.,:;()]/g, "")
          .split(/\s+/)
          .filter(w => w.length > 3 && !STOP_WORDS.has(w));

        if (cleanWords.length === 0) {
          resolve("");
          return;
        }

        const isEmergencyQuery = cleanWords.some(w =>
          ["hospital", "bomberos", "policia", "policía", "comisaria", "comisaría", "emergencia", "guardia", "medico", "ambulancia"].includes(w)
        );

        const isTourismQuery = cleanWords.some(w =>
          ["esteros", "ibera", "iberá", "represa", "yacyreta", "yacyretá", "turismo", "playa", "camping"].includes(w)
        );

        const matches = allItems.filter(item => {
          if (item.category === "salud" || item.id.includes("civico")) {
            return isEmergencyQuery;
          }
          if (item.id.includes("turismo") || item.title.toLowerCase().includes("esteros")) {
            return isTourismQuery;
          }
          const text = `${item.title} ${item.content}`.toLowerCase();
          return cleanWords.some(w => text.includes(w));
        });

        if (matches.length === 0) {
          resolve("");
          return;
        }

        const formatted = matches
          .slice(0, 2)
          .map(m => `• [${m.title}]: ${m.content}`)
          .join("\n\n");

        resolve(formatted);
      };

      request.onerror = () => resolve("");
    });
  } catch {
    return "";
  }
}

/**
 * Sincroniza en segundo plano las últimas noticias cuando hay conexión
 */
export async function syncOnlineDeltasIfAvailable(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) return;

  try {
    const res = await fetch("/api/articles?limit=5", { signal: AbortSignal.timeout(3500) });
    if (!res.ok) return;

    const data = await res.json();
    const articles = data.articles || data.data || [];

    if (Array.isArray(articles) && articles.length > 0) {
      const deltaItems: OfflineKnowledgeItem[] = articles.map((a: any) => ({
        id: `news_${a.id || Math.random().toString(36).substring(2, 8)}`,
        category: "noticias",
        title: a.title || "Noticia de Nexativa News",
        content: `${a.subtitle || ''} - ${a.content ? a.content.slice(0, 300) : ''}`.trim(),
        updatedAt: a.created_at || new Date().toISOString()
      }));

      await saveOfflineDeltas(deltaItems);
      console.log(`[Offline Sync] 🌾 Sincronizadas ${deltaItems.length} cápsulas de noticias para modo campo.`);
    }
  } catch (err) {
    // Falla silenciosa si la red es inestable
  }
}
