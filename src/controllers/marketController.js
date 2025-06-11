import bot from '../bot.js';
import { genererNouvellePrediction } from '../utils/prediction.js';

const anciensMessages = {}; // Pour suivre les anciens messages par utilisateur

// Réinitialise une séquence (à adapter selon ton besoin)
export const resetSequence = () => {
  // Logique à ajouter ici si nécessaire
};

// 📩 Gère toutes les mises à jour Telegram (message ou bouton)
export async function handleUpdate(update) {
  if (update.message) {
    await gererMessageTelegram(update.message);
  } else if (update.callback_query) {
    await gererCallbackQuery(update.callback_query);
  }
}

// 📨 Gère les messages normaux
async function gererMessageTelegram(message) {
  const chatId = message.chat.id;
  const text = message.text || '';

  if (text === '/start') {
    await envoyerPredictionAvecBouton(chatId);
  } else {
    await bot.sendMessage(chatId, `👋 Commande non reconnue : *${text}*`, {
      parse_mode: 'Markdown'
    });
  }
}

// 🔘 Gère les boutons cliqués (callback_query)
async function gererCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const action = callbackQuery.data;

  await bot.answerCallbackQuery(callbackQuery.id);

  // Nettoie l'ancien message bouton
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch (e) {
    console.warn(`⚠️ Erreur suppression bouton :`, e.message);
  }

  // Répond selon le bouton cliqué
  if (action === 'acheter') {
    await envoyerMessage(chatId, `🟢 Vous avez choisi *Acheter*.`);
  } else if (action === 'vendre') {
    await envoyerMessage(chatId, `🔴 Vous avez choisi *Vendre*.`);
  } else if (action === 'attendre') {
    await envoyerMessage(chatId, `⏸️ Vous avez choisi *Attendre*.`);
  } else {
    await envoyerMessage(chatId, `✅ Action reçue : ${action}`);
  }
}

// 🔮 Envoie une nouvelle prédiction avec boutons
export async function envoyerPredictionAvecBouton(chatId) {
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
          { text: '🟢 Acheter', callback_data: 'acheter' },
          { text: '🔴 Vendre', callback_data: 'vendre' },
          { text: '⏸️ Attendre', callback_data: 'attendre' }
        ]
      ]
    }
  });

  anciensMessages[chatId] = [sent.message_id];

  // ⏱️ Auto-suppression après 60 sec
  setTimeout(() => {
    bot.deleteMessage(chatId, sent.message_id).catch(err =>
      console.warn('❌ Erreur suppression prédiction :', err.message)
    );
  }, 60000);
}

// 📉 Analyse et envoie une bougie simulée ou réelle
export async function analyserEtEnvoyerBougie(chatId, bougie) {
  const { open, high, low, close } = bougie;
  const message = `📉 *Analyse Bougie*\n\n🟢 Open: ${open}\n🔺 High: ${high}\n🔻 Low: ${low}\n🔴 Close: ${close}`;

  if (chatId) {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } else {
    console.log(message);
  }
}

// Utilitaire d'envoi
async function envoyerMessage(chatId, text) {
  await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}
