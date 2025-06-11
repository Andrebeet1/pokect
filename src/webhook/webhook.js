import express from 'express';
import bot from '../bot.js';
import {
  handleUpdate,
  envoyerPredictionAvecBouton,
  envoyerAnalyseBougie,
  resetSequence,
  getLastMessageIdForChat,
  setLastMessageIdForChat,
  deleteMessageById
} from '../controllers/marketController.js';
import { genererNouvellePrediction } from '../utils/prediction.js';
import WebSocket from 'ws';

const router = express.Router();

// Stockage en mémoire des derniers messageIds par chat pour nettoyage (tu peux améliorer avec une DB)
const lastMessageIds = new Map();

// Helper pour nettoyer l'ancien message (si possible)
async function nettoyerAncienMessage(chatId) {
  const messageId = lastMessageIds.get(chatId);
  if (messageId) {
    try {
      await bot.deleteMessage(chatId, messageId);
    } catch (e) {
      // Parfois le message est déjà supprimé ou non supprimable
      console.warn(`Impossible de supprimer le message ${messageId} pour le chat ${chatId}:`, e.message);
    }
  }
}

// Webhook Telegram (réception des messages / commandes)
router.post('/', async (req, res) => {
  try {
    await handleUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error('Erreur webhook:', e);
    res.sendStatus(500);
  }
});

// Gestion du bouton "Nouvelle prédiction"
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'NOUVELLE_PREDICTION' || query.data === 'regenerer') {
    await bot.answerCallbackQuery(query.id);

    // Réinitialiser la séquence pour une nouvelle prédiction propre
    resetSequence();

    // Nettoyer l'ancien message
    await nettoyerAncienMessage(chatId);

    // Générer nouvelle prédiction
    const { texte, mouvement } = await genererNouvellePrediction();

    // Déterminer l’emoji selon mouvement
    let emoji = '⚪️ STABLE';
    if (/hausse/i.test(mouvement)) emoji = '🟢 BUY';
    else if (/baisse/i.test(mouvement)) emoji = '🔴 SELL';

    const message = `${emoji}\n\n${texte}`;

    // Envoyer message avec bouton
    const sentMessage = await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔁 Nouvelle prédiction', callback_data: 'regenerer' }]
        ]
      }
    });

    // Mémoriser le message envoyé pour suppression ultérieure
    lastMessageIds.set(chatId, sentMessage.message_id);
  }
});

// WebSocket pour recevoir des ticks avec données OHLC
const ws = new WebSocket('wss://api-us-north.po.market/socket.io/?EIO=4&transport=websocket');

ws.on('message', async (data) => {
  try {
    const tick = JSON.parse(data);

    const bougie = {
      open: Number(tick.open),
      high: Number(tick.high),
      low: Number(tick.low),
      close: Number(tick.close)
    };

    // Valider la bougie avant analyse
    if ([bougie.open, bougie.high, bougie.low, bougie.close].some(v => isNaN(v))) {
      console.warn('⛔ Bougie invalide reçue :', bougie);
      return;
    }

    await envoyerAnalyseBougie(null, bougie);
  } catch (e) {
    console.error('Erreur WebSocket Bougie:', e.message);
  }
});

export default router;
