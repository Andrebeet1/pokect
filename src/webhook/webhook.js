import express from 'express';
import { handleUpdate, envoyerPredictionAvecBouton, envoyerAnalyseBougie, resetSequence } from '../controllers/marketController.js';
import bot from '../bot.js';
import { genererNouvellePrediction } from '../utils/prediction.js';
import WebSocket from 'ws';

const router = express.Router();

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

// 🔁 Gestion du bouton "Nouvelle prédiction"
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'NOUVELLE_PREDICTION') {
    await bot.answerCallbackQuery(query.id);
    resetSequence();
    await envoyerPredictionAvecBouton(chatId);
  }

  if (query.data === 'regenerer') {
    await bot.answerCallbackQuery(query.id);

    const result = await genererNouvellePrediction(); // ← Ajout du `await`
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
});

// 📡 Connexion WebSocket
const ws = new WebSocket('wss://api-us-north.po.market/socket.io/?EIO=4&transport=websocket');

// ✅ Traitement des messages WebSocket
ws.on('message', async (rawData) => {
  try {
    const text = rawData.toString().trim();

    // Vérifie format `socket.io` style "42[...]"
    if (!text.startsWith('42')) return;

    const parsed = JSON.parse(text.slice(2)); // ["event", { ... }]
    const [event, data] = parsed;

    if (typeof data !== 'object' || data === null) {
      console.warn('⛔ Données de bougie invalides (null ou vide)');
      return;
    }

    const bougie = {
      open: parseFloat(data.open),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      close: parseFloat(data.close)
    };

    if ([bougie.open, bougie.high, bougie.low, bougie.close].some(v => isNaN(v))) {
      console.error('⛔ Bougie invalide ou incomplète reçue :', bougie);
      return;
    }

    // ✅ Envoi à l'analyse
    await envoyerAnalyseBougie(null, bougie);
  } catch (e) {
    console.error('❌ Erreur WebSocket Bougie:', e.message);
  }
});

export default router;
