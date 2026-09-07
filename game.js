import * as THREE from "three";

const canvas = document.getElementById("view");
const menu = document.getElementById("menu");
const endScreen = document.getElementById("end");
const pauseScreen = document.getElementById("pause");
const hud = document.getElementById("hud");
const hpFill = document.getElementById("hp-fill");
const coreCount = document.getElementById("core-count");
const hurt = document.getElementById("hurt");
const markerEl = document.getElementById("marker");
const markerDist = document.getElementById("marker-dist");
const missionText = document.getElementById("mission-text");
const phaseKicker = document.getElementById("phase-kicker");
const nearPrompt = document.getElementById("near-prompt");
const lockBanner = document.getElementById("lock-banner");
const phaseBanner = document.getElementById("phase-banner");
const hitmarker = document.getElementById("hitmarker");
const heatFill = document.getElementById("heat-fill");
const hurtL = document.getElementById("hurt-l");
const hurtR = document.getElementById("hurt-r");
const enemyCountEl = document.getElementById("enemy-count");
const timerLab = document.getElementById("timer-lab");
const hpLayer = document.getElementById("hp-layer");
const storyEl = document.getElementById("story");
const alertEl = document.getElementById("alert");
const invSlot = document.getElementById("inv-slot");
const weaponNameEl = document.getElementById("weapon-name");
const ammoCountEl = document.getElementById("ammo-count");
const ammoLineEl = document.getElementById("ammo-line");
const btnStart = document.getElementById("btn-start");
const btnRetry = document.getElementById("btn-retry");
const btnResume = document.getElementById("btn-resume");

const KEYS = {};
const PLAYER_R = 0.4;
const EYE = 1.58;
const PHASE_NAMES = ["", "HANGAR", "ALA LESTE", "CORREDORES", "COFRE NORTE"];
const PHASE_NEED = [0, 2, 3, 3, 3];
const PHASE_INFO = [
  "",
  "O reator central está desativado. Derrote os robôs portadores, recupere 2 células e instale-as no reator.",
  "Destrua o gerador laranja para desativar as torretas. Derrote os robôs para obter as células.",
  "Os corredores permitem flanqueio. Observe o temporizador. Recupere as células dos robôs.",
  "A unidade pesada só sofre dano no visor. Recupere as 3 células e instale-as no cofre.",
];
const STORY = [
  "",
  "O NEXO foi desativado. Os reatores estão vazios. A defesa automática identifica o operador como intruso.",
  "A ala leste ativou as torretas. O gerador laranja as alimenta. As células estão com os robôs da ala.",
  "Os corredores foram ativados. O protocolo de tempo foi iniciado. As unidades irão flanquear.",
  "O cofre norte abriga o último reator. A unidade pesada protege a entrada. Apenas o visor é vulnerável.",
];
const LABELS = { drone: "Drone", turret: "Torreta", chaser: "Unidade rápida", heavy: "Unidade pesada", alarm: "Alarme de tempo" };
const WEAPONS = {
  pistola: { name: "PISTOLA", dmg: 1, cd: 0.24, mag: 12, heat: 13, pellets: 1, spread: 0, recoil: -0.3 },
  rifle: { name: "RIFLE", dmg: 1, cd: 0.1, mag: 30, heat: 8, pellets: 1, spread: 0.014, recoil: -0.18 },
  escopeta: { name: "ESCOPETA", dmg: 1, cd: 0.75, mag: 6, heat: 32, pellets: 6, spread: 0.055, recoil: -0.55 },
};

const state = {
  running: false,
  paused: false,
  hp: 100,
  cores: 0,
  phase: 1,
  phaseGot: 0,
  phaseNeed: 2,
  yaw: 0,
  pitch: -0.06,
  grounded: true,
  velY: 0,
  shootCd: 0,
  hurtFlash: 0,
  iframe: 0,
  bob: 0,
  moved: false,
  grace: 1.8,
  dragging: false,
  triedLock: false,
  stepT: 0,
  heat: 0,
  overheat: false,
  overclock: 0,
  timer: 0,
  alarm: false,
  alarmT: 0,
  beatT: 0,
  hurtL: 0,
  hurtR: 0,
  lastHitBy: "",
  carrying: false,
  carryingFrom: null,
  weapon: "pistola",
  ammo: 12,
  vx: 0,
  vz: 0,
  yawPrev: 0,
  pitchPrev: -0.06,
  swayX: 0,
  swayY: 0,
  roll: 0,
  landKick: 0,
  coyote: 0,
  jumpBuf: 0,
  bobAmt: 0,
  lookYaw: 0,
  lookPitch: -0.06,
  mx: 0,
  my: 0,
};

const audio = { ctx: null, master: null, humGain: null, started: false };

function initAudio() {
  if (audio.ctx) return;
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.4;
  master.connect(ctx.destination);
  audio.ctx = ctx;
  audio.master = master;
}

function beep(freq, dur, type = "square", vol = 0.16, slide = 0, pan = 0) {
  if (!audio.ctx) return;
  const t = audio.ctx.currentTime;
  const o = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  const p = audio.ctx.createStereoPanner();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  p.pan.value = THREE.MathUtils.clamp(pan, -1, 1);
  o.connect(g);
  g.connect(p);
  p.connect(audio.master);
  o.start(t);
  o.stop(t + dur);
}

function noiseBurst(dur = 0.07, vol = 0.16, freq = 1600) {
  if (!audio.ctx) return;
  const t = audio.ctx.currentTime;
  const n = audio.ctx.createBuffer(1, Math.max(1, audio.ctx.sampleRate * dur), audio.ctx.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = audio.ctx.createBufferSource();
  src.buffer = n;
  const f = audio.ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  const g = audio.ctx.createGain();
  g.gain.value = vol;
  src.connect(f);
  f.connect(g);
  g.connect(audio.master);
  src.start(t);
}

function startAmbience() {
  if (!audio.ctx || audio.started) return;
  audio.started = true;
  const ctx = audio.ctx;
  const t = ctx.currentTime;
  const pad = ctx.createGain();
  pad.gain.value = 0.16;
  pad.connect(audio.master);
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  o1.type = "sine";
  o2.type = "sine";
  o1.frequency.value = 46;
  o2.frequency.value = 69;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 380;
  o1.connect(lp);
  o2.connect(lp);
  lp.connect(pad);
  o1.start(t);
  o2.start(t);
  const bed = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = bed.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.22;
  const noise = ctx.createBufferSource();
  noise.buffer = bed;
  noise.loop = true;
  const nf = ctx.createBiquadFilter();
  nf.type = "lowpass";
  nf.frequency.value = 750;
  const ng = ctx.createGain();
  ng.gain.value = 0.07;
  noise.connect(nf);
  nf.connect(ng);
  ng.connect(audio.master);
  noise.start(t);
  const hum = ctx.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = 78;
  const hf = ctx.createBiquadFilter();
  hf.type = "bandpass";
  hf.Q.value = 4;
  hf.frequency.value = 160;
  audio.humGain = ctx.createGain();
  audio.humGain.gain.value = 0;
  hum.connect(hf);
  hf.connect(audio.humGain);
  audio.humGain.connect(audio.master);
  hum.start(t);

  const pulse = ctx.createOscillator();
  pulse.type = "sine";
  pulse.frequency.value = 52;
  const pg = ctx.createGain();
  pg.gain.value = 0.05;
  pulse.connect(pg);
  pg.connect(audio.master);
  pulse.start(t);
  audio.pulseGain = pg;
  audio.alarmOsc = ctx.createOscillator();
  audio.alarmOsc.type = "square";
  audio.alarmOsc.frequency.value = 880;
  audio.alarmGain = ctx.createGain();
  audio.alarmGain.gain.value = 0;
  audio.alarmOsc.connect(audio.alarmGain);
  audio.alarmGain.connect(audio.master);
  audio.alarmOsc.start(t);
}

const sfx = {
  foot(sprint) {
    noiseBurst(0.05, sprint ? 0.16 : 0.11, sprint ? 900 : 620);
    beep(sprint ? 95 : 80, 0.06, "sine", 0.07);
  },
  jump() {
    beep(180, 0.08, "sine", 0.09, -70);
    noiseBurst(0.04, 0.08, 400);
  },
  shoot(kind) {
    if (kind === "escopeta") {
      noiseBurst(0.16, 0.32, 700);
      beep(160, 0.14, "sawtooth", 0.2, -60);
    } else if (kind === "rifle") {
      noiseBurst(0.06, 0.22, 2200);
      beep(840, 0.05, "square", 0.1, -300);
    } else {
      noiseBurst(0.08, 0.26, 1800);
      beep(720, 0.06, "square", 0.12, -380);
      beep(180, 0.09, "sine", 0.08);
    }
  },
  dry() {
    beep(1200, 0.03, "square", 0.08);
    beep(850, 0.05, "square", 0.06);
  },
  deposit() {
    beep(140, 0.12, "sine", 0.22, -40);
    beep(280, 0.2, "triangle", 0.16, 160);
    noiseBurst(0.08, 0.12, 600);
  },
  drop() {
    beep(330, 0.2, "sawtooth", 0.14, -180);
  },
  pickup() {
    beep(523, 0.09, "sine", 0.16);
    beep(659, 0.11, "sine", 0.14);
    beep(784, 0.16, "triangle", 0.13, 40);
  },
  hit() {
    noiseBurst(0.12, 0.24, 300);
    beep(70, 0.2, "sawtooth", 0.2, -30);
  },
  droneShot(pos) {
    beep(240, 0.1, "sawtooth", 0.14, -90, panOf(pos));
    noiseBurst(0.06, 0.13, 900);
  },
  droneHit(pos) {
    beep(150, 0.08, "square", 0.13, -40, panOf(pos));
    noiseBurst(0.05, 0.1, 1200);
  },
  droneDie() {
    beep(90, 0.32, "sawtooth", 0.2, -45);
    noiseBurst(0.2, 0.2, 500);
  },
  charge() {
    beep(420, 0.32, "triangle", 0.11, 280);
  },
  hitmark() {
    beep(1900, 0.045, "square", 0.1);
  },
  armor(pos) {
    beep(140, 0.07, "square", 0.1, 0, panOf(pos));
    noiseBurst(0.04, 0.08, 800);
  },
  overheat() {
    beep(90, 0.22, "sawtooth", 0.16, -20);
    noiseBurst(0.15, 0.14, 700);
  },
  overclock() {
    beep(440, 0.12, "sine", 0.14, 200);
    beep(880, 0.2, "triangle", 0.1);
  },
  beat(phase) {
    beep(70 + phase * 6, 0.07, "sine", 0.06 + phase * 0.01);
    if (phase >= 3) noiseBurst(0.03, 0.05, 2400);
  },
  phase() {
    noiseBurst(0.22, 0.2, 400);
    beep(220, 0.18, "sine", 0.14, 180);
    beep(330, 0.28, "triangle", 0.12, 120);
  },
  win() {
    beep(392, 0.16, "sine", 0.16);
    beep(523, 0.2, "sine", 0.16);
    beep(659, 0.4, "triangle", 0.18);
  },
  lose() {
    beep(110, 0.45, "sawtooth", 0.2, -50);
    noiseBurst(0.3, 0.16, 200);
  },
  hum(dist) {
    if (!audio.humGain) return;
    const vol = state.running && !state.paused ? Math.max(0, (1 - dist / 13) * 0.13) : 0;
    audio.humGain.gain.setTargetAtTime(vol, audio.ctx.currentTime, 0.08);
  },
};

function panOf(pos) {
  if (!pos) return 0;
  const dx = pos.x - player.position.x;
  const dz = pos.z - player.position.z;
  const dist = Math.hypot(dx, dz) || 1;
  return THREE.MathUtils.clamp((dx * Math.cos(state.yaw) + dz * -Math.sin(state.yaw)) / dist, -1, 1);
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.48;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101820);
scene.fog = new THREE.Fog(0x101820, 32, 72);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.07, 110);
const player = new THREE.Object3D();
player.position.set(0, 0, 6);
scene.add(player);
player.add(camera);
camera.position.set(0, EYE, 0);

const world = new THREE.Group();
scene.add(world);

scene.add(new THREE.AmbientLight(0x2a3a44, 0.58));
scene.add(new THREE.HemisphereLight(0x8eb8cc, 0x182028, 0.72));
const sun = new THREE.DirectionalLight(0xd4e6f0, 0.72);
sun.position.set(-8, 22, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
sun.shadow.camera.far = 50;
scene.add(sun);
const rim = new THREE.DirectionalLight(0x6ae0d0, 0.28);
rim.position.set(10, 10, -12);
scene.add(rim);

const flashlight = new THREE.SpotLight(0xe2f6ff, 3.2, 26, 0.6, 0.4, 0.85);
flashlight.position.set(0.15, -0.08, 0.1);
flashlight.target.position.set(0, -0.18, -8);
camera.add(flashlight);
camera.add(flashlight.target);

const muzzle = new THREE.PointLight(0x9ffff0, 0, 7);
muzzle.position.set(0.22, -0.12, -0.7);
camera.add(muzzle);

const guide = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineDashedMaterial({ color: 0x2affd0, dashSize: 0.4, gapSize: 0.35, transparent: true, opacity: 0.45 })
);
guide.frustumCulled = false;
guide.visible = false;
scene.add(guide);

const metal = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.72, roughness: 0.32, ...extra });
const emit = (color, intensity = 1.4) =>
  new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.35,
    metalness: 0.2,
  });

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function buildGunModel(type) {
  const g = new THREE.Group();
  if (type === "rifle") {
    const mag = mesh(new THREE.BoxGeometry(0.06, 0.2, 0.09), metal(0x141c23), 0, -0.13, -0.05);
    mag.rotation.x = 0.12;
    g.add(
      mesh(new THREE.BoxGeometry(0.08, 0.1, 0.62), metal(0x1c2732, { roughness: 0.3 }), 0, 0.02, -0.16),
      mesh(new THREE.BoxGeometry(0.07, 0.09, 0.22), metal(0x18222b), 0, -0.01, 0.22),
      mesh(new THREE.BoxGeometry(0.06, 0.14, 0.07), metal(0x18222b, { roughness: 0.5 }), 0, -0.11, 0.08),
      mesh(new THREE.BoxGeometry(0.02, 0.05, 0.2), metal(0x0c1216), 0, 0.1, -0.2),
      mesh(new THREE.BoxGeometry(0.05, 0.014, 0.3), emit(0x2affd0, 0.8), 0, 0.075, -0.18),
      mag
    );
    const barrel = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), metal(0x0c1216), 0, 0.04, -0.6);
    barrel.rotation.x = Math.PI / 2;
    g.add(barrel);
  } else if (type === "escopeta") {
    const barrel = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 10), metal(0x1a222b, { roughness: 0.26 }), 0, 0.05, -0.28);
    barrel.rotation.x = Math.PI / 2;
    const tube = mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.5, 8), metal(0x10161c), 0, -0.02, -0.24);
    tube.rotation.x = Math.PI / 2;
    const wood = { roughness: 0.75, metalness: 0.05 };
    g.add(
      barrel,
      tube,
      mesh(new THREE.BoxGeometry(0.09, 0.11, 0.24), metal(0x232d36), 0, 0.01, 0.08),
      mesh(new THREE.BoxGeometry(0.07, 0.08, 0.16), metal(0x4a3423, wood), 0, -0.045, -0.28),
      mesh(new THREE.BoxGeometry(0.08, 0.1, 0.2), metal(0x4a3423, wood), 0, -0.05, 0.26),
      mesh(new THREE.BoxGeometry(0.05, 0.014, 0.2), emit(0xffb14a, 0.7), 0, 0.075, 0.02)
    );
  } else {
    const grip = mesh(new THREE.BoxGeometry(0.06, 0.16, 0.075), metal(0x18222b, { roughness: 0.5 }), 0, -0.13, 0.02);
    grip.rotation.x = 0.18;
    const barrel = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.1, 8), metal(0x0c1216), 0, 0.03, -0.3);
    barrel.rotation.x = Math.PI / 2;
    g.add(
      mesh(new THREE.BoxGeometry(0.075, 0.085, 0.34), metal(0x1f2a33, { roughness: 0.28 }), 0, 0.02, -0.1),
      mesh(new THREE.BoxGeometry(0.065, 0.05, 0.3), metal(0x141c23), 0, -0.03, -0.08),
      barrel,
      grip,
      mesh(new THREE.BoxGeometry(0.014, 0.03, 0.02), metal(0x0c1216), 0, 0.075, -0.24),
      mesh(new THREE.BoxGeometry(0.05, 0.012, 0.14), emit(0x2affd0, 0.8), 0, 0.068, -0.05)
    );
  }
  return g;
}

function updateWeaponHud() {
  weaponNameEl.textContent = WEAPONS[state.weapon].name;
  ammoCountEl.textContent = String(state.ammo);
  ammoLineEl.classList.toggle("low", state.ammo <= 3);
}

function setWeapon(type, silent = false) {
  state.weapon = type;
  state.ammo = WEAPONS[type].mag;
  while (gun.children.length) gun.remove(gun.children[0]);
  gun.add(buildGunModel(type));
  updateWeaponHud();
  if (!silent) {
    sfx.pickup();
    showBanner(`${WEAPONS[type].name} — CARREGADOR COMPLETO`);
  }
}

const gun = new THREE.Group();
camera.add(gun);
gun.position.set(0.3, -0.28, -0.58);
gun.add(buildGunModel("pistola"));

const colliders = [];
const gates = [];
const cores = [];
const reactors = [];
const enemies = [];
const props = [];
const shots = [];
const enemyShots = [];
const bits = [];
const weaponPickups = [];
let wMat;
let hitTimer = 0;
let bannerTimer = 0;

function canvasTex(draw, size = 256, repeat = 8) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function floorTex() {
  return canvasTex((g, s) => {
    g.fillStyle = "#10161c";
    g.fillRect(0, 0, s, s);
    const n = 8;
    const t = s / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        g.fillStyle = (x + y) % 2 ? "#22303a" : "#1a242e";
        g.fillRect(x * t + 1, y * t + 1, t - 2, t - 2);
        g.strokeStyle = "rgba(70, 160, 170, 0.22)";
        g.strokeRect(x * t + 1, y * t + 1, t - 2, t - 2);
      }
    }
  }, 256, 14);
}

function wallTex() {
  return canvasTex((g, s) => {
    g.fillStyle = "#243038";
    g.fillRect(0, 0, s, s);
    g.fillStyle = "#1c262e";
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 3; x++) {
        g.fillRect(10 + x * 82, 8 + y * 62, 74, 52);
        g.strokeStyle = "rgba(80, 140, 150, 0.28)";
        g.strokeRect(10 + x * 82, 8 + y * 62, 74, 52);
      }
    }
    g.fillStyle = "#1fd7c4";
    g.globalAlpha = 0.4;
    g.fillRect(0, s - 8, s, 4);
    g.globalAlpha = 1;
  }, 256, 6);
}

function addSolid(x, y, z, w, h, d, mat, collide = true) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  world.add(m);
  let col = null;
  if (collide) {
    col = {
      min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
      max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2),
    };
    colliders.push(col);
  }
  return { mesh: m, col };
}

function addStrip(x, y, z, w, h, d, color = 0x1fd7c4) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), emit(color, 2.05), x, y, z);
  m.castShadow = false;
  world.add(m);
}

function addLightFixture(x, z) {
  const housing = mesh(new THREE.BoxGeometry(1.6, 0.08, 0.45), metal(0x0c1014), x, 4.72, z);
  const lamp = mesh(new THREE.BoxGeometry(1.4, 0.04, 0.28), emit(0xf2fbff, 2.7), x, 4.66, z);
  housing.castShadow = false;
  lamp.castShadow = false;
  world.add(housing, lamp);
  const p = new THREE.PointLight(0xe4f4ff, 2.65, 14, 1.5);
  p.position.set(x, 4.2, z);
  world.add(p);
}

function addCrate(x, z, color = 0x1a242e) {
  addSolid(x, 0.45, z, 0.9, 0.9, 0.9, metal(color, { roughness: 0.5 }));
  addStrip(x, 0.46, z + 0.46, 0.7, 0.03, 0.02, 0xff8a3a);
}

function addGate(id, x, z, w, h, d) {
  const gateMat = metal(0x1a1010, { roughness: 0.4, metalness: 0.55, emissive: 0x3a0808, emissiveIntensity: 0.35 });
  const { mesh: m, col } = addSolid(x, h / 2, z, w, h, d, gateMat);
  const strip = mesh(new THREE.BoxGeometry(w * 0.7, 0.06, d * 0.7), emit(0xff3a3a, 2), 0, h * 0.22, 0);
  strip.castShadow = false;
  m.add(strip);
  gates.push({ id, mesh: m, col, pos: new THREE.Vector3(x, h / 2, z) });
}

function openGate(id) {
  const g = gates.find((x) => x.id === id && !x.open);
  if (!g) return;
  g.open = true;
  world.remove(g.mesh);
  const i = colliders.indexOf(g.col);
  if (i >= 0) colliders.splice(i, 1);
  spawnBits(g.pos, 0xff5a3a, 18);
}

function buildWorld() {
  wMat = new THREE.MeshStandardMaterial({ map: wallTex(), roughness: 0.68, metalness: 0.22 });
  const fMat = new THREE.MeshStandardMaterial({ map: floorTex(), roughness: 0.8, metalness: 0.16 });
  const floor = mesh(new THREE.PlaneGeometry(72, 72), fMat);
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  world.add(floor);
  world.add(mesh(new THREE.BoxGeometry(70, 0.4, 70), metal(0x12181e, { roughness: 0.7 }), 0, 5.05, 0));

  const H = 5;
  const hub = 11.5;
  const gap = 2.2;
  const seg = hub - gap;
  const mid = (hub + gap) / 2;

  addSolid(-mid, H / 2, -hub, seg, H, 0.7, wMat);
  addSolid(mid, H / 2, -hub, seg, H, 0.7, wMat);
  addSolid(-mid, H / 2, hub, seg, H, 0.7, wMat);
  addSolid(mid, H / 2, hub, seg, H, 0.7, wMat);
  addSolid(-hub, H / 2, -mid, 0.7, H, seg, wMat);
  addSolid(-hub, H / 2, mid, 0.7, H, seg, wMat);
  addSolid(hub, H / 2, -mid, 0.7, H, seg, wMat);
  addSolid(hub, H / 2, mid, 0.7, H, seg, wMat);

  addGate("east", hub, 0, 0.55, H, 4.3);
  addGate("west", -hub, 0, 0.55, H, 4.3);
  addGate("south", 0, hub, 4.3, H, 0.55);
  addGate("north", 0, -hub, 4.3, H, 0.55);

  addSolid(15.7, H / 2, 9, 8.4, H, 0.7, wMat);
  addSolid(26.35, H / 2, 9, 3.3, H, 0.7, wMat);
  addSolid(22.3, H / 2, 12.4, 5.6, H, 0.7, wMat);
  addSolid(19.9, H / 2, 10.7, 0.7, H, 3.4, wMat);
  addSolid(24.7, H / 2, 10.7, 0.7, H, 3.4, wMat);
  addSolid(19.75, H / 2, -9, 16.6, H, 0.7, wMat);
  addSolid(28, H / 2, 0, 0.7, H, 18.7, wMat);

  addSolid(-19.75, H / 2, 9, 16.6, H, 0.7, wMat);
  addSolid(-19.75, H / 2, -9, 16.6, H, 0.7, wMat);
  addSolid(-28, H / 2, 0, 0.7, H, 18.7, wMat);

  addSolid(9, H / 2, 18.75, 0.7, H, 14.6, wMat);
  addSolid(-9, H / 2, 18.75, 0.7, H, 14.6, wMat);
  addSolid(0, H / 2, 26, 18.7, H, 0.7, wMat);

  addSolid(9, H / 2, -18.75, 0.7, H, 14.6, wMat);
  addSolid(-9, H / 2, -18.75, 0.7, H, 14.6, wMat);
  addSolid(0, H / 2, -26, 18.7, H, 0.7, wMat);

  addStrip(0, 0.06, 0, 8, 0.04, 0.04);
  addSolid(-5.5, 1.5, -2.8, 6.5, 3, 0.4, wMat);
  addSolid(5.8, 1.5, 3.6, 5.5, 3, 0.4, wMat);
  addSolid(20, 1.4, 2.2, 4.2, 2.8, 0.4, wMat);
  addSolid(-20, 1.4, -2.4, 4.2, 2.8, 0.4, wMat);
  addSolid(2.4, 1.4, 19.5, 0.4, 2.8, 4.2, wMat);
  addSolid(-4, 1.2, -19.6, 1.8, 2.4, 0.45, wMat);
  addSolid(4, 1.2, -19.6, 1.8, 2.4, 0.45, wMat);

  for (const [x, z] of [
    [0, 0],
    [0, 6],
    [0, -6],
    [6, 0],
    [-6, 0],
    [20, 0],
    [-20, 0],
    [0, 19],
    [0, -19],
  ]) addLightFixture(x, z);

  addCrate(-8, 2.2);
  addCrate(8.4, -3);
  addCrate(16.5, -5);
  addCrate(-17, 5);
  addCrate(4.5, 16.5);
  addCrate(-4, -16);

  addSolid(-8, 2.4, -8, 0.65, 4.8, 0.65, metal(0x1a222b));
  addSolid(8, 2.4, 8, 0.65, 4.8, 0.65, metal(0x1a222b));
  addStrip(-8, 2.5, -8, 0.72, 0.06, 0.72);
  addStrip(8, 2.5, 8, 0.72, 0.06, 0.72);

  const spawnLight = new THREE.PointLight(0x9fd8d0, 1.6, 14);
  spawnLight.position.set(0, 3.6, 6);
  world.add(spawnLight);

  spawnPhase(1);
}

function spawnPhase(n) {
  state.phase = n;
  state.phaseGot = 0;
  state.phaseNeed = PHASE_NEED[n];
  state.grace = n === 1 ? 1.8 : 0.55;
  state.timer = n === 3 ? 80 : 0;
  state.alarm = false;
  state.carrying = false;
  state.carryingFrom = null;
  updateInv();
  if (n === 1) {
    spawnReactor(0, -6.5);
    spawnEnemy("drone", 0, 2.4, true);
    spawnEnemy("drone", -7.2, -6.2, true);
    spawnWeapon("rifle", -9.6, 4.6);
    spawnWeapon("pistola", 8.6, -4.4);
    spawnEnemy("drone", 7.4, -7.2);
    spawnEnemy("drone", -7.6, 7.4);
  }
  if (n === 2) {
    openGate("east");
    spawnReactor(20, 0);
    spawnGenerator(24.6, 0);
    spawnEnemy("drone", 16.2, 4.2, true);
    spawnEnemy("drone", 22.5, -4.6, true);
    spawnEnemy("chaser", 25.2, 3.4, true);
    spawnWeapon("escopeta", 26.2, 6.8);
    spawnWeapon("rifle", 13.8, -6.6);
    spawnEnemy("turret", 18.2, 6.2);
    spawnEnemy("turret", 23.4, -6.4);
    spawnEnemy("drone", 25.6, 0);
    spawnEnemy("drone", 16.5, -5.5);
  }
  if (n === 3) {
    openGate("west");
    openGate("south");
    spawnReactor(-20, 0);
    spawnReactor(0, 19);
    spawnEnemy("chaser", -17.4, 4.6, true);
    spawnEnemy("drone", -24.2, -3.8, true);
    spawnEnemy("chaser", 4.2, 20.4, true);
    spawnWeapon("rifle", -26, 6.4);
    spawnWeapon("escopeta", 6.2, 24.2);
    spawnWeapon("pistola", -4.5, 16);
    spawnEnemy("chaser", -20.2, -5.2);
    spawnEnemy("chaser", -16.4, 5.6);
    spawnEnemy("chaser", 5.4, 18.2);
    spawnEnemy("drone", -24.6, 5.2);
    spawnEnemy("turret", -18, -4);
  }
  if (n === 4) {
    openGate("north");
    spawnReactor(0, -20);
    spawnEnemy("drone", 0, -17.6, true);
    spawnEnemy("chaser", -5.2, -22.4, true);
    spawnEnemy("drone", 5.4, -22.2, true);
    spawnWeapon("escopeta", -6.4, -24.4);
    spawnWeapon("rifle", 6.6, -24.6);
    spawnEnemy("heavy", 0, -23.4);
    spawnEnemy("turret", -6.2, -16.4);
    spawnEnemy("chaser", 6.4, -16.6);
    spawnEnemy("drone", -4, -18);
    spawnEnemy("drone", 4, -18);
  }
  sfx.phase();
  const extra = state.overclock > 0 && n > 1 ? "  ·  OVERCLOCK 9s" : "";
  showBanner(`FASE ${n} — ${PHASE_NAMES[n]}${extra}`);
  showStory(STORY[n]);
  updateHudPhase();
}

function nextPhase() {
  if (state.phase >= 4) {
    finish(true);
    return;
  }
  state.hp = Math.min(100, state.hp + 22);
  state.overclock = 9;
  state.heat = 0;
  state.overheat = false;
  sfx.overclock();
  spawnPhase(state.phase + 1);
}

function spawnWeapon(type, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const crate = mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), metal(0x1a222b, { roughness: 0.6 }), 0, 0.25, 0);
  const stripe = mesh(new THREE.BoxGeometry(0.92, 0.08, 0.92), emit(0xff8a30, 0.9), 0, 0.42, 0);
  const model = buildGunModel(type);
  model.scale.setScalar(1.7);
  model.position.set(0, 0.95, 0);
  const halo = mesh(new THREE.TorusGeometry(0.55, 0.02, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffa040 }), 0, 0.55, 0);
  halo.rotation.x = Math.PI / 2;
  halo.castShadow = false;
  const glow = new THREE.PointLight(0xffa040, 1.7, 7);
  glow.position.y = 1.1;
  g.add(crate, stripe, model, halo, glow);
  world.add(g);
  weaponPickups.push({ mesh: g, model, type, taken: false });
}

function updateWeapons(t, dt) {
  for (const w of weaponPickups) {
    if (w.taken) continue;
    w.model.rotation.y += dt * 1.6;
    w.model.position.y = 0.95 + Math.sin(t * 2 + w.mesh.position.x) * 0.06;
    const d = Math.hypot(w.mesh.position.x - player.position.x, w.mesh.position.z - player.position.z);
    if (d < 1.6) {
      w.taken = true;
      world.remove(w.mesh);
      setWeapon(w.type);
    }
  }
}

function nearestWeapon() {
  let best = null;
  let bestD = Infinity;
  for (const w of weaponPickups) {
    if (w.taken) continue;
    const d = w.mesh.position.distanceTo(player.position);
    if (d < bestD) {
      bestD = d;
      best = w;
    }
  }
  return best;
}

function spawnCore(x, z, first = false, locked = false) {
  const group = new THREE.Group();
  group.position.set(x, 1.08, z);
  const scale = first ? 1.2 : 1;
  const cell = mesh(
    new THREE.CylinderGeometry(0.17 * scale, 0.17 * scale, 0.52 * scale, 12),
    metal(0x1c262e, { roughness: 0.35, metalness: 0.6 })
  );
  const band = mesh(
    new THREE.CylinderGeometry(0.175 * scale, 0.175 * scale, 0.2 * scale, 12),
    emit(0x2affd0, 1.8)
  );
  const capTop = mesh(
    new THREE.CylinderGeometry(0.06 * scale, 0.06 * scale, 0.08 * scale, 8),
    metal(0x9aa6ae, { metalness: 0.9, roughness: 0.25 }),
    0,
    0.3 * scale,
    0
  );
  const capBot = mesh(
    new THREE.CylinderGeometry(0.17 * scale, 0.15 * scale, 0.06 * scale, 12),
    metal(0x10161c),
    0,
    -0.29 * scale,
    0
  );
  const beam = mesh(
    new THREE.CylinderGeometry(0.05, 0.14, 4.4, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x7fffe8, transparent: true, opacity: first ? 0.34 : 0.22, side: THREE.DoubleSide })
  );
  beam.position.y = 2.1;
  beam.castShadow = false;
  const ring = mesh(new THREE.TorusGeometry(0.55 * scale, 0.018, 8, 28), new THREE.MeshBasicMaterial({ color: 0x7fffe8 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.72;
  ring.castShadow = false;
  group.add(cell, band, capTop, capBot, beam, ring, new THREE.PointLight(0x66ffe0, first ? 4.5 : 2.8, first ? 14 : 10));
  world.add(group);
  cores.push({ mesh: group, taken: false, baseY: 1.08, locked, cage: locked ? addCage(x, z) : null });
}

function spawnReactor(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const base = mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.3, 10), metal(0x161d24, { roughness: 0.6 }), 0, 0.15, 0);
  const body = mesh(new THREE.CylinderGeometry(0.62, 0.68, 1.9, 10), metal(0x232d36, { roughness: 0.42, metalness: 0.55 }), 0, 1.25, 0);
  const band = mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.26, 10), emit(0xb05020, 1.1), 0, 1.72, 0);
  const ribs = mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.1, 10), metal(0x10161c), 0, 0.7, 0);
  const cap = mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.22, 10), metal(0x10161c), 0, 2.3, 0);
  const post1 = mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.28, 8), metal(0x9aa6ae, { metalness: 0.9, roughness: 0.25 }), 0.26, 2.5, 0);
  const post2 = mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.28, 8), metal(0x9aa6ae, { metalness: 0.9, roughness: 0.25 }), -0.26, 2.5, 0);
  const leds = [];
  for (let i = 0; i < 3; i++) {
    const led = mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), emit(0x381408, 0.4), -0.26 + i * 0.26, 1.1, 0.6);
    leds.push(led);
  }
  const light = new THREE.PointLight(0xff5030, 1.8, 10);
  light.position.set(0, 2.1, 0);
  g.add(base, body, band, ribs, cap, post1, post2, ...leds, light);
  world.add(g);
  reactors.push({ mesh: g, leds, band, light, filled: false, cell: null });
}

function showStory(text) {
  storyEl.innerHTML = text;
  storyEl.classList.remove("hidden");
  clearTimeout(showStory.t);
  showStory.t = setTimeout(() => storyEl.classList.add("hidden"), 5200);
}

function showAlert(text) {
  if (!alertEl) return;
  alertEl.textContent = text;
  alertEl.classList.remove("hidden");
  clearTimeout(showAlert.t);
  showAlert.t = setTimeout(() => alertEl.classList.add("hidden"), 4500);
}

function spawnReinforcements() {
  const px = player.position.x;
  const pz = player.position.z;
  const kind = state.phase >= 3 ? "chaser" : "drone";
  const offsets = [
    [7.5, 2.2],
    [-6.8, 4.4],
    [3.2, -7.2],
    [-5.4, -6.2],
  ];
  const n = Math.min(2 + state.phase, offsets.length);
  let spawned = 0;
  for (const [ox, oz] of offsets) {
    if (spawned >= n) break;
    const x = px + ox;
    const z = pz + oz;
    if (pointBlocked(x, 1.2, z)) continue;
    spawnEnemy(kind, x, z);
    spawned += 1;
  }
  if (spawned < 2) {
    spawnEnemy("drone", px + 8, pz);
    spawnEnemy(kind, px - 8, pz);
  }
}

function updateInv() {
  invSlot.textContent = state.carrying ? "CÉLULA" : "VAZIA";
  invSlot.classList.toggle("full", state.carrying);
  invSlot.classList.toggle("empty", !state.carrying);
}

function addCage(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 1.15, z);
  const bars = metal(0x4a1810, { roughness: 0.4 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    g.add(mesh(new THREE.BoxGeometry(0.08, 2.2, 1.35), bars, Math.cos(a) * 0.72, 0, Math.sin(a) * 0.72));
  }
  g.add(mesh(new THREE.BoxGeometry(1.5, 0.08, 1.5), bars, 0, 1.12, 0));
  world.add(g);
  const col = {
    min: new THREE.Vector3(x - 0.8, 0, z - 0.8),
    max: new THREE.Vector3(x + 0.8, 2.3, z + 0.8),
  };
  colliders.push(col);
  return { mesh: g, col };
}

function spawnGenerator(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.4, 8), metal(0x2a1810), 0, 0.2, 0));
  const core = mesh(new THREE.OctahedronGeometry(0.45, 0), emit(0xff7a22, 2.2), 0, 1.15, 0);
  g.add(core);
  g.add(mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 16), emit(0xff4a18, 1.6), 0, 1.15, 0));
  g.add(new THREE.PointLight(0xff6a22, 2.4, 8));
  world.add(g);
  const col = {
    min: new THREE.Vector3(x - 0.85, 0, z - 0.85),
    max: new THREE.Vector3(x + 0.85, 1.8, z + 0.85),
  };
  colliders.push(col);
  props.push({ kind: "gen", mesh: g, col, hp: 10, hpMax: 10, alive: true, core });
}

function pushEnemy(root, kind, x, z, extra) {
  world.add(root);
  enemies.push({
    kind,
    mesh: root,
    home: new THREE.Vector3(x, extra.hoverY, z),
    phase: Math.random() * Math.PI * 2,
    attackCd: 0.4 + Math.random() * 0.6,
    windup: 0,
    alive: true,
    hpMax: extra.hp,
    label: LABELS[kind],
    powered: true,
    carriesCell: false,
    ...extra,
  });
}

function bindCarrierCell(kind) {
  const e = enemies[enemies.length - 1];
  if (!e) return;
  const y = kind === "turret" ? 1.4 : kind === "heavy" ? 0.62 : kind === "chaser" ? 0.45 : 0.52;
  const cell = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.32, 10), emit(0x2affd0, 1.8), 0, y, 0);
  e.mesh.add(cell);
  e.carriesCell = true;
  e.cellMesh = cell;
}

function spawnEnemy(kind, x, z, carriesCell = false) {
  const root = new THREE.Group();
  const hull = metal(0x1a2028, { roughness: 0.28, metalness: 0.82 });
  const dark = metal(0x0b0e13, { roughness: 0.22, metalness: 0.88 });
  const visorMat = emit(kind === "chaser" ? 0xff8a22 : 0xff2a33, 1.6);
  const dummy = new THREE.Object3D();
  const thrusters = [];

  if (kind === "turret") {
    root.position.set(x, 0, z);
    root.add(mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.5, 8), hull, 0, 0.25, 0));
    root.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 8), dark, 0, 0.7, 0));
    const head = mesh(new THREE.BoxGeometry(0.55, 0.28, 0.55), hull, 0, 0.95, 0);
    const visor = mesh(new THREE.BoxGeometry(0.4, 0.08, 0.06), visorMat, 0, 0.98, 0.28);
    const barrel = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8), dark, 0, 0.95, 0.45);
    barrel.rotation.x = Math.PI / 2;
    visor.castShadow = false;
    root.add(head, visor, barrel, new THREE.PointLight(0xff3a28, 1.1, 5));
    pushEnemy(root, kind, x, z, {
      ring: dummy,
      ring2: dummy,
      visorMat,
      thrusters,
      hp: 7,
      radius: 0.7,
      hoverY: 0,
      speed: 0,
      chaseSpeed: 0,
      range: 16,
      shotDmg: 16,
      shotSpeed: 22,
      shotLife: 1.1,
      fireCd: 0.72,
      windupTime: 0.28,
      melee: 0,
      meleeDmg: 0,
      boltColor: 0xff6644,
      boltSize: 0.09,
    });
    if (carriesCell) bindCarrierCell(kind);
    return;
  }

  if (kind === "chaser") {
    root.position.set(x, 0.7, z);
    root.add(mesh(new THREE.SphereGeometry(0.32, 12, 10), metal(0x2a1810, { roughness: 0.4 }), 0, 0, 0));
    root.add(mesh(new THREE.BoxGeometry(0.22, 0.08, 0.08), visorMat, 0, 0.06, 0.28));
    for (const s of [-1, 1]) {
      const leg = mesh(new THREE.BoxGeometry(0.08, 0.08, 0.42), dark, s * 0.22, -0.18, 0);
      root.add(leg);
    }
    const glow = mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff7a22 }), 0, -0.22, 0);
    glow.castShadow = false;
    thrusters.push(glow);
    root.add(glow, new THREE.PointLight(0xff7a22, 1.2, 4.5));
    pushEnemy(root, kind, x, z, {
      ring: dummy,
      ring2: dummy,
      visorMat,
      thrusters,
      hp: 3,
      radius: 0.42,
      hoverY: 0.7,
      speed: 2.4,
      chaseSpeed: 6.4,
      range: 13,
      shotDmg: 0,
      shotSpeed: 0,
      shotLife: 0,
      fireCd: 0.55,
      windupTime: 0,
      melee: 1.35,
      meleeDmg: 22,
      boltColor: 0xff7a22,
      boltSize: 0.08,
    });
    if (carriesCell) bindCarrierCell(kind);
    return;
  }

  if (kind === "heavy") {
    root.position.set(x, 1.15, z);
    root.add(mesh(new THREE.BoxGeometry(1.15, 0.7, 1.35), metal(0x16181c, { metalness: 0.85 }), 0, 0, 0));
    root.add(mesh(new THREE.BoxGeometry(0.7, 0.22, 0.12), visorMat, 0, 0.18, 0.68));
    const b1 = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8), dark, -0.32, 0.05, 0.7);
    const b2 = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8), dark, 0.32, 0.05, 0.7);
    b1.rotation.x = b2.rotation.x = Math.PI / 2;
    const ring = mesh(new THREE.TorusGeometry(0.85, 0.04, 6, 16), metal(0x3a2020), 0, 0.05, 0);
    ring.rotation.x = Math.PI / 2;
    root.add(b1, b2, ring, new THREE.PointLight(0xff2a20, 1.6, 7));
    pushEnemy(root, kind, x, z, {
      ring,
      ring2: dummy,
      visorMat,
      thrusters,
      hp: 8,
      radius: 0.9,
      hoverY: 1.15,
      speed: 0.9,
      chaseSpeed: 1.7,
      range: 15,
      shotDmg: 28,
      shotSpeed: 12,
      shotLife: 1.4,
      fireCd: 1.55,
      windupTime: 0.55,
      melee: 1.7,
      meleeDmg: 18,
      boltColor: 0xff2208,
      boltSize: 0.18,
    });
    if (carriesCell) bindCarrierCell(kind);
    return;
  }

  root.position.set(x, 1.35, z);
  const ring = mesh(
    new THREE.TorusGeometry(0.62, 0.03, 7, 28),
    new THREE.MeshStandardMaterial({ color: 0x2a313c, metalness: 0.9, roughness: 0.18, emissive: 0x4a1212, emissiveIntensity: 0.45 })
  );
  ring.rotation.x = Math.PI / 2;
  const ring2 = mesh(new THREE.TorusGeometry(0.42, 0.018, 6, 20), metal(0x3a444e), 0, 0.02, 0);
  ring2.rotation.z = Math.PI / 2;
  root.add(
    mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.2, 8), hull),
    mesh(new THREE.SphereGeometry(0.28, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), dark, 0, 0.08, 0),
    mesh(new THREE.BoxGeometry(0.36, 0.07, 0.05), visorMat, 0, 0.07, 0.46),
    ring,
    ring2
  );
  const gunL = mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.42, 8), dark, -0.4, -0.04, 0.22);
  const gunR = mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.42, 8), dark, 0.4, -0.04, 0.22);
  gunL.rotation.x = gunR.rotation.x = Math.PI / 2;
  root.add(gunL, gunR);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const glow = mesh(
      new THREE.SphereGeometry(0.055, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff7a32 }),
      Math.cos(a) * 0.38,
      -0.28,
      Math.sin(a) * 0.38
    );
    glow.castShadow = false;
    root.add(glow);
    thrusters.push(glow);
  }
  root.add(new THREE.PointLight(0xff3a28, 1.25, 6));
  pushEnemy(root, kind, x, z, {
    ring,
    ring2,
    visorMat,
    thrusters,
    hp: 5,
    radius: 0.55,
    hoverY: 1.35,
    speed: 1.5,
    chaseSpeed: 3.2,
    range: 11,
    shotDmg: 15,
    shotSpeed: 18,
    shotLife: 1.05,
    fireCd: 0.95,
    windupTime: 0.32,
    melee: 1.45,
    meleeDmg: 10,
    boltColor: 0xff4a32,
    boltSize: 0.08,
  });
  if (carriesCell) bindCarrierCell(kind);
}

function clearWorld() {
  while (world.children.length) world.remove(world.children[0]);
  cores.length = 0;
  reactors.length = 0;
  enemies.length = 0;
  props.length = 0;
  weaponPickups.length = 0;
  colliders.length = 0;
  gates.length = 0;
  for (const s of shots) scene.remove(s.mesh);
  for (const s of enemyShots) scene.remove(s.mesh);
  for (const b of bits) scene.remove(b.mesh);
  shots.length = 0;
  enemyShots.length = 0;
  bits.length = 0;
}

function pointBlocked(x, y, z) {
  for (const c of colliders) {
    if (x >= c.min.x && x <= c.max.x && y >= c.min.y && y <= c.max.y && z >= c.min.z && z <= c.max.z) return true;
  }
  return false;
}

function canSee(from) {
  const to = new THREE.Vector3(player.position.x, EYE, player.position.z);
  const dir = to.clone().sub(from);
  const dist = dir.length();
  if (dist < 0.2) return true;
  dir.normalize();
  const steps = Math.ceil(dist / 0.35);
  for (let i = 1; i < steps; i++) {
    const p = from.clone().addScaledVector(dir, i * 0.35);
    if (pointBlocked(p.x, p.y, p.z)) return false;
  }
  return true;
}

function resolveRadius(pos, radius, yOff = 0.9) {
  for (const c of colliders) {
    if (!(pos.y + yOff > c.min.y && pos.y < c.max.y)) continue;
    const closestX = THREE.MathUtils.clamp(pos.x, c.min.x, c.max.x);
    const closestZ = THREE.MathUtils.clamp(pos.z, c.min.z, c.max.z);
    const dx = pos.x - closestX;
    const dz = pos.z - closestZ;
    const dist = Math.hypot(dx, dz);
    if (dist < radius && dist > 0.0001) {
      const push = (radius - dist) / dist;
      pos.x += dx * push;
      pos.z += dz * push;
    } else if (dist === 0) {
      const left = Math.abs(pos.x - c.min.x);
      const right = Math.abs(c.max.x - pos.x);
      const back = Math.abs(pos.z - c.min.z);
      const front = Math.abs(c.max.z - pos.z);
      const m = Math.min(left, right, back, front);
      if (m === left) pos.x = c.min.x - radius;
      else if (m === right) pos.x = c.max.x + radius;
      else if (m === back) pos.z = c.min.z - radius;
      else pos.z = c.max.z + radius;
    }
  }
}

function pressed(a, b) {
  return KEYS[a] || (b && KEYS[b]);
}

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _wish = new THREE.Vector3();
const _one = new THREE.Vector3(1, 1, 1);
const damp = THREE.MathUtils.damp;

function movePlayer(dt) {
  if (pressed("KeyQ")) state.lookYaw += 2.2 * dt;
  if (pressed("KeyE")) state.lookYaw -= 2.2 * dt;
  state.lookYaw -= state.mx * 0.00205;
  state.lookPitch = THREE.MathUtils.clamp(state.lookPitch - state.my * 0.00205, -1.25, 1.25);
  state.mx = 0;
  state.my = 0;
  state.yaw = damp(state.yaw, state.lookYaw, 22, dt);
  state.pitch = damp(state.pitch, state.lookPitch, 22, dt);

  const sprint = pressed("ShiftLeft", "ShiftRight");
  const speed = sprint ? 8.4 : 5.5;
  _fwd.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
  _right.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw));
  _wish.set(0, 0, 0);
  if (pressed("KeyW", "ArrowUp")) _wish.add(_fwd);
  if (pressed("KeyS", "ArrowDown")) _wish.sub(_fwd);
  if (pressed("KeyD", "ArrowRight")) _wish.add(_right);
  if (pressed("KeyA", "ArrowLeft")) _wish.sub(_right);
  const wishing = _wish.lengthSq() > 0;
  if (wishing) {
    _wish.normalize();
    state.moved = true;
  }
  const accel = state.grounded ? (wishing ? 8.5 : 6.2) : 4.8;
  state.vx = damp(state.vx, wishing ? _wish.x * speed : 0, accel, dt);
  state.vz = damp(state.vz, wishing ? _wish.z * speed : 0, accel, dt);

  const ox = player.position.x;
  const oz = player.position.z;
  const wantX = ox + state.vx * dt;
  const wantZ = oz + state.vz * dt;
  player.position.x = wantX;
  player.position.z = wantZ;
  resolveRadius(player.position, PLAYER_R);
  if (Math.abs(player.position.x - wantX) > 0.001) state.vx = 0;
  if (Math.abs(player.position.z - wantZ) > 0.001) state.vz = 0;

  const hSpeed = Math.hypot(state.vx, state.vz);
  state.bobAmt = damp(state.bobAmt, state.grounded && hSpeed > 0.4 ? Math.min(1, hSpeed / 5.5) : 0, 7, dt);
  state.bob += hSpeed * dt * 1.35;
  if (state.grounded && hSpeed > 1.2) {
    state.stepT -= dt;
    if (state.stepT <= 0) {
      sfx.foot(hSpeed > 6.5);
      state.stepT = hSpeed > 6.5 ? 0.32 : 0.46;
    }
  } else state.stepT = 0.08;

  state.coyote = state.grounded ? 0.18 : Math.max(0, state.coyote - dt);
  state.jumpBuf = Math.max(0, state.jumpBuf - dt);
  state.velY -= 21 * dt;
  player.position.y += state.velY * dt;
  if (player.position.y <= 0) {
    if (!state.grounded && state.velY < -3) state.landKick = Math.min(0.12, -state.velY * 0.014);
    player.position.y = 0;
    state.velY = 0;
    state.grounded = true;
  } else state.grounded = false;
  if ((pressed("Space") || state.jumpBuf > 0) && (state.grounded || state.coyote > 0) && state.velY <= 1) {
    state.velY = 7.2;
    state.grounded = false;
    state.coyote = 0;
    state.jumpBuf = 0;
    sfx.jump();
  }

  player.rotation.y = state.yaw;
  camera.rotation.x = state.pitch;

  const dyaw = state.yaw - state.yawPrev;
  const dpitch = state.pitch - state.pitchPrev;
  state.yawPrev = state.yaw;
  state.pitchPrev = state.pitch;
  state.swayX = damp(state.swayX, THREE.MathUtils.clamp(-dyaw * 14, -0.12, 0.12), 9, dt);
  state.swayY = damp(state.swayY, THREE.MathUtils.clamp(dpitch * 10, -0.08, 0.08), 9, dt);
  const side = state.vx * _right.x + state.vz * _right.z;
  state.roll = damp(state.roll, THREE.MathUtils.clamp(-side * 0.018, -0.055, 0.055), 6, dt);
  state.landKick = damp(state.landKick, 0, 6.5, dt);
  camera.rotation.z = state.roll;

  const bobS = Math.sin(state.bob) * state.bobAmt;
  const bobC = Math.cos(state.bob * 2) * state.bobAmt;
  camera.position.x = damp(camera.position.x, bobS * 0.018, 9, dt);
  camera.position.y = damp(camera.position.y, EYE + bobC * 0.026 - state.landKick, 10, dt);

  const sprintAmt = sprint && hSpeed > 3.5 ? 1 : 0;
  const wantFov = 72 + sprintAmt * 7;
  if (Math.abs(camera.fov - wantFov) > 0.04) {
    camera.fov = damp(camera.fov, wantFov, 4.5, dt);
    camera.updateProjectionMatrix();
  }

  gun.position.x = damp(gun.position.x, 0.3 + bobS * 0.014 + state.swayX, 10, dt);
  gun.position.y = damp(gun.position.y, -0.28 + Math.abs(bobS) * 0.022 + state.swayY - state.landKick * 0.45, 10, dt);
  gun.position.z = damp(gun.position.z, -0.58 - sprintAmt * 0.06, 8, dt);
}

function spawnBits(pos, color, n = 10) {
  for (let i = 0; i < n; i++) {
    const m = mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), new THREE.MeshBasicMaterial({ color }), pos.x, pos.y, pos.z);
    m.castShadow = false;
    scene.add(m);
    bits.push({
      mesh: m,
      vel: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4.5, (Math.random() - 0.5) * 6),
      life: 0.45,
    });
  }
}

function shoot() {
  if (!state.running || state.paused || state.shootCd > 0 || state.overheat) return;
  const w = WEAPONS[state.weapon];
  if (state.ammo <= 0) {
    state.shootCd = 0.3;
    sfx.dry();
    return;
  }
  const oc = state.overclock > 0;
  state.shootCd = oc ? w.cd * 0.6 : w.cd;
  state.ammo -= 1;
  updateWeaponHud();
  if (!oc) {
    state.heat = Math.min(100, state.heat + w.heat);
    if (state.heat >= 100) {
      state.overheat = true;
      sfx.overheat();
    }
  }
  sfx.shoot(state.weapon);
  muzzle.intensity = oc ? 10 : 8;
  gun.rotation.x = oc ? w.recoil * 0.6 : w.recoil;
  gun.rotation.z = (Math.random() - 0.5) * 0.1;
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3();
  camera.getWorldPosition(origin);
  camera.getWorldDirection(dir);
  origin.addScaledVector(dir, 0.55);
  let closeHit = false;
  for (const e of enemies) {
    if (!e.alive) continue;
    const to = e.mesh.position.clone().sub(origin);
    const dist = to.length();
    if (dist > 3.4) continue;
    to.normalize();
    if (to.dot(dir) > 0.62) {
      hitEnemy(e, e.mesh.position, w.dmg);
      closeHit = true;
      break;
    }
  }
  if (!closeHit) for (let i = 0; i < w.pellets; i++) {
    const d = dir.clone();
    if (w.spread) {
      d.x += (Math.random() - 0.5) * w.spread * 2;
      d.y += (Math.random() - 0.5) * w.spread * 2;
      d.z += (Math.random() - 0.5) * w.spread * 2;
      d.normalize();
    }
    const bolt = mesh(new THREE.CapsuleGeometry(0.035, 0.18, 4, 8), new THREE.MeshBasicMaterial({ color: 0xb8fff4 }));
    bolt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    bolt.position.copy(origin);
    bolt.castShadow = false;
    scene.add(bolt);
    shots.push({ mesh: bolt, dir: d, life: 0.7, dmg: w.dmg });
  }
}

function enemyShoot(e) {
  const origin = e.mesh.position.clone();
  origin.y += e.kind === "turret" ? 1.0 : 0.1;
  const dir = new THREE.Vector3(player.position.x, EYE, player.position.z).sub(origin).normalize();
  const bolt = mesh(new THREE.SphereGeometry(e.boltSize, 8, 8), new THREE.MeshBasicMaterial({ color: e.boltColor }));
  bolt.position.copy(origin).addScaledVector(dir, 0.7);
  bolt.castShadow = false;
  scene.add(bolt);
  enemyShots.push({ mesh: bolt, dir, life: e.shotLife, speed: e.shotSpeed, dmg: e.shotDmg, src: e });
  sfx.droneShot(e.mesh.position);
}

function stepBolt(s, speed, dt, onMove) {
  const steps = 3;
  const part = (speed * dt) / steps;
  for (let k = 0; k < steps; k++) {
    s.mesh.position.addScaledVector(s.dir, part);
    const r = onMove();
    if (r) return r;
    if (pointBlocked(s.mesh.position.x, s.mesh.position.y, s.mesh.position.z)) return "wall";
  }
  return null;
}

function updateShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.life -= dt;
    const res = stepBolt(s, 44, dt, () => {
      for (const p of props) {
        if (!p.alive) continue;
        if (s.mesh.position.distanceTo(new THREE.Vector3(p.mesh.position.x, 1.15, p.mesh.position.z)) < 0.9) {
          hitGenerator(p, s.dmg || 1);
          return "hit";
        }
      }
      for (const e of enemies) {
        if (!e.alive) continue;
        if (s.mesh.position.distanceTo(e.mesh.position) < e.radius + 0.55) {
          hitEnemy(e, s.mesh.position, s.dmg || 1);
          return "hit";
        }
      }
      return null;
    });
    if (res === "wall") spawnBits(s.mesh.position, 0x9fd8d0, 4);
    if (res || s.life <= 0) {
      scene.remove(s.mesh);
      shots.splice(i, 1);
    }
  }
  for (let i = enemyShots.length - 1; i >= 0; i--) {
    const s = enemyShots[i];
    s.life -= dt;
    const body = player.position.clone();
    body.y += EYE * 0.55;
    const res = stepBolt(s, s.speed, dt, () => (s.mesh.position.distanceTo(body) < 0.5 ? "player" : null));
    if (res === "player") {
      damage(s.dmg, s.mesh.position, s.src?.label);
      spawnBits(s.mesh.position, 0xff5a40, 6);
    }
    if (res === "wall") spawnBits(s.mesh.position, 0xff6644, 3);
    if (res || s.life <= 0) {
      scene.remove(s.mesh);
      enemyShots.splice(i, 1);
    }
  }
}

function showHit(kill, armor = false) {
  hitmarker.classList.add("show");
  hitmarker.classList.toggle("kill", !!kill);
  hitmarker.classList.toggle("armor", !!armor);
  if (!armor) sfx.hitmark();
  hitTimer = armor ? 0.08 : 0.12;
}

function isWeakPoint(e, point) {
  if (e.kind !== "heavy") return true;
  const local = e.mesh.worldToLocal(point.clone());
  return local.z > 0.32 && Math.abs(local.x) < 0.48 && local.y > -0.15 && local.y < 0.55;
}

function hitEnemy(e, point, dmg = 1) {
  if (!isWeakPoint(e, point)) {
    sfx.armor(point);
    spawnBits(point, 0xffc078, 5);
    e.mesh.scale.setScalar(1.06);
    showHit(false, true);
    return;
  }
  e.hp -= dmg;
  sfx.droneHit(point);
  spawnBits(point, 0xff6a48, 8);
  e.mesh.scale.setScalar(1.12);
  const dead = e.hp <= 0;
  showHit(dead);
  if (dead) {
    e.alive = false;
    spawnBits(e.mesh.position, 0xff4028, 16);
    if (e.carriesCell) {
      e.carriesCell = false;
      spawnCore(e.mesh.position.x, e.mesh.position.z);
      showBanner("CÉLULA RECUPERADA");
    }
    world.remove(e.mesh);
    sfx.droneDie();
  }
}

function hitGenerator(p, dmg = 1) {
  p.hp -= dmg;
  sfx.droneHit(p.mesh.position);
  spawnBits(p.mesh.position.clone().setY(1.15), 0xff8a3a, 8);
  showHit(p.hp <= 0);
  if (p.hp > 0) return;
  p.alive = false;
  world.remove(p.mesh);
  const i = colliders.indexOf(p.col);
  if (i >= 0) colliders.splice(i, 1);
  spawnBits(p.mesh.position, 0xff6a22, 22);
  sfx.phase();
  showBanner("JAULAS LIBERADAS");
  for (const c of cores) {
    c.locked = false;
    if (c.cage) {
      world.remove(c.cage.mesh);
      const ci = colliders.indexOf(c.cage.col);
      if (ci >= 0) colliders.splice(ci, 1);
      c.cage = null;
    }
  }
  for (const e of enemies) {
    if (!e.alive || e.kind !== "turret") continue;
    e.alive = false;
    spawnBits(e.mesh.position, 0xff4028, 12);
    world.remove(e.mesh);
  }
}

function damage(amount, fromPos, label) {
  if (state.iframe > 0) return;
  state.hp = Math.max(0, state.hp - amount);
  state.hurtFlash = 1;
  state.iframe = 0.7;
  if (label) state.lastHitBy = label;
  if (state.carrying && amount >= 12 && state.hp > 0) {
    state.carrying = false;
    state.carryingFrom = null;
    spawnCore(player.position.x, player.position.z);
    updateInv();
    showBanner("CÉLULA PERDIDA");
    sfx.drop();
  }
  if (fromPos) {
    const dx = fromPos.x - player.position.x;
    const dz = fromPos.z - player.position.z;
    const side = dx * Math.cos(state.yaw) + dz * -Math.sin(state.yaw);
    if (side < -0.35) {
      state.hurtL = 1;
      state.hurtR = 0.15;
    } else if (side > 0.35) {
      state.hurtR = 1;
      state.hurtL = 0.15;
    } else {
      state.hurtL = 0.7;
      state.hurtR = 0.7;
    }
    sfx.hit();
    beep(70, 0.12, "sawtooth", 0.08, 0, panOf(fromPos));
  } else sfx.hit();
  if (state.hp <= 0) finish(false);
}

function nearestCore() {
  let best = null;
  let bestD = Infinity;
  for (const c of cores) {
    if (c.taken) continue;
    const d = c.mesh.position.distanceTo(player.position);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function updateCores(t, dt) {
  let close = false;
  let advance = false;
  let blockedByFull = false;
  for (const c of cores) {
    if (c.taken) continue;
    c.mesh.position.y = c.baseY + Math.sin(t * 2.3 + c.mesh.position.x) * 0.12;
    c.mesh.rotation.y += dt * 1.3;
    const d = Math.hypot(c.mesh.position.x - player.position.x, c.mesh.position.z - player.position.z);
    if (d < 2.8) close = true;
    if (d < 1.35) {
      if (c.locked) continue;
      if (state.carrying) {
        blockedByFull = true;
        continue;
      }
      c.taken = true;
      world.remove(c.mesh);
      state.carrying = true;
      state.carryingFrom = c;
      sfx.pickup();
      spawnBits(c.mesh.position, 0x7fffe8, 14);
      updateInv();
      showAlert("Célula encontrada. Perigo: robôs ativados.");
      spawnReinforcements();
    }
  }
  for (const r of reactors) {
    if (r.filled) continue;
    const d = Math.hypot(r.mesh.position.x - player.position.x, r.mesh.position.z - player.position.z);
    if (d < 2.4) close = true;
    if (d < 1.5 && state.carrying) {
      state.carrying = false;
      state.carryingFrom = null;
      r.filled = true;
      state.phaseGot += 1;
      state.hp = Math.min(100, state.hp + 8);
      sfx.deposit();
      spawnBits(r.mesh.position.clone().setY(1.4), 0x7fffe8, 18);
      for (const led of r.leds) {
        led.material.color.setHex(0x30ff70);
        led.material.emissive.setHex(0x30ff70);
        led.material.emissiveIntensity = 1.6;
      }
      r.band.material.color.setHex(0x1fd7c4);
      r.band.material.emissive.setHex(0x1fd7c4);
      r.band.material.emissiveIntensity = 1.6;
      r.light.color.setHex(0x66ffe0);
      r.light.intensity = 2.4;
      const cell = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 10), emit(0x2affd0, 1.6), 0, 2.6, 0);
      r.mesh.add(cell);
      r.cell = cell;
      updateInv();
      if (state.phaseGot >= state.phaseNeed) advance = true;
    }
  }
  coreCount.textContent = `${state.phaseGot} / ${state.phaseNeed}`;
  if (blockedByFull) {
    nearPrompt.textContent = "Mochila ocupada. Entregue a célula no reator primeiro.";
  } else if (state.carrying) {
    nearPrompt.textContent = "Leve a célula até o reator.";
  } else if (cores.some((c) => !c.taken && c.locked)) {
    nearPrompt.textContent = "Célula em jaula. Destrua o gerador laranja.";
  } else if (enemies.some((e) => e.alive && e.carriesCell)) {
    nearPrompt.textContent = "Derrote o robô portador para obter a célula.";
  } else {
    nearPrompt.textContent = "Aproxime-se para recolher a célula.";
  }
  nearPrompt.classList.toggle("hidden", !close || !state.running || state.paused);
  if (advance) nextPhase();
}

function updateEnemies(t, dt) {
  const p = player.position;
  state.grace = Math.max(0, state.grace - dt);
  let nearest = 99;
  for (const e of enemies) {
    if (!e.alive) continue;
    e.mesh.scale.lerp(_one, 10 * dt);
    e.phase += dt;
    e.ring.rotation.z += dt * 2.2;
    e.ring2.rotation.y += dt * 2.8;
    for (const th of e.thrusters) th.scale.setScalar(0.85 + Math.sin(t * 14 + e.phase) * 0.15);

    const dist = Math.hypot(p.x - e.mesh.position.x, p.z - e.mesh.position.z);
    nearest = Math.min(nearest, dist);
    const seeY = e.kind === "turret" ? 1.0 : 0.4;
    const see = canSee(e.mesh.position.clone().setY(e.mesh.position.y + seeY));
    const chase = state.grace <= 0 && dist < e.range && e.powered !== false;

    if (e.kind === "turret" && e.powered === false) e.visorMat.emissiveIntensity = 0.2;

    if (e.chaseSpeed > 0) {
      const keep = PLAYER_R + e.radius + 0.7;
      const tx = chase ? p.x : e.home.x + Math.cos(e.phase * 0.5) * 2.6;
      const tz = chase ? p.z : e.home.z + Math.sin(e.phase * 0.5) * 2.6;
      const dx = tx - e.mesh.position.x;
      const dz = tz - e.mesh.position.z;
      const len = Math.hypot(dx, dz);
      const tooClose = chase && dist < keep;
      if (len > 0.12 && !tooClose) {
        const sp = (chase ? e.chaseSpeed : e.speed) * dt;
        e.mesh.position.x += (dx / len) * sp;
        e.mesh.position.z += (dz / len) * sp;
      }
      resolveRadius(e.mesh.position, e.radius, 0.6);
      if (e.kind !== "turret") e.mesh.position.y = e.hoverY + Math.sin(t * 2.2 + e.phase) * (e.kind === "chaser" ? 0.08 : 0.1);
    }

    let distNow = Math.hypot(p.x - e.mesh.position.x, p.z - e.mesh.position.z);
    const keep = PLAYER_R + e.radius + 0.65;
    if (distNow < keep && distNow > 0.001) {
      const nx = (e.mesh.position.x - p.x) / distNow;
      const nz = (e.mesh.position.z - p.z) / distNow;
      e.mesh.position.x = p.x + nx * keep;
      e.mesh.position.z = p.z + nz * keep;
      resolveRadius(e.mesh.position, e.radius, 0.6);
      distNow = Math.hypot(p.x - e.mesh.position.x, p.z - e.mesh.position.z);
    }

    e.mesh.lookAt(p.x, e.mesh.position.y, p.z);
    e.visorMat.emissiveIntensity = chase ? 2.3 + Math.sin(t * 9) * 0.5 : 1.2;
    e.attackCd -= dt;

    if (e.shotDmg > 0 && chase && see && distNow > 1.7) {
      if (e.attackCd <= 0) {
        if (e.windup === 0) sfx.charge();
        e.windup += dt;
        e.visorMat.emissiveIntensity = 3.5;
        if (e.windup > e.windupTime) {
          enemyShoot(e);
          e.windup = 0;
          e.attackCd = e.fireCd;
        }
      }
    } else e.windup = 0;

    if (e.meleeDmg > 0 && state.grace <= 0 && distNow < e.melee + 0.35 && e.attackCd <= 0.15) {
      damage(e.meleeDmg, e.mesh.position, e.label);
      e.attackCd = e.fireCd;
    }
  }
  sfx.hum(nearest);
}

function nearestCarrier() {
  let best = null;
  let bestD = Infinity;
  for (const e of enemies) {
    if (!e.alive || !e.carriesCell) continue;
    const d = e.mesh.position.distanceTo(player.position);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function nearestObjective() {
  if (state.ammo <= 0) {
    const w = nearestWeapon();
    if (w) return { mesh: w.mesh, kind: "weapon" };
  }
  const gen = props.find((p) => p.alive && p.kind === "gen");
  if (gen) return { mesh: gen.mesh, kind: "gen" };
  if (state.carrying) {
    const r = reactors.find((x) => !x.filled);
    if (r) return { mesh: r.mesh, kind: "reactor" };
  }
  const core = nearestCore();
  if (core) return core;
  const carrier = nearestCarrier();
  if (carrier) return { mesh: carrier.mesh, kind: "carrier" };
  return null;
}

function updateMarker() {
  const c = nearestObjective();
  if (!c || !state.running || state.paused) {
    markerEl.classList.add("hidden");
    guide.visible = false;
    return;
  }
  const worldPos = c.mesh.position.clone();
  worldPos.y += c.kind === "gen" ? 2.1 : c.kind === "reactor" ? 2.4 : c.kind === "weapon" ? 1.6 : 1.4;
  const ndc = worldPos.project(camera);
  let x = (ndc.x * 0.5 + 0.5) * innerWidth;
  let y = (-ndc.y * 0.5 + 0.5) * innerHeight;
  if (ndc.z > 1) {
    x = ndc.x < 0 ? 24 : innerWidth - 24;
    y = innerHeight * 0.42;
  }
  x = THREE.MathUtils.clamp(x, 24, innerWidth - 24);
  y = THREE.MathUtils.clamp(y, 90, innerHeight - 100);
  markerEl.classList.remove("hidden");
  markerEl.style.transform = `translate(${x}px, ${y}px)`;
  const meters = Math.round(c.mesh.position.distanceTo(player.position));
  markerDist.textContent =
    c.kind === "gen"
      ? `gerador ${meters}m`
      : c.kind === "reactor"
        ? `reator ${meters}m`
        : c.kind === "weapon"
          ? `arma ${meters}m`
          : c.kind === "carrier"
            ? `portador ${meters}m`
            : `${meters}m`;
  if (meters > 3) {
    guide.visible = true;
    guide.geometry.setFromPoints([
      new THREE.Vector3(player.position.x, 0.07, player.position.z),
      new THREE.Vector3(c.mesh.position.x, 0.07, c.mesh.position.z),
    ]);
    guide.computeLineDistances();
  } else guide.visible = false;
}

function updateHudPhase() {
  phaseKicker.textContent = `FASE ${state.phase} / 4 — ${PHASE_NAMES[state.phase]}`;
  coreCount.textContent = `${state.phaseGot} / ${state.phaseNeed}`;
}

function updateMission() {
  if (!state.moved) {
    missionText.textContent = "Avance com WASD até o robô portador à frente.";
    return;
  }
  if (state.carrying) {
    missionText.textContent = "Leve a célula até o reator-bateria. A linha no piso indica o caminho.";
    return;
  }
  if (state.ammo <= 0) {
    missionText.textContent = "Sem munição. Siga o marcador até uma arma laranja.";
    return;
  }
  if (props.some((p) => p.alive && p.kind === "gen")) {
    missionText.textContent = "Destrua o gerador laranja, no flanco norte da ala leste.";
    return;
  }
  if (state.phase === 4 && enemies.some((e) => e.alive && e.kind === "heavy")) {
    missionText.textContent = "Mire no visor vermelho da unidade pesada. O casco é blindado.";
    return;
  }
  if (enemies.some((e) => e.alive && e.carriesCell)) {
    missionText.textContent = "Derrote o robô portador. A célula será liberada ao destruí-lo.";
    return;
  }
  if (state.overclock > 0) {
    missionText.textContent = `Overclock ${Math.ceil(state.overclock)}s — cadência elevada. A arma não superaquece.`;
    return;
  }
  missionText.textContent = PHASE_INFO[state.phase];
}

function showBanner(text) {
  phaseBanner.textContent = text;
  phaseBanner.classList.remove("hidden");
  bannerTimer = 2.3;
}

function updateHpBars() {
  const items = [...enemies.filter((e) => e.alive), ...props.filter((p) => p.alive)];
  while (hpLayer.children.length < items.length) {
    const d = document.createElement("div");
    d.className = "hp-float";
    d.innerHTML = "<i></i>";
    hpLayer.appendChild(d);
  }
  for (let i = 0; i < hpLayer.children.length; i++) {
    const el = hpLayer.children[i];
    if (i >= items.length) {
      el.classList.add("hidden");
      continue;
    }
    const e = items[i];
    const pos = e.mesh.position.clone();
    pos.y += e.kind === "turret" ? 1.7 : e.kind === "gen" ? 2.2 : e.kind === "heavy" ? 1.8 : 1.35;
    pos.project(camera);
    if (pos.z > 1) {
      el.classList.add("hidden");
      continue;
    }
    el.classList.remove("hidden");
    const x = (pos.x * 0.5 + 0.5) * innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * innerHeight;
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.querySelector("i").style.transform = `scaleX(${Math.max(0, e.hp / e.hpMax)})`;
  }
}

function updateFx(dt) {
  state.shootCd = Math.max(0, state.shootCd - dt);
  state.iframe = Math.max(0, state.iframe - dt);
  state.overclock = Math.max(0, state.overclock - dt);
  state.heat = Math.max(0, state.heat - (state.overheat ? 24 : 36) * dt);
  if (state.overheat && state.heat <= 18) state.overheat = false;
  muzzle.intensity = THREE.MathUtils.damp(muzzle.intensity, 0, 10, dt);
  gun.rotation.x = THREE.MathUtils.damp(gun.rotation.x, 0, 7, dt);
  gun.rotation.z = THREE.MathUtils.damp(gun.rotation.z, 0, 6, dt);
  state.hurtFlash = Math.max(0, state.hurtFlash - dt * 2.6);
  state.hurtL = Math.max(0, state.hurtL - dt * 2.4);
  state.hurtR = Math.max(0, state.hurtR - dt * 2.4);
  hurt.style.opacity = String(state.hurtFlash * 0.5);
  if (hurtL) hurtL.style.opacity = String(state.hurtL);
  if (hurtR) hurtR.style.opacity = String(state.hurtR);
  hpFill.style.transform = `scaleX(${state.hp / 100})`;
  if (heatFill) heatFill.style.transform = `scaleX(${state.heat / 100})`;
  lockBanner.classList.toggle("hidden", !!document.pointerLockElement || state.paused);
  hitTimer -= dt;
  if (hitTimer <= 0) hitmarker.classList.remove("show", "kill", "armor");
  bannerTimer -= dt;
  if (bannerTimer <= 0) phaseBanner.classList.add("hidden");

  const aliveE = enemies.filter((e) => e.alive).length;
  if (enemyCountEl) enemyCountEl.textContent = `Inimigos: ${aliveE}`;

  if (state.timer > 0) {
    state.timer = Math.max(0, state.timer - dt);
    timerLab.classList.remove("hidden");
    timerLab.textContent = `${Math.ceil(state.timer)}s`;
    timerLab.classList.toggle("low", state.timer < 20);
    if (state.timer <= 0 && !state.alarm) {
      state.alarm = true;
      spawnEnemy("chaser", -22, 0);
      showBanner("TEMPO ESGOTADO");
      sfx.overheat();
    }
  } else if (!state.alarm) timerLab.classList.add("hidden");

  if (state.alarm && state.running) {
    state.alarmT -= dt;
    if (state.alarmT <= 0) {
      state.alarmT = 1.15;
      damage(7, player.position.clone().setZ(player.position.z - 2), LABELS.alarm);
    }
  }

  state.beatT -= dt;
  if (state.beatT <= 0 && audio.ctx) {
    const bpm = 68 + state.phase * 16 + (state.timer > 0 && state.timer < 20 ? 22 : 0);
    state.beatT = 60 / bpm;
    sfx.beat(state.phase);
  }
  if (audio.pulseGain && audio.ctx) {
    const t = audio.ctx.currentTime;
    audio.pulseGain.gain.setTargetAtTime(0.03 + state.phase * 0.012 + (state.overclock > 0 ? 0.02 : 0), t, 0.15);
  }
  if (audio.alarmGain && audio.ctx) {
    audio.alarmGain.gain.setTargetAtTime(state.alarm ? 0.035 : 0, audio.ctx.currentTime, 0.1);
  }

  for (const p of props) {
    if (p.alive && p.core) p.core.rotation.y += dt * 2.4;
  }
  updateHpBars();

  for (let i = bits.length - 1; i >= 0; i--) {
    const b = bits[i];
    b.life -= dt;
    b.vel.y -= 10 * dt;
    b.mesh.position.addScaledVector(b.vel, dt);
    if (b.life <= 0) {
      scene.remove(b.mesh);
      bits.splice(i, 1);
    }
  }
}

function setPaused(v) {
  if (!state.running) return;
  state.paused = v;
  pauseScreen.classList.toggle("hidden", !v);
  if (v) {
    document.exitPointerLock?.();
    sfx.hum(99);
  } else {
    canvas.requestPointerLock?.();
  }
}

function finish(win) {
  if (!state.running) return;
  state.running = false;
  state.paused = false;
  pauseScreen.classList.add("hidden");
  document.exitPointerLock?.();
  hud.classList.add("hidden");
  endScreen.classList.remove("hidden");
  document.getElementById("end-tag").textContent = win ? "EXTRAÇÃO" : "SINAL PERDIDO";
  document.getElementById("end-title").textContent = win ? "NEXO ESTÁVEL" : "FALHA";
  document.getElementById("end-blurb").textContent = win
    ? "Os quatro reatores foram religados. O NEXO foi restabelecido. A defesa automática foi desativada."
    : `A operação foi interrompida na fase ${state.phase}. ${state.lastHitBy ? "Responsável: " + state.lastHitBy + ". " : ""}Reatores: ${state.phaseGot}/${state.phaseNeed}.`;
  if (win) sfx.win();
  else sfx.lose();
  sfx.hum(99);
}

function resetGame() {
  state.running = true;
  state.paused = false;
  state.hp = 100;
  state.cores = 0;
  state.phase = 1;
  state.phaseGot = 0;
  state.yaw = 0;
  state.pitch = -0.06;
  state.lookYaw = 0;
  state.lookPitch = -0.06;
  state.mx = 0;
  state.my = 0;
  state.velY = 0;
  state.vx = 0;
  state.vz = 0;
  state.yawPrev = 0;
  state.pitchPrev = -0.06;
  state.swayX = 0;
  state.swayY = 0;
  state.roll = 0;
  state.landKick = 0;
  state.coyote = 0;
  state.jumpBuf = 0;
  state.bobAmt = 0;
  camera.position.set(0, EYE, 0);
  camera.rotation.set(0, 0, 0);
  camera.fov = 72;
  camera.updateProjectionMatrix();
  gun.position.set(0.3, -0.28, -0.58);
  state.shootCd = 0;
  state.hurtFlash = 0;
  state.iframe = 0;
  state.moved = false;
  state.triedLock = false;
  state.stepT = 0;
  state.heat = 0;
  state.overheat = false;
  state.overclock = 0;
  state.timer = 0;
  state.alarm = false;
  state.lastHitBy = "";
  state.carrying = false;
  state.carryingFrom = null;
  updateInv();
  setWeapon("pistola", true);
  player.position.set(0, 0, 6);
  pauseScreen.classList.add("hidden");
  alertEl?.classList.add("hidden");
  clearWorld();
  buildWorld();
  updateHudPhase();
}

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.running && !state.paused) {
    const t = now / 1000;
    movePlayer(dt);
    updateCores(t, dt);
    updateWeapons(t, dt);
    updateEnemies(t, dt);
    updateShots(dt);
    updateFx(dt);
    updateMarker();
    updateMission();
  } else {
    renderer.render(scene, camera);
    return;
  }
  renderer.render(scene, camera);
}

function start() {
  initAudio();
  audio.ctx?.resume();
  startAmbience();
  menu.classList.add("hidden");
  endScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  resetGame();
  canvas.requestPointerLock?.();
}

btnStart.addEventListener("click", start);
btnRetry.addEventListener("click", start);
btnResume.addEventListener("click", () => setPaused(false));

canvas.addEventListener("click", () => {
  if (!state.running || state.paused) return;
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
    if (state.triedLock) shoot();
    state.triedLock = true;
    return;
  }
  shoot();
});

canvas.addEventListener("mousedown", (e) => {
  if (!state.running || state.paused) return;
  if (!document.pointerLockElement && e.button === 0) state.dragging = true;
});
window.addEventListener("mouseup", () => {
  state.dragging = false;
});

document.addEventListener("mousemove", (e) => {
  if (!state.running || state.paused) return;
  if (!document.pointerLockElement && !state.dragging) return;
  state.mx += e.movementX;
  state.my += e.movementY;
});

document.addEventListener("keydown", (e) => {
  KEYS[e.code] = true;
  if (e.code === "Space") {
    e.preventDefault();
    if (!e.repeat) state.jumpBuf = 0.14;
  }
  if (e.code === "Escape") {
    e.preventDefault();
    if (state.running) setPaused(!state.paused);
    return;
  }
  if (state.running && !state.paused && (e.code === "KeyF" || e.code === "ControlLeft")) shoot();
});
document.addEventListener("keyup", (e) => {
  KEYS[e.code] = false;
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

buildWorld();
requestAnimationFrame(loop);

window.NEXO_DEBUG = { player, state, colliders };
