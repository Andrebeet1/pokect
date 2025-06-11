import { analyseMarche, analyserBougie } from '../services/groqService.js';
import { envoyerMessage } from '../services/telegramService.js';
import bot from '../bot.js';

let sequence = [];
let chatIdMemo = null; // Mémoriser le dernier chatId pour WebSocket

// 🔁 Réinitialise la séquence (appelée à chaque nouvelle prédiction)
export function resetSequence() {
  sequence = [];
}

// Helper pour supprimer un message après un délai
async function supprimerMessageApres(chatId, messageId, delay = 60000) {
  setTimeout(() => {
    bot.deleteMessage(chatId, messageId).catch((err) => {
      console.warn('❌ Erreur suppression message :', err.message);
    });
  }, delay);
}

// 🔁 Génère une prédiction à partir d'une séquence de valeurs
export async function envoyerPredictionAvecBouton(chatId) {
  try {
    const valeur = Math.random() * 100;
    sequence.push(valeur);
    if (sequence.length > 10) sequence.shift();

    const resultat = await analyseMarche(sequence);

    // Envoie le message principal (avec parse_mode Markdown pour mise en forme)
    const sentMessage = await bot.sendMessage(chatId, `📈 *Prédiction :*\n${resultat}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔁 Nouvelle prédiction', callback_data: 'NOUVELLE_PREDICTION' }]
        ]
      }
    });

    // Supprime le message après 60 secondes
    await supprimerMessageApres(chatId, sentMessage.message_id, 60000);

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
      const id = chatId || chatIdMemo;

      const messageTexte = 
        `🕯️ *Analyse Bougie :*\n` +
        `Open: ${bougie.open}\n` +
        `High: ${bougie.high}\n` +
        `Low: ${bougie.low}\n` +
        `Close: ${bougie.close}\n\n` +
        `*Résultat:* ${resultat}`;

      const sentMessage = await bot.sendMessage(id, messageTexte, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔁 Nouvelle Prédiction', callback_data: 'NOUVELLE_PREDICTION' }]
          ]
        }
      });

      // Supprime le message après 60 secondes
      await supprimerMessageApres(id, sentMessage.message_id, 60000);
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
