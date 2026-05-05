import * as THREE from 'three';
export const raycaster = new THREE.Raycaster();
export const mouseCenter = new THREE.Vector2(0, 0); // centre écran

// ═══════════════════════════════════════
// SCÈNE, CAMÉRA, RENDERER
// ═══════════════════════════════════════
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0605);
scene.fog = new THREE.FogExp2(0x0a0605, 0.022);

export const camera = new THREE.PerspectiveCamera(
  80,
  window.innerWidth / window.innerHeight,
  0.1,
  80
);
camera.position.set(0, 1.7, 10);

export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = false; // désactivé pour les perfs
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.8;
document.body.appendChild(renderer.domElement);

// ═══════════════════════════════════════
// SYSTÈME DE CAMÉRA FPS MANUEL
// Pas de PointerLockControls — contrôle total
// ═══════════════════════════════════════
let yaw = 0; // rotation horizontale
let pitch = 0; // rotation verticale
let locked = false;

// Euler pour la rotation caméra
const euler = new THREE.Euler(0, 0, 0, 'YXZ');

// Demande le pointer lock sur clic
renderer.domElement.addEventListener('click', (e) => {
  if (!locked) renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement;
  const ret = document.getElementById('reticule');
  if (ret) ret.style.opacity = locked ? '1' : '0.4';
});

// Mouvement souris → rotation caméra
document.addEventListener('mousemove', (e) => {
  if (!locked) return;
  const sensitivity = 0.0018;
  yaw -= e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;
  pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
  euler.set(pitch, yaw, 0);
  camera.quaternion.setFromEuler(euler);
});

export function activerFPS() {
  renderer.domElement.requestPointerLock();
}

export const controls = {
  lock: () => renderer.domElement.requestPointerLock(),
  unlock: () => document.exitPointerLock(),
  isLocked: () => locked,
  addEventListener: (event, fn) => {
    if (event === 'lock')
      document.addEventListener('pointerlockchange', () => {
        if (locked) fn();
      });
    if (event === 'unlock')
      document.addEventListener('pointerlockchange', () => {
        if (!locked) fn();
      });
  },
};

scene.add(camera);

// ═══════════════════════════════════════
// DÉPLACEMENT WASD — TOUTES DIRECTIONS
// ═══════════════════════════════════════
const touches = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

const VITESSE = 0.07;
const direction = new THREE.Vector3();
const lateral = new THREE.Vector3();
const forward = new THREE.Vector3();

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

const LIMITES = { minX: -13, maxX: 13, minZ: -21, maxZ: 19 };
let lastTime = performance.now();

export function updateControls() {
  const now = performance.now();
  const delta = (now - lastTime) / 16.666;
  lastTime = now;

  const speed = VITESSE * delta;
  if (touches.forward) camera.position.addScaledVector(forward, speed);
  if (touches.backward) camera.position.addScaledVector(forward, -speed);
  if (touches.left) camera.position.addScaledVector(lateral, -speed);
  if (touches.right) camera.position.addScaledVector(lateral, speed);

  // limites inchangées
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
