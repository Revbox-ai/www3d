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
scene.fog = new THREE.FogExp2(0x080808, 0.032);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 4, -30);

const mouse = new THREE.Vector2(0, 0);
const clock = new THREE.Clock();

// ─── Procedural textures ────────────────────────────────────────────────────

function makeCanvasTex(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const woodTex = makeCanvasTex(512, 256, (ctx, w, h) => {
  ctx.fillStyle = '#b8936a';
  ctx.fillRect(0, 0, w, h);
  const ph = 32;
  for (let i = 0; i < h / ph; i++) {
    const y = i * ph;
    const d = (Math.random() * 0.18 - 0.09);
    ctx.fillStyle = `hsl(28,${40 + d * 80}%,${54 + d * 80}%)`;
    ctx.fillRect(0, y, w, ph - 1);
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 0.7;
    for (let j = 0; j < 6; j++) {
      const gx = Math.random() * w;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx + (Math.random() - 0.5) * 12, y + ph);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(38,16,4,0.6)';
    ctx.fillRect(0, y + ph - 1, w, 1);
  }
});
woodTex.repeat.set(3, 6);

const concreteTex = makeCanvasTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#dbd3c7';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const v = Math.random() * 30 - 15;
    ctx.fillStyle = `rgba(${Math.round(219 + v)},${Math.round(211 + v)},${Math.round(199 + v)},0.45)`;
    ctx.fillRect(x, y, 2 + Math.random() * 2, 2 + Math.random() * 2);
  }
});
concreteTex.repeat.set(2, 2);

const grassTex = makeCanvasTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#1c2810';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const v = Math.random() * 18 - 9;
    ctx.fillStyle = `rgba(${28 + v},${40 + v},${14 + v},0.9)`;
    ctx.fillRect(x, y, 2, 2 + Math.random() * 4);
  }
});
grassTex.repeat.set(8, 10);

const gravelTex = makeCanvasTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#4a4642';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const r = 2 + Math.random() * 5;
    const v = Math.random() * 30 - 15;
    ctx.fillStyle = `rgba(${80 + v},${75 + v},${68 + v},0.7)`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.65, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
});
gravelTex.repeat.set(4, 4);

const fabricTex = makeCanvasTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#c9b89a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(155,132,105,0.45)';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 4) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(215,195,168,0.45)';
  for (let j = 0; j < h; j += 4) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke(); }
});
fabricTex.repeat.set(3, 3);

const carpetTex = makeCanvasTex(512, 512, (ctx, w, h) => {
  const cx = w / 2, cy = h / 2;
  ctx.fillStyle = '#7a3830';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#c4694a'; ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, w - 52, h - 52);
  const step = 56;
  ctx.strokeStyle = 'rgba(194,105,74,0.45)'; ctx.lineWidth = 1.5;
  for (let i = -step * 2; i < w + step * 2; i += step) {
    for (let j = -step * 2; j < h + step * 2; j += step) {
      ctx.beginPath();
      ctx.moveTo(i + step / 2, j); ctx.lineTo(i + step, j + step / 2);
      ctx.lineTo(i + step / 2, j + step); ctx.lineTo(i, j + step / 2);
      ctx.closePath(); ctx.stroke();
    }
  }
  ctx.strokeStyle = '#e8906a';
  ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 78, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.stroke();
  [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach((a) => {
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * 38, cy + Math.sin(a) * 38, 18, 10, a, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#c4694a'; ctx.fill();
});

const quiltTex = makeCanvasTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#f0ece4';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(200,188,172,0.7)'; ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 28) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
  for (let j = 0; j < h; j += 28) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(175,162,145,0.55)';
  for (let i = 14; i < w; i += 28) {
    for (let j = 14; j < h; j += 28) {
      ctx.beginPath(); ctx.moveTo(i - 5, j); ctx.lineTo(i, j - 5); ctx.lineTo(i + 5, j); ctx.lineTo(i, j + 5); ctx.closePath(); ctx.stroke();
    }
  }
});
quiltTex.repeat.set(2, 2);

const paintingTex = makeCanvasTex(256, 192, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#2e4a6e'); g.addColorStop(0.35, '#4a6e2e');
  g.addColorStop(0.65, '#6e3030'); g.addColorStop(1, '#2e5a5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) {
    const gx = Math.random() * w, gy = Math.random() * h;
    const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, 28 + Math.random() * 44);
    const hue = Math.floor(Math.random() * 360);
    gr.addColorStop(0, `hsla(${hue},52%,62%,0.38)`); gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  }
});

// ─── Materials ───────────────────────────────────────────────────────────────

const materials = {
  clay:      new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.72, metalness: 0.02 }),
  clayDark:  new THREE.MeshStandardMaterial({ color: 0xd7d0c6, roughness: 0.80, metalness: 0.02 }),
  floor:     new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55, metalness: 0.01 }),
  wall:      new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xf2ede4, roughness: 0.78, metalness: 0.01 }),
  ground:    new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.96 }),
  gravel:    new THREE.MeshStandardMaterial({ map: gravelTex, roughness: 0.98 }),
  glass:     new THREE.MeshPhysicalMaterial({ color: 0xdde6ef, roughness: 0.08, metalness: 0.0, transmission: 0.18, transparent: true, opacity: 0.28 }),
  warm:      new THREE.MeshStandardMaterial({ color: 0xffdfb0, emissive: 0xffb66e, emissiveIntensity: 1.25, roughness: 0.4 }),
  outline:   new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.13 }),
  path:      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }),
  bark:      new THREE.MeshStandardMaterial({ color: 0x4a2e0d, roughness: 0.96 }),
  foliage:   new THREE.MeshStandardMaterial({ color: 0x2e4e1c, roughness: 0.88 }),
  foliage2:  new THREE.MeshStandardMaterial({ color: 0x1e3212, roughness: 0.90 }),
  fabric:    new THREE.MeshStandardMaterial({ map: fabricTex, color: 0xd4c4a8, roughness: 0.85 }),
  carpet:    new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.92 }),
  quilt:     new THREE.MeshStandardMaterial({ map: quiltTex, roughness: 0.80 }),
  pillow:    new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.75 }),
  lampShade: new THREE.MeshStandardMaterial({ color: 0xf0e8d0, transparent: true, opacity: 0.88, roughness: 0.70 }),
  painting:  new THREE.MeshStandardMaterial({ map: paintingTex, roughness: 0.60 }),
};

const house = new THREE.Group();
scene.add(house);

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    mesh.add(new THREE.LineSegments(edges, materials.outline));
  }
  return mesh;
}

function addCylinder({ name, pos, rt, rb, h, segs = 7, mat, cast = true, parent = scene }) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rt, rb, h, segs),
    mat
  );
  mesh.name = name || 'cyl';
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = cast;
  scene.add(mesh); // always to scene for vegetation
  return mesh;
}

function addSphere({ name, pos, r, segs = 7, mat, scaleY = 1, cast = true }) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, segs, Math.ceil(segs * 0.7)),
    mat
  );
  mesh.name = name || 'sphere';
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.scale.y = scaleY;
  mesh.castShadow = cast;
  scene.add(mesh);
  return mesh;
}

function addLabel(text, x, z) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.font = '700 38px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.fillText(text.toUpperCase(), 256, 72);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.62, depthWrite: false })
  );
  sprite.position.set(x, 0.06, z);
  sprite.scale.set(2.8, 0.7, 1);
  sprite.rotation.x = -Math.PI / 2;
  scene.add(sprite);
  return sprite;
}

// ─── Vegetation ──────────────────────────────────────────────────────────────

function addTree(x, z, scale = 1.0) {
  const th = 1.6 * scale;
  addCylinder({ name: 'trunk', pos: [x, th / 2, z], rt: 0.09 * scale, rb: 0.15 * scale, h: th, mat: materials.bark });

  const cr = 0.78 * scale;
  addSphere({ name: 'canopy', pos: [x, th + cr * 0.5, z], r: cr, mat: materials.foliage });
  addSphere({ name: 'canopy2', pos: [x + 0.08 * scale, th + cr * 1.1, z - 0.06 * scale], r: cr * 0.68, mat: materials.foliage2 });
}

function addBush(x, z, r = 0.52) {
  addSphere({ name: 'bush', pos: [x, r * 0.62, z], r, segs: 6, mat: materials.foliage, scaleY: 0.62 });
}

function addColumn(x, z) {
  addBox({ name: 'column', pos: [x, 1.65, z], scale: [0.22, 3.3, 0.22], mat: materials.wall, parent: house });
}

// ─── Entrance sitting area (left of door) ────────────────────────────────────

function buildEntranceArea() {
  // Dywan — terracotta z geometrycznym wzorem
  addBox({ name: 'entrance carpet', pos: [-4.02, 0.012, -6.2], scale: [2.4, 0.05, 3.2], mat: materials.carpet, outline: false });

  // Kanapa 3-częściowa: siedzisko + oparcie + 2 podłokietniki
  addBox({ name: 'sofa seat',      pos: [-4.40, 0.38, -6.20], scale: [0.72, 0.44, 2.10], mat: materials.fabric });
  addBox({ name: 'sofa back',      pos: [-4.76, 0.82, -6.20], scale: [0.12, 0.52, 2.10], mat: materials.fabric });
  addBox({ name: 'sofa arm L',     pos: [-4.40, 0.64, -7.22], scale: [0.72, 0.28, 0.12], mat: materials.fabric });
  addBox({ name: 'sofa arm R',     pos: [-4.40, 0.64, -5.18], scale: [0.72, 0.28, 0.12], mat: materials.fabric });

  // Stolik kawowy — blat + 4 nogi
  addBox({ name: 'ct top',  pos: [-3.22, 0.42, -6.20], scale: [0.72, 0.06, 1.40], mat: materials.floor, outline: false });
  addBox({ name: 'ct leg1', pos: [-2.94, 0.20, -5.57], scale: [0.06, 0.38, 0.06], mat: materials.clayDark, outline: false });
  addBox({ name: 'ct leg2', pos: [-3.50, 0.20, -5.57], scale: [0.06, 0.38, 0.06], mat: materials.clayDark, outline: false });
  addBox({ name: 'ct leg3', pos: [-2.94, 0.20, -6.83], scale: [0.06, 0.38, 0.06], mat: materials.clayDark, outline: false });
  addBox({ name: 'ct leg4', pos: [-3.50, 0.20, -6.83], scale: [0.06, 0.38, 0.06], mat: materials.clayDark, outline: false });
}

// ─── Ground & landscape ───────────────────────────────────────────────────────

function buildGround() {
  addBox({
    name: 'site slab',
    pos: [0, -0.07, 0],
    scale: [30, 0.12, 42],
    mat: materials.ground,
    outline: false,
    parent: scene
  });

  // Gravel path leading to entrance
  addBox({
    name: 'path',
    pos: [0, -0.01, -13.2],
    scale: [2.2, 0.06, 6.5],
    mat: materials.gravel,
    outline: false,
    parent: scene
  });

  // Trees
  addTree(-9,  -13, 1.4);
  addTree( 9,  -11, 1.2);
  addTree(-11,  -5, 1.6);
  addTree( 11,  -3, 1.35);
  addTree(-11,   5, 1.5);
  addTree( 11,   8, 1.4);
  addTree(-9,   13, 1.25);
  addTree( 9,   14, 1.6);
  addTree(-5,  -16, 1.1);
  addTree( 5,  -15, 1.3);
  addTree( 0,   17, 1.45);
  addTree(-7,   15, 1.2);
  addTree( 4,   -18, 1.0);
  addTree(-3,   -17, 1.1);

  // Bushes flanking entrance
  addBush(-1.9, -9.8, 0.52);
  addBush( 1.9, -9.8, 0.48);
  addBush(-3.4, -10.0, 0.40);
  addBush( 3.2, -10.0, 0.44);
  addBush(-2.6, -9.6, 0.34);
  addBush( 2.5, -9.6, 0.36);
}

// ─── House ───────────────────────────────────────────────────────────────────

function buildHouse() {
  // Floors — wood texture
  addBox({ name: 'floor',         pos: [0,    0.02,    0],  scale: [10.8, 0.16, 16.8], mat: materials.floor });
  addBox({ name: 'front terrace', pos: [0,    0.03, -10.4], scale: [8.5,  0.12,  4.2], mat: materials.gravel });
  addBox({ name: 'back terrace',  pos: [0,    0.03,  10.2], scale: [9.4,  0.12,  3.2], mat: materials.gravel });

  // Exterior walls — concrete texture
  addBox({ name: 'front wall left',  pos: [-3.25, 1.65, -8.1], scale: [3.5, 3.3, 0.24], mat: materials.wall });
  addBox({ name: 'front wall right', pos: [ 3.45, 1.65, -8.1], scale: [3.1, 3.3, 0.24], mat: materials.wall });
  addBox({ name: 'front lintel',     pos: [ 0.2,  2.95, -8.1], scale: [3.7, 0.7, 0.24], mat: materials.wall });
  addBox({ name: 'back wall',        pos: [ 0,    1.65,  8.1], scale: [10.4, 3.3, 0.24], mat: materials.wall });
  addBox({ name: 'left wall',        pos: [-5.1,  1.65,  0],   scale: [0.24, 3.3, 16.4], mat: materials.wall });
  addBox({ name: 'right wall',       pos: [ 5.1,  1.65,  0],   scale: [0.24, 3.3, 16.4], mat: materials.wall });

  // Columns at entrance
  addColumn(-1.1, -8.1);
  addColumn( 1.3, -8.1);

  // Roof — semi-transparent concrete
  const roofMat = new THREE.MeshStandardMaterial({
    map: concreteTex, color: 0xf0ebe2, roughness: 0.65, transparent: true, opacity: 0.72
  });
  const roof = addBox({ name: 'roof', pos: [0, 3.45, 0], scale: [11.2, 0.28, 17.2], mat: roofMat });
  roof.userData.fadeOnInterior = true;

  // Glass
  addBox({ name: 'glass entrance',       pos: [ 0,    1.4,  -8.23], scale: [2.0,  2.55, 0.05], mat: materials.glass, outline: false });
  addBox({ name: 'left panorama glass',  pos: [-5.23, 1.55, -2.6],  scale: [0.05, 2.75, 4.4],  mat: materials.glass, outline: false });
  addBox({ name: 'right panorama glass', pos: [ 5.23, 1.55, -2.1],  scale: [0.05, 2.75, 4.8],  mat: materials.glass, outline: false });
  addBox({ name: 'back glass',           pos: [ 1.7,  1.55,  8.23], scale: [4.3,  2.75, 0.05], mat: materials.glass, outline: false });

  // Interior partitions
  addBox({ name: 'hall left partition a',  pos: [-1.55, 1.55, -2.8], scale: [0.18, 3.1, 3.3] });
  addBox({ name: 'hall left partition b',  pos: [-1.55, 1.55,  5.8], scale: [0.18, 3.1, 4.5] });
  addBox({ name: 'hall right partition a', pos: [ 1.85, 1.55,  1.5], scale: [0.18, 3.1, 4.3] });
  addBox({ name: 'hall right partition b', pos: [ 1.85, 1.55,  6.7], scale: [0.18, 3.1, 2.8] });
  addBox({ name: 'living divider',         pos: [-3.25, 1.55,  2.25], scale: [3.55, 3.1, 0.18] });
  addBox({ name: 'kitchen divider',        pos: [ 3.45, 1.55,  2.25], scale: [3.1,  3.1, 0.18] });
  addBox({ name: 'bedroom wall',           pos: [-3.35, 1.55,  5.2],  scale: [3.3,  3.1, 0.18] });
  addBox({ name: 'bath wall',              pos: [ 3.45, 1.55,  5.2],  scale: [3.1,  3.1, 0.18] });

  // Furniture
  addBox({ name: 'sofa',              pos: [-3.25, 0.45, -1.4],  scale: [2.25, 0.60, 0.88], mat: materials.clayDark });
  addBox({ name: 'coffee table',      pos: [-3.2,  0.32,  0.1],  scale: [1.25, 0.22, 0.72], mat: materials.clay });
  addBox({ name: 'media wall',        pos: [-4.72, 1.0,   1.1],  scale: [0.22, 1.50, 2.40], mat: materials.clayDark });
  addBox({ name: 'kitchen island',    pos: [ 3.28, 0.52, -0.35], scale: [2.1,  0.92, 0.92], mat: materials.clayDark });
  addBox({ name: 'kitchen wall units',pos: [ 4.74, 1.1,   0.95], scale: [0.38, 2.00, 2.35], mat: materials.clayDark });
  // Bed — frame, headboard, mattress, duvet, pillows
  addBox({ name: 'bed frame',       pos: [-3.45, 0.28,  6.85], scale: [2.40, 0.44, 2.20], mat: materials.clayDark });
  addBox({ name: 'headboard',       pos: [-3.45, 0.96,  5.88], scale: [2.40, 0.90, 0.10], mat: materials.clayDark });
  addBox({ name: 'mattress',        pos: [-3.45, 0.62,  6.85], scale: [2.22, 0.20, 2.05], mat: materials.quilt });
  addBox({ name: 'duvet',           pos: [-3.45, 0.84,  7.12], scale: [2.20, 0.15, 1.65], mat: materials.quilt });
  addBox({ name: 'pillow L',        pos: [-4.12, 0.88,  6.12], scale: [0.86, 0.14, 0.50], mat: materials.pillow });
  addBox({ name: 'pillow R',        pos: [-2.80, 0.88,  6.12], scale: [0.86, 0.14, 0.50], mat: materials.pillow });
  addBox({ name: 'wardrobe',        pos: [-4.75, 1.25,  5.85], scale: [0.36, 2.30, 1.70], mat: materials.clayDark });
  // Nightstand + table lamp (right side, more space)
  addBox({ name: 'nightstand',      pos: [-2.06, 0.36,  6.12], scale: [0.42, 0.44, 0.42], mat: materials.clayDark });
  addBox({ name: 'lamp base',       pos: [-2.06, 0.60,  6.12], scale: [0.09, 0.09, 0.09], mat: materials.clayDark });
  addBox({ name: 'lamp stem',       pos: [-2.06, 0.72,  6.12], scale: [0.03, 0.22, 0.03], mat: materials.clayDark, outline: false });
  addBox({ name: 'lamp shade',      pos: [-2.06, 0.88,  6.12], scale: [0.22, 0.14, 0.22], mat: materials.lampShade, outline: false });
  addBox({ name: 'lamp glow',       pos: [-2.06, 0.82,  6.12], scale: [0.12, 0.08, 0.12], mat: materials.warm, outline: false });
  // Wall sconce on left bedroom wall
  addBox({ name: 'sconce arm',      pos: [-4.92, 2.26,  7.15], scale: [0.10, 0.08, 0.22], mat: materials.clayDark });
  addBox({ name: 'sconce shade',    pos: [-4.82, 2.26,  7.15], scale: [0.10, 0.18, 0.14], mat: materials.lampShade, outline: false });
  addBox({ name: 'sconce glow',     pos: [-4.78, 2.26,  7.15], scale: [0.06, 0.10, 0.08], mat: materials.warm, outline: false });
  // Painting on bedroom divider wall (inner face z ≈ 5.31)
  addBox({ name: 'painting frame',  pos: [-3.35, 1.88,  5.31], scale: [1.28, 0.98, 0.06], mat: materials.clayDark, outline: false });
  addBox({ name: 'painting canvas', pos: [-3.35, 1.88,  5.35], scale: [1.14, 0.84, 0.03], mat: materials.painting, outline: false });
  addBox({ name: 'bath block',      pos: [ 3.35, 0.56,  6.65], scale: [1.45, 0.72, 1.70], mat: materials.clayDark });
  addBox({ name: 'stair mass',        pos: [ 0.22, 0.42,  4.45], scale: [1.15, 0.70, 2.90], mat: materials.clayDark });

  // Warm line lights
  addBox({ name: 'light front',   pos: [0,   3.08, -4.9],  scale: [6.5,  0.05, 0.08], mat: materials.warm, outline: false });
  addBox({ name: 'light kitchen', pos: [3.2, 3.08, -0.45], scale: [0.08, 0.05, 2.8],  mat: materials.warm, outline: false });
  addBox({ name: 'light hall',    pos: [0.2, 3.08,  4.5],  scale: [0.08, 0.05, 3.4],  mat: materials.warm, outline: false });

  addLabel('Salon',    -3.25, -0.25);
  addLabel('Kuchnia',   3.2,  -0.1);
  addLabel('Hall',      0.1,   3.25);
  addLabel('Sypialnia',-3.35,  6.7);
  addLabel('Łazienka',  3.4,   6.65);
}

// ─── Camera path guide ───────────────────────────────────────────────────────

function buildCameraPathGuide() {
  const points = cameraKeyframes.map((f) => f.pos);
  const geo = new THREE.BufferGeometry().setFromPoints(
    new THREE.CatmullRomCurve3(points).getPoints(120)
  );
  const line = new THREE.Line(geo, materials.path);
  line.position.y = -0.02;
  scene.add(line);
}

// ─── Lights ──────────────────────────────────────────────────────────────────

function setupLights() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x302f2c, 1.55));

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

// ─── Stage content ───────────────────────────────────────────────────────────

const stageContent = [
  { title: 'Widok inwestycji',   copy: 'Scrolluj, aby zbliżyć się do budynku. To wersja MVP oparta o prostą białą makietę 3D.' },
  { title: 'Elewacja i wejście', copy: 'Kamera płynnie podchodzi pod dom. W produkcji można tu pokazać nazwę inwestycji, metraż i kluczowe wyróżniki.' },
  { title: 'Salon z aneksem',    copy: 'Pierwsze wejście do środka. Pomieszczenia są czytelne dzięki bryłom, światłu i prostym podpisom.' },
  { title: 'Kuchnia',            copy: 'Kolejny etap spaceru może opowiadać o funkcjonalnym układzie, widoku z okna albo jakości materiałów.' },
  { title: 'Hall i komunikacja', copy: 'Scroll steruje kamerą, a nie tylko tekstem. Dzięki temu strona działa jak krótki film produktowy.' },
  { title: 'Strefa prywatna',    copy: 'Na końcu spaceru użytkownik może dostać CTA, formularz, rzuty PDF albo przejście do wyboru lokalu.' },
];

// ─── Camera keyframes ────────────────────────────────────────────────────────

const cameraKeyframes = [
  { p: 0,    pos: new THREE.Vector3(0,    4.3,  -30),  target: new THREE.Vector3(0,    1.4,  -2),   stage: 0 },
  { p: 0.15, pos: new THREE.Vector3(0,    3.6,  -19),  target: new THREE.Vector3(0,    1.55, -5.5), stage: 0 },
  { p: 0.28, pos: new THREE.Vector3(0,    1.85,  -9.35), target: new THREE.Vector3(0,  1.45, -4.0), stage: 1 },
  { p: 0.42, pos: new THREE.Vector3(-2.9, 1.68,  -3.3),  target: new THREE.Vector3(-3.55, 1.35, 1.7), stage: 2 },
  { p: 0.56, pos: new THREE.Vector3( 3.05,1.68,  -2.1),  target: new THREE.Vector3( 3.65, 1.35, 2.0), stage: 3 },
  { p: 0.70, pos: new THREE.Vector3( 0.1, 1.68,   2.15), target: new THREE.Vector3( 0.15, 1.38, 6.3), stage: 4 },
  { p: 0.84, pos: new THREE.Vector3(-3.1, 1.68,   5.7),  target: new THREE.Vector3(-3.95, 1.25, 7.9), stage: 5 },
  { p: 1,    pos: new THREE.Vector3( 3.15,1.68,   5.95), target: new THREE.Vector3( 4.05, 1.25, 7.8), stage: 5 },
];

// ─── Scroll / HUD logic ──────────────────────────────────────────────────────

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(v) { return Math.min(1, Math.max(0, v)); }

function getScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  return scrollable <= 0 ? 0 : clamp01(window.scrollY / scrollable);
}

function getFrame(progress) {
  let current = cameraKeyframes[0];
  let next = cameraKeyframes[cameraKeyframes.length - 1];
  for (let i = 0; i < cameraKeyframes.length - 1; i++) {
    if (progress >= cameraKeyframes[i].p && progress <= cameraKeyframes[i + 1].p) {
      current = cameraKeyframes[i];
      next = cameraKeyframes[i + 1];
      break;
    }
  }
  const t = easeInOutCubic(clamp01((progress - current.p) / (next.p - current.p)));
  return {
    pos:    current.pos.clone().lerp(next.pos, t),
    target: current.target.clone().lerp(next.target, t),
    stage:  t < 0.55 ? current.stage : next.stage,
  };
}

function updateHud(progress, stage) {
  const { title, copy } = stageContent[stage] || stageContent[0];
  if (stageTitle.textContent !== title) stageTitle.textContent = title;
  if (stageCopy.textContent  !== copy)  stageCopy.textContent  = copy;
  const pct = Math.round(progress * 100);
  progressBar.style.width = `${pct}%`;
  progressPercent.textContent = `${pct}%`;
  dots.forEach((d, i) => d.classList.toggle('active', i === stage));
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
  const px = mouse.x * 0.18, py = mouse.y * 0.08;
  camera.position.lerp(new THREE.Vector3(frame.pos.x + px, frame.pos.y + py, frame.pos.z), 0.12);
  camera.lookAt(new THREE.Vector3(frame.target.x + px * 0.7, frame.target.y + py * 0.5, frame.target.z));
  updateHud(progress, frame.stage);
  fadeRoof(progress);
}

// ─── Render loop ─────────────────────────────────────────────────────────────

function animate() {
  house.position.y = Math.sin(clock.getElapsedTime() * 0.55) * 0.015;
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function goToStep(index) {
  const frame = cameraKeyframes.find((f) => f.stage === index) || cameraKeyframes[0];
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: scrollable * frame.p, behavior: 'smooth' });
}

// ─── Events ──────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
});

dots.forEach((d) => d.addEventListener('click', () => goToStep(Number(d.dataset.step))));

// ─── Init ────────────────────────────────────────────────────────────────────

buildGround();
buildHouse();
buildEntranceArea();
buildCameraPathGuide();
setupLights();
updateCamera();
animate();
