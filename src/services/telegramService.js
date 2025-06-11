import bot from '../bot.js';

const anciensMessagesParChat = {};

export async function envoyerMessage(chatId, texte, mouvement) {
  let emoji = '⚪️ STABLE';
  if (/hausse/i.test(mouvement)) emoji = '🟢 BUY';
  else if (/baisse/i.test(mouvement)) emoji = '🔴 SELL';

  const message = `${emoji}\n\n${texte}`;

  // 🧹 Supprimer anciens messages
  if (anciensMessagesParChat[chatId]) {
    for (const msgId of anciensMessagesParChat[chatId]) {
      try {
        await bot.deleteMessage(chatId, msgId);
      } catch (e) {
        console.warn(`❌ Échec suppression message ${msgId} :`, e.message);
      }
    }
  }

  try {
    // 📤 Envoyer message avec menu clair
    const sentMessage = await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔁 Nouvelle Prédiction',
              callback_data: 'NOUVELLE_PREDICTION'
            }
          ],
          [
            {
              text: '📊 Voir Statistiques',
              callback_data: 'VOIR_STATS'
            },
            {
              text: '⚙️ Paramètres',
              callback_data: 'PARAMETRES'
            }
          ],
          [
            {
              text: '❓ Aide',
              callback_data: 'AIDE'
            }
          ]
        ]
      }
    });

    anciensMessagesParChat[chatId] = [sentMessage.message_id];
    return sentMessage;

  } catch (e) {
    console.error('❌ Erreur dans envoyerMessage :', e.message);
  }
}
