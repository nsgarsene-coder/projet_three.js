import {
  lancerAmbiance,
  jouerCorrect,
  jouerWrong,
  jouerGameover,
  jouerVictoire,
} from './sound.js';
import './style.css';
import gsap from 'gsap';
import {
  camera,
  controls,
  updateControls,
  addToLoop,
  startLoop,
  activerFPS,
} from './scene.js';
import {
  buildBibliotheque,
  livresFilms,
  objetsIndices,
  createLumieres,
} from './bibliotheque.js';
import { films, getFilmById, checkAnswer } from '../data/films.js';

// DOM
const loader = document.getElementById('loader');
const loaderFleche = document.getElementById('loader-fleche');
const accueil = document.getElementById('accueil');
const btnJouer = document.getElementById('btn-jouer');
const jeu = document.getElementById('jeu');
const timerEl = document.getElementById('timer-value');
const scoreEl = document.getElementById('score-value');
const zoneEl = document.getElementById('zone-value');
const interfaceIndice = document.getElementById('interface-indice');
const indiceTexte = document.getElementById('indice-texte');
const btnFermerIndice = document.getElementById('btn-fermer-indice');
const interfaceReponse = document.getElementById('interface-reponse');
const inputReponse = document.getElementById('input-reponse');
const btnValider = document.getElementById('btn-valider');
const btnAnnuler = document.getElementById('btn-annuler');
const reponseFeedback = document.getElementById('reponse-feedback');
const carteResultat = document.getElementById('carte-resultat');
const btnContinuer = document.getElementById('btn-continuer');
const gameOver = document.getElementById('game-over');
const goScore = document.getElementById('go-score');
const btnRejouer = document.getElementById('btn-rejouer');
const victoire = document.getElementById('victoire');
const vScore = document.getElementById('v-score');
const btnRejouerV = document.getElementById('btn-rejouer-v');

// ÉTAT
let score = 0;
let timerInterval = null;
let filmActuel = null;
let filmsResolus = new Set();
let jeuActif = false;
let objetProche = null;

// ─── LOADER ───────────────────────────
function lancerLoader() {
  gsap.fromTo(
    loaderFleche,
    { y: -220, opacity: 0 },
    {
      y: window.innerHeight + 220,
      opacity: 1,
      duration: 1.4,
      ease: 'power2.in',
      onComplete: () =>
        gsap.to(loader, {
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            loader.classList.add('hidden');
            afficherAccueil();
          },
        }),
    }
  );
}

// ─── ACCUEIL ──────────────────────────
function afficherAccueil() {
  accueil.classList.remove('hidden');
  gsap.fromTo(
    '#accueil-content',
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.2, ease: 'power2.out' }
  );
}

btnJouer.addEventListener('click', lancerTransition);

// ─── TRANSITION ───────────────────────
function lancerTransition() {
  const transition = document.getElementById('transition');
  transition.classList.remove('hidden');
  Object.assign(transition.style, {
    width: '100vmax',
    height: '100vmax',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) scale(0)',
  });
  gsap.to(transition, {
    scale: 3,
    duration: 1.0,
    ease: 'power2.inOut',
    onComplete: () => {
      accueil.classList.add('hidden');
      initialiserJeu();
      gsap.to(transition, {
        opacity: 0,
        duration: 0.4,
        delay: 0.2,
        onComplete: () => transition.classList.add('hidden'),
      });
    },
  });
}

// ─── INIT JEU ─────────────────────────
function initialiserJeu() {
  jeu.classList.remove('hidden');
  jeuActif = true;

  // ─── Overlay pour entrer en mode FPS ───
  const btnEntrer = document.createElement('div');
  btnEntrer.id = 'btn-entrer';
  btnEntrer.innerHTML = `
    <div id="entrer-inner">
      <p>CLIQUER POUR ENTRER</p>
      <p id="entrer-sub">WASD pour avancer · SOURIS pour regarder</p>
    </div>
  `;
  document.body.appendChild(btnEntrer);

  btnEntrer.addEventListener('click', () => {
    controls.lock();
    lancerAmbiance();
  });

  controls.addEventListener('lock', () => {
    btnEntrer.classList.add('hidden');
  });

  controls.addEventListener('unlock', () => {
    if (
      jeuActif &&
      interfaceReponse.classList.contains('hidden') &&
      carteResultat.classList.contains('hidden')
    ) {
      btnEntrer.classList.remove('hidden');
    }
  });
  // ────────────────────────────────────────

  const updateBiblio = buildBibliotheque();
  const updateLumiere = createLumieres();

  addToLoop(updateControls);
  addToLoop(updateBiblio);
  addToLoop(updateLumiere);
  addToLoop(detecterProximite);
  startLoop();
  lancerTimer(180);
}

// ─── TIMER ────────────────────────────
function lancerTimer(secondes) {
  let restant = secondes;
  timerInterval = setInterval(() => {
    if (!jeuActif) return;
    restant--;
    const min = String(Math.floor(restant / 60)).padStart(2, '0');
    const sec = String(restant % 60).padStart(2, '0');
    timerEl.textContent = min + ':' + sec;
    if (restant <= 30) timerEl.classList.add('urgent');
    if (restant <= 0) {
      clearInterval(timerInterval);
      declencherGameOver();
    }
  }, 1000);
}

// ─── DÉTECTION PROXIMITÉ ──────────────
const DISTANCE = 2.5;

function detecterProximite() {
  if (!jeuActif) return;
  if (!interfaceReponse.classList.contains('hidden')) return;
  if (!carteResultat.classList.contains('hidden')) return;

  const pos = camera.position;
  let plusProche = null;
  let distMin = DISTANCE;

  objetsIndices.forEach((obj) => {
    const d = pos.distanceTo(obj.position);
    if (d < distMin) {
      distMin = d;
      plusProche = obj;
    }
  });

  livresFilms.forEach((livre) => {
    if (filmsResolus.has(livre.userData.filmId)) return;
    const d = pos.distanceTo(livre.position);
    if (d < distMin) {
      distMin = d;
      plusProche = livre;
    }
  });

  if (plusProche !== objetProche) {
    objetProche = plusProche;
    if (plusProche?.userData.estIndice) afficherIndice(plusProche);
    else if (plusProche?.userData.estFilm) {
      fermerIndice();
      ouvrirReponse(plusProche.userData.filmId);
    } else fermerIndice();
  }

  const z = camera.position.z;
  zoneEl.textContent = z < -6 ? 'C' : z < 6 ? 'B' : 'A';
}

// ─── INDICE ───────────────────────────
function afficherIndice(obj) {
  indiceTexte.textContent = obj.userData.indiceTexte;
  interfaceIndice.classList.remove('hidden');
  gsap.fromTo(
    interfaceIndice,
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.4 }
  );
}

function fermerIndice() {
  if (!interfaceIndice.classList.contains('hidden')) {
    gsap.to(interfaceIndice, {
      opacity: 0,
      y: 10,
      duration: 0.3,
      onComplete: () => interfaceIndice.classList.add('hidden'),
    });
  }
}

btnFermerIndice.addEventListener('click', fermerIndice);

// ─── RÉPONSE ──────────────────────────
function ouvrirReponse(filmId) {
  if (filmsResolus.has(filmId)) return;
  filmActuel = filmId;
  controls.unlock();
  interfaceReponse.classList.remove('hidden');
  reponseFeedback.textContent = '';
  inputReponse.value = '';
  gsap.fromTo(
    '#interface-reponse',
    { opacity: 0 },
    { opacity: 1, duration: 0.4 }
  );
  setTimeout(() => inputReponse.focus(), 100);
}

btnAnnuler.addEventListener('click', () => {
  interfaceReponse.classList.add('hidden');
  controls.lock();
});

inputReponse.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') validerReponse();
});

btnValider.addEventListener('click', validerReponse);

function validerReponse() {
  const reponse = inputReponse.value.trim();
  if (!reponse) return;

  if (checkAnswer(filmActuel, reponse)) {
    filmsResolus.add(filmActuel);
    const film = getFilmById(filmActuel);
    score += film.points;
    scoreEl.textContent = score;
    interfaceReponse.classList.add('hidden');
    afficherCarteFilm(film);
    jouerCorrect();

    // Griser le livre résolu
    livresFilms.forEach((livre) => {
      if (livre.userData.filmId === filmActuel) {
        livre.material.color.set(0x111111);
        livre.material.emissiveIntensity = 0;
      }
    });

    if (filmsResolus.size === films.length)
      setTimeout(declencherVictoire, 3000);
  } else {
    reponseFeedback.textContent = 'INCORRECT — RÉESSAIE';
    jouerWrong();
    gsap.to('#input-reponse', {
      x: 8,
      duration: 0.05,
      yoyo: true,
      repeat: 7,
      ease: 'power1.inOut',
      onComplete: () => gsap.set('#input-reponse', { x: 0 }),
    });
  }
}

// ─── CARTE FILM ───────────────────────
function afficherCarteFilm(film) {
  document.getElementById('film-poster').src = film.poster || '';
  document.getElementById('film-title').textContent = film.title;
  document.getElementById('film-year').textContent = film.year;
  document.getElementById('film-synopsis').textContent = film.synopsis;
  document.getElementById('film-cast').textContent = Array.isArray(film.cast)
    ? film.cast.join(', ')
    : film.cast || '';
  document.getElementById('film-points').textContent = '+' + film.points;
  carteResultat.classList.remove('hidden');
  gsap.fromTo(
    '#carte-inner',
    { scale: 0.9, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' }
  );
}

btnContinuer.addEventListener('click', () => {
  carteResultat.classList.add('hidden');
  controls.lock();
});

// ─── GAME OVER ────────────────────────
function declencherGameOver() {
  jeuActif = false;
  clearInterval(timerInterval);
  controls.unlock();
  goScore.textContent = score;
  jouerGameover();
  gameOver.classList.remove('hidden');
  gsap.fromTo(
    '#game-over-inner',
    { scale: 0.8, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.2)' }
  );
}

// ─── VICTOIRE ─────────────────────────
function declencherVictoire() {
  jeuActif = false;
  clearInterval(timerInterval);
  controls.unlock();
  vScore.textContent = score;
  jouerVictoire();
  victoire.classList.remove('hidden');
  gsap.fromTo(
    '#victoire-inner',
    { scale: 0.8, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.2)' }
  );
}

// ─── REJOUER ──────────────────────────
btnRejouer.addEventListener('click', () => location.reload());
btnRejouerV.addEventListener('click', () => location.reload());

// ─── DÉMARRAGE ────────────────────────
lancerLoader();
