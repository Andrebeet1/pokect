import { analyseMarche } from '../services/groqService.js';
import { envoyerMessage } from '../services/telegramService.js';
import bot from '../bot.js'; // Assure-toi que ce fichier exporte bien `bot` en tant qu'objet

let sequence = [];
let chatIdMemo = null; // Mémoriser le dernier chatId pour WebSocket

// 🔁 Génère une nouvelle prédiction et envoie avec le bouton
async function envoyerPredictionAvecBouton(chatId) {
  const valeur = Math.random() * 100;
  sequence.push(valeur);
  if (sequence.length > 10) sequence.shift();

  const resultat = await analyseMarche(sequence);
  await envoyerMessage(chatId, resultat, resultat);

  // Envoyer le bouton de régénération
  await bot.sendMessage(chatId, '🔁 Générer une autre prédiction ?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔁 Nouvelle prédiction', callback_data: 'NOUVELLE_PREDICTION' }]
      ]
    }
  });
}

// 📩 Traite les messages Telegram (webhook)
export async function handleUpdate(update) {
  try {
    const chatId = update?.message?.chat?.id || update?.callback_query?.message?.chat?.id;
    if (!chatId) return;

    chatIdMemo = chatId;

    // Si clic sur le bouton "Nouvelle prédiction"
    if (update.callback_query?.data === 'NOUVELLE_PREDICTION') {
      return await envoyerPredictionAvecBouton(chatId);
    }

    // Si message texte (par exemple /start)
    if (update.message?.text) {
      return await envoyerPredictionAvecBouton(chatId);
    }
  } catch (e) {
    console.error('❌ Erreur dans handleUpdate:', e.message);
  }
}

// 📊 Traite les valeurs reçues du WebSocket
export async function processIncomingData(valeur) {
  try {
    if (!chatIdMemo) return; // Aucun utilisateur actif pour répondre

    sequence.push(valeur);
    if (sequence.length > 10) sequence.shift();

    const resultat = await analyseMarche(sequence);
    await envoyerMessage(chatIdMemo, resultat, resultat);
  } catch (e) {
    console.error('❌ Erreur dans processIncomingData:', e.message);
  }
}
