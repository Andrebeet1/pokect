import express from 'express';
import {
  handleUpdate,
  envoyerPredictionAvecBouton,
  envoyerAnalyseBougie,
  resetSequence
} from '../controllers/marketController.js';

import bot from '../bot.js';
import { genererNouvellePrediction } from '../utils/prediction.js';
import WebSocket from 'ws';

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

  // Supprimer le message précédent (bouton cliqué)
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch (e) {
    console.warn('❌ Impossible de supprimer le message précédent :', e.message);
  }

  // 🔁 Nouvelle prédiction
  if (query.data === 'NOUVELLE_PREDICTION' || query.data === 'regenerer') {
    resetSequence();

    const { texte, mouvement } = genererNouvellePrediction();
    let emoji = '⚪️ STABLE';
    if (/hausse/i.test(mouvement)) emoji = '🟢 BUY';
    else if (/baisse/i.test(mouvement)) emoji = '🔴 SELL';

    const message = `${emoji} *Signal Prédictif*\n\n${texte}`;

    const sentMessage = await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔁 Rafraîchir Prédiction', callback_data: 'regenerer' },
            { text: '📉 Voir Bougie', callback_data: 'NOUVELLE_ANALYSE' }
          ]
        ]
      }
    });

    // Suppression automatique
    setTimeout(() => {
      bot.deleteMessage(chatId, sentMessage.message_id).catch(err => {
        console.warn('❌ Erreur suppression message prédiction :', err.message);
      });
    }, 60000);
  }

  // 📉 Nouvelle analyse de bougie simulée
  if (query.data === 'NOUVELLE_ANALYSE') {
    // Option : simuler une bougie (à remplacer avec des vraies données si dispo)
    const bougieTest = {
      open: (Math.random() * 100).toFixed(2),
      close: (Math.random() * 100).toFixed(2),
      high: (Math.random() * 100).toFixed(2),
      low: (Math.random() * 100).toFixed(2)
    };

    await envoyerAnalyseBougie(chatId, bougieTest);
  }
});

// 📡 WebSocket (bougies en temps réel)
const ws = new WebSocket('wss://api-us-north.po.market/socket.io/?EIO=4&transport=websocket');

ws.on('message', async (data) => {
  try {
    const text = data.toString();

    if (!text.trim().startsWith('{')) return;

    const tick = JSON.parse(text);

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

    await envoyerAnalyseBougie(null, bougie);
  } catch (e) {
    console.error('❌ Erreur WebSocket Bougie:', e.message);
  }
});

export default router;
