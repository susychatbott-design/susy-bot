/**
 * ==============================================================================
 * 📻 SUSY BOT - PUENTE WEB BLUETOOTH LORA MESH (OFF-GRID DEFENSE)
 * Ubicación: src/lib/susy/mesh/SusyMeshBridge.ts
 * 
 * Permite que Susy Bot transmita y reciba paquetes por radiofrecuencia (LoRa/Meshtastic)
 * mediante Web Bluetooth API con 0% de internet o redes celulares.
 * Propiedad Intelectual: MyJNexoraVisual
 * ==============================================================================
 */

export interface MeshPayload {
  nodeId: string;
  alertType: "PANICO" | "INUNDACION" | "EVACUACION" | "SISTEMA_CAIDO";
  message: string;
  lat: number;
  lon: number;
}

export class SusyMeshBridge {
  private static instance: SusyMeshBridge;
  private bluetoothDevice: any = null;
  private txCharacteristic: any = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): SusyMeshBridge {
    if (!SusyMeshBridge.instance) {
      SusyMeshBridge.instance = new SusyMeshBridge();
    }
    return SusyMeshBridge.instance;
  }

  /**
   * Verifica si el navegador actual soporta Web Bluetooth API
   */
  public isSupported(): boolean {
    return typeof window !== "undefined" && Boolean((navigator as any)?.bluetooth);
  }

  /**
   * Estado de conexión con el nodo físico LoRa
   */
  public getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Nombre del nodo físico emparejado
   */
  public getDeviceName(): string {
    return this.bluetoothDevice?.name || "No enlazado";
  }

  /**
   * Conecta la PWA de Susy Bot a una radio LoRa física (Heltec / T-Beam / Meshtastic)
   */
  public async connectToLoRaNode(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn("⚠️ Web Bluetooth no es soportado en este navegador o plataforma.");
      return false;
    }

    try {
      const navBluetooth = (navigator as any).bluetooth;
      this.bluetoothDevice = await navBluetooth.requestDevice({
        filters: [{ namePrefix: "Meshtastic" }, { namePrefix: "Heltec" }, { namePrefix: "T-Beam" }],
        optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"] // Nordic UART Service (NUS)
      });

      const server = await this.bluetoothDevice.gatt.connect();
      const service = await server.getPrimaryService("6e400001-b5a3-f393-e0a9-e50e24dcca9e");
      this.txCharacteristic = await service.getCharacteristic("6e400002-b5a3-f393-e0a9-e50e24dcca9e");
      
      this.isConnected = true;
      console.log("🟢 Conexión exitosa al nodo físico LoRa Mesh:", this.bluetoothDevice.name);

      this.bluetoothDevice.addEventListener("gattserverdisconnected", () => {
        console.warn("🔴 Nodo LoRa Mesh desconectado físicamente.");
        this.isConnected = false;
        this.txCharacteristic = null;
      });

      return true;
    } catch (error) {
      console.error("Falla al enlazar hardware de radiofrecuencia Bluetooth:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Desconecta el nodo LoRa
   */
  public disconnect(): void {
    try {
      if (this.bluetoothDevice?.gatt?.connected) {
        this.bluetoothDevice.gatt.disconnect();
      }
    } catch (e) {}
    this.isConnected = false;
    this.txCharacteristic = null;
  }

  /**
   * Transmite un paquete de emergencia empaquetado bit a bit por ondas de radio (0% Internet)
   */
  public async broadcastEmergency(payload: MeshPayload): Promise<boolean> {
    if (!this.txCharacteristic) {
      console.warn("❌ Transmisión abortada: No hay un nodo LoRa enlazado por Bluetooth.");
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const dataString = JSON.stringify({
        n: payload.nodeId,
        t: payload.alertType,
        m: payload.message,
        la: payload.lat,
        lo: payload.lon
      });
      
      const dataBuffer = encoder.encode(dataString);
      await this.txCharacteristic.writeValue(dataBuffer);
      console.log("📡 Paquete crítico S.O.S transmitido con éxito por ondas LoRa.");
      return true;
    } catch (err) {
      console.error("Error crítico de hardware en la transmisión RF LoRa:", err);
      return false;
    }
  }
}
