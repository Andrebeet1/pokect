import { analyseMarche } from '../services/groqService.js';

export function creerSequenceAleatoire(taille = 4) {
  return Array.from({ length: taille }, () =>
    parseFloat((Math.random() * 100).toFixed(14))
  );
}

export async function genererNouvellePrediction() {
  const sequence = creerSequenceAleatoire();

  const texte = await analyseMarche(sequence);

  // Détecter le mouvement dans le texte
  let mouvement = 'stable';
  if (/hausse/i.test(texte)) mouvement = 'hausse';
  else if (/baisse/i.test(texte)) mouvement = 'baisse';

  return { texte, mouvement };
}
