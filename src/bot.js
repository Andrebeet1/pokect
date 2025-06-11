import { analyseMarche } from './services/groqService.js';
import { envoyerMessage } from './services/telegramService.js';
import bot from './bot.js';

let sequence = [];

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  // Génère une nouvelle valeur aléatoire
  const valeur = Math.random() * 100;
  sequence.push(valeur);
  if (sequence.length > 10) sequence.shift();

  try {
    const resultat = await analyseMarche(sequence);
    await envoyerMessage(chatId, resultat, resultat);
    await bot.answerCallbackQuery(query.id); // pour éviter le loading infini
  } catch (error) {
    console.error('Erreur dans callback_query:', error);
    await bot.sendMessage(chatId, '❌ Erreur lors de la génération de prédiction.');
  }
});
