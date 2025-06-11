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

// 🔁 Mémoire du dernier message par chat pour suppression automatique
const dernierMessage = new Map();

function setDernierMessage(chatId, messageId) {
  dernierMessage.set(chatId, messageId);
}

function getDernierMessage(chatId) {
  return dernierMessage.get(chatId);
}

async function supprimerDernierMessage(chatId) {
  const msgId = getDernierMessage(chatId);
  if (msgId) {
    try {
      await bot.deleteMessage(chatId, msgId);
    } catch (e) {
      console.warn(`⚠️ Message déjà supprimé ou introuvable :`, e.message);
    }
  }
}

// 📥 Webhook Telegram
router.post('/', async (req, res) => {
  try {
    await handleUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error('❌ Erreur webhook:', e);
    res.sendStatus(500);
  }
});

// 🔘 Gestion des boutons
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'NOUVELLE_PREDICTION' || query.data === 'regenerer') {
    await bot.answerCallbackQuery(query.id);
    resetSequence();

    // 🧹 Supprimer l'ancien message avec prédiction
    await supprimerDernierMessage(chatId);

    const result = await genererNouvellePrediction();
    const { texte, mouvement } = result;

    let emoji = '⚪️ STABLE';
    if (/hausse/i.test(mouvement)) emoji = '🟢 BUY';
    else if (/baisse/i.test(mouvement)) emoji = '🔴 SELL';

    const message = `${emoji}\n\n${texte}`;

    const sent = await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔁 Nouvelle prédiction', callback_data: 'regenerer' }]
        ]
      }
    });

    // 📝 Mémoriser le message actuel pour suppression future
    setDernierMessage(chatId, sent.message_id);
  }
});

// 📡 Simule un WebSocket pour recevoir les ticks
const ws = new WebSocket('wss://api-us-north.po.market/socket.io/?EIO=4&transport=websocket');

ws.on('message', async (data) => {
  try {
    const tick = JSON.parse(data);

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
