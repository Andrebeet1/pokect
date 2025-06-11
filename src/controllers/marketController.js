import { analyseMarche, analyserBougie } from '../services/groqService.js';
import { envoyerMessage } from '../services/telegramService.js';
import { genererNouvellePrediction } from '../utils/prediction.js'; // ✅ OK

let sequence = [];
let chatIdMemo = null;

// ✅ Envoie une prédiction avec des boutons interactifs
export async function envoyerPredictionAvecBouton() {
  if (!chatIdMemo) return;

  const { texte } = await genererNouvellePrediction();

  const message = `🔮 *Nouvelle Prédiction*\n${texte}`;
  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📈 Acheter', callback_data: 'acheter' },
          { text: '📉 Vendre', callback_data: 'vendre' },
          { text: '⏸️ Attendre', callback_data: 'attendre' }
        ]
      ]
    }
  };

  await envoyerMessage(chatIdMemo, message, '📩 Prédiction envoyée avec boutons', options);
}

// ✅ Gère les messages Telegram (start, test, etc.)
export async function gererMessageTelegram(msg) {
  const chatId = msg.chat.id;
  chatIdMemo = chatId;

  await envoyerMessage(chatId, "👋 Prêt à recevoir les signaux du marché !");
}

// ✅ Reçoit des valeurs (par exemple via WebSocket) pour analyse en séquence
export async function processIncomingData(valeur) {
  if (!chatIdMemo || typeof valeur !== 'number') return;

  sequence.push(valeur);
  if (sequence.length > 10) sequence.shift(); // Garde les 10 dernières

  const resultat = await analyseMarche(sequence);

  const buy = resultat.match(/Buy\s*:\s*(.*)/i)?.[1]?.trim() || '';
  const sell = resultat.match(/Sell\s*:\s*(.*)/i)?.[1]?.trim() || '';
  const action = resultat.match(/Action\s*:\s*(.*)/i)?.[1]?.trim() || '';

  const message =
    `📈 *Signal marché*\n` +
    `Buy 🟩🟩🟩 : ${buy}\n` +
    `Sell 🟥🟥🟥 : ${sell}\n` +
    `*Action* : ${action}`;

  await envoyerMessage(chatIdMemo, message, `Signal marché : Buy ${buy} / Sell ${sell} / Action : ${action}`);
}

// ✅ Analyse d’une seule bougie avec affichage clair
export async function analyserEtEnvoyerBougie(chatId, bougie) {
  const cibleChatId = chatId || chatIdMemo;
  if (!cibleChatId) return;

  const resultat = await analyserBougie(bougie);

  const buy = resultat.match(/Buy\s*:\s*(.*)/i)?.[1]?.trim() || '';
  const sell = resultat.match(/Sell\s*:\s*(.*)/i)?.[1]?.trim() || '';
  const action = resultat.match(/Action\s*:\s*(.*)/i)?.[1]?.trim() || '';

  const message =
    `🕯️ *Analyse Bougie*\n` +
    `Open: ${bougie.open}\n` +
    `High: ${bougie.high}\n` +
    `Low: ${bougie.low}\n` +
    `Close: ${bougie.close}\n\n` +
    `Buy 🟩🟩🟩 : ${buy}\n` +
    `Sell 🟥🟥🟥 : ${sell}\n` +
    `*Action* : ${action}`;

  await envoyerMessage(cibleChatId, message, `Analyse bougie : Buy ${buy} / Sell ${sell} / Action : ${action}`);
}

// ✅ Reset manuel de la séquence
export function resetSequence() {
  sequence = [];
}
