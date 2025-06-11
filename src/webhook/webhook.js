import express from 'express';
import { handleUpdate } from '../controllers/marketController.js';
import bot from '../bot.js';
import { genererNouvellePrediction } from '../utils/prediction.js'; // adapte si le chemin diffère

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

// Gestion du bouton "🔁 Nouvelle prédiction"
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'regenerer') {
    await bot.answerCallbackQuery(query.id); // pour supprimer le "loading..."

    const result = genererNouvellePrediction(); // génère une prédiction (texte, mouvement)
    const { texte, mouvement } = result;

    // Choisir l’emoji en fonction du mouvement
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

export default router;
