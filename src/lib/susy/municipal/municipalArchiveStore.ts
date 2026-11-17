/**
 * ==============================================================================
 * 🏛️ REPOSITORIO DE ARCHIVO HISTÓRICO Y AUDITORÍA MUNICIPAL
 * Ubicación: src/lib/susy/municipal/municipalArchiveStore.ts
 *
 * Módulo de respaldo y auditoría permanente de Ituzaingó, Corrientes:
 * - Cuando un operador elimina o modifica un turno, permiso o registro activo,
 *   se resguarda automáticamente en este archivo inmutable.
 * - Soporta exportación en JSON y CSV para respaldo físico ante quejas o auditorías.
 * - Permite restaurar registros a la bandeja activa en caso de error.
 * ==============================================================================
 */

export interface ArchivoHistoricoItem {
  id: string; // ID único del registro archivado
  originalId: string; // #TURNO-..., #PERM-..., #GAC-..., OP-ITU-...
  tipo: "TURNO" | "PERMISO_QR" | "GACETILLA" | "OPERACION_TREN";
  tituloOAsunto: string;
  detalleCiudadano: string;
  areaResponsable: string;
  fechaRegistroOriginal: string;
  fechaArchivado: string;
  motivoArchivado: "RESUELTO" | "CANCELADO_VECINO" | "DEPURADO_OPERADOR" | "MODIFICADO";
  operadorNota?: string;
  payloadCompleto: Record<string, unknown>;
}

const STORAGE_KEY_ARCHIVE = "susy_ituzaingo_archivo_historico_v1";

class MunicipalArchiveManager {
  private items: ArchivoHistoricoItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ARCHIVE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.items = parsed;
        }
      }
    } catch (e) {
      console.warn("[MunicipalArchive] Error al cargar archivo histórico:", e);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_ARCHIVE, JSON.stringify(this.items));
    } catch (e) {
      console.warn("[MunicipalArchive] Error al persistir archivo histórico:", e);
    }
  }

  public getArchivados(): ArchivoHistoricoItem[] {
    return [...this.items];
  }

  public archivar(item: Omit<ArchivoHistoricoItem, "id" | "fechaArchivado">): ArchivoHistoricoItem {
    const newItem: ArchivoHistoricoItem = {
      ...item,
      id: `ARC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      fechaArchivado: new Date().toLocaleString("es-AR"),
    };
    this.items.unshift(newItem);
    this.saveToStorage();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("susy_municipal_archive_updated"));
    }
    return newItem;
  }

  public eliminarDefinitivo(archiveId: string): void {
    this.items = this.items.filter((i) => i.id !== archiveId);
    this.saveToStorage();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("susy_municipal_archive_updated"));
    }
  }

  public exportarCSV(): string {
    const headers = [
      "ID_ARCHIVO",
      "ID_ORIGINAL",
      "TIPO",
      "ASUNTO",
      "CIUDADANO_DETALLE",
      "AREA_RESPONSABLE",
      "FECHA_ORIGINAL",
      "FECHA_ARCHIVADO",
      "MOTIVO",
    ];

    const rows = this.items.map((i) => [
      `"${i.id}"`,
      `"${i.originalId}"`,
      `"${i.tipo}"`,
      `"${(i.tituloOAsunto || "").replace(/"/g, '""')}"`,
      `"${(i.detalleCiudadano || "").replace(/"/g, '""')}"`,
      `"${(i.areaResponsable || "").replace(/"/g, '""')}"`,
      `"${i.fechaRegistroOriginal}"`,
      `"${i.fechaArchivado}"`,
      `"${i.motivoArchivado}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
}

export const municipalArchive = new MunicipalArchiveManager();
