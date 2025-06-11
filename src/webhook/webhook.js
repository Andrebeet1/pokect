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

// 📩 Webhook Telegram (réception des messages / commandes)
router.post('/', async (req, res) => {
  try {
    await handleUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error('❌ Erreur webhook:', e);
    res.sendStatus(500);
  }
});

// 🔘 Gestion des boutons inline
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  try {
    await bot.answerCallbackQuery(query.id);

    if (query.data === 'NOUVELLE_PREDICTION') {
      resetSequence();
      await envoyerPredictionAvecBouton(chatId);
    }

    if (query.data === 'regenerer') {
      const result = await genererNouvellePrediction();
      const { texte, mouvement } = result;

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
  } catch (err) {
    console.error('❌ Erreur callback_query :', err);
  }
});

// 📡 WebSocket pour recevoir des données de marché (tick)
const ws = new WebSocket('wss://api-us-north.po.market/socket.io/?EIO=4&transport=websocket');

ws.on('message', async (rawData) => {
  try {
    const jsonData = rawData.toString().trim();

    // Tentative de détection et d'extraction du vrai JSON
    const jsonStart = jsonData.indexOf('{');
    if (jsonStart === -1) throw new Error('Données non JSON');

    const data = JSON.parse(jsonData.slice(jsonStart));

    // ✅ Vérifie que les champs nécessaires existent et sont numériques
    const bougie = {
      open: parseFloat(data?.open),
      high: parseFloat(data?.high),
      low: parseFloat(data?.low),
      close: parseFloat(data?.close)
    };

    if (
      [bougie.open, bougie.high, bougie.low, bougie.close].some(v => isNaN(v))
    ) {
      console.error('⛔ Bougie invalide ou incomplète reçue :', bougie);
      return;
    }

    await envoyerAnalyseBougie(null, bougie); // null : pas de chatId cible direct
  } catch (e) {
    console.error('❌ Erreur WebSocket Bougie:', e.message);
  }
});

export default router;
