import * as THREE from 'three';
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
  scene,
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
let fleche = null;
let filmsResolus = new Set();
let jeuActif = false;
let objetProche = null;
let porteSortie = null;
let dernierBruit = 0;
document.getElementById('jeu').classList.add('hidden');
document.getElementById('game-over').classList.add('hidden');
document.getElementById('victoire').classList.add('hidden');
document.getElementById('interface-reponse').classList.add('hidden');
document.getElementById('carte-resultat').classList.add('hidden');

``;

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

  gsap.from('#accueil-content', {
    opacity: 0,
    y: 50,
    duration: 1,
    ease: 'power2.out',
  });

  gsap.from('#btn-jouer', {
    scale: 0.8,
    opacity: 0,
    delay: 0.3,
    duration: 0.8,
    ease: 'back.out(1.7)',
  });
}

btnJouer.addEventListener('click', lancerTransition);
document.getElementById('btn-jouer').addEventListener('mouseenter', () => {
  gsap.to('#btn-jouer', {
    scale: 1.1,
    duration: 0.2,
  });
});

document.getElementById('btn-jouer').addEventListener('mouseleave', () => {
  gsap.to('#btn-jouer', {
    scale: 1,
    duration: 0.2,
  });
});

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
      document.getElementById('accueil').classList.add('hidden');

      const jeu = document.getElementById('jeu');
      jeu.classList.remove('hidden');

      // nettoyer les autres UI
      document.getElementById('game-over').classList.add('hidden');
      document.getElementById('victoire').classList.add('hidden');
      document.getElementById('carte-resultat').classList.add('hidden');

      initialiserJeu();

      activerFPS();
      lancerAmbiance();
    },
  });
}

// ─── INIT JEU ─────────────────────────
async function initialiserJeu() {
  jeu.classList.remove('hidden');

  const result = await buildBibliotheque();
  const updateBibliotheque = result.updateBibliotheque;

  console.log('updateBibliotheque:', updateBibliotheque);
  console.log('type:', typeof updateBibliotheque);

  scene.traverse((obj) => {
    if (obj.userData.estSortie) {
      porteSortie = obj;
    }
  });

  const updateLumiere = createLumieres();

  if (typeof updateControls === 'function') addToLoop(updateControls);
  if (typeof updateBibliotheque === 'function') addToLoop(updateBibliotheque);
  if (typeof updateLumiere === 'function') addToLoop(updateLumiere);
  if (typeof detecterProximite === 'function') addToLoop(detecterProximite);
  if (typeof respirationCamera === 'function') addToLoop(respirationCamera);
  startLoop();

  // ❗ IMPORTANT
  jeuActif = true;

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

      const random = Math.random();

      if (random < 0.33) {
        effetChute();
      } else if (random < 0.66) {
        effetEtagere();
      } else {
        effetNoir();
      }
    }
  }, 1000);
}

// DÉTECTION PROXIMITÉ
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
  if (porteSortie) {
    const distanceSortie = camera.position.distanceTo(porteSortie.position);

    //  ouverture + victoire
    if (distanceSortie < 2 && filmsResolus.size >= 3) {
      ouvrirPorte();

      setTimeout(() => {
        declencherVictoire();
      }, 1000);
    }

    //  effet lumière
    if (distanceSortie < 3) {
      porteSortie.material.emissiveIntensity = 1.5;
    } else {
      porteSortie.material.emissiveIntensity = 0.4;
    }
  }
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

  // révélation livre
  livresFilms.forEach((livre) => {
    if (livre.userData.filmId === filmId && !livre.userData.revele) {
      livre.material.color.set(0xff3300);
      livre.material.emissive = new THREE.Color(0xff2200);
      livre.material.emissiveIntensity = 0.8;

      livre.userData.revele = true;

      setTimeout(() => {
        const texture = new THREE.TextureLoader().load(affiches[filmId]);
        livre.material.map = texture;
        livre.material.needsUpdate = true;
      }, 200);

      const targetPosition = livre.position
        .clone()
        .add(new THREE.Vector3(0, 0, 0.3));

      gsap.to(livre.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 0.5,
        ease: 'power2.out',
      });

      gsap.to(livre.rotation, {
        y: livre.rotation.y + 0.5,
        duration: 0.5,
        ease: 'power2.out',
      });
    }
  });

  //  UI
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
function creerFleche() {
  if (!porteSortie) return;

  if (fleche) {
    scene.remove(fleche);
  }

  const geo = new THREE.ConeGeometry(0.2, 0.5, 8);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x00aaff,
    emissive: 0x00aaff,
    emissiveIntensity: 1,
  });

  fleche = new THREE.Mesh(geo, mat);

  //  position = position joueur
  fleche.position.set(camera.position.x, 0.2, camera.position.z);

  //  calcul direction vers la sortie
  const direction = new THREE.Vector3()
    .subVectors(porteSortie.position, camera.position)
    .normalize();

  const angle = Math.atan2(direction.x, direction.z);

  fleche.rotation.set(Math.PI, angle, 0);

  scene.add(fleche);

  setTimeout(() => {
    scene.remove(fleche);
    fleche = null;
  }, 5000);
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
    creerFleche();
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
function ouvrirPorte() {
  if (!porteSortie) return;

  gsap.to(porteSortie.rotation, {
    y: Math.PI / 2,
    duration: 1,
    ease: 'power2.out',
  });
}
function effetChute() {
  gsap.to(camera.position, {
    y: -10,
    duration: 1.5,
    ease: 'power2.in',
    onComplete: () => {
      declencherGameOver();
    },
  });
}
function effetEtagere() {
  const geo = new THREE.BoxGeometry(3, 4, 0.5);
  const mat = new THREE.MeshStandardMaterial({ color: 0x3d2010 });

  const etagere = new THREE.Mesh(geo, mat);

  // au-dessus du joueur
  etagere.position.set(camera.position.x, 6, camera.position.z);

  scene.add(etagere);

  gsap.to(etagere.position, {
    y: 0,
    duration: 0.7,
    ease: 'power2.in',
    onComplete: () => {
      declencherGameOver();
    },
  });
}
function effetNoir() {
  gsap.to(document.body, {
    backgroundColor: 'black',
    duration: 0.5,
    onComplete: () => {
      declencherGameOver();
    },
  });
}

function evenementAleatoire() {
  const random = Math.random();

  if (random < 0.15) {
    // declencherBruit();
  } else if (random < 0.3) {
    // objetRapide();
  } else if (random < 0.4) {
    //ombreRapide(); //  AJOUT
  }
}

function declencherBruit() {
  const maintenant = Date.now();

  // limite : 3 secondes entre sons
  if (maintenant - dernierBruit < 3000) return;

  dernierBruit = maintenant;

  const sons = [
    new Audio('/sounds/bruit1.mp3'),
    new Audio('/sounds/bruit2.mp3'),
    new Audio('/sounds/chuchotement.mp3'),
  ];

  const son = sons[Math.floor(Math.random() * sons.length)];

  const distance = Math.random() * 10;

  son.volume = Math.max(0.05, 0.4 - distance / 12);
  son.play();

  // 🎮 effet caméra
  gsap.to(camera.position, {
    z: camera.position.z - 0.1,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
  });
}
function objetRapide() {
  const geo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    emissive: 0x222222,
    emissiveIntensity: 0.5,
  });

  const objet = new THREE.Mesh(geo, mat);

  // position côté gauche du joueur
  objet.position.set(
    camera.position.x - 2,
    camera.position.y,
    camera.position.z
  );

  scene.add(objet);

  // animation → traverse rapidement
  gsap.to(objet.position, {
    x: camera.position.x + 2,
    duration: 0.4,
    ease: 'power2.out',
    onComplete: () => {
      scene.remove(objet);
    },
  });
}
function ombreRapide() {
  const geo = new THREE.PlaneGeometry(1, 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.6,
  });

  const ombre = new THREE.Mesh(geo, mat);

  ombre.position.set(
    camera.position.x - 2,
    camera.position.y,
    camera.position.z
  );

  scene.add(ombre);

  gsap.to(ombre.position, {
    x: camera.position.x + 2,
    duration: 0.4,
    ease: 'power2.out',
    onComplete: () => {
      scene.remove(ombre);
    },
  });
}
function respirationCamera() {
  const t = Date.now() * 0.002;
  camera.position.y += Math.sin(t) * 0.002;
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
