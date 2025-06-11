import express from 'express';
import {
  handleUpdate,
  envoyerPredictionAvecBouton,
  envoyerAnalyseBougie,
  resetSequence
} from '../controllers/marketController.js';

import bot from '../bot.js';
import { genererNouvellePrediction } from '../utils/prediction.js';

const router = express.Router();

// 📩 Webhook Telegram
router.post('/', async (req, res) => {
  try {
    await handleUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error('Erreur webhook:', e);
    res.sendStatus(500);
  }
});

// 🎯 Boutons Telegram
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  await bot.answerCallbackQuery(query.id);

  // 🧹 Supprimer ancien message pour rendre propre
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch (e) {
    console.warn('Impossible de supprimer le message précédent :', e.message);
  }

  if (query.data === 'NOUVELLE_PREDICTION' || query.data === 'regenerer') {
    // Réinitialiser si besoin
    resetSequence();

    const { texte, mouvement } = genererNouvellePrediction();
    let emoji = '⚪️ STABLE';
    if (/hausse/i.test(mouvement)) emoji = '🟢 BUY';
    else if (/baisse/i.test(mouvement)) emoji = '🔴 SELL';

    const message = `${emoji}\n\n${texte}`;

    await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔁 Nouvelle prédiction', callback_data: 'regenerer' }]
        ]
      }
    });
  }
});

// 📡 WebSocket (bougies)
import WebSocket from 'ws';
const ws = new WebSocket('wss://api-us-north.po.market/socket.io/?EIO=4&transport=websocket');

ws.on('message', async (data) => {
  try {
    const text = data.toString();

    // Vérifie que c'est un JSON valide (commence par "{")
    if (!text.trim().startsWith('{')) return;

    const tick = JSON.parse(text);

    // Crée la bougie
    const bougie = {
      open: parseFloat(tick.open),
      high: parseFloat(tick.high),
      low: parseFloat(tick.low),
      close: parseFloat(tick.close)
    };

    if ([bougie.open, bougie.high, bougie.low, bougie.close].some(isNaN)) {
      console.warn('⛔ Bougie invalide ou incomplète reçue :', bougie);
      return;
    }

    await envoyerAnalyseBougie(null, bougie); // Optionnel : passer un chatId
  } catch (e) {
    console.error('❌ Erreur WebSocket Bougie:', e.message);
  }
});

export default router;
