import express from 'express';
import {
  handleUpdate,
  envoyerPredictionAvecBouton,
  analyserEtEnvoyerBougie,
  resetSequence
} from '../controllers/marketController.js';

import bot from '../bot.js';
import { genererNouvellePrediction } from '../utils/prediction.js';
import WebSocket from 'ws';

const router = express.Router();
const anciensMessages = {}; // 🔁 Pour supprimer les anciens messages

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
  const action = query.data;

  await bot.answerCallbackQuery(query.id);

  // 🔁 Supprimer ancien message
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch (e) {
    console.warn('⚠️ Erreur suppression message bouton :', e.message);
  }

  // 🔄 Nettoyage des anciens messages précédents
  if (anciensMessages[chatId]) {
    for (const id of anciensMessages[chatId]) {
      try {
        await bot.deleteMessage(chatId, id);
      } catch (e) {
        console.warn(`❌ Erreur suppression message #${id} :`, e.message);
      }
    }
    anciensMessages[chatId] = [];
  }

  // 🔁 Nouvelle prédiction
  if (action === 'NOUVELLE_PREDICTION' || action === 'regenerer') {
    resetSequence();

    const { texte, mouvement } = genererNouvellePrediction();
    let emoji = '⚪️ STABLE';
    if (/hausse/i.test(mouvement)) emoji = '🟢 BUY';
    else if (/baisse/i.test(mouvement)) emoji = '🔴 SELL';

    const message = `${emoji} *Signal Prédictif*\n\n${texte}`;

    const sent = await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔁 Nouvelle Prédiction', callback_data: 'regenerer' }
          ],
          [
            { text: '📉 Voir Bougie', callback_data: 'NOUVELLE_ANALYSE' },
            { text: '📊 Voir Statistiques', callback_data: 'VOIR_STATS' }
          ],
          [
            { text: '⚙️ Paramètres', callback_data: 'PARAMETRES' },
            { text: '❓ Aide', callback_data: 'AIDE' }
          ]
        ]
      }
    });

    anciensMessages[chatId] = [sent.message_id];

    // ⏱️ Auto-suppression après 60 sec
    setTimeout(() => {
      bot.deleteMessage(chatId, sent.message_id).catch(err => {
        console.warn('❌ Erreur suppression prédiction :', err.message);
      });
    }, 60000);
  }

  // 📉 Nouvelle analyse de bougie simulée
  if (action === 'NOUVELLE_ANALYSE') {
    const bougieTest = {
      open: (Math.random() * 100).toFixed(2),
      close: (Math.random() * 100).toFixed(2),
      high: (Math.random() * 100).toFixed(2),
      low: (Math.random() * 100).toFixed(2)
    };
    await analyserEtEnvoyerBougie(chatId, bougieTest);
  }

  // 📊 Statistiques
  if (action === 'VOIR_STATS') {
    const msg = await bot.sendMessage(chatId, '📊 *Aucune statistique disponible pour le moment.*', {
      parse_mode: 'Markdown'
    });
    anciensMessages[chatId].push(msg.message_id);
  }

  // ⚙️ Paramètres
  if (action === 'PARAMETRES') {
    const msg = await bot.sendMessage(chatId, '⚙️ *Les paramètres seront bientôt disponibles.*', {
      parse_mode: 'Markdown'
    });
    anciensMessages[chatId].push(msg.message_id);
  }

  // ❓ Aide
  if (action === 'AIDE') {
    const msg = await bot.sendMessage(chatId, '❓ *Cliquez sur les boutons ci-dessus pour interagir avec le bot.*', {
      parse_mode: 'Markdown'
    });
    anciensMessages[chatId].push(msg.message_id);
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
      console.warn('⛔ Bougie invalide reçue :', bougie);
      return;
    }

    await analyserEtEnvoyerBougie(null, bougie);
  } catch (e) {
    console.error('❌ Erreur WebSocket Bougie:', e.message);
  }
});

export default router;
