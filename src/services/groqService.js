import axios from 'axios';
import { GROQ_API_KEY } from '../config.js';

// 🔍 Analyse une séquence de valeurs
export async function analyseMarche(sequence) {
  const prompt = `
Voici une séquence de prix : ${sequence.join(', ')}.
En te basant sur la philosophie du trading (support, résistance, tendance), donne-moi uniquement :
Buy : [prix]
Sell : [prix]
Action : [Acheter maintenant / Vendre maintenant / Attendre]
Pas d'explication, uniquement ces trois lignes.
  `;

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

    const prompt = `
Voici une bougie :
- Open : ${open.toFixed(2)}
- High : ${high.toFixed(2)}
- Low : ${low.toFixed(2)}
- Close : ${close.toFixed(2)}

En te basant sur la philosophie du trading (support, résistance, tendance), donne-moi uniquement :
Buy : [prix]
Sell : [prix]
Action : [Acheter maintenant / Vendre maintenant / Attendre]
Pas d'explication, uniquement ces trois lignes.
    `;

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