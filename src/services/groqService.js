import axios from 'axios';
import { GROQ_API_KEY } from '../config.js';

// 🔍 Analyse une séquence de valeurs
export async function analyseMarche(sequence) {
  const prompt = `Voici une séquence : ${sequence.join(', ')}.\nAnalyse : hausse, baisse ou stable + durée en minutes.\nRéponds ainsi :\nMouvement : Hausse/Baisse/Stable\nDurée : x minutes`;

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Erreur API Groq:', error.response?.data || error.message);
    return 'Erreur lors de l’analyse';
  }
}

// 🕯️ Analyse une bougie (open, high, low, close)
export async function analyserBougie(bougie) {
  const { open, high, low, close } = bougie;

  const prompt = `Analyse cette bougie :
- Ouverture (Open) : ${open.toFixed(2)}
- Haut (High) : ${high.toFixed(2)}
- Bas (Low) : ${low.toFixed(2)}
- Clôture (Close) : ${close.toFixed(2)}

Indique si c’est une bougie haussière ou baissière, la force du mouvement, et une brève interprétation. Réponds en une phrase.`;

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Erreur API Groq (bougie):', error.response?.data || error.message);
    return 'Erreur lors de l’analyse de la bougie';
  }
}
