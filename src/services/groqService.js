import axios from 'axios';
import { GROQ_API_KEY } from '../config.js';

// 🔍 Analyse une séquence de valeurs (marché)
export async function analyseMarche(sequence) {
  const prompt = `
Tu es un analyste financier basé sur le trading (support, résistance, tendance).
Voici une séquence de prix : ${sequence.join(', ')}.

Donne uniquement ces trois lignes :
Buy : [prix]
Sell : [prix]
Action : [Acheter maintenant / Vendre maintenant / Attendre]

Pas d'explication. Réponds uniquement au format demandé.
`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt.trim() }],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Erreur API Groq (analyseMarche):', error.response?.data || error.message);
    return '❌ Erreur lors de l’analyse du marché.';
  }
}

// 🕯️ Analyse d'une bougie (open, high, low, close)
export async function analyserBougie(bougie) {
  try {
    const { open, high, low, close } = bougie;

    // ✅ Validation de la bougie
    if ([open, high, low, close].some(val => typeof val !== 'number' || isNaN(val))) {
      console.error('❌ Bougie invalide reçue :', bougie);
      return '❌ Bougie invalide (valeurs manquantes ou incorrectes).';
    }

    const prompt = `
Tu es un analyste de bougies japonaises. Voici les données de la bougie :
- Open : ${open.toFixed(2)}
- High : ${high.toFixed(2)}
- Low : ${low.toFixed(2)}
- Close : ${close.toFixed(2)}

En te basant sur la philosophie du trading (support, résistance, tendance), donne uniquement :
Buy : [prix]
Sell : [prix]
Action : [Acheter maintenant / Vendre maintenant / Attendre]

Aucune explication. Réponds uniquement avec ces trois lignes.
`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt.trim() }],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Erreur API Groq (analyserBougie):', error.response?.data || error.message);
    return '❌ Erreur lors de l’analyse de la bougie.';
  }
}
