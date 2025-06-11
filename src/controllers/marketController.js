import { analyseMarche, analyserBougie } from '../services/groqService.js';
import { envoyerMessage } from '../services/telegramService.js';
import bot from '../bot.js';

let sequence = [];
let chatIdMemo = null; // Mémoriser le dernier chatId pour WebSocket

// 🔁 Réinitialise la séquence (appelée à chaque nouvelle prédiction)
export function resetSequence() {
  sequence = [];
}

// 🔁 Génère une prédiction à partir d'une séquence de valeurs
export async function envoyerPredictionAvecBouton(chatId) {
  try {
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
  } catch (e) {
    console.error('❌ Erreur dans envoyerPredictionAvecBouton:', e.message);
  }
}

// 🕯️ Analyse automatique d'une bougie (OHLC)
export async function envoyerAnalyseBougie(chatId = null, bougie) {
  try {
    if (
      !bougie ||
      typeof bougie.open !== 'number' ||
      typeof bougie.close !== 'number'
    ) {
      console.warn('⛔ Bougie invalide ou incomplète reçue :', bougie);
      return;
    }

    const resultat = await analyserBougie(bougie);

    // Envoie à un utilisateur s’il y a un chatId
    if (chatId || chatIdMemo) {
      await envoyerMessage(chatId || chatIdMemo, '🕯️ Analyse bougie', resultat);
    }
  } catch (e) {
    console.error('❌ Erreur dans envoyerAnalyseBougie:', e.message);
  }
}

// 📩 Traite les messages Telegram
export async function handleUpdate(update) {
  try {
    const chatId =
      update?.message?.chat?.id || update?.callback_query?.message?.chat?.id;
    if (!chatId) return;

    chatIdMemo = chatId;

    if (update.callback_query?.data === 'NOUVELLE_PREDICTION') {
      return await envoyerPredictionAvecBouton(chatId);
    }

    if (update.message?.text) {
      return await envoyerPredictionAvecBouton(chatId);
    }
  } catch (e) {
    console.error('❌ Erreur dans handleUpdate:', e.message);
  }
}

// 📊 Traite les valeurs reçues du WebSocket (valeurs simples)
export async function processIncomingData(valeur) {
  try {
    if (!chatIdMemo) return;

    if (typeof valeur !== 'number') {
      console.warn('⛔ Valeur WebSocket ignorée (non numérique) :', valeur);
      return;
    }

    sequence.push(valeur);
    if (sequence.length > 10) sequence.shift();

    const resultat = await analyseMarche(sequence);
    await envoyerMessage(chatIdMemo, resultat, resultat);
  } catch (e) {
    console.error('❌ Erreur dans processIncomingData:', e.message);
  }
}
