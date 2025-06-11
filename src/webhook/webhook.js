import express from 'express';
import { handleUpdate, envoyerPredictionAvecBouton, envoyerAnalyseBougie, resetSequence } from '../controllers/marketController.js';
import bot from '../bot.js';
import { genererNouvellePrediction } from '../utils/prediction.js';

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
    
    // ✅ Réinitialiser la séquence pour une nouvelle prédiction propre
    resetSequence();

    // Génère et envoie une nouvelle prédiction
    await envoyerPredictionAvecBouton(chatId);
  }

  if (query.data === 'regenerer') {
    await bot.answerCallbackQuery(query.id);

    const result = genererNouvellePrediction();
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

// 📡 Simule un WebSocket pour recevoir des ticks avec données OHLC
import WebSocket from 'ws';
const ws = new WebSocket('wss://exemple-websocket/flux');

// À chaque tick, exécuter une analyse de bougie
ws.on('message', async (data) => {
  try {
    const tick = JSON.parse(data);

    // Exemple de données de bougie : adapte selon ta source réelle
    const bougie = {
      open: tick.open,
      high: tick.high,
      low: tick.low,
      close: tick.close
    };

    // Appelle analyse Groq bougie
    await envoyerAnalyseBougie(null, bougie); // null = pas de chatId (optionnel si tu veux envoyer à chatIdMemo)
  } catch (e) {
    console.error('Erreur WebSocket Bougie:', e.message);
  }
});

export default router;
