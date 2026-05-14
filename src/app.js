import * as THREE from 'three';

const canvas = document.querySelector('#scene');
const stageTitle = document.querySelector('#stage-title');
const stageCopy = document.querySelector('#stage-copy');
const progressBar = document.querySelector('#progress-bar');
const progressPercent = document.querySelector('#progress-percent');
const dots = [...document.querySelectorAll('.map-dot')];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080808, 0.035);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 4, -30);

const mouse = new THREE.Vector2(0, 0);
const clock = new THREE.Clock();

const materials = {
  clay: new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.72, metalness: 0.02 }),
  clayDark: new THREE.MeshStandardMaterial({ color: 0xd7d0c6, roughness: 0.8, metalness: 0.02 }),
  floor: new THREE.MeshStandardMaterial({ color: 0xeee8dd, roughness: 0.58, metalness: 0.02 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xdde6ef, roughness: 0.08, metalness: 0.0, transmission: 0.18, transparent: true, opacity: 0.28 }),
  warm: new THREE.MeshStandardMaterial({ color: 0xffdfb0, emissive: 0xffb66e, emissiveIntensity: 1.25, roughness: 0.4 }),
  outline: new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.13 }),
  path: new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 })
};

const house = new THREE.Group();
scene.add(house);

function addBox({ name, pos, scale, mat = materials.clay, cast = true, receive = true, outline = true, parent = house }) {
  const geo = new THREE.BoxGeometry(scale[0], scale[1], scale[2]);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name || 'box';
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);

  if (outline) {
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, materials.outline);
    mesh.add(line);
  }

  return mesh;
}

function addLabel(text, x, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '700 38px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.fillText(text.toUpperCase(), 256, 72);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.62, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(x, 0.06, z);
  sprite.scale.set(2.8, 0.7, 1);
  sprite.rotation.x = -Math.PI / 2;
  scene.add(sprite);
  return sprite;
}

function buildGround() {
  addBox({
    name: 'site slab',
    pos: [0, -0.07, 0],
    scale: [28, 0.12, 38],
    mat: new THREE.MeshStandardMaterial({ color: 0x2d2c29, roughness: 0.9 }),
    outline: false,
    parent: scene
  });

  for (let i = 0; i < 26; i += 1) {
    const x = (Math.random() - 0.5) * 24;
    const z = (Math.random() - 0.5) * 34;
    if (Math.abs(x) < 7 && Math.abs(z) < 10) continue;
    addBox({
      name: 'landscape block',
      pos: [x, 0.25, z],
      scale: [0.5 + Math.random() * 1.4, 0.5 + Math.random() * 1.6, 0.5 + Math.random() * 1.4],
      mat: new THREE.MeshStandardMaterial({ color: 0x5a5852, roughness: 0.95 }),
      outline: false,
      parent: scene
    });
  }
}

function buildHouse() {
  addBox({ name: 'floor', pos: [0, 0.02, 0], scale: [10.8, 0.16, 16.8], mat: materials.floor });
  addBox({ name: 'front terrace', pos: [0, 0.03, -10.4], scale: [8.5, 0.12, 4.2], mat: materials.floor });
  addBox({ name: 'back terrace', pos: [0, 0.03, 10.2], scale: [9.4, 0.12, 3.2], mat: materials.floor });

  // Exterior walls with an opening at the front entrance.
  addBox({ name: 'front wall left', pos: [-3.25, 1.65, -8.1], scale: [3.5, 3.3, 0.24] });
  addBox({ name: 'front wall right', pos: [3.45, 1.65, -8.1], scale: [3.1, 3.3, 0.24] });
  addBox({ name: 'front lintel', pos: [0.2, 2.95, -8.1], scale: [3.7, 0.7, 0.24] });
  addBox({ name: 'back wall', pos: [0, 1.65, 8.1], scale: [10.4, 3.3, 0.24] });
  addBox({ name: 'left wall', pos: [-5.1, 1.65, 0], scale: [0.24, 3.3, 16.4] });
  addBox({ name: 'right wall', pos: [5.1, 1.65, 0], scale: [0.24, 3.3, 16.4] });

  // Roof as a pale, semi-transparent plate. It fades a bit while walking inside.
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0xf3eee5,
    roughness: 0.65,
    transparent: true,
    opacity: 0.72
  });
  const roof = addBox({ name: 'roof', pos: [0, 3.45, 0], scale: [11.2, 0.28, 17.2], mat: roofMaterial });
  roof.userData.fadeOnInterior = true;

  // Glass at entrance and large side windows.
  addBox({ name: 'glass entrance', pos: [0, 1.4, -8.23], scale: [2.0, 2.55, 0.05], mat: materials.glass, outline: false });
  addBox({ name: 'left panorama glass', pos: [-5.23, 1.55, -2.6], scale: [0.05, 2.75, 4.4], mat: materials.glass, outline: false });
  addBox({ name: 'right panorama glass', pos: [5.23, 1.55, -2.1], scale: [0.05, 2.75, 4.8], mat: materials.glass, outline: false });
  addBox({ name: 'back glass', pos: [1.7, 1.55, 8.23], scale: [4.3, 2.75, 0.05], mat: materials.glass, outline: false });

  // Interior partitions. Gaps are intentional doors.
  addBox({ name: 'hall left partition a', pos: [-1.55, 1.55, -2.8], scale: [0.18, 3.1, 3.3] });
  addBox({ name: 'hall left partition b', pos: [-1.55, 1.55, 5.8], scale: [0.18, 3.1, 4.5] });
  addBox({ name: 'hall right partition a', pos: [1.85, 1.55, 1.5], scale: [0.18, 3.1, 4.3] });
  addBox({ name: 'hall right partition b', pos: [1.85, 1.55, 6.7], scale: [0.18, 3.1, 2.8] });
  addBox({ name: 'living divider', pos: [-3.25, 1.55, 2.25], scale: [3.55, 3.1, 0.18] });
  addBox({ name: 'kitchen divider', pos: [3.45, 1.55, 2.25], scale: [3.1, 3.1, 0.18] });
  addBox({ name: 'bedroom wall', pos: [-3.35, 1.55, 5.2], scale: [3.3, 3.1, 0.18] });
  addBox({ name: 'bath wall', pos: [3.45, 1.55, 5.2], scale: [3.1, 3.1, 0.18] });

  // Simple white furniture and architectural hints.
  addBox({ name: 'sofa', pos: [-3.25, 0.45, -1.4], scale: [2.25, 0.6, 0.88], mat: materials.clayDark });
  addBox({ name: 'coffee table', pos: [-3.2, 0.32, 0.1], scale: [1.25, 0.22, 0.72], mat: materials.clay });
  addBox({ name: 'media wall', pos: [-4.72, 1.0, 1.1], scale: [0.22, 1.5, 2.4], mat: materials.clayDark });
  addBox({ name: 'kitchen island', pos: [3.28, 0.52, -0.35], scale: [2.1, 0.92, 0.92], mat: materials.clayDark });
  addBox({ name: 'kitchen wall units', pos: [4.74, 1.1, 0.95], scale: [0.38, 2.0, 2.35], mat: materials.clayDark });
  addBox({ name: 'bed', pos: [-3.45, 0.42, 6.85], scale: [2.35, 0.58, 2.15], mat: materials.clayDark });
  addBox({ name: 'wardrobe', pos: [-4.75, 1.25, 5.85], scale: [0.36, 2.3, 1.7], mat: materials.clayDark });
  addBox({ name: 'bath block', pos: [3.35, 0.56, 6.65], scale: [1.45, 0.72, 1.7], mat: materials.clayDark });
  addBox({ name: 'stair mass', pos: [0.22, 0.42, 4.45], scale: [1.15, 0.7, 2.9], mat: materials.clayDark });

  // Warm line lights to make the white model more readable.
  addBox({ name: 'warm ceiling light front', pos: [0, 3.08, -4.9], scale: [6.5, 0.05, 0.08], mat: materials.warm, outline: false });
  addBox({ name: 'warm ceiling light kitchen', pos: [3.2, 3.08, -0.45], scale: [0.08, 0.05, 2.8], mat: materials.warm, outline: false });
  addBox({ name: 'warm ceiling light hall', pos: [0.2, 3.08, 4.5], scale: [0.08, 0.05, 3.4], mat: materials.warm, outline: false });

  addLabel('Salon', -3.25, -0.25);
  addLabel('Kuchnia', 3.2, -0.1);
  addLabel('Hall', 0.1, 3.25);
  addLabel('Sypialnia', -3.35, 6.7);
  addLabel('Łazienka', 3.4, 6.65);
}

function buildCameraPathGuide() {
  const points = cameraKeyframes.map((frame) => frame.pos);
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(120));
  const line = new THREE.Line(geo, materials.path);
  line.position.y = -0.02;
  scene.add(line);
}

function setupLights() {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x302f2c, 1.55);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 3.2);
  sun.position.set(-7, 10, -7);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 50;
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  scene.add(sun);

  const fill = new THREE.PointLight(0xffd4a0, 1.8, 18);
  fill.position.set(0, 2.7, -4.6);
  scene.add(fill);
}

const stageContent = [
  {
    title: 'Widok inwestycji',
    copy: 'Scrolluj, aby zbliżyć się do budynku. To wersja MVP oparta o prostą białą makietę 3D.'
  },
  {
    title: 'Elewacja i wejście',
    copy: 'Kamera płynnie podchodzi pod dom. W produkcji można tu pokazać nazwę inwestycji, metraż i kluczowe wyróżniki.'
  },
  {
    title: 'Salon z aneksem',
    copy: 'Pierwsze wejście do środka. Pomieszczenia są czytelne dzięki bryłom, światłu i prostym podpisom.'
  },
  {
    title: 'Kuchnia',
    copy: 'Kolejny etap spaceru może opowiadać o funkcjonalnym układzie, widoku z okna albo jakości materiałów.'
  },
  {
    title: 'Hall i komunikacja',
    copy: 'Scroll steruje kamerą, a nie tylko tekstem. Dzięki temu strona działa jak krótki film produktowy.'
  },
  {
    title: 'Strefa prywatna',
    copy: 'Na końcu spaceru użytkownik może dostać CTA, formularz, rzuty PDF albo przejście do wyboru lokalu.'
  }
];

const cameraKeyframes = [
  {
    p: 0,
    pos: new THREE.Vector3(0, 4.3, -30),
    target: new THREE.Vector3(0, 1.4, -2),
    stage: 0
  },
  {
    p: 0.15,
    pos: new THREE.Vector3(0, 3.6, -19),
    target: new THREE.Vector3(0, 1.55, -5.5),
    stage: 0
  },
  {
    p: 0.28,
    pos: new THREE.Vector3(0, 1.85, -9.35),
    target: new THREE.Vector3(0, 1.45, -4.0),
    stage: 1
  },
  {
    p: 0.42,
    pos: new THREE.Vector3(-2.9, 1.68, -3.3),
    target: new THREE.Vector3(-3.55, 1.35, 1.7),
    stage: 2
  },
  {
    p: 0.56,
    pos: new THREE.Vector3(3.05, 1.68, -2.1),
    target: new THREE.Vector3(3.65, 1.35, 2.0),
    stage: 3
  },
  {
    p: 0.70,
    pos: new THREE.Vector3(0.1, 1.68, 2.15),
    target: new THREE.Vector3(0.15, 1.38, 6.3),
    stage: 4
  },
  {
    p: 0.84,
    pos: new THREE.Vector3(-3.1, 1.68, 5.7),
    target: new THREE.Vector3(-3.95, 1.25, 7.9),
    stage: 5
  },
  {
    p: 1,
    pos: new THREE.Vector3(3.15, 1.68, 5.95),
    target: new THREE.Vector3(4.05, 1.25, 7.8),
    stage: 5
  }
];

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function getScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return clamp01(window.scrollY / scrollable);
}

function getFrame(progress) {
  let current = cameraKeyframes[0];
  let next = cameraKeyframes[cameraKeyframes.length - 1];

  for (let i = 0; i < cameraKeyframes.length - 1; i += 1) {
    const a = cameraKeyframes[i];
    const b = cameraKeyframes[i + 1];
    if (progress >= a.p && progress <= b.p) {
      current = a;
      next = b;
      break;
    }
  }

  const local = clamp01((progress - current.p) / (next.p - current.p));
  const t = easeInOutCubic(local);
  return {
    pos: current.pos.clone().lerp(next.pos, t),
    target: current.target.clone().lerp(next.target, t),
    stage: t < 0.55 ? current.stage : next.stage
  };
}

function updateHud(progress, stage) {
  const content = stageContent[stage] || stageContent[0];
  if (stageTitle.textContent !== content.title) stageTitle.textContent = content.title;
  if (stageCopy.textContent !== content.copy) stageCopy.textContent = content.copy;

  const percent = Math.round(progress * 100);
  progressBar.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;

  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === stage);
  });
}

function fadeRoof(progress) {
  house.traverse((obj) => {
    if (!obj.isMesh || !obj.userData.fadeOnInterior) return;
    obj.material.opacity = progress > 0.25 ? 0.18 : 0.72;
  });
}

function updateCamera() {
  const progress = getScrollProgress();
  const frame = getFrame(progress);
  const parallaxX = mouse.x * 0.18;
  const parallaxY = mouse.y * 0.08;

  camera.position.lerp(new THREE.Vector3(frame.pos.x + parallaxX, frame.pos.y + parallaxY, frame.pos.z), 0.12);
  const target = new THREE.Vector3(frame.target.x + parallaxX * 0.7, frame.target.y + parallaxY * 0.5, frame.target.z);
  camera.lookAt(target);

  updateHud(progress, frame.stage);
  fadeRoof(progress);
}

function animate() {
  const elapsed = clock.getElapsedTime();
  house.position.y = Math.sin(elapsed * 0.55) * 0.015;
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function goToStep(index) {
  const frame = cameraKeyframes.find((item) => item.stage === index) || cameraKeyframes[0];
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: scrollable * frame.p, behavior: 'smooth' });
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = -(event.clientY / window.innerHeight - 0.5) * 2;
});

dots.forEach((dot) => {
  dot.addEventListener('click', () => goToStep(Number(dot.dataset.step)));
});

buildGround();
buildHouse();
buildCameraPathGuide();
setupLights();
updateCamera();
animate();
