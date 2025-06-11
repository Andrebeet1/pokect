import { analyseMarche } from '../services/groqService.js';
import { envoyerMessage } from '../services/telegramService.js';

let sequence = [];
let chatIdMemo = null; // Mémoriser le dernier chatId pour WebSocket

// Traite les messages Telegram (webhook)
export async function handleUpdate(update) {
  try {
    const chatId = update?.message?.chat?.id;
    if (!chatId) return;

    chatIdMemo = chatId; // Mémoriser pour les updates WebSocket

    const valeur = Math.random() * 100; // Valeur fictive à remplacer par des vraies données
    sequence.push(valeur);
    if (sequence.length > 10) sequence.shift();

    const resultat = await analyseMarche(sequence);
    await envoyerMessage(chatId, resultat, resultat);
  } catch (e) {
    console.error('❌ Erreur dans handleUpdate:', e.message);
  }
}

// Traite les valeurs reçues du WebSocket
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
