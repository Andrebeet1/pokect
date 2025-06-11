import { analyseMarche } from '../services/groqService.js';

// 📊 Génère une séquence de valeurs aléatoires avec 14 décimales
export function creerSequenceAleatoire(taille = 4) {
  return Array.from({ length: taille }, () =>
    parseFloat((Math.random() * 100).toFixed(14))
  );
}

// 🤖 Génère une prédiction en analysant la séquence aléatoire
export async function genererNouvellePrediction() {
  const sequence = creerSequenceAleatoire();

  let texte;
  try {
    texte = await analyseMarche(sequence);
    if (typeof texte !== 'string') {
      throw new Error('Réponse non valide');
    }
  } catch (err) {
    console.error('Erreur lors de la génération de la prédiction:', err.message);
    texte = 'Erreur lors de la prédiction';
  }

  // 🧠 Détection du mouvement basé sur le texte
  let mouvement = 'stable';
  if (/hausse/i.test(texte)) mouvement = 'hausse';
  else if (/baisse/i.test(texte)) mouvement = 'baisse';

  return { texte, mouvement };
}
