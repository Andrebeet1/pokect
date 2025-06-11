let valeurs = [];

/**
 * 📥 Ajoute une valeur numérique avec timestamp
 * @param {number|string} valeur - La valeur à ajouter
 */
export function ajouterValeur(valeur) {
  const num = parseFloat(valeur);

  if (isNaN(num)) {
    console.warn('⛔ Valeur ignorée (non numérique ou invalide) :', valeur);
    return;
  }

  valeurs.push({
    valeur: num,
    timestamp: Date.now()
  });
}

/**
 * 🕯️ Construit une bougie OHLC à partir des valeurs accumulées
 * puis réinitialise le tableau des valeurs.
 * @returns {{open: number, high: number, low: number, close: number} | null}
 */
export function construireBougieEtReinitialiser() {
  if (valeurs.length === 0) {
    console.warn('⚠️ Aucune valeur pour construire une bougie.');
    return null;
  }

  const liste = valeurs.map(v => v.valeur);
  const open = liste[0];
  const close = liste[liste.length - 1];
  const high = Math.max(...liste);
  const low = Math.min(...liste);

  const bougie = { open, high, low, close };

  const invalid = [open, high, low, close].some(
    val => typeof val !== 'number' || isNaN(val)
  );

  if (invalid) {
    console.error('⛔ Bougie invalide ou incomplète :', bougie);
    valeurs.length = 0; // Réinitialise même si invalide
    return null;
  }

  valeurs.length = 0; // Réinitialise les données
  return bougie;
}
