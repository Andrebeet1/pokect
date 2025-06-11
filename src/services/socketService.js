// src/services/socketService.js
import { io } from 'socket.io-client';
import { processIncomingData } from '../controllers/marketController.js';

const socketURL = 'wss://api-us-north.po.market/socket.io/?EIO=4&transport=websocket';

export function startSocket() {
  const socket = io(socketURL, {
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('✅ Connecté à PO Market via WebSocket');
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Erreur de connexion WebSocket :', err.message);
  });

  socket.on('disconnect', () => {
    console.warn('⚠️ Déconnecté de WebSocket');
  });

  socket.on('data', async (payload) => {
    // Remplace par la bonne clé si nécessaire
    const valeur = payload.price || Math.random() * 100;
    await processIncomingData(valeur);
  });
}
