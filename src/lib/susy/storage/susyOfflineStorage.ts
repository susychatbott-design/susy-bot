/**
 * ========================================================================
 * 🗄️ NORA OFFLINE STORAGE (INDEXEDDB - CERO DATOS / MODO LAZARILLO)
 * Ubicación: src/lib/nora/storage/susyOfflineStorage.ts
 * ========================================================================
 */

export interface SOSContact {
  id: string;
  name: string;
  phone: string;
  relation?: string;
  isPrimary?: boolean;
}

export interface OfflineWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  category?: 'HOSPITAL' | 'POLICIA' | 'FARMACIA' | 'HOGAR' | 'CRUCE_SEGURO';
}

const DB_NAME = 'NoraLazarilloOfflineDB';
const DB_VERSION = 1;

// Puntos de referencia precargados de Ituzaingó, Corrientes para orientación offline
const DEFAULT_ITUZAINGO_WAYPOINTS: OfflineWaypoint[] = [
  {
    id: 'hosp_ituzaingo',
    name: 'Hospital Dr. Ricardo Billinghurst',
    lat: -27.5898,
    lng: -56.6853,
    description: 'Hospital central de emergencias de Ituzaingó (Atención 24hs).',
    category: 'HOSPITAL'
  },
  {
    id: 'comisaria_1',
    name: 'Comisaría Seccional Primera Ituzaingó',
    lat: -27.5925,
    lng: -56.6821,
    description: 'Centro policial y punto de auxilio ciudadano.',
    category: 'POLICIA'
  },
  {
    id: 'plaza_san_martin',
    name: 'Plaza San Martín (Centro)',
    lat: -27.5912,
    lng: -56.6834,
    description: 'Punto neurálgico céntrico con veredas anchas y paradas de taxi.',
    category: 'CRUCE_SEGURO'
  }
];

export const initOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB no está disponible en este entorno.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('waypoints')) {
        const wpStore = db.createObjectStore('waypoints', { keyPath: 'id' });
        // Poblar puntos esenciales de Ituzaingó
        DEFAULT_ITUZAINGO_WAYPOINTS.forEach((wp) => {
          wpStore.put(wp);
        });
      }
    };
  });
};

export const saveSOSContact = async (contact: SOSContact): Promise<void> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('contacts', 'readwrite');
    const store = transaction.objectStore('contacts');
    const request = store.put(contact);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteSOSContact = async (id: string): Promise<void> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('contacts', 'readwrite');
    const store = transaction.objectStore('contacts');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getSOSContacts = async (): Promise<SOSContact[]> => {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('contacts', 'readonly');
      const store = transaction.objectStore('contacts');
      const request = store.getAll();
      request.onsuccess = () => {
        const results: SOSContact[] = request.result || [];
        if (results.length === 0) {
          // Contactos SOS de emergencia por defecto en Ituzaingó / Corrientes
          resolve([
            { id: 'emergencias_911', name: 'Policía / Emergencias 911', phone: '911', isPrimary: true },
            { id: 'hospital_107', name: 'Hospital Ituzaingó (107)', phone: '107' },
            { id: 'bomberos_100', name: 'Bomberos Voluntarios (100)', phone: '100' }
          ]);
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [
      { id: 'emergencias_911', name: 'Policía / Emergencias 911', phone: '911', isPrimary: true },
      { id: 'hospital_107', name: 'Hospital Ituzaingó (107)', phone: '107' }
    ];
  }
};

export const getOfflineWaypoints = async (): Promise<OfflineWaypoint[]> => {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('waypoints', 'readonly');
      const store = transaction.objectStore('waypoints');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || DEFAULT_ITUZAINGO_WAYPOINTS);
      request.onerror = () => resolve(DEFAULT_ITUZAINGO_WAYPOINTS);
    });
  } catch {
    return DEFAULT_ITUZAINGO_WAYPOINTS;
  }
};
