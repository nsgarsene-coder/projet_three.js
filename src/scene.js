import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// ═══════════════════════════════════════
// SCÈNE, CAMÉRA, RENDERER
// ═══════════════════════════════════════
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0605);
scene.fog = new THREE.FogExp2(0x0a0605, 0.025);

export const camera = new THREE.PerspectiveCamera(
  80,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.7, 10);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ═══════════════════════════════════════
// POINTER LOCK CONTROLS (FPS)
// ═══════════════════════════════════════
export const controls = new PointerLockControls(camera, document.body);

// Overlay clique pour activer FPS
let overlayActif = false;

export function activerFPS() {
  if (!overlayActif) {
    overlayActif = true;
    controls.lock();
  }
}

controls.addEventListener('lock', () => {
  const ret = document.getElementById('reticule');
  if (ret) ret.style.opacity = '1';
  const hint = document.getElementById('fps-hint');
  if (hint) hint.classList.add('hidden');
});

controls.addEventListener('unlock', () => {
  const ret = document.getElementById('reticule');
  if (ret) ret.style.opacity = '0.4';
  overlayActif = false;
});

scene.add(camera);

// ═══════════════════════════════════════
// DÉPLACEMENT WASD
// ═══════════════════════════════════════
const touches = { forward: false, backward: false, left: false, right: false };
const VITESSE = 0.08;
const direction = new THREE.Vector3();
const droite = new THREE.Vector3();

document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      touches.forward = true;
      break;
    case 'KeyS':
    case 'ArrowDown':
      touches.backward = true;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      touches.left = true;
      break;
    case 'KeyD':
    case 'ArrowRight':
      touches.right = true;
      break;
  }
});

document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      touches.forward = false;
      break;
    case 'KeyS':
    case 'ArrowDown':
      touches.backward = false;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      touches.left = false;
      break;
    case 'KeyD':
    case 'ArrowRight':
      touches.right = false;
      break;
  }
});

const LIMITES = { minX: -13, maxX: 13, minZ: -19, maxZ: 19 };

export function updateControls() {
  if (!controls.isLocked) return;

  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();
  droite.crossVectors(direction, camera.up).normalize();

  if (touches.forward) camera.position.addScaledVector(direction, VITESSE);
  if (touches.backward) camera.position.addScaledVector(direction, -VITESSE);
  if (touches.left) camera.position.addScaledVector(droite, -VITESSE);
  if (touches.right) camera.position.addScaledVector(droite, VITESSE);

  camera.position.x = Math.max(
    LIMITES.minX,
    Math.min(LIMITES.maxX, camera.position.x)
  );
  camera.position.z = Math.max(
    LIMITES.minZ,
    Math.min(LIMITES.maxZ, camera.position.z)
  );
  camera.position.y = 1.7;
}

// ═══════════════════════════════════════
// RESIZE
// ═══════════════════════════════════════
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ═══════════════════════════════════════
// BOUCLE ANIMATE
// ═══════════════════════════════════════
const callbacks = [];

export function addToLoop(fn) {
  callbacks.push(fn);
}

export function startLoop() {
  function animate() {
    requestAnimationFrame(animate);
    callbacks.forEach((fn) => fn());
    renderer.render(scene, camera);
  }
  animate();
}
