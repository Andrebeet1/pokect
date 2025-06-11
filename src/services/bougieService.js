let valeurs = [];

export function ajouterValeur(valeur) {
  valeurs.push({
    valeur,
    timestamp: Date.now()
  });
}

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
