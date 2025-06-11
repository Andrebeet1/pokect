import bot from '../bot.js';

const anciensMessagesParChat = {};

// 📤 Envoie un message et gère l'interface Telegram
export async function envoyerMessage(chatId, texte, mouvement) {
  // 🧠 Déterminer l'emoji selon le mouvement
  let emoji = '⚪️ STABLE';
  if (/buy|hausse/i.test(mouvement)) {
    emoji = '🟩🟩🟩 BUY';
  } else if (/sell|baisse/i.test(mouvement)) {
    emoji = '🟥🟥🟥 SELL';
  }

  const message = `*${emoji}*\n\n${texte}`;

  // 🧹 Supprimer les anciens messages
  if (anciensMessagesParChat[chatId]) {
    for (const msgId of anciensMessagesParChat[chatId]) {
      try {
        await bot.deleteMessage(chatId, msgId);
      } catch (e) {
        console.warn(`⚠️ Impossible de supprimer le message ${msgId} :`, e.message);
      }
    }
  }

  try {
    // 📤 Envoi du nouveau message avec le menu
    const sentMessage = await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔁 Nouvelle Prédiction', callback_data: 'NOUVELLE_PREDICTION' }
          ],
          [
            { text: '📊 Voir Statistiques', callback_data: 'VOIR_STATS' },
            { text: '⚙️ Paramètres', callback_data: 'PARAMETRES' }
          ],
          [
            { text: '❓ Aide', callback_data: 'AIDE' }
          ]
        ]
      }
    });

    anciensMessagesParChat[chatId] = [sentMessage.message_id];
    return sentMessage;

  } catch (e) {
    console.error('❌ Erreur lors de l’envoi du message :', e.message);
    return null;
  }
}
