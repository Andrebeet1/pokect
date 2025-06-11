import { analyseMarche, analyserBougie } from '../services/groqService.js';
import { envoyerMessage } from '../services/telegramService.js';
import bot from '../bot.js';

let sequence = [];
let chatIdMemo = null;
const MESSAGE_AUTO_DELETE_DELAY = 60000;

// 🔄 Réinitialise la séquence
export function resetSequence() {
  sequence = [];
}

// ⏳ Supprime un message après un délai donné
async function supprimerMessageApres(chatId, messageId, delay = MESSAGE_AUTO_DELETE_DELAY) {
  try {
    setTimeout(() => {
      bot.deleteMessage(chatId, messageId).catch((err) => {
        console.warn('⚠️ Erreur suppression message :', err.message);
      });
    }, delay);
  } catch (err) {
    console.error('❌ Erreur dans supprimerMessageApres :', err.message);
  }
}

// 🎯 Boutons principaux dans un menu clair
function getMenuPrincipal() {
  return {
    inline_keyboard: [
      [
        { text: '📊 Voir statistiques', callback_data: 'MENU_STATS' },
        { text: '⚙️ Paramètres', callback_data: 'MENU_SETTINGS' }
      ],
      [
        { text: '❓ Aide', callback_data: 'MENU_HELP' }
      ]
    ]
  };
}

// 🔮 Envoi prédiction avec bouton "Nouvelle prédiction"
export async function envoyerPredictionAvecBouton(chatId) {
  try {
    const valeur = Math.random() * 100;
    sequence.push(valeur);
    if (sequence.length > 10) sequence.shift();

    const resultat = await analyseMarche(sequence);
    const texte = `📈 *Prédiction :*\n${resultat}\n\n🔘 Utilisez les boutons pour naviguer.`;

    const sentMessage = await bot.sendMessage(chatId, texte, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔁 Nouvelle prédiction', callback_data: 'NOUVELLE_PREDICTION' }],
          [{ text: '🏠 Menu principal', callback_data: 'MENU_PRINCIPAL' }]
        ]
      }
    });

    await supprimerMessageApres(chatId, sentMessage.message_id);
  } catch (e) {
    console.error('❌ Erreur dans envoyerPredictionAvecBouton :', e.message);
  }
}

// 🕯️ Envoi analyse bougie + boutons navigation
export async function envoyerAnalyseBougie(chatId = null, bougie) {
  try {
    if (!bougie || typeof bougie.open !== 'number' || typeof bougie.close !== 'number') {
      console.warn('⚠️ Bougie invalide ou incomplète :', bougie);
      return;
    }

    const resultat = await analyserBougie(bougie);
    const id = chatId || chatIdMemo;
    if (!id) return;

    const messageTexte =
      `🕯️ *Analyse Bougie :*\n` +
      `Open: ${bougie.open}\n` +
      `High: ${bougie.high}\n` +
      `Low: ${bougie.low}\n` +
      `Close: ${bougie.close}\n\n` +
      `*Résultat:* ${resultat}\n\n` +
      `🔘 Utilisez les boutons ci-dessous pour naviguer.`;

    const sentMessage = await bot.sendMessage(id, messageTexte, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔁 Nouvelle prédiction', callback_data: 'NOUVELLE_PREDICTION' }],
          [{ text: '🏠 Menu principal', callback_data: 'MENU_PRINCIPAL' }]
        ]
      }
    });

    await supprimerMessageApres(id, sentMessage.message_id);
  } catch (e) {
    console.error('❌ Erreur dans envoyerAnalyseBougie :', e.message);
  }
}

// 📬 Gestion des interactions utilisateurs (messages + callback queries)
export async function handleUpdate(update) {
  try {
    const chatId = update?.message?.chat?.id || update?.callback_query?.message?.chat?.id;
    if (!chatId) return;

    chatIdMemo = chatId;

    const data = update.callback_query?.data;

    switch (data) {
      case 'NOUVELLE_PREDICTION':
        await envoyerPredictionAvecBouton(chatId);
        break;

      case 'MENU_PRINCIPAL':
        await bot.sendMessage(chatId, '🏠 *Menu principal*', {
          parse_mode: 'Markdown',
          reply_markup: getMenuPrincipal()
        });
        break;

      case 'MENU_STATS':
        // Ici tu peux appeler une fonction dédiée à l'affichage des stats
        await bot.sendMessage(chatId, '📊 *Statistiques en cours de développement...*');
        break;

      case 'MENU_SETTINGS':
        // Ici tu peux appeler une fonction dédiée aux paramètres
        await bot.sendMessage(chatId, '⚙️ *Paramètres en cours de développement...*');
        break;

      case 'MENU_HELP':
        await bot.sendMessage(chatId, '❓ *Aide*\n\nUtilisez les boutons pour naviguer dans le bot.\nPour toute question, contactez @ton_support.');
        break;

      default:
        if (update.message?.text) {
          // Par défaut, on envoie une prédiction
          await envoyerPredictionAvecBouton(chatId);
        }
        break;
    }
  } catch (e) {
    console.error('❌ Erreur dans handleUpdate :', e.message);
  }
}

// 🔄 Traitement des données entrantes WebSocket (ex: prix)
export async function processIncomingData(valeur) {
  try {
    if (!chatIdMemo) return;

    if (typeof valeur !== 'number') {
      console.warn('⚠️ Valeur WebSocket ignorée (non numérique) :', valeur);
      return;
    }

    sequence.push(valeur);
    if (sequence.length > 10) sequence.shift();

    const resultat = await analyseMarche(sequence);

    // Envoi simplifié (sans bouton)
    await envoyerMessage(chatIdMemo, `📈 Mise à jour marché :\n${resultat}`, `Mise à jour marché : ${resultat}`);
  } catch (e) {
    console.error('❌ Erreur dans processIncomingData :', e.message);
  }
}
