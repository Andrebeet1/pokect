let valeurs = [];

/**
 * 📥 Ajoute une valeur numérique avec timestamp
 */
export function ajouterValeur(valeur) {
  const num = parseFloat(valeur);

  if (typeof num !== 'number' || isNaN(num)) {
    console.warn('⛔ Valeur ignorée (non numérique ou invalide) :', valeur);
    return;
  }

  valeurs.push({
    valeur: num,
    timestamp: Date.now()
  });
}

/**
 * 🕯️ Construit une bougie à partir des valeurs accumulées
 * puis réinitialise la liste.
 */
export function construireBougieEtReinitialiser() {
  if (valeurs.length === 0) return null;

  const liste = valeurs.map(v => v.valeur);
  const open = liste[0];
  const close = liste[liste.length - 1];
  const high = Math.max(...liste);
  const low = Math.min(...liste);

  const bougie = { open, high, low, close };

  // Vérifie que la bougie est complète
  if (
    [open, high, low, close].some(val => typeof val !== 'number' || isNaN(val))
  ) {
    console.error('⛔ Bougie invalide ou incomplète :', bougie);
    valeurs.length = 0; // Réinitialise malgré tout
    return null;
  }

  valeurs.length = 0; // Réinitialise proprement
  return bougie;
}
