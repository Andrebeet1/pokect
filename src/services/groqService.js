import axios from 'axios';
import { GROQ_API_KEY } from '../config.js';

/**
 * [Access Node → CORE-HACKNET v2.1]
 *
 * User: ghost_13
 * Tunnel: wss://target-node.secure.net/socket
 * Protocol: SHA-256 handshake | Token obfuscation enabled
 *
 * Mission: Intercepter, décoder et analyser les paquets entrants/sortants via le WebSocket sécurisé ci-dessus.
 * Objectif :
 *   - Écouter les flux en temps réel
 *   - Identifier les patterns récurrents (ex: codes, valeurs, timestamps)
 *   - Générer une prédiction ou alerte basée sur l’intelligence comportementale
 *
 * Contraintes :
 *   - Connexion discrète, sans interférer
 *   - Limiter le cache mémoire pour éviter la détection
 *   - Utiliser uniquement du JS natif et WebSocket API (aucune lib tierce)
 *
 * Bonus 🔐 : Si un pattern critique (ex: value > x.00 ou spike dans le flux) est détecté,
 * activer la routine ghostTrigger() avec réponse stylée dans la console.
 *
 * [Inject your code below. Begin with stealth handshake.]
 */

/**
 * Analyse une séquence de valeurs issues d'un flux WebSocket sécurisé.
 */
export async function analyseMarche(sequence) {
  const prompt = `
[Access Node → CORE-HACKNET v2.1]

User: ghost_13  
Tunnel: wss://target-node.secure.net/socket  
Protocol: SHA-256 handshake | Token obfuscation enabled

> Mission: Intercepter, décoder et analyser les paquets entrants/sortants via le WebSocket sécurisé ci-dessus.  
> Objectif :  
  - Écouter les flux en temps réel  
  - Identifier les patterns récurrents (ex: codes, valeurs, timestamps)  
  - Générer une prédiction ou alerte basée sur l’intelligence comportementale

> Contraintes :  
  - Connexion discrète, sans interférer  
  - Limiter le cache mémoire pour éviter la détection  
  - Utiliser uniquement du JS natif et WebSocket API (auc value > x.00 ou spike dans le flux) est détecté, active la routine ghostTrigger() et affiche une alerte stylée dans la console.

[Attends uniquement le rapport d’analyse sous ce format :]
Pattern détecté : [décrire le motif ou la valeur]
Alerte : [true/false]
Routine : [ghostTrigger activé ou non]
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
    return '❌ Erreur lors de l’analyse du flux WebSocket.';
  }
}

// 🕯️ Optionnel : tu peux aussi modifier analyserBougie avec une ambiance similaire si tu veux
export async function analyserBougie(bougie) {
  try {
    const { open, high, low, close } = bougie;

    if ([open, high, low, close].some(val => typeof val !== 'number' || isNaN(val))) {
      console.error('❌ Bougie invalide reçue :', bougie);
      return '❌ Bougie invalide (valeurs manquantes ou incorrectes).';
    }

    const prompt = `
[Access Node → CORE-HACKNET v2.1]

User: ghost_13  
Tunnel: wss://target-node.secure.net/socket  
Protocol: SHA-256 handshake | Token obfuscation enabled

> Mission: Analyse et pattern recognition sur une bougie de flux sécurisé.
> Données :
- Open : ${open.toFixed(2)}
- High : ${high.toFixed(2)}
- Low : ${low.toFixed(2)}
- Close : ${close.toFixed(2)}

> Objectif :  
  - Repérer un pattern (ex: spike, range, signal fort)
  - Activer ghostPattern détecté : [xxx]
Alerte : [true/false]
Routine : [ghostTrigger activé ou non]
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