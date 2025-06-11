let valeurs = [];

/**
 * Ajoute une valeur numérique avec timestamp
 */
export function ajouterValeur(valeur) {
  if (typeof valeur !== 'number' || isNaN(valeur)) {
    console.warn('⛔ Valeur ignorée (non numérique ou invalide) :', valeur);
    return;
  }

  valeurs.push({
    valeur,
    timestamp: Date.now()
  });
}

/**
 * Construit une bougie à partir des valeurs accumulées
 * et réinitialise la liste.
 */
export function construireBougieEtReinitialiser() {
  if (valeurs.length === 0) return null;

  const liste = valeurs.map(v => v.valeur);
  const open = liste[0];
  const close = liste[liste.length - 1];
  const high = Math.max(...liste);
  const low = Math.min(...liste);

  const bougie = { open, high, low, close };

  valeurs = []; // Réinitialise la bougie pour la prochaine
  return bougie;
}
