import WebSocket from 'ws';
import { processIncomingData } from '../controllers/marketController.js';

let ws;

export function demarrerSocket(url) {
  ws = new WebSocket(url);

  ws.on('open', () => {
    console.log('✅ Connexion WebSocket établie');
  });

  ws.on('message', async (data) => {
    try {
      let valeur = null;

      // Essaye de parser en JSON
      try {
        const obj = JSON.parse(data);
        if (typeof obj === 'number') {
          valeur = obj;
        } else if (obj && typeof obj.price === 'number') {
          valeur = obj.price;
        }
      } catch {
        // Si ce n'est pas du JSON, tente de parser en float
        const n = parseFloat(data);
        if (!isNaN(n)) valeur = n;
      }

      if (valeur !== null) {
        await processIncomingData(valeur);
      } else {
        console.warn('⚠️ Donnée reçue non reconnue :', data);
      }
    } catch (e) {
      console.error('❌ Erreur traitement message WebSocket:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('❌ Connexion WebSocket fermée. Reconnexion...');
    setTimeout(() => demarrerSocket(url), 2000);
  });

  ws.on('error', (e) => {
    console.error('❌ Erreur WebSocket:', e.message);
  });
}

export function arreterSocket() {
  if (ws) ws.close();
}