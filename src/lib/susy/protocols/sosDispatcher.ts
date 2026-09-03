/**
 * ========================================================================
 * 🚨 NORA PROTOCOLO SOS HÍBRIDO (ONLINE CLOUD / OFFLINE SMS NATIVO)
 * Ubicación: src/lib/nora/protocols/sosDispatcher.ts
 * ========================================================================
 */

import { getSOSContacts, SOSContact } from '../storage/susyOfflineStorage';

interface TriggerSOSParams {
  lat?: number | null;
  lng?: number | null;
  isOnline?: boolean;
  customNote?: string;
}

export interface SOSResult {
  method: 'NETWORK' | 'SMS';
  success: boolean;
  smsUri?: string;
  contactUsed: SOSContact;
  message: string;
}

export const dispatchSOS = async ({
  lat,
  lng,
  isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true,
  customNote
}: TriggerSOSParams): Promise<SOSResult> => {
  const contacts = await getSOSContacts();
  if (!contacts || contacts.length === 0) {
    throw new Error('No hay contactos de emergencia configurados en la memoria de Nora.');
  }

  // Tomamos el contacto prioritario
  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  const hasCoords = typeof lat === 'number' && typeof lng === 'number';
  const mapsUrl = hasCoords ? `https://maps.google.com/?q=${lat},${lng}` : 'Ubicación satelital en proceso...';

  const notePart = customNote ? ` Motivo: "${customNote}".` : '';
  const messageText = `🚨 ALERTA SOS NORA AI: Persona que requiere auxilio inmediato en Ituzaingó, Corrientes.${notePart} Ubicación GPS satelital: ${mapsUrl}`;

  // 1. Si hay red, despachar vía Servidor Central / Webhook
  if (isOnline) {
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: primaryContact.phone,
          name: primaryContact.name,
          message: messageText,
          lat,
          lng,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        return {
          method: 'NETWORK',
          success: true,
          contactUsed: primaryContact,
          message: messageText
        };
      }
    } catch (netErr) {
      console.warn('[SOS Dispatcher] Red inestable, ejecutando protocolo SMS Offline...', netErr);
    }
  }

  // 2. Fallback Offline Analógico Total: URI Nativa de SMS con Coordenadas Satelitales
  const encodedMessage = encodeURIComponent(messageText);
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // En iOS el separador de body es '&', en Android es '?'
  const smsUri = `sms:${primaryContact.phone}${isIOS ? '&' : '?'}body=${encodedMessage}`;

  return {
    method: 'SMS',
    success: true,
    smsUri,
    contactUsed: primaryContact,
    message: messageText
  };
};
