// ═══════════════════════════════════════
// TMDB API — The Movie Database
// Récupère les affiches des films automatiquement
// ═══════════════════════════════════════

const API_KEY = 'cb2a8d10ec2369773ee25a2588e6b021'; // ← mets ta clé ici
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w342'; // w342 = bonne résolution

// Cache pour éviter de refaire les mêmes requêtes
const cache = new Map();

// Chercher un film par titre et récupérer l'URL de son affiche
export async function fetchAffiche(title) {
  if (cache.has(title)) return cache.get(title);

  try {
    const res = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&language=fr-FR`
    );
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const film = data.results[0];
      const url = film.poster_path ? `${IMG_URL}${film.poster_path}` : null;
      cache.set(title, url);
      return url;
    }
  } catch (err) {
    console.warn(`TMDB: impossible de charger l'affiche pour "${title}"`);
  }

  cache.set(title, null);
  return null;
}

// Charger toutes les affiches d'une liste de films
export async function fetchToutesAffiches(films) {
  const resultats = {};

  await Promise.all(
    films.map(async (film) => {
      const url = await fetchAffiche(film.title);
      resultats[film.id] = url;
    })
  );

  return resultats;
}
