import './style.css';
import { activerFPS } from './scene.js';
import { buildBibliotheque } from './bibliotheque.js';
import * as THREE from 'three';
import { camera } from './scene.js';
import { livresFilms, objetsIndices } from './bibliotheque.js';
import { revelerLivre } from './bibliotheque.js';

const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
let objetSurvole = null;
``;

// ─────────────────────────────
// DOM
// ─────────────────────────────
const loader = document.getElementById('loader');
const accueil = document.getElementById('accueil');
const btnJouer = document.getElementById('btn-jouer');
const jeu = document.getElementById('jeu');
const transition = document.getElementById('transition');

// ─────────────────────────────
// ÉTAT
// ─────────────────────────────
let gameState = 'loading';

// ─────────────────────────────
// LOADER
// ─────────────────────────────
function lancerLoader() {
  setTimeout(() => {
    loader.classList.add('hidden');
    afficherAccueil();
  }, 1000);
}

// ─────────────────────────────
// ACCUEIL
// ─────────────────────────────
function afficherAccueil() {
  gameState = 'idle';
  accueil.classList.remove('hidden');
}

// ─────────────────────────────
// TRANSITION → JEU
// ─────────────────────────────
async function lancerJeu() {
  if (gameState !== 'idle') return;

  const video = document.getElementById('bg-video');
  video.pause();
  video.currentTime = 0;
  lancerAmbiance();

  gameState = 'transition';

  transition.classList.remove('hidden');

  transition.style.transform = 'translate(-50%, -50%) scale(0)';

  setTimeout(() => {
    transition.style.transform = 'translate(-50%, -50%) scale(3)';
  }, 10);

  setTimeout(async () => {
    accueil.classList.add('hidden');
    jeu.classList.remove('hidden');
    transition.classList.add('hidden');

    gameState = 'exploring';

    //  ICI on construit la bibliothèque
    const result = await buildBibliotheque();

    //  lancer update (très important)
    if (result && typeof result.update === 'function') {
      function loop() {
        result.update();
        detectInteraction();
        requestAnimationFrame(loop);
      }
      loop();
    }

    console.log('BIBLIOTHÈQUE LOAD ');
  }, 1000);
}
// ─────────────────────────────
// EVENT
// ─────────────────────────────
btnJouer.addEventListener('click', lancerJeu);

// ─────────────────────────────
// START
// ─────────────────────────────
lancerLoader();
function detectInteraction() {
  if (gameState !== 'exploring') return;

  raycaster.setFromCamera(center, camera);

  const objets = [...livresFilms, ...objetsIndices];

  const intersects = raycaster.intersectObjects(objets);

  let cible = null;

  if (intersects.length > 0) {
    cible = intersects[0].object;
  }

  //  RESET ancien objet
  if (objetSurvole && objetSurvole !== cible) {
    if (objetSurvole.material?.emissive) {
      objetSurvole.material.emissiveIntensity = 0;
    }
    objetSurvole.scale.set(1, 1, 1);
  }

  //  NOUVEL objet ciblé
  if (cible && cible !== objetSurvole) {
    objetSurvole = cible;

    // effet surbrillance
    cible.scale.set(1.1, 1.1, 1.1);

    if (cible.material?.emissive) {
      cible.material.emissiveIntensity = 0.8;
    }

    if (cible.userData.estIndice) {
      cible.material.emissiveIntensity = 1.2;
    }
  }

  if (!cible) {
    objetSurvole = null;
  }
}
window.addEventListener('click', () => {
  if (!objetSurvole) return;

  if (objetSurvole.userData.estFilm) {
    activerLivre(objetSurvole);
  }

  if (objetSurvole.userData.estIndice) {
    console.log('INDICE :', objetSurvole.userData.indiceTexte);
  }
});
function activerLivre(livre) {
  if (!livre || !livre.userData.estFilm) return;

  console.log('Livre cliqué');

  // animation sortie
  livre.position.z += 1;
  livre.rotation.y += Math.PI;

  // récupérer affiche
  const url = livre.userData.affiche;

  if (url) {
    const texture = new THREE.TextureLoader().load(url);
    livre.material.map = texture;
    livre.material.needsUpdate = true;
  }
  //  glow
  livre.material.emissiveIntensity = 1;
}
``;
