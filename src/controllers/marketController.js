import { analyseMarche, analyserBougie } from '../services/groqService.js';
import { envoyerMessage } from '../services/telegramService.js';
import { genererNouvellePrediction } from '../utils/prediction.js'; // ✅ Import ajouté

let sequence = [];
let chatIdMemo = null;

// ✅ Fonction pour envoyer une prédiction avec boutons
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

// Fonction appelée quand tu reçois un message Telegram
export async function gererMessageTelegram(msg) {
  const chatId = msg.chat.id;
  chatIdMemo = chatId;
  await envoyerMessage(chatId, "👋 Prêt à recevoir les signaux du marché !");
}

// Fonction appelée à chaque nouvelle valeur du WebSocket
export async function processIncomingData(valeur) {
  if (!chatIdMemo) return;
  if (typeof valeur !== 'number') return;

  sequence.push(valeur);
  if (sequence.length > 10) sequence.shift();

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

// ✅ Fonction d’analyse de bougie acceptant un chatId facultatif
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

export function resetSequence() {
  sequence = [];
}

export default {
  gererMessageTelegram,
  processIncomingData,
  analyserEtEnvoyerBougie,
  envoyerPredictionAvecBouton, // ✅ Ajouté à l’export
  resetSequence
};
