import { analyseMarche, analyserBougie } from '../services/groqService.js';
import { envoyerMessage } from '../services/telegramService.js';

let sequence = [];
let chatIdMemo = null;

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

  // Extraction Buy/Sell/Action
  const buy = resultat.match(/Buy\s*:\s*(.*)/i)?.[1]?.trim() || '';
  const sell = resultat.match(/Sell\s*:\s*(.*)/i)?.[1]?.trim() || '';
  const action = resultat.match(/Action\s*:\s*(.*)/i)?.[1]?.trim() || '';

  // Formatage avec emojis
  const message =
    `📈 *Signal marché*\n` +
    `Buy 🟩🟩🟩 : ${buy}\n` +
    `Sell 🟥🟥🟥 : ${sell}\n` +
    `*Action* : ${action}`;

  await envoyerMessage(chatIdMemo, message, `Signal marché : Buy ${buy} / Sell ${sell} / Action : ${action}`);
}

// Exemple d'analyse de bougie (optionnel)
export async function analyserEtEnvoyerBougie(bougie) {
  if (!chatIdMemo) return;
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

  await envoyerMessage(chatIdMemo, message, `Analyse bougie : Buy ${buy} / Sell ${sell} / Action : ${action}`);
}

export default {
  gererMessageTelegram,
  processIncomingData,
  analyserEtEnvoyerBougie
};