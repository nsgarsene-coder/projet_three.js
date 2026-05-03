import { fetchToutesAffiches } from './tmdb.js';
import * as THREE from 'three';
import { scene, camera } from './scene.js';
import { films } from '../data/films.js';

// ═══════════════════════════════════════
// MATÉRIAUX
// ═══════════════════════════════════════
const matSol = new THREE.MeshStandardMaterial({
  color: 0x1a1008,
  roughness: 0.95,
});
const matMur = new THREE.MeshStandardMaterial({
  color: 0x0d0a07,
  roughness: 0.9,
});
const matBois = new THREE.MeshStandardMaterial({
  color: 0x3d2010,
  roughness: 0.85,
});
const matBoisSombre = new THREE.MeshStandardMaterial({
  color: 0x1a0f05,
  roughness: 0.9,
});

const couleursLivres = [
  0x3d0000, 0x0a1a0a, 0x1a1200, 0x0a0a1a, 0x2a0a0a, 0x1a001a,
];

// ═══════════════════════════════════════
// LUMIÈRES
// ═══════════════════════════════════════
export function createLumieres() {
  const ambiante = new THREE.AmbientLight(0xffeedd, 3.5);
  scene.add(ambiante);

  const positionsChandelles = [
    [0, 4.5, 8],
    [-6, 4.5, 4],
    [6, 4.5, 4],
    [-6, 4.5, -4],
    [6, 4.5, -4],
    [0, 4.5, -10],
    [-6, 4.5, -14],
    [6, 4.5, -14],
  ];

  const chandelles = [];
  positionsChandelles.forEach(([x, y, z]) => {
    const lumiere = new THREE.PointLight(0xffaa66, 5.0, 20);
    lumiere.position.set(x, y, z);
    lumiere.castShadow = false;
    scene.add(lumiere);
    chandelles.push(lumiere);
  });

  // Lumière rouge au fond
  const rouge = new THREE.PointLight(0xff1100, 1.5, 18);
  rouge.position.set(0, 2.5, -18);
  scene.add(rouge);

  // Lumière bleue sortie
  const bleue = new THREE.PointLight(0x4fc3f7, 2.0, 8);
  bleue.position.set(0, 2.5, -19);
  scene.add(bleue);
  const positionsEtageres = [
    [-8, 2, -12],
    [-8, 2, -7],
    [-8, 2, -2],
    [-8, 2, 3],
    [-8, 2, 8],
    [-2.2, 2, -14],
    [-2.2, 2, -8],
    [-2.2, 2, -2],
    [-2.2, 2, 4],
    [2.2, 2, -14],
    [2.2, 2, -8],
    [2.2, 2, -2],
    [2.2, 2, 4],
    [8, 2, -14],
    [8, 2, -10],
    [8, 2, -6],
    [8, 2, -2],
    [8, 2, 2],
  ];

  positionsEtageres.forEach(([x, y, z]) => {
    const l = new THREE.PointLight(0xff8844, 1.8, 5);
    l.position.set(x, y, z);
    scene.add(l);
  });
  // ← FIN

  return function updateLumieres() {
    const t = Date.now() * 0.001;
    chandelles.forEach((c, i) => {
      c.intensity =
        3.0 +
        Math.sin(t * 2.3 + i * 1.7) * 0.4 +
        Math.sin(t * 7.1 + i * 0.9) * 0.15;
    });
    rouge.intensity = 1.5 + Math.sin(t * 0.8) * 0.3;
    bleue.intensity = 2.0 + Math.sin(t * 1.2) * 0.5;
  };
}

// ═══════════════════════════════════════
// SOL
// ═══════════════════════════════════════
function createSol() {
  const geo = new THREE.PlaneGeometry(32, 44);
  const sol = new THREE.Mesh(geo, matSol);
  sol.rotation.x = -Math.PI / 2;
  sol.receiveShadow = true;
  scene.add(sol);

  for (let i = -15; i < 15; i += 0.9) {
    const pGeo = new THREE.PlaneGeometry(0.85, 44);
    const pMat = new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? 0x201408 : 0x160e06,
      roughness: 0.95,
    });
    const planche = new THREE.Mesh(pGeo, pMat);
    planche.rotation.x = -Math.PI / 2;
    planche.position.set(i, 0.001, 0);
    scene.add(planche);
  }
}

// ═══════════════════════════════════════
// STRUCTURE (murs + plafond + poutres)
// ═══════════════════════════════════════
function createStructure() {
  // Plafond
  const plafond = new THREE.Mesh(new THREE.PlaneGeometry(32, 44), matMur);
  plafond.rotation.x = Math.PI / 2;
  plafond.position.y = 5;
  scene.add(plafond);

  // Murs
  [
    { pos: [0, 2.5, -22], rot: [0, 0, 0], size: [32, 5] },
    { pos: [0, 2.5, 22], rot: [0, Math.PI, 0], size: [32, 5] },
    { pos: [-16, 2.5, 0], rot: [0, Math.PI / 2, 0], size: [44, 5] },
    { pos: [16, 2.5, 0], rot: [0, -Math.PI / 2, 0], size: [44, 5] },
  ].forEach(({ pos, rot, size }) => {
    const mur = new THREE.Mesh(new THREE.PlaneGeometry(...size), matMur);
    mur.position.set(...pos);
    mur.rotation.set(...rot);
    scene.add(mur);
  });

  // Poutres
  for (let z = -18; z <= 18; z += 6) {
    const poutre = new THREE.Mesh(
      new THREE.BoxGeometry(32, 0.25, 0.35),
      matBoisSombre
    );
    poutre.position.set(0, 4.88, z);
    scene.add(poutre);
  }
}

// ═══════════════════════════════════════
// ÉTAGÈRE
// ═══════════════════════════════════════
function createEtagere(x, z, rotY = 0) {
  const g = new THREE.Group();
  const H = 3.8,
    W = 2.6,
    D = 0.45;

  // Panneau arrière
  const arr = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.05), matBoisSombre);
  arr.position.set(0, H / 2, -D / 2);
  g.add(arr);

  // Côtés
  [-W / 2, W / 2].forEach((px) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.07, H, D), matBois);
    c.position.set(px, H / 2, 0);
    g.add(c);
  });

  // Tablettes
  [0.05, 1.0, 1.95, 2.9, 3.75].forEach((py) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(W, 0.07, D), matBois);
    t.position.set(0, py, 0);
    g.add(t);
  });

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  g.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  scene.add(g);
  return g;
}

// ═══════════════════════════════════════
// LIVRES DÉCORATIFS
// ═══════════════════════════════════════
function remplirEtagere(x, z, rotY = 0) {
  const niveaux = [0.4, 1.35, 2.3, 3.25];
  niveaux.forEach((ny) => {
    let px = -1.15;
    while (px < 1.15) {
      const lw = 0.07 + Math.random() * 0.07;
      const lh = 0.65 + Math.random() * 0.3;
      const livre = new THREE.Mesh(
        new THREE.BoxGeometry(lw, lh, 0.32),
        new THREE.MeshStandardMaterial({
          color:
            couleursLivres[Math.floor(Math.random() * couleursLivres.length)],
          roughness: 0.8,
        })
      );
      if (rotY === 0) livre.position.set(x + px, ny, z - 0.05);
      else {
        livre.position.set(x - 0.05, ny, z + px);
        livre.rotation.y = Math.PI / 2;
      }
      livre.rotation.z = (Math.random() - 0.5) * 0.08;
      livre.castShadow = true;
      scene.add(livre);
      px += lw + 0.015;
    }
  });
}

// ═══════════════════════════════════════
// LIVRES DES FILMS (cliquables)
// ═══════════════════════════════════════
export const livresFilms = [];

function createLivreFilm(film, x, y, z, afficheUrl = null, rotY = 0) {
  const couleurs = { easy: 0x8b0000, medium: 0x4a0e0e, hard: 0x1a0a0a };
  const mat = new THREE.MeshStandardMaterial({
    color: couleurs[film.difficulty] || 0x3d0000,
    roughness: 0.65,
    emissive: new THREE.Color(couleurs[film.difficulty] || 0x3d0000),
    emissiveIntensity: 0.12,
  });

  const livre = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.85, 0.32), mat);
  livre.position.set(x, y + 0.35, z);
  livre.rotation.y = rotY;
  livre.castShadow = true;
  livre.userData = { filmId: film.id, estFilm: true };
  // Appliquer l'affiche si disponible
  if (afficheUrl) {
    const texture = new THREE.TextureLoader().load(afficheUrl);
    livre.material.map = texture;
    livre.material.needsUpdate = true;
  }
  // Tranche rouge lumineuse
  const tranche = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.83, 0.3),
    new THREE.MeshStandardMaterial({
      color: 0xff2200,
      emissive: 0xff2200,
      emissiveIntensity: 0.5,
    })
  );
  tranche.position.set(0.065, 0, 0);
  livre.add(tranche);

  scene.add(livre);
  livresFilms.push(livre);
}

// ═══════════════════════════════════════
// INDICES
// ═══════════════════════════════════════
export const objetsIndices = [];

function createIndice(film, x, y, z) {
  const estObjet = film.indice_type === 'objet';
  const geo = estObjet
    ? new THREE.IcosahedronGeometry(0.14, 0)
    : new THREE.BoxGeometry(0.45, 0.32, 0.025);

  const mat = new THREE.MeshStandardMaterial({
    color: estObjet ? 0xff2200 : 0xd4b483,
    emissive: estObjet ? 0xff2200 : 0xffaa00,
    emissiveIntensity: 0.5,
    roughness: 0.3,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.userData = {
    filmId: film.id,
    estIndice: true,
    indiceTexte: film.indice,
  };
  mesh.castShadow = true;
  scene.add(mesh);
  objetsIndices.push(mesh);

  const halo = new THREE.PointLight(estObjet ? 0xff2200 : 0xffaa00, 1.0, 2.0);
  halo.position.set(x, y, z);
  scene.add(halo);
}

// ═══════════════════════════════════════
// POUSSIÈRE
// ═══════════════════════════════════════
function createPoussiere() {
  const count = 400;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    pos[i] = (Math.random() - 0.5) * 28;
    pos[i + 1] = Math.random() * 5;
    pos[i + 2] = (Math.random() - 0.5) * 40;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xffeeaa,
      size: 0.018,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
    })
  );
  scene.add(pts);

  return function () {
    const t = Date.now() * 0.0001;
    const p = pts.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      p.array[i * 3 + 1] += Math.sin(t + i) * 0.0006;
      p.array[i * 3] += Math.cos(t * 0.7 + i) * 0.0003;
      if (p.array[i * 3 + 1] > 5) p.array[i * 3 + 1] = 0.1;
      if (p.array[i * 3 + 1] < 0) p.array[i * 3 + 1] = 4.9;
    }
    p.needsUpdate = true;
  };
}

// ═══════════════════════════════════════
// ANIMATION INDICES
// ═══════════════════════════════════════
function updateIndices() {
  const t = Date.now() * 0.001;
  objetsIndices.forEach((obj, i) => {
    obj.position.y += Math.sin(t * 1.5 + i * 0.8) * 0.0006;
    obj.rotation.y += 0.01;
  });
}

// ═══════════════════════════════════════
// BUILD COMPLET
// ═══════════════════════════════════════
export async function buildBibliotheque() {
  createSol();
  createStructure();

  // Charger toutes les affiches TMDB
  const affiches = await fetchToutesAffiches(films);

  const filmsA = films.filter((f) => f.zone === 'A');
  const filmsB = films.filter((f) => f.zone === 'B');
  const filmsC = films.filter((f) => f.zone === 'C');

  // Niveaux des tablettes (hauteur tablette + demi-hauteur livre)
  const NIVEAUX = [0.47, 1.42, 2.37, 3.32];

  // ── ZONE A — couloir gauche ──
  // Étagères à x=-8, livres collés sur la face avant (z légèrement en avant)
  const etagereZ_A = [-12, -7, -2, 3, 8];
  etagereZ_A.forEach((z) => {
    createEtagere(-8, z);
    remplirEtagere(-8, z);
  });

  filmsA.forEach((film, i) => {
    // On place le livre sur l'étagère la plus proche de son index
    const etagereIndex = Math.floor(i / 4);
    const eZ = etagereZ_A[etagereIndex] || etagereZ_A[etagereZ_A.length - 1];
    const niveau = NIVEAUX[i % 4];
    // x = -8 (centre étagère) + decalage pour être sur la face avant
    // La face avant de l'étagère est à z = eZ, profondeur D=0.45
    // Livre à -8 (même x), z = eZ - 0.05 (face avant)
    const offsetX = -1.0 + (i % 4) * 0.65; // répartir sur la largeur
    createLivreFilm(film, -8 + offsetX, niveau, eZ - 0.05, affiches[film.id]);
    createIndice(film, -6 + (i % 3) * 1.2, 0.25, eZ + 1.5);
  });

  // ── ZONE B — couloir central ──
  const etagereZ_B = [-14, -8, -2, 4];
  etagereZ_B.forEach((z) => {
    createEtagere(-2.2, z);
    createEtagere(2.2, z);
    remplirEtagere(-2.2, z);
    remplirEtagere(2.2, z);
  });

  filmsB.forEach((film, i) => {
    const etagereIndex = Math.floor(i / 4);
    const eZ = etagereZ_B[etagereIndex] || etagereZ_B[etagereZ_B.length - 1];
    const niveau = NIVEAUX[i % 4];
    const offsetX = -1.0 + (i % 4) * 0.65;
    // Alterner gauche (-2.2) et droite (2.2)
    const coteX = i % 2 === 0 ? -2.2 : 2.2;
    const faceZ = i % 2 === 0 ? eZ + 0.05 : eZ - 0.05;
    createLivreFilm(
      film,
      coteX + offsetX * 0.4,
      niveau,
      faceZ,
      affiches[film.id]
    );
    createIndice(film, (i % 3) * 0.8 - 0.8, 0.25, eZ + 1.2);
  });

  // ── ZONE C — couloir droit ──
  const etagereZ_C = [
    -14, -10, -6, -2, 2, 6, 10, 14, -18, 18, -22, 22, -26, 26, -28,
  ];
  etagereZ_C.forEach((z) => {
    createEtagere(8, z);
    remplirEtagere(8, z);
  });

  filmsC.forEach((film, i) => {
    const etagereIndex = Math.floor(i / 4);
    const eZ = etagereZ_C[etagereIndex] || etagereZ_C[etagereZ_C.length - 1];
    const niveau = NIVEAUX[i % 4];
    const offsetX = -1.0 + (i % 4) * 0.65;
    createLivreFilm(film, 8 + offsetX, niveau, eZ - 0.05, affiches[film.id]);
    createIndice(film, 5.5 + (i % 3) * 0.8, 0.25, eZ + 1.2);
  });

  // ── Étagères murales déco ──
  for (let z = -18; z <= 18; z += 5) {
    createEtagere(-14.5, z);
    createEtagere(14.5, z);
    remplirEtagere(-14.5, z);
    remplirEtagere(14.5, z);
  }

  // ── Porte de sortie ──
  const porte = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 3.0, 0.12),
    new THREE.MeshStandardMaterial({
      color: 0x050510,
      emissive: 0x001144,
      emissiveIntensity: 0.4,
    })
  );
  porte.position.set(0, 1.5, -21.5);
  porte.userData.estSortie = true;
  scene.add(porte);

  const cadre = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 3.2, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x2c1a0a, roughness: 0.8 })
  );
  cadre.position.set(0, 1.6, -21.45);
  scene.add(cadre);

  const updatePoussiere = createPoussiere();

  return function updateBibliotheque() {
    updatePoussiere();
    updateIndices();
  };
}
