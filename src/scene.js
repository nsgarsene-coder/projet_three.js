import * as THREE from 'three';

// ─────────────────────────────
// SCENE
// ─────────────────────────────
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// ─────────────────────────────
// CAMERA
// ─────────────────────────────
export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.6, 5);

// ─────────────────────────────
// RENDERER
// ─────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.8;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.8;

// ─────────────────────────────
// LIGHT
// ─────────────────────────────
const light = new THREE.HemisphereLight(0xffffff, 0x222222, 0.8);
scene.add(light);

const dirLight = new THREE.DirectionalLight(0xffaa66, 1.2);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const fill = new THREE.PointLight(0xffffff, 1.5, 100);
fill.position.set(0, 10, 0);
scene.add(fill);
const ambiante = new THREE.AmbientLight(0xffffff, 6);

const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

// ─────────────────────────────
// SOL TEST
// ─────────────────────────────
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x111111 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// ─────────────────────────────
// CONTROLES FPS (basique)
// ─────────────────────────────
let pitch = 0;
let yaw = 0;

const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

// souris
document.addEventListener('mousemove', (e) => {
  if (!isLocked) return;

  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;

  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

  camera.rotation.set(pitch, yaw, 0);
});

// clavier
document.addEventListener('keydown', (e) => {
  if (e.key === 'z') keys.forward = true;
  if (e.key === 's') keys.backward = true;
  if (e.key === 'q') keys.left = true;
  if (e.key === 'd') keys.right = true;
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'z') keys.forward = false;
  if (e.key === 's') keys.backward = false;
  if (e.key === 'q') keys.left = false;
  if (e.key === 'd') keys.right = false;
});

// ─────────────────────────────
// POINTER LOCK
// ─────────────────────────────
let isLocked = false;

export function activerFPS() {
  document.body.requestPointerLock();
}

document.addEventListener('pointerlockchange', () => {
  isLocked = document.pointerLockElement === document.body;
});

// ─────────────────────────────
// UPDATE LOOP
// ─────────────────────────────
const speed = 0.08;

function updateMovement() {
  if (!isLocked) return;

  const direction = new THREE.Vector3();

  if (keys.forward) direction.z -= 1;
  if (keys.backward) direction.z += 1;
  if (keys.left) direction.x -= 1;
  if (keys.right) direction.x += 1;

  direction.normalize();

  const forward = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
  const right = new THREE.Vector3(1, 0, 0).applyEuler(camera.rotation);

  camera.position.add(forward.multiplyScalar(direction.z * speed));
  camera.position.add(right.multiplyScalar(direction.x * speed));
}

// ─────────────────────────────
// LOOP
// ─────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  updateMovement();

  renderer.render(scene, camera);
}

animate();

// ─────────────────────────────
// RESIZE
// ─────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
