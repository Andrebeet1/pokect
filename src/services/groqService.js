import axios from 'axios';
import { GROQ_API_KEY } from '../config.js';

// 🔍 Analyse une séquence de valeurs
export async function analyseMarche(sequence) {
  const prompt = `Voici une séquence de valeurs numériques : ${sequence.join(', ')}.\nAnalyse et indique :\n- Mouvement : Hausse, Baisse ou Stable\n- Durée estimée en minutes.\nFormat de réponse :\nMouvement : [Hausse/Baisse/Stable]\nDurée : [x] minutes`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erreur API Groq (analyseMarche):', error.response?.data || error.message);
    return '❌ Erreur lors de l’analyse du marché.';
  }
}

// 🕯️ Analyse une bougie (open, high, low, close)
export async function analyserBougie(bougie) {
  try {
    const { open, high, low, close } = bougie;

    // Vérification des valeurs numériques
    if ([open, high, low, close].some(val => typeof val !== 'number' || isNaN(val))) {
      console.error('❌ Bougie invalide reçue :', bougie);
      return '❌ Bougie invalide (valeurs manquantes ou incorrectes).';
    }

    const prompt = `Analyse cette bougie :
- Ouverture (Open) : ${open.toFixed(2)}
- Haut (High) : ${high.toFixed(2)}
- Bas (Low) : ${low.toFixed(2)}
- Clôture (Close) : ${close.toFixed(2)}

Indique si c’est une bougie haussière ou baissière, la force du mouvement et une brève interprétation. Réponds en une phrase.`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erreur API Groq (analyserBougie):', error.response?.data || error.message);
    return '❌ Erreur lors de l’analyse de la bougie.';
  }
}
