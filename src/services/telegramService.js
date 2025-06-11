import bot from '../bot.js';

export function envoyerMessage(chatId, texte, mouvement) {
  let emoji = '⚪️ STABLE';

  if (/hausse/i.test(mouvement)) emoji = '🟢 BUY';
  else if (/baisse/i.test(mouvement)) emoji = '🔴 SELL';

  const message = `${emoji}\n\n${texte}`;
  return bot.sendMessage(chatId, message);
}
