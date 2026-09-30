import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("view");
const gameRoot = document.getElementById("game-root");
const menu = document.getElementById("menu");
const endScreen = document.getElementById("end");
const pauseScreen = document.getElementById("pause");
const hud = document.getElementById("hud");
const hpFill = document.getElementById("hp-fill");
const hpValue = document.getElementById("hp-value");
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
const carryStatus = document.getElementById("carry-status");
const weaponNameEl = document.getElementById("weapon-name");
const ammoCountEl = document.getElementById("ammo-count");
const ammoLineEl = document.getElementById("ammo-line");
let ammoReserveEl = document.getElementById("ammo-reserve");
const hotbarButtons = [...document.querySelectorAll("#weapon-hotbar button[data-weapon]")];
const gearButtons = [...document.querySelectorAll("#weapon-hotbar button[data-gear]")];
const shieldFill = document.getElementById("shield-fill");
const shieldGlow = document.getElementById("shield-glow");
const useFx = document.getElementById("use-fx");
const crosshairEl = document.querySelector(".crosshair");
const btnStart = document.getElementById("btn-start");
const btnRetry = document.getElementById("btn-retry");
const btnResume = document.getElementById("btn-resume");
const touchStick = document.getElementById("touch-stick");
const touchKnob = touchStick?.querySelector("i");
const touchLook = document.getElementById("touch-look");
const touchAim = document.getElementById("touch-aim");
const touchFire = document.getElementById("touch-fire");
const touchReload = document.getElementById("touch-reload");
const touchJump = document.getElementById("touch-jump");
const touchKit = document.getElementById("touch-kit");
const touchShield = document.getElementById("touch-shield");

const KEYS = {};
const PLAYER_R = 0.4;
const EYE = 1.58;
const PHASE_NAMES = ["", "HANGAR", "ALA LESTE", "CORREDORES", "COFRE NORTE"];
const PHASE_NEED = [0, 2, 3, 3, 3];
const PHASE_INFO = [
  "",
  "O reator central está desativado. Derrote os robôs portadores, recupere 2 células e instale-as no reator.",
  "Destrua o gerador laranja para desativar as torretas. Derrote os robôs para obter as células.",
  "Os corredores permitem flanqueio. Observe o temporizador. Pegue os kits verdes e os escudos azuis se a vida baixar.",
  "A unidade pesada só sofre dano no visor. Recupere as 3 células e instale-as no cofre.",
];
const STORY = [
  "",
  "O NEXO foi desativado. Os reatores estão vazios. A defesa automática identifica o operador como intruso.",
  "A ala leste ativou as torretas. O gerador laranja as alimenta. As células estão com os robôs da ala.",
  "Os corredores foram ativados. O protocolo de tempo foi iniciado. Há kits e escudos nos flancos — use com 4 e 5.",
  "O cofre norte abriga o último reator. A unidade pesada protege a entrada. Apenas o visor é vulnerável. Use kits e escudos nos flancos.",
];
const LABELS = { drone: "Drone", turret: "Torreta", chaser: "Unidade rápida", heavy: "Unidade pesada", alarm: "Alarme de tempo" };
const WEAPONS = {
  pistola: {
    name: "PISTOLA", dmg: 1.6, cd: 0.22, mag: 18, heat: 10, pellets: 1,
    spread: 0.006, recoil: -0.3, reload: 0.95, pickup: 24, reserve: 216,
    speed: 48, falloffStart: 10, range: 26, minDamage: 0.55,
  },
  rifle: {
    name: "RIFLE", dmg: 1.35, cd: 0.1, mag: 40, heat: 7, pellets: 1,
    spread: 0.016, recoil: -0.18, reload: 1.25, pickup: 24, reserve: 218,
    speed: 70, falloffStart: 18, range: 48, minDamage: 0.75,
  },
  escopeta: {
    name: "ESCOPETA", dmg: 1.4, cd: 0.68, mag: 10, heat: 25, pellets: 7,
    spread: 0.06, recoil: -0.55, reload: 1.65, pickup: 24, reserve: 77,
    speed: 42, falloffStart: 3.5, range: 16, minDamage: 0.18,
  },
};
const VIEW_POSES = {
  pistola: {
    hip: new THREE.Vector3(0.22, -0.18, -0.44),
    aim: new THREE.Vector3(0, -0.064, -0.36),
  },
  rifle: {
    hip: new THREE.Vector3(0.3, -0.22, -0.59),
    aim: new THREE.Vector3(0, -0.13, -0.48),
  },
  escopeta: {
    hip: new THREE.Vector3(0.3, -0.23, -0.63),
    aim: new THREE.Vector3(0, -0.13, -0.52),
  },
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
  shotKick: 0,
  shotFlash: 0,
  aiming: false,
  aim: 0,
  firing: false,
  touchMoveX: 0,
  touchMoveY: 0,
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
  ammo: 18,
  ownedWeapons: ["pistola"],
  weaponAmmo: { pistola: 18 },
  weaponReserve: { pistola: 216, rifle: 0, escopeta: 0 },
  ammoGranted: { pistola: true },
  reserve: 216,
  reloading: false,
  reloadT: 0,
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
  door: null,
  medkits: 0,
  shieldPacks: 0,
  shield: 0,
  using: null,
  useT: 0,
  useDur: 1,
  useApplied: false,
};

const audio = { ctx: null, master: null, humGain: null, started: false, voices: 0, maxVoices: 8, buf: {} };

function initAudio() {
  if (audio.ctx) return;
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.4;
  master.connect(ctx.destination);
  audio.ctx = ctx;
  audio.master = master;
  bakeSfx();
}

function oscSample(type, t, freq) {
  const ph = (t * freq) % 1;
  if (type === "square") return ph < 0.5 ? 1 : -1;
  if (type === "sawtooth") return ph * 2 - 1;
  if (type === "triangle") return 1 - 4 * Math.abs(ph - 0.5);
  return Math.sin(t * freq * Math.PI * 2);
}

function mixToneAt(d, sr, freq, vol, type, slide = 0, delay = 0) {
  const start = (delay * sr) | 0;
  for (let i = start; i < d.length; i++) {
    const t = (i - start) / sr;
    const env = Math.exp(-t * 18);
    const f = slide ? Math.max(40, freq + slide * ((i - start) / Math.max(1, d.length - start))) : freq;
    d[i] += oscSample(type, t, f) * vol * env;
  }
}

function mixNoise(d, vol, decay = 1.8) {
  for (let i = 0; i < d.length; i++) d[i] += (Math.random() * 2 - 1) * vol * Math.pow(1 - i / d.length, decay);
}

function bakeBuf(dur, write) {
  const sr = audio.ctx.sampleRate;
  const n = Math.max(1, (sr * dur) | 0);
  const buf = audio.ctx.createBuffer(1, n, sr);
  write(buf.getChannelData(0), sr);
  return buf;
}

function bakeSfx() {
  const b = audio.buf;
  b.pistola = bakeBuf(0.12, (d, sr) => {
    mixNoise(d, 0.22, 2.2);
    mixToneAt(d, sr, 720, 0.12, "square", -380);
    mixToneAt(d, sr, 180, 0.08, "sine");
  });
  b.rifle = bakeBuf(0.08, (d, sr) => {
    mixNoise(d, 0.2, 2.4);
    mixToneAt(d, sr, 840, 0.1, "square", -300);
  });
  b.escopeta = bakeBuf(0.18, (d, sr) => {
    mixNoise(d, 0.28, 1.6);
    mixToneAt(d, sr, 160, 0.18, "sawtooth", -60);
  });
  b.pickup = bakeBuf(0.26, (d, sr) => {
    mixToneAt(d, sr, 523, 0.16, "sine", 0, 0);
    mixToneAt(d, sr, 659, 0.14, "sine", 0, 0.07);
    mixToneAt(d, sr, 784, 0.13, "triangle", 40, 0.13);
  });
  b.dry = bakeBuf(0.08, (d, sr) => {
    mixToneAt(d, sr, 1200, 0.08, "square");
    mixToneAt(d, sr, 850, 0.06, "square", 0, 0.03);
  });
  b.hitmark = bakeBuf(0.05, (d, sr) => {
    mixToneAt(d, sr, 1900, 0.1, "square");
  });
  b.kitReady = bakeBuf(0.18, (d, sr) => {
    mixToneAt(d, sr, 420, 0.12, "sine");
    mixToneAt(d, sr, 640, 0.12, "triangle", 80, 0.05);
  });
  b.shieldReady = bakeBuf(0.2, (d, sr) => {
    mixToneAt(d, sr, 240, 0.12, "triangle");
    mixToneAt(d, sr, 480, 0.12, "sine", 60, 0.06);
  });
  b.droneHit = bakeBuf(0.1, (d, sr) => {
    mixToneAt(d, sr, 150, 0.13, "square", -40);
    mixNoise(d, 0.1, 2);
  });
  b.droneShot = bakeBuf(0.1, (d, sr) => {
    mixToneAt(d, sr, 240, 0.14, "sawtooth", -90);
    mixNoise(d, 0.12, 2);
  });
  b.droneDie = bakeBuf(0.32, (d, sr) => {
    mixToneAt(d, sr, 90, 0.2, "sawtooth", -45);
    mixNoise(d, 0.18, 1.4);
  });
  b.armor = bakeBuf(0.08, (d, sr) => {
    mixToneAt(d, sr, 140, 0.1, "square");
    mixNoise(d, 0.08, 2);
  });
  b.hit = bakeBuf(0.2, (d, sr) => {
    mixNoise(d, 0.22, 1.5);
    mixToneAt(d, sr, 70, 0.2, "sawtooth", -30);
  });
}

function playSfx(name) {
  if (!audio.ctx) return;
  const buf = audio.buf[name];
  if (!buf || audio.voices >= audio.maxVoices) return;
  audio.voices += 1;
  const src = audio.ctx.createBufferSource();
  src.buffer = buf;
  src.connect(audio.master);
  src.onended = () => { audio.voices = Math.max(0, audio.voices - 1); };
  src.start();
}

function beep(freq, dur, type = "square", vol = 0.16, slide = 0, pan = 0) {
  if (!audio.ctx || audio.voices >= audio.maxVoices) return;
  const t = audio.ctx.currentTime;
  const o = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  if (pan) {
    const p = audio.ctx.createStereoPanner();
    p.pan.value = THREE.MathUtils.clamp(pan, -1, 1);
    g.connect(p);
    p.connect(audio.master);
  } else g.connect(audio.master);
  audio.voices += 1;
  o.onended = () => { audio.voices = Math.max(0, audio.voices - 1); };
  o.start(t);
  o.stop(t + dur);
}

const noiseCache = new Map();
function noiseBuffer(dur) {
  const key = dur < 0.08 ? 0.07 : dur < 0.16 ? 0.12 : 0.22;
  let buf = noiseCache.get(key);
  if (buf && buf.sampleRate === audio.ctx.sampleRate) return buf;
  buf = audio.ctx.createBuffer(1, Math.max(1, (audio.ctx.sampleRate * key) | 0), audio.ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  noiseCache.set(key, buf);
  return buf;
}

function noiseBurst(dur = 0.07, vol = 0.16, freq = 1600) {
  if (!audio.ctx || audio.voices >= audio.maxVoices) return;
  const t = audio.ctx.currentTime;
  const src = audio.ctx.createBufferSource();
  src.buffer = noiseBuffer(dur);
  const f = audio.ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  const g = audio.ctx.createGain();
  g.gain.value = vol;
  src.connect(f);
  f.connect(g);
  g.connect(audio.master);
  audio.voices += 1;
  src.onended = () => { audio.voices = Math.max(0, audio.voices - 1); };
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
    playSfx(kind === "escopeta" ? "escopeta" : kind === "rifle" ? "rifle" : "pistola");
  },
  dry() {
    playSfx("dry");
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
    playSfx("pickup");
  },
  hit() {
    playSfx("hit");
  },
  droneShot() {
    playSfx("droneShot");
  },
  droneHit() {
    playSfx("droneHit");
  },
  droneDie() {
    playSfx("droneDie");
  },
  charge() {
    beep(420, 0.32, "triangle", 0.11, 280);
  },
  hitmark() {
    playSfx("hitmark");
  },
  door() {
    beep(80, 0.4, "sawtooth", 0.2, 60);
    noiseBurst(0.15, 0.18, 300);
    beep(120, 0.3, "triangle", 0.15, 80);
  },
  armor() {
    playSfx("armor");
  },
  overheat() {
    beep(90, 0.22, "sawtooth", 0.16, -20);
    noiseBurst(0.15, 0.14, 700);
  },
  reloadStart() {
    beep(180, 0.07, "square", 0.08, -50);
    noiseBurst(0.045, 0.07, 900);
  },
  reloadEnd() {
    beep(260, 0.06, "square", 0.09, 80);
    noiseBurst(0.04, 0.06, 1400);
  },
  overclock() {
    beep(440, 0.12, "sine", 0.14, 200);
    beep(880, 0.2, "triangle", 0.1);
  },
  kitReady() {
    playSfx("kitReady");
  },
  kitUse() {
    noiseBurst(0.1, 0.12, 1400);
    beep(280, 0.16, "sine", 0.14, 120);
    beep(520, 0.22, "triangle", 0.12, 90);
  },
  shieldReady() {
    playSfx("shieldReady");
  },
  shieldUse() {
    beep(180, 0.18, "sine", 0.16, 80);
    beep(360, 0.24, "triangle", 0.14, 140);
    noiseBurst(0.08, 0.1, 900);
  },
  shieldHit() {
    beep(210, 0.07, "square", 0.1);
    noiseBurst(0.04, 0.07, 1600);
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
    const t = audio.ctx.currentTime;
    if (t - (audio._humT || 0) < 0.1) return;
    audio._humT = t;
    const vol = state.running && !state.paused ? Math.max(0, (1 - dist / 13) * 0.13) : 0;
    audio.humGain.gain.setTargetAtTime(vol, t, 0.08);
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
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const pmrem = new THREE.PMREMGenerator(renderer);
const roomEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const scene = new THREE.Scene();
scene.environment = roomEnv;
scene.environmentIntensity = 0.32;
scene.background = new THREE.Color(0x070b10);
scene.fog = new THREE.FogExp2(0x070b10, 0.023);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.07, 110);
const player = new THREE.Object3D();
player.position.set(0, 0, 6);
scene.add(player);
player.add(camera);
camera.position.set(0, EYE, 0);

let gfxReady = false;

let mobilePlay = false;

function isMobilePlay() {
  return mobilePlay;
}

function syncPlayMode() {
  mobilePlay =
    window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(hover: none)").matches;
  document.documentElement.classList.toggle("nexo-touch", mobilePlay);
  if (gfxReady) applyQuality();
}
syncPlayMode();
window.matchMedia("(pointer: coarse)").addEventListener?.("change", syncPlayMode);
window.matchMedia("(hover: none)").addEventListener?.("change", syncPlayMode);

function viewSize() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    return {
      w: Math.max(1, innerWidth),
      h: Math.max(1, innerHeight),
      x: 0,
      y: 0,
    };
  }
  const vv = window.visualViewport;
  return {
    w: Math.max(1, Math.round(vv?.width ?? innerWidth)),
    h: Math.max(1, Math.round(vv?.height ?? innerHeight)),
    x: Math.round(vv?.offsetLeft ?? 0),
    y: Math.round(vv?.offsetTop ?? 0),
  };
}

function resizeView() {
  const vv = window.visualViewport;
  const w = Math.max(1, Math.round(vv?.width ?? innerWidth));
  const h = Math.max(1, Math.round(vv?.height ?? innerHeight));
  if (gameRoot) {
    gameRoot.style.left = "0px";
    gameRoot.style.top = "0px";
    gameRoot.style.width = "100%";
    gameRoot.style.height = "100%";
  }
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
}
resizeView();

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function enterFullscreen() {
  window.scrollTo(0, 0);
  if (isFullscreen()) {
    resizeView();
    return;
  }
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen;
  if (!req) {
    resizeView();
    return;
  }
  Promise.resolve(req.call(el, { navigationUI: "hide" }))
    .catch(() => {})
    .finally(() => resizeView());
}

const world = new THREE.Group();
scene.add(world);
const fxLayer = new THREE.Group();
scene.add(fxLayer);
const mapLights = [];

// poeira no ar
const dustGeo = new THREE.BufferGeometry();
const dustCount = 180;
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPos[i * 3] = (Math.random() - 0.5) * 70;
  dustPos[i * 3 + 1] = Math.random() * 5;
  dustPos[i * 3 + 2] = (Math.random() - 0.5) * 70;
}
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(
  dustGeo,
  new THREE.PointsMaterial({ color: 0x9fd8d0, size: 0.035, transparent: true, opacity: 0.35, sizeAttenuation: true })
);
scene.add(dust);

scene.add(new THREE.AmbientLight(0x1a242e, 0.42));
scene.add(new THREE.HemisphereLight(0x6a8a9c, 0x12161c, 0.46));
const sun = new THREE.DirectionalLight(0xd8ecf6, 1.05);
sun.position.set(10, 36, 12);
sun.target.position.set(0, 0, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -52;
sun.shadow.camera.right = 52;
sun.shadow.camera.top = 52;
sun.shadow.camera.bottom = -52;
sun.shadow.camera.near = 8;
sun.shadow.camera.far = 90;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.035;
scene.add(sun);
scene.add(sun.target);

function applyQuality() {
  if (!gfxReady) return;
  const mobile = isMobilePlay();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.15 : 1.5));
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(mobile ? 512 : 2048, mobile ? 512 : 2048);
  dust.visible = !mobile;
}
gfxReady = true;
applyQuality();
const rim = new THREE.DirectionalLight(0x4ad8c8, 0.22);
rim.position.set(12, 10, -14);
scene.add(rim);

const flashlight = new THREE.SpotLight(0xe8f8ff, 4.2, 30, 0.52, 0.55, 1.1);
flashlight.position.set(0.16, -0.1, 0.08);
flashlight.target.position.set(0, -0.22, -9);
camera.add(flashlight);
camera.add(flashlight.target);

const muzzle = new THREE.PointLight(0x9ffff0, 0, 8);
muzzle.position.set(0.22, -0.12, -0.7);
camera.add(muzzle);

const guide = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({ color: 0x2affd0, transparent: true, opacity: 0.42 })
);
guide.frustumCulled = false;
guide.visible = false;
scene.add(guide);

const metal = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.82, roughness: 0.34, envMapIntensity: 0.7, ...extra });
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

const ASSET_URLS = {
  arma_pistola: "blender/glb/arma_pistola.glb",
  arma_rifle: "blender/glb/arma_rifle.glb",
  arma_escopeta: "blender/glb/arma_escopeta.glb",
  prop_crate: "blender/glb/prop_crate.glb",
  prop_cell: "blender/glb/prop_cell.glb",
  prop_medkit: "blender/glb/prop_medkit.glb",
  prop_shield: "blender/glb/prop_shield.glb",
  prop_reactor: "blender/glb/prop_reactor.glb",
  prop_generator: "blender/glb/prop_generator.glb",
  prop_cover: "blender/glb/prop_cover.glb",
  prop_pillar: "blender/glb/prop_pillar.glb",
  enemy_drone: "blender/glb/enemy_drone.glb",
  enemy_turret: "blender/glb/enemy_turret.glb",
  enemy_chaser: "blender/glb/enemy_chaser.glb",
  enemy_heavy: "blender/glb/enemy_heavy.glb",
  map_station: "blender/glb/map_station.glb",
};
const assets = {};
let assetsReady = false;
let mapMeta = null;

function prepAsset(root, keepLights = false) {
  const dropLights = [];
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = true;
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (m && m.map) m.map.colorSpace = THREE.SRGBColorSpace;
        }
      }
    }
    if (o.isLight) {
      if (keepLights) o.intensity *= 0.35;
      else dropLights.push(o);
    }
  });
  for (const L of dropLights) L.parent?.remove(L);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (!box.isEmpty()) {
    root.userData.bbCenterX = (box.min.x + box.max.x) * 0.5;
    root.userData.bbCenterY = (box.min.y + box.max.y) * 0.5;
    root.userData.bbCenterZ = (box.min.z + box.max.z) * 0.5;
    root.userData.bbMinY = box.min.y;
  }
  return root;
}

function cloneAsset(key, scale = 1, ground = false) {
  const src = assets[key];
  if (!src) return null;
  const wrapper = new THREE.Group();
  const c = src.clone(true);
  wrapper.add(c);
  const u = src.userData;
  if (u.bbCenterX != null) {
    c.position.x -= u.bbCenterX;
    c.position.z -= u.bbCenterZ;
    if (ground) c.position.y -= u.bbMinY;
    else c.position.y -= u.bbCenterY;
  }
  wrapper.scale.setScalar(scale);
  wrapper.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  return wrapper;
}

function loadOneAsset(loader, key, url, ms = 8000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    const t = setTimeout(finish, ms);
    loader.load(
      url,
      (gltf) => {
        clearTimeout(t);
        assets[key] = prepAsset(gltf.scene, key === "map_station");
        finish();
      },
      undefined,
      (err) => {
        clearTimeout(t);
        console.warn("asset fail", key, err);
        finish();
      }
    );
  });
}

async function loadAssets() {
  const loader = new GLTFLoader();
  await Promise.all(Object.entries(ASSET_URLS).map(([key, url]) => loadOneAsset(loader, key, url)));
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch("blender/glb/map_station.json", { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) mapMeta = await res.json();
  } catch (err) {
    console.warn("map meta fail", err);
  }
  assetsReady = true;
  for (const t of ["pistola", "rifle", "escopeta"]) getViewGun(t);
}

function buildGunModel(type) {
  const key = type === "rifle" ? "arma_rifle" : type === "escopeta" ? "arma_escopeta" : "arma_pistola";
  const glb = cloneAsset(key, 1, false);
  if (glb) {
    // Blender exporta o eixo frontal oposto ao viewmodel da câmera.
    glb.rotation.set(-0.05, Math.PI, 0);
    glb.position.set(0, -0.03, 0.03);
    glb.traverse((o) => {
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const mm of mats) {
          if (mm && mm.isMeshStandardMaterial) {
            mm.metalness = Math.min(0.9, (mm.metalness ?? 0.7) + 0.08);
            mm.roughness = Math.max(0.22, (mm.roughness ?? 0.4) - 0.06);
            mm.envMapIntensity = 0.8;
          }
        }
      }
    });
    return glb;
  }
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

const gunViewModels = Object.create(null);
const gunAimPoints = Object.create(null);

function getViewGun(type) {
  if (!gunViewModels[type]) gunViewModels[type] = buildGunModel(type);
  return gunViewModels[type];
}

function mountWeapon(type) {
  if (gun.userData.mounted === type) return;
  const model = getViewGun(type);
  while (gun.children.length) gun.remove(gun.children[0]);
  gun.add(model);
  attachMuzzleFlash(type, model);
  if (gunAimPoints[type]) gun.userData.aimPoint = gunAimPoints[type];
  else {
    calibrateWeaponAim(type, model);
    gunAimPoints[type] = gun.userData.aimPoint;
  }
  gun.userData.mounted = type;
}

function updateHotbar() {
  for (const button of hotbarButtons) {
    const type = button.dataset.weapon;
    const owned = state.ownedWeapons.includes(type);
    const ammo = state.weaponAmmo[type];
    button.classList.toggle("locked", !owned);
    button.classList.toggle("active", owned && state.weapon === type);
    const info = button._info || (button._info = button.querySelector("small"));
    if (info) info.textContent = owned ? `${ammo ?? WEAPONS[type].mag} BALAS` : "BLOQUEADO";
  }
}

function tickAmmoHud() {
  state.weaponAmmo[state.weapon] = state.ammo;
  setText(ammoCountEl, state.reloading ? "..." : String(state.ammo));
  const low = state.ammo <= 3 && !state.reloading;
  if (ammoLineEl._low !== low) {
    ammoLineEl._low = low;
    ammoLineEl.classList.toggle("low", low);
  }
  if (!ammoReserveEl) {
    ammoReserveEl = document.createElement("span");
    ammoReserveEl.id = "ammo-reserve";
    ammoReserveEl.style.marginLeft = "6px";
    ammoReserveEl.style.opacity = "0.7";
    ammoLineEl.appendChild(ammoReserveEl);
  }
  setText(ammoReserveEl, `/ ${state.reserve}`);
}

function updateWeaponHud() {
  tickAmmoHud();
  setText(weaponNameEl, WEAPONS[state.weapon].name);
  updateHotbar();
}

function startReload() {
  const w = WEAPONS[state.weapon];
  if (state.reloading || state.using || state.ammo >= w.mag || state.reserve <= 0) return;
  state.aiming = false;
  state.reloading = true;
  state.reloadT = w.reload;
  sfx.reloadStart();
  updateWeaponHud();
  showBanner("RECARREGANDO...");
}

function finishReload() {
  const w = WEAPONS[state.weapon];
  const need = w.mag - state.ammo;
  const take = Math.min(need, state.reserve);
  state.ammo += take;
  state.reserve -= take;
  if (state.weaponReserve) state.weaponReserve[state.weapon] = state.reserve;
  state.reloading = false;
  state.reloadT = 0;
  sfx.reloadEnd();
  updateWeaponHud();
}

function setWeapon(type, silent = false) {
  if (state.weapon && state.weaponAmmo) {
    state.weaponAmmo[state.weapon] = state.ammo;
    if (!state.weaponReserve) state.weaponReserve = {};
    state.weaponReserve[state.weapon] = state.reserve;
  }
  const newlyOwned = !state.ownedWeapons.includes(type);
  if (newlyOwned) {
    state.ownedWeapons.push(type);
    state.weaponAmmo[type] = WEAPONS[type].mag;
  }
  if (!silent) {
    state.weaponAmmo[type] = WEAPONS[type].mag;
    if (!state.ammoGranted) state.ammoGranted = {};
    if (!state.weaponReserve) state.weaponReserve = {};
    if (!state.ammoGranted[type]) {
      state.ammoGranted[type] = true;
      state.weaponReserve[type] = WEAPONS[type].reserve;
    } else {
      state.weaponReserve[type] = (state.weaponReserve[type] || 0) + WEAPONS[type].pickup;
    }
  }
  state.weapon = type;
  state.ammo = state.weaponAmmo[type] ?? WEAPONS[type].mag;
  state.reserve = state.weaponReserve?.[type] || 0;
  state.reloading = false;
  state.reloadT = 0;
  mountWeapon(type);
  updateWeaponHud();
  if (!silent) {
    sfx.pickup();
    showBanner(`${WEAPONS[type].name} — CARREGADOR COMPLETO`);
  }
}

function switchWeapon(type) {
  if (!state.ownedWeapons.includes(type) || state.weapon === type || state.reloading || state.using) return;
  setWeapon(type, true);
  sfx.pickup();
  showBanner(`${WEAPONS[type].name} EQUIPADO`);
}

const gun = new THREE.Group();
camera.add(gun);
gun.position.copy(VIEW_POSES.pistola.hip);

const itemHand = new THREE.Group();
camera.add(itemHand);
itemHand.visible = false;

const muzzleFlash = new THREE.Group();
const flashMat = new THREE.MeshBasicMaterial({
  color: 0xffe2a0,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const flashCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.085), flashMat);
flashCore.scale.set(0.8, 0.8, 2.8);
const flashCross = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.06), flashMat);
const flashCross2 = flashCross.clone();
flashCross2.rotation.z = Math.PI / 2;
muzzleFlash.add(flashCore, flashCross, flashCross2);
muzzleFlash.visible = false;

function localBounds(root) {
  root.updateMatrixWorld(true);
  const inverseRoot = root.matrixWorld.clone().invert();
  const result = new THREE.Box3();
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const transform = inverseRoot.clone().multiply(o.matrixWorld);
    result.union(o.geometry.boundingBox.clone().applyMatrix4(transform));
  });
  return result;
}

function attachMuzzleFlash(type, model) {
  const marker = model.getObjectByName("MUZZLE_POINT");
  if (marker) {
    marker.add(muzzleFlash);
    muzzleFlash.position.set(0, 0, 0);
    muzzleFlash.rotation.set(0, 0, 0);
    return;
  }
  const box = localBounds(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const yRatio = type === "pistola" ? 0.29 : 0.1;
  model.add(muzzleFlash);
  muzzleFlash.position.set(center.x, center.y + size.y * yRatio, box.min.z - 0.035);
  muzzleFlash.rotation.set(0, 0, 0);
}

function calibrateWeaponAim(type, model) {
  const marker = model.getObjectByName("AIM_POINT");
  if (!marker) {
    gun.userData.aimPoint = VIEW_POSES[type].aim.clone();
    return;
  }
  camera.updateMatrixWorld(true);
  const local = marker.getWorldPosition(new THREE.Vector3());
  gun.worldToLocal(local);
  gun.userData.aimPoint = new THREE.Vector3(-local.x, -local.y, VIEW_POSES[type].aim.z);
}

mountWeapon("pistola");

const colliders = [];
const gates = [];
const cores = [];
const reactors = [];
const enemies = [];
const spawnQ = [];
const props = [];
const shots = [];
const enemyShots = [];
const bits = [];
const weaponPickups = [];
const gearPickups = [];
const boltGeo = new THREE.CapsuleGeometry(0.035, 0.18, 3, 6);
const boltMat = new THREE.MeshBasicMaterial({ color: 0xb8fff4 });
const bitGeo = new THREE.BoxGeometry(0.07, 0.07, 0.07);
const enemyBoltGeo = new THREE.SphereGeometry(1, 6, 6);
const boltPool = [];
const shotPool = [];
const bitPool = [];
const bitRecPool = [];
const shotRecPool = [];
const bitMats = new Map();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _upY = new THREE.Vector3(0, 1, 0);
const _guideA = new THREE.Vector3();
const _guideB = new THREE.Vector3();

function takeMesh(pool, make) {
  let m = pool.pop();
  if (!m) {
    m = make();
    fxLayer.add(m);
  }
  m.visible = true;
  return m;
}

function recycle(m, pool) {
  if (!m) return;
  m.visible = false;
  if (pool.length < 96) pool.push(m);
}

function retirePickup(obj) {
  if (!obj) return;
  obj.traverse((o) => {
    if (o.isLight) o.intensity = 0;
    else if (o.isMesh || o.isLine || o.isSprite || o.isPoints) o.visible = false;
  });
}

function bitMaterial(color) {
  let mat = bitMats.get(color);
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({ color });
    bitMats.set(color, mat);
  }
  return mat;
}
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
    g.fillStyle = "#0a0e13";
    g.fillRect(0, 0, s, s);
    const n = 8;
    const t = s / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const shade = (x + y) % 2 ? "#141b22" : "#10161c";
        g.fillStyle = shade;
        g.fillRect(x * t + 1, y * t + 1, t - 2, t - 2);
        g.strokeStyle = "rgba(90, 140, 150, 0.12)";
        g.strokeRect(x * t + 1, y * t + 1, t - 2, t - 2);
      }
    }
    // desgaste
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"}, ${0.02 + Math.random() * 0.05})`;
      const w = 2 + Math.random() * 14;
      g.fillRect(Math.random() * s, Math.random() * s, w, 1 + Math.random() * 2);
    }
  }, 256, 16);
}

function wallTex() {
  return canvasTex((g, s) => {
    g.fillStyle = "#161d24";
    g.fillRect(0, 0, s, s);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 3; x++) {
        const px = 10 + x * 82;
        const py = 8 + y * 62;
        g.fillStyle = (x + y) % 2 ? "#1a232b" : "#141c22";
        g.fillRect(px, py, 74, 52);
        g.strokeStyle = "rgba(100, 150, 160, 0.16)";
        g.strokeRect(px, py, 74, 52);
        g.fillStyle = "rgba(0,0,0,0.25)";
        g.fillRect(px, py + 46, 74, 6);
      }
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(255,255,255, ${0.015 + Math.random() * 0.03})`;
      g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 3, 8 + Math.random() * 30);
    }
    g.fillStyle = "#1fd7c4";
    g.globalAlpha = 0.22;
    g.fillRect(0, s - 10, s, 3);
    g.globalAlpha = 1;
  }, 256, 8);
}

function addSolid(x, y, z, w, h, d, mat, collide = true) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
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
  const lamp = mesh(new THREE.BoxGeometry(1.4, 0.04, 0.28), emit(0xe8f4ff, 2.2), x, 4.66, z);
  world.add(housing, lamp);
  const p = new THREE.PointLight(0xd8ecff, 1.4, 14, 1.8);
  p.position.set(x, 4.1, z);
  world.add(p);
  mapLights.push(p);
}

function addCrate(x, z, color = 0x1a242e) {
  const glb = cloneAsset("prop_crate", 1, true);
  if (glb) {
    glb.position.set(x, 0, z);
    world.add(glb);
    colliders.push({
      min: new THREE.Vector3(x - 0.45, 0, z - 0.45),
      max: new THREE.Vector3(x + 0.45, 0.9, z + 0.45),
    });
    return;
  }
  addSolid(x, 0.45, z, 0.9, 0.9, 0.9, metal(color, { roughness: 0.5 }));
  addStrip(x, 0.46, z + 0.46, 0.7, 0.03, 0.02, 0xff8a3a);
}

function addLane(x1, z1, x2, z2, color = 0x1fd7c4) {
  const mx = (x1 + x2) / 2;
  const mz = (z1 + z2) / 2;
  const dx = Math.abs(x2 - x1);
  const dz = Math.abs(z2 - z1);
  if (dx >= dz) addStrip(mx, 0.04, mz, Math.max(dx, 0.2), 0.03, 0.18, color);
  else addStrip(mx, 0.04, mz, 0.18, 0.03, Math.max(dz, 0.2), color);
}

function addPillar(x, z, h = 4.8) {
  const glb = cloneAsset("prop_pillar", 1, true);
  if (glb) {
    glb.position.set(x, 0, z);
    world.add(glb);
    colliders.push({
      min: new THREE.Vector3(x - 0.4, 0, z - 0.4),
      max: new THREE.Vector3(x + 0.4, h, z + 0.4),
    });
    return;
  }
  addSolid(x, h / 2, z, 0.7, h, 0.7, metal(0x1a222b));
  addStrip(x, h * 0.52, z, 0.78, 0.06, 0.78);
}

function addCoverLow(x, z, w = 2.4, d = 0.5) {
  const glb = cloneAsset("prop_cover", 1, true);
  if (glb) {
    glb.position.set(x, 0, z);
    if (Math.abs(w - 2.4) > 0.2) glb.scale.x *= w / 2.4;
    world.add(glb);
    colliders.push({
      min: new THREE.Vector3(x - w / 2, 0, z - 0.35),
      max: new THREE.Vector3(x + w / 2, 1.2, z + 0.35),
    });
    return;
  }
  addSolid(x, 0.55, z, w, 1.1, d, metal(0x182028, { roughness: 0.55 }));
  addStrip(x, 1.12, z, w * 0.7, 0.04, d * 0.15, 0x2affd0);
}

function addZoneMark(x, z, labelColor) {
  addStrip(x, 0.05, z, 2.4, 0.03, 2.4, labelColor);
  addStrip(x, 0.06, z, 1.2, 0.02, 0.12, 0xf2fbff);
}

const GATE_LOOK = {
  east: 0xff7a2e,
  west: 0x3d8cff,
  south: 0xb06bff,
  north: 0xff3a3a,
};

function addGate(id, x, z, w, h, d) {
  // O vão da parede é 5.2 m. A chapa antiga tinha 4.8 e deixava fresta dos dois lados.
  const alongX = w >= d;
  const span = 5.72;
  const thick = 0.84;
  const height = 5.16;
  const cy = height / 2 - 0.04;
  const accent = GATE_LOOK[id] || 0xff3a3a;
  const bodyMat = metal(0x141a22, { roughness: 0.4, metalness: 0.74 });
  const edgeMat = metal(0x0b1016, { roughness: 0.32, metalness: 0.86 });
  const frameMat = metal(0x2c3640, { roughness: 0.3, metalness: 0.84 });
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  if (!alongX) group.rotation.y = Math.PI / 2;

  const slab = mesh(new THREE.BoxGeometry(span, height, thick), bodyMat, 0, cy, 0);
  group.add(slab);
  const face = thick / 2 + 0.012;
  const leafW = 2.62;
  for (const side of [1, -1]) {
    for (const hand of [-1, 1]) {
      const lx = hand * 1.34;
      const leaf = mesh(new THREE.BoxGeometry(leafW, 4.55, 0.05), edgeMat, lx, cy, side * face);
      group.add(leaf);
      const inset = mesh(new THREE.BoxGeometry(2.15, 3.15, 0.03), bodyMat, lx, cy + 0.05, side * (face + 0.03));
      group.add(inset);
      for (let i = -1; i <= 1; i++) {
        const brace = mesh(new THREE.BoxGeometry(1.35, 0.07, 0.028), frameMat, lx, cy + i * 0.72, side * (face + 0.05));
        brace.rotation.z = hand * 0.48;
        group.add(brace);
      }
    }
    const seam = mesh(new THREE.BoxGeometry(0.16, 4.7, 0.07), frameMat, 0, cy, side * (face + 0.02));
    const railT = mesh(new THREE.BoxGeometry(span - 0.2, 0.16, 0.06), frameMat, 0, cy + 2.28, side * (face + 0.02));
    const railB = mesh(new THREE.BoxGeometry(span - 0.2, 0.16, 0.06), frameMat, 0, cy - 2.22, side * (face + 0.02));
    const strip = mesh(new THREE.BoxGeometry(span * 0.62, 0.045, 0.02), emit(accent, 1.05), 0, 0.38, side * (face + 0.055));
    strip.castShadow = false;
    group.add(seam, railT, railB, strip);
  }
  group.traverse((o) => {
    if (!o.isMesh) return;
    const glow = o.material?.emissive && o.material.emissive.r + o.material.emissive.g + o.material.emissive.b > 0.2;
    o.castShadow = !glow;
    o.receiveShadow = true;
  });
  world.add(group);

  const hw = alongX ? span / 2 : thick / 2;
  const hd = alongX ? thick / 2 : span / 2;
  const col = {
    min: new THREE.Vector3(x - hw, -0.04, z - hd),
    max: new THREE.Vector3(x + hw, -0.04 + height, z + hd),
  };
  colliders.push(col);
  gates.push({ id, mesh: group, col, pos: new THREE.Vector3(x, cy, z) });
}

function openGate(id) {
  const g = gates.find((x) => x.id === id && !x.open);
  if (!g) return;
  g.open = true;
  world.remove(g.mesh);
  const i = colliders.indexOf(g.col);
  if (i >= 0) colliders.splice(i, 1);
  spawnBits(g.pos, 0xff5a3a, 8);
}

function openSpawnDoor() {
  if (!state.door || state.door.open || state.door.opening) return;
  state.door.opening = true;
  spawnBits(state.door.pos, 0x1fd7c4, 24);
  sfx.door?.();
  state.grace = 1.8;
}

function updateSpawnDoor(dt) {
  const d = state.door;
  if (!d?.opening || d.open) return;
  d.progress = Math.min(1, d.progress + dt * 1.25);
  const eased = 1 - Math.pow(1 - d.progress, 3);
  d.left.position.x = -0.72 - eased * 1.65;
  d.right.position.x = 0.72 + eased * 1.65;
  d.left.rotation.z = eased * 0.025;
  d.right.rotation.z = -eased * 0.025;
  d.statusMat.color.setHex(0x1fd7c4);
  d.statusMat.emissive.setHex(0x1fd7c4);
  d.statusMat.emissiveIntensity = 2.5 + Math.sin(d.progress * Math.PI * 8) * 0.5;
  d.warning.color.setHex(0x1fd7c4);

  if (d.progress >= 0.62 && d.col) {
    const i = colliders.indexOf(d.col);
    if (i >= 0) colliders.splice(i, 1);
    d.col = null;
  }
  if (d.progress >= 1) {
    d.open = true;
    d.opening = false;
    openGate("south");
    spawnPhase(1);
  }
}

function buildSpawnDoor(withFrame = true) {
  const frameMat = metal(0x303943, { roughness: 0.3, metalness: 0.88 });
  const edgeMat = metal(0x080b0f, { roughness: 0.22, metalness: 0.92 });
  const panelMat = metal(0x171e26, { roughness: 0.34, metalness: 0.8 });
  if (withFrame) {
    addSolid(-1.68, 2, 15, 0.42, 4, 0.7, frameMat);
    addSolid(1.68, 2, 15, 0.42, 4, 0.7, frameMat);
    addSolid(0, 3.82, 15, 3.75, 0.42, 0.7, frameMat);
    addSolid(-1.47, 2, 15.02, 0.08, 3.55, 0.82, edgeMat, false);
    addSolid(1.47, 2, 15.02, 0.08, 3.55, 0.82, edgeMat, false);
  }

  const door = new THREE.Group();
  door.position.set(0, 0, 15);
  const left = new THREE.Group();
  const right = new THREE.Group();
  left.position.set(-0.72, 2, 0);
  right.position.set(0.72, 2, 0);

  for (const [panel, side] of [[left, -1], [right, 1]]) {
    const slab = mesh(new THREE.BoxGeometry(1.42, 3.45, 0.22), panelMat);
    const inset = mesh(new THREE.BoxGeometry(1.08, 2.55, 0.05), edgeMat, 0, 0, 0.135);
    const armorTop = mesh(new THREE.BoxGeometry(1.12, 0.38, 0.08), frameMat, 0, 1.25, 0.17);
    const armorBottom = mesh(new THREE.BoxGeometry(1.12, 0.38, 0.08), frameMat, 0, -1.25, 0.17);
    const spine = mesh(new THREE.BoxGeometry(0.1, 2.45, 0.09), frameMat, side * 0.5, 0, 0.18);
    panel.add(slab, inset, armorTop, armorBottom, spine);
    for (let i = -1; i <= 1; i++) {
      const brace = mesh(new THREE.BoxGeometry(0.72, 0.09, 0.08), frameMat, 0, i * 0.58, 0.19);
      brace.rotation.z = side * 0.58;
      panel.add(brace);
    }
  }
  door.add(left, right);
  door.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  world.add(door);

  const statusMat = emit(0xff3030, 2.8);
  const statusHousing = mesh(new THREE.BoxGeometry(0.62, 0.27, 0.24), edgeMat, 0, 3.5, 15.28);
  const status = mesh(new THREE.BoxGeometry(0.38, 0.1, 0.04), statusMat, 0, 3.5, 15.42);
  status.castShadow = false;
  world.add(statusHousing, status);
  const warning = new THREE.PointLight(0xff2828, 1.4, 4);
  warning.position.set(0, 3.45, 15.5);
  world.add(warning);

  const doorCol = {
    min: new THREE.Vector3(-1.43, 0, 14.86),
    max: new THREE.Vector3(1.43, 3.75, 15.14),
  };
  colliders.push(doorCol);
  state.door = {
    mesh: door,
    left,
    right,
    col: doorCol,
    open: false,
    opening: false,
    progress: 0,
    pos: new THREE.Vector3(0, 2, 15),
    statusMat,
    warning,
  };
}

function stationCanvas(draw, size) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  return c;
}

function stationMaps() {
  if (stationMaps.cache) return stationMaps.cache;
  const colorOf = (canvas) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const roughOf = (canvas) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    t.colorSpace = THREE.NoColorSpace;
    return t;
  };
  const floorC = stationCanvas((g, s) => {
    g.fillStyle = "#141b22";
    g.fillRect(0, 0, s, s);
    const n = 4;
    const t = s / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const shade = 18 + ((x * 3 + y * 5) % 5) * 2;
        g.fillStyle = `rgb(${shade},${shade + 4},${shade + 8})`;
        g.fillRect(x * t + 3, y * t + 3, t - 6, t - 6);
        g.strokeStyle = "rgba(120, 160, 170, 0.16)";
        g.strokeRect(x * t + 6, y * t + 6, t - 12, t - 12);
      }
    }
    for (let i = 0; i < 140; i++) {
      g.fillStyle = `rgba(210,220,230,${0.03 + Math.random() * 0.05})`;
      g.fillRect(Math.random() * s, Math.random() * s, 4 + Math.random() * 28, 1);
    }
  }, 512);
  const floorR = stationCanvas((g, s) => {
    g.fillStyle = "#c8c8c8";
    g.fillRect(0, 0, s, s);
    const n = 4;
    const t = s / n;
    g.strokeStyle = "#6a6a6a";
    g.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      g.beginPath();
      g.moveTo(i * t, 0);
      g.lineTo(i * t, s);
      g.moveTo(0, i * t);
      g.lineTo(s, i * t);
      g.stroke();
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(40,40,40,${0.15 + Math.random() * 0.3})`;
      g.fillRect(Math.random() * s, Math.random() * s, 8 + Math.random() * 40, 2);
    }
  }, 512);
  const wallC = stationCanvas((g, s) => {
    g.fillStyle = "#1c262e";
    g.fillRect(0, 0, s, s);
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 2; x++) {
        const px = 10 + x * 250;
        const py = 12 + y * 164;
        const alt = (x + y) % 2 ? 34 : 28;
        g.fillStyle = `rgb(${alt},${alt + 6},${alt + 12})`;
        g.fillRect(px, py, 230, 146);
        g.strokeStyle = "rgba(150, 180, 190, 0.2)";
        g.strokeRect(px + 8, py + 8, 214, 130);
        g.fillStyle = "rgba(0,0,0,0.28)";
        g.fillRect(px, py + 132, 230, 10);
        g.fillStyle = "rgba(180,200,210,0.35)";
        for (const [rx, ry] of [[px + 12, py + 12], [px + 214, py + 12], [px + 12, py + 128], [px + 214, py + 128]]) {
          g.beginPath();
          g.arc(rx, ry, 2.2, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }, 512);
  const wallR = stationCanvas((g, s) => {
    g.fillStyle = "#b4b4b4";
    g.fillRect(0, 0, s, s);
    g.fillStyle = "#8a8a8a";
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 2; x++) g.fillRect(10 + x * 250, 12 + y * 164, 230, 146);
    }
  }, 256);
  const ceilC = stationCanvas((g, s) => {
    g.fillStyle = "#12181e";
    g.fillRect(0, 0, s, s);
    const n = 3;
    const t = s / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        g.fillStyle = (x + y) % 2 ? "#1a222a" : "#161e26";
        g.fillRect(x * t + 4, y * t + 4, t - 8, t - 8);
      }
    }
  }, 256);
  const trimC = stationCanvas((g, s) => {
    g.fillStyle = "#2a343c";
    g.fillRect(0, 0, s, s);
    g.fillStyle = "rgba(0,0,0,0.35)";
    for (let y = 8; y < s; y += 18) g.fillRect(0, y, s, 2);
  }, 128);
  const trimR = stationCanvas((g, s) => {
    g.fillStyle = "#9a9a9a";
    g.fillRect(0, 0, s, s);
    g.fillStyle = "#5c5c5c";
    for (let y = 8; y < s; y += 18) g.fillRect(0, y, s, 2);
  }, 128);
  stationMaps.cache = {
    floor: { color: colorOf(floorC), rough: roughOf(floorR) },
    wall: { color: colorOf(wallC), rough: roughOf(wallR) },
    ceil: { color: colorOf(ceilC), rough: roughOf(wallR) },
    trim: { color: colorOf(trimC), rough: roughOf(trimR) },
  };
  return stationMaps.cache;
}

function dressStation(root) {
  const maps = stationMaps();
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position || !o.geometry.attributes.normal) return;
    const pos = o.geometry.attributes.position;
    const nor = o.geometry.attributes.normal;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ax = Math.abs(nor.getX(i));
      const ay = Math.abs(nor.getY(i));
      const az = Math.abs(nor.getZ(i));
      if (ay >= ax && ay >= az) {
        uv[i * 2] = x * 0.5;
        uv[i * 2 + 1] = z * 0.5;
      } else if (ax >= az) {
        uv[i * 2] = z * 0.5;
        uv[i * 2 + 1] = y * 0.5;
      } else {
        uv[i * 2] = x * 0.5;
        uv[i * 2 + 1] = y * 0.5;
      }
    }
    o.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    const list = Array.isArray(o.material) ? o.material : [o.material];
    const next = list.map((m) => {
      const glow = m?.emissive && m.emissive.r + m.emissive.g + m.emissive.b > 0.04;
      if (!m || glow) return m;
      const n = (m.name || "").toLowerCase();
      let kind = null;
      if (n.includes("floor") || n.includes("seam")) kind = "floor";
      else if (n.includes("ceil")) kind = "ceil";
      else if (n.includes("panel") || n.includes("wall") || n.includes("crate")) kind = "wall";
      else if (n.includes("trim") || n.includes("frame")) kind = "trim";
      if (!kind) return m;
      const copy = m.clone();
      copy.map = maps[kind].color;
      copy.roughnessMap = maps[kind].rough;
      copy.color.set(0xffffff);
      if (kind === "floor") {
        copy.metalness = 0.2;
        copy.roughness = 0.78;
        copy.envMapIntensity = 0.32;
      } else if (kind === "ceil") {
        copy.metalness = 0.24;
        copy.roughness = 0.72;
        copy.envMapIntensity = 0.28;
      } else if (kind === "wall") {
        copy.metalness = 0.36;
        copy.roughness = 0.6;
        copy.envMapIntensity = 0.38;
      } else {
        copy.metalness = 0.7;
        copy.roughness = 0.36;
        copy.envMapIntensity = 0.5;
      }
      copy.needsUpdate = true;
      return copy;
    });
    o.material = Array.isArray(o.material) ? next : next[0];
  });
}

function mountBlenderMap() {
  const src = assets.map_station;
  if (!src || !mapMeta?.boxes) return false;
  const root = src.clone(true);
  root.name = "station_map";
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    let p = o;
    while (p) {
      if (typeof p.name === "string" && p.name.startsWith("map_floor")) {
        o.castShadow = false;
        break;
      }
      p = p.parent;
    }
  });
  dressStation(root);
  world.add(root);
  for (const b of mapMeta.boxes) {
    colliders.push({
      min: new THREE.Vector3(b.min[0], b.min[1], b.min[2]),
      max: new THREE.Vector3(b.max[0], b.max[1], b.max[2]),
    });
  }
  for (const entry of mapMeta.lights || []) {
    const x = entry[0];
    const z = entry[1];
    const y = entry.length > 2 ? entry[2] : 4.1;
    const p = new THREE.PointLight(0xd8ecff, 1.7, 16, 1.6);
    p.position.set(x, y, z);
    world.add(p);
    mapLights.push(p);
  }
  const spawnLight = new THREE.PointLight(0x9fd8d0, 1.8, 16);
  spawnLight.position.set(0, 3.6, 7.5);
  world.add(spawnLight);
  mapLights.push(spawnLight);

  const H = 5;
  addGate("east", 14, 0, 0.55, H, 4.8);
  addGate("west", -14, 0, 0.55, H, 4.8);
  addGate("south", 0, 14, 4.8, H, 0.55);
  addGate("north", 0, -14, 4.8, H, 0.55);
  buildSpawnDoor(false);
  return true;
}

function buildWorld() {
  if (mountBlenderMap()) {
    state.phase = 1;
    state.phaseGot = 0;
    state.phaseNeed = PHASE_NEED[1];
    state.grace = 999;
    return;
  }
  wMat = new THREE.MeshStandardMaterial({ map: wallTex(), roughness: 0.72, metalness: 0.28, envMapIntensity: 0.5 });
  const fMat = new THREE.MeshStandardMaterial({ map: floorTex(), roughness: 0.85, metalness: 0.2, envMapIntensity: 0.4 });
  const floor = mesh(new THREE.PlaneGeometry(96, 96), fMat);
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  world.add(floor);
  world.add(mesh(new THREE.BoxGeometry(94, 0.4, 94), metal(0x12181e, { roughness: 0.7 }), 0, 5.05, 0));

  const H = 5;
  const hub = 14;
  const gap = 2.6;
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

  addGate("east", hub, 0, 0.55, H, 4.8);
  addGate("west", -hub, 0, 0.55, H, 4.8);
  addGate("south", 0, hub, 4.8, H, 0.55);
  addGate("north", 0, -hub, 4.8, H, 0.55);

  addSolid(18.5, H / 2, 11, 11, H, 0.65, wMat);
  addSolid(30.2, H / 2, 11, 4.2, H, 0.65, wMat);
  addSolid(25.5, H / 2, 15.2, 7.2, H, 0.65, wMat);
  addSolid(22.2, H / 2, 13.1, 0.65, H, 4.2, wMat);
  addSolid(28.6, H / 2, 13.1, 0.65, H, 4.2, wMat);
  addSolid(23, H / 2, -11, 20, H, 0.65, wMat);
  addSolid(33, H / 2, 0, 0.65, H, 22.5, wMat);
  addSolid(19.5, H / 2, 3.6, 0.55, H, 5, wMat);
  addSolid(28.2, H / 2, -4, 0.55, H, 4.2, wMat);
  addCoverLow(24, 5.8, 2.6);
  addCoverLow(29.2, -6.2, 2.8);

  addSolid(-23, H / 2, 11, 20, H, 0.65, wMat);
  addSolid(-23, H / 2, -11, 20, H, 0.65, wMat);
  addSolid(-33, H / 2, 0, 0.65, H, 22.5, wMat);
  addSolid(-19, H / 2, 3.2, 0.55, H, 5.6, wMat);
  addSolid(-27.5, H / 2, -3.8, 0.55, H, 5, wMat);
  addCoverLow(-24.5, 5.2, 2.4);

  addSolid(11, H / 2, 22.5, 0.65, H, 18, wMat);
  addSolid(-11, H / 2, 22.5, 0.65, H, 18, wMat);
  addSolid(0, H / 2, 31.5, 22.5, H, 0.65, wMat);
  addSolid(4.2, H / 2, 20.5, 0.5, H, 5.2, wMat);
  addSolid(-5, H / 2, 25, 3.8, 1.2, 0.5, metal(0x1a222b));
  addCoverLow(0, 24.5, 3);

  addSolid(11, H / 2, -22.5, 0.65, H, 18, wMat);
  addSolid(-11, H / 2, -22.5, 0.65, H, 18, wMat);
  addSolid(0, H / 2, -31.5, 22.5, H, 0.65, wMat);
  addSolid(-5, H / 2, -20.5, 1.8, 2.8, 0.55, wMat);
  addSolid(5, H / 2, -20.5, 1.8, 2.8, 0.55, wMat);
  addCoverLow(0, -24.5, 3.4);

  addLane(-10, 0, 10, 0);
  addLane(0, -10, 0, 10);
  addZoneMark(0, 0, 0x1fd7c4);
  addZoneMark(24, 0, 0xff8a3a);
  addZoneMark(-24, 0, 0x4aa8ff);
  addZoneMark(0, 23, 0xc77dff);
  addZoneMark(0, -24, 0xff3a3a);

  addSolid(-6.5, 1.4, -3.6, 6.2, 2.8, 0.4, wMat);
  addSolid(7, 1.4, 4.2, 5.6, 2.8, 0.4, wMat);
  addPillar(-9.5, -9.5);
  addPillar(9.5, 9.5);
  addPillar(-9.5, 9.5);
  addPillar(9.5, -9.5);

  for (const [x, z] of [[0,0],[0,7],[0,-7],[7,0],[-7,0],[24,0],[24,7],[24,-7],[-24,0],[-24,6],[0,23],[0,-23],[6,27],[-6,-27]]) addLightFixture(x, z);
  for (const [x, z] of [[-9.2,3],[9.4,-3.6],[8,7.2],[-7.5,-6.2],[19.5,-6],[30,6.5],[21,7.5],[-19.5,6],[-29.5,-5.5],[5.5,19.5],[-6,28.5],[-5,-18.5],[6.5,-28.5],[27,-3],[-26,3.5]]) addCrate(x, z);

  addLane(14, 0, 32, 0, 0xff8a3a);
  addLane(-14, 0, -32, 0, 0x4aa8ff);
  addLane(0, 14, 0, 30, 0xc77dff);
  addLane(0, -14, 0, -30, 0xff3a3a);

  const spawnLight = new THREE.PointLight(0x9fd8d0, 1.8, 16);
  spawnLight.position.set(0, 3.6, 7.5);
  world.add(spawnLight);
  mapLights.push(spawnLight);

  // === SALA DE SPAWN (z 15 a 21) ===
  const SH = 4;
  addSolid(-3.5, SH / 2, 18, 0.5, SH, 6, wMat);      // parede oeste
  addSolid(3.5, SH / 2, 18, 0.5, SH, 6, wMat);       // parede leste
  addSolid(0, SH / 2, 21, 7.5, SH, 0.5, wMat);       // parede fundo
  addSolid(-2.5, SH / 2, 15, 2, SH, 0.5, wMat);      // parede frente esq
  addSolid(2.5, SH / 2, 15, 2, SH, 0.5, wMat);       // parede frente dir
  addSolid(0, SH - 0.1, 18, 7.5, 0.2, 6.5, metal(0x12181e)); // teto
  addStrip(0, 0.05, 18, 2.4, 0.03, 2.4, 0x1fd7c4);   // marca no chão
  addLightFixture(0, 18);

  // Porta blindada sci-fi de duas folhas.
  const frameMat = metal(0x303943, { roughness: 0.3, metalness: 0.88 });
  const edgeMat = metal(0x080b0f, { roughness: 0.22, metalness: 0.92 });
  const panelMat = metal(0x171e26, { roughness: 0.34, metalness: 0.8 });
  addSolid(-1.68, 2, 15, 0.42, 4, 0.7, frameMat);
  addSolid(1.68, 2, 15, 0.42, 4, 0.7, frameMat);
  addSolid(0, 3.82, 15, 3.75, 0.42, 0.7, frameMat);
  addSolid(-1.47, 2, 15.02, 0.08, 3.55, 0.82, edgeMat, false);
  addSolid(1.47, 2, 15.02, 0.08, 3.55, 0.82, edgeMat, false);

  const door = new THREE.Group();
  door.position.set(0, 0, 15);
  const left = new THREE.Group();
  const right = new THREE.Group();
  left.position.set(-0.72, 2, 0);
  right.position.set(0.72, 2, 0);

  for (const [panel, side] of [[left, -1], [right, 1]]) {
    const slab = mesh(new THREE.BoxGeometry(1.42, 3.45, 0.22), panelMat);
    const inset = mesh(new THREE.BoxGeometry(1.08, 2.55, 0.05), edgeMat, 0, 0, 0.135);
    const armorTop = mesh(new THREE.BoxGeometry(1.12, 0.38, 0.08), frameMat, 0, 1.25, 0.17);
    const armorBottom = mesh(new THREE.BoxGeometry(1.12, 0.38, 0.08), frameMat, 0, -1.25, 0.17);
    const spine = mesh(new THREE.BoxGeometry(0.1, 2.45, 0.09), frameMat, side * 0.5, 0, 0.18);
    panel.add(slab, inset, armorTop, armorBottom, spine);

    // Três barras diagonais dão silhueta industrial às folhas.
    for (let i = -1; i <= 1; i++) {
      const brace = mesh(new THREE.BoxGeometry(0.72, 0.09, 0.08), frameMat, 0, i * 0.58, 0.19);
      brace.rotation.z = side * 0.58;
      panel.add(brace);
    }
  }
  door.add(left, right);
  door.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  world.add(door);

  const statusMat = emit(0xff3030, 2.8);
  const statusHousing = mesh(new THREE.BoxGeometry(0.62, 0.27, 0.24), edgeMat, 0, 3.5, 15.28);
  const status = mesh(new THREE.BoxGeometry(0.38, 0.1, 0.04), statusMat, 0, 3.5, 15.42);
  status.castShadow = false;
  world.add(statusHousing, status);
  const warning = new THREE.PointLight(0xff2828, 1.4, 4);
  warning.position.set(0, 3.45, 15.5);
  world.add(warning);

  const doorCol = {
    min: new THREE.Vector3(-1.43, 0, 14.86),
    max: new THREE.Vector3(1.43, 3.75, 15.14),
  };
  colliders.push(doorCol);
  state.door = {
    mesh: door,
    left,
    right,
    col: doorCol,
    open: false,
    opening: false,
    progress: 0,
    pos: new THREE.Vector3(0, 2, 15),
    statusMat,
    warning,
  };

  state.phase = 1;
  state.phaseGot = 0;
  state.phaseNeed = PHASE_NEED[1];
  state.grace = 999;
}

function spawnPhase(n) {
  state.phase = n;
  if (n > 1) retireAliveEnemies();
  state.phaseGot = 0;
  state.phaseNeed = PHASE_NEED[n];
  state.grace = n === 1 ? 1.8 : 1.6;
  state.timer = n === 3 ? 110 : 0;
  state.alarm = false;
  state.carrying = false;
  state.carryingFrom = null;
  updateInv();
  updateWeaponHud();
  updateGearHud();
  if (n === 1) {
    spawnReactor(0, -7.5, 2);
    spawnEnemy("drone", 0, 2.8, true);
    spawnEnemy("drone", -8.2, -7.2, true);
    spawnWeapon("rifle", -11, 5.2);
    spawnWeapon("pistola", 10.2, -5);
    spawnEnemy("drone", 8.4, -8);
    spawnEnemy("drone", -8.6, 8.2);
    spawnEnemy("drone", 6.4, -4.8);
    spawnEnemy("drone", -5.2, 5.1);
    spawnEnemy("chaser", 7.1, 6.4);
    spawnGear("medkit", 6.8, 10.4);
    spawnGear("shield", -6.8, -10.4);
  }
  if (n === 2) {
    openGate("east");
    spawnReactor(24, 0, 3);
    spawnGenerator(26.2, 7.6);
    spawnEnemy("drone", 18.5, 5, true);
    spawnEnemy("drone", 26, -5.2, true);
    spawnEnemy("chaser", 29.2, 4, true);
    spawnWeapon("escopeta", 30.5, 7.5);
    spawnWeapon("rifle", 16, -7.5);
    spawnGear("medkit", 16.5, 7.4);
    spawnGear("medkit", 31, 7.2);
    spawnGear("shield", 32, -8.4);
    spawnEnemy("turret", 23.2, -2.4);
    spawnEnemy("turret", 27, -7.2);
    spawnEnemy("drone", 30, 0);
    spawnEnemy("drone", 18.8, -6.2);
    spawnEnemy("drone", 21.6, 7.4);
    spawnEnemy("drone", 16.8, -3.2);
    spawnEnemy("chaser", 27.2, 6.2);
    spawnEnemy("chaser", 20.2, -8.2);
    spawnEnemy("turret", 31.2, -3.6);
  }
  if (n === 3) {
    openGate("west");
    openGate("south");
    spawnReactor(-24, 0, 2);
    spawnReactor(0, 24, 1);
    spawnEnemy("drone", -25.4, -5.6, true);
    spawnEnemy("chaser", -27.6, 5.4, true);
    spawnEnemy("chaser", 4.6, 26.8, true);
    spawnWeapon("rifle", -30.5, 7.2);
    spawnWeapon("escopeta", 7, 28.5);
    spawnWeapon("pistola", -5.2, 19);
    spawnGear("medkit", -31, 7.2);
    spawnGear("medkit", 8.2, 19.2);
    spawnGear("medkit", -16.5, 7.8);
    spawnGear("shield", -31, -7.2);
    spawnGear("shield", 3.2, 29.2);
    spawnEnemy("turret", -22.4, -5.2);
    spawnEnemy("drone", -28.2, 4.2);
    spawnEnemy("drone", -26.2, -1.2);
    spawnEnemy("drone", -20.8, 6.5);
    spawnEnemy("drone", -3.8, 27.2);
    spawnEnemy("chaser", -29.2, -4.2);
    spawnEnemy("chaser", -23.4, 7.4);
    spawnEnemy("chaser", 6.8, 21.8);
    spawnEnemy("turret", -30.2, 1.2);
  }
  if (n === 4) {
    openGate("north");
    spawnReactor(0, -24.5, 3);
    spawnEnemy("drone", 0, -20.5, true);
    spawnEnemy("chaser", -6, -26.5, true);
    spawnEnemy("drone", 6.2, -26.2, true);
    spawnWeapon("escopeta", -7.5, -28.5);
    spawnWeapon("rifle", 7.8, -28.8);
    spawnGear("medkit", -8.2, -18.8);
    spawnGear("medkit", 0, -22.8);
    spawnGear("shield", 8.2, -18.8);
    spawnEnemy("heavy", 0, -27.5);
    spawnEnemy("turret", -7, -19);
    spawnEnemy("chaser", 7.2, -19.2);
    spawnEnemy("drone", -8, -18.6);
    spawnEnemy("drone", 8, -18.6);
  }
  sfx.phase();
  const extra = state.overclock > 0 && n > 1 ? "  ·  OVERCLOCK 9s" : "";
  showBanner(`FASE ${n} — ${PHASE_NAMES[n]}${extra}`);
  showStory(STORY[n]);
  updateHudPhase();
  warmRenderer();
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
  g.add(crate, stripe, model, halo);
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
      retirePickup(w.mesh);
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

function buildMedkitProp() {
  const g = new THREE.Group();
  const caseBox = mesh(new THREE.BoxGeometry(0.38, 0.22, 0.28), metal(0xd8e8dc, { metalness: 0.15, roughness: 0.45 }));
  const lid = mesh(new THREE.BoxGeometry(0.4, 0.04, 0.3), metal(0x1a3a28, { metalness: 0.3, roughness: 0.4 }), 0, 0.13, 0);
  const crossV = mesh(new THREE.BoxGeometry(0.06, 0.03, 0.18), emit(0xff3a3a, 1.4), 0, 0.16, 0);
  const crossH = mesh(new THREE.BoxGeometry(0.18, 0.03, 0.06), emit(0xff3a3a, 1.4), 0, 0.16, 0);
  g.add(caseBox, lid, crossV, crossH);
  return g;
}

function buildShieldProp() {
  const g = new THREE.Group();
  const plate = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 6), metal(0x1a3344, { metalness: 0.85, roughness: 0.22 }));
  plate.rotation.x = Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(0.22, 0.018, 8, 6), emit(0x4ad4ff, 1.6));
  rim.rotation.x = Math.PI / 2;
  const core = mesh(new THREE.OctahedronGeometry(0.08), emit(0x9af0ff, 1.8));
  g.add(plate, rim, core);
  return g;
}

function gearModel(kind, scale) {
  const key = kind === "medkit" ? "prop_medkit" : "prop_shield";
  return cloneAsset(key, scale, false) || (kind === "medkit" ? buildMedkitProp() : buildShieldProp());
}

function buildUseItem(kind) {
  return gearModel(kind, kind === "medkit" ? 0.42 : 0.85);
}

function gearFull(kind) {
  return kind === "medkit" ? state.medkits >= 2 : state.shieldPacks >= 1;
}

function spawnGear(kind, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const color = kind === "medkit" ? 0x3dff7a : 0x4ad4ff;
  const crate = mesh(new THREE.BoxGeometry(0.86, 0.42, 0.86), metal(0x162028, { roughness: 0.58 }), 0, 0.21, 0);
  const stripe = mesh(new THREE.BoxGeometry(0.88, 0.07, 0.88), emit(color, 1.05), 0, 0.38, 0);
  const model = gearModel(kind, kind === "medkit" ? 1.05 : 1.2);
  model.position.set(0, 0.88, 0);
  const halo = mesh(new THREE.TorusGeometry(0.5, 0.018, 8, 20), new THREE.MeshBasicMaterial({ color }), 0, 0.48, 0);
  halo.rotation.x = Math.PI / 2;
  halo.castShadow = false;
  g.add(crate, stripe, model, halo);
  world.add(g);
  gearPickups.push({ mesh: g, model, kind, taken: false });
}

function takeGear(g) {
  if (g.taken || gearFull(g.kind)) return false;
  g.taken = true;
  retirePickup(g.mesh);
  if (g.kind === "medkit") {
    state.medkits += 1;
    sfx.kitReady();
    showBanner("KIT MÉDICO — 4 PARA CURAR");
  } else {
    state.shieldPacks += 1;
    sfx.shieldReady();
    showBanner("ESCUDO — 5 PARA ATIVAR");
  }
  _v1.copy(g.mesh.position);
  _v1.y = 0.9;
  spawnBits(_v1, g.kind === "medkit" ? 0x3dff7a : 0x4ad4ff, 3);
  updateGearHud();
  return true;
}

function updateGear(t, dt) {
  let close = null;
  for (const g of gearPickups) {
    if (g.taken) continue;
    g.model.rotation.y += dt * 1.5;
    g.model.position.y = 0.88 + Math.sin(t * 2.1 + g.mesh.position.x) * 0.07;
    const d = Math.hypot(g.mesh.position.x - player.position.x, g.mesh.position.z - player.position.z);
    if (d < 2.7) close = g;
    if (d < 1.55) takeGear(g);
  }
  if (!close || !state.running || state.paused) return;
  if (gearFull(close.kind)) {
    nearPrompt.textContent = close.kind === "medkit"
      ? "Você já carrega 2 kits. Use um com 4."
      : "Você já carrega um escudo. Use com 5.";
  } else {
    nearPrompt.textContent = close.kind === "medkit"
      ? "Kit médico. Recolha e use com 4."
      : "Escudo portátil. Recolha e use com 5.";
  }
  nearPrompt.classList.remove("hidden");
}

function nearestGear(kind) {
  let best = null;
  let bestD = Infinity;
  for (const g of gearPickups) {
    if (g.taken) continue;
    if (kind && g.kind !== kind) continue;
    const d = g.mesh.position.distanceTo(player.position);
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  return best;
}

function updateGearHud() {
  for (const button of gearButtons) {
    const kind = button.dataset.gear;
    const count = kind === "medkit" ? state.medkits : state.shieldPacks;
    const info = button.querySelector("small");
    if (info) info.textContent = String(count);
    button.classList.toggle("empty", count <= 0);
    button.classList.toggle("ready", count > 0);
    button.classList.toggle("using", state.using === kind);
  }
}

function startUseItem(kind) {
  if (!state.running || state.paused || state.using || state.reloading) return;
  if (kind === "medkit") {
    if (state.medkits <= 0) {
      showBanner("SEM KIT MÉDICO");
      return;
    }
    if (state.hp >= 100) {
      showBanner("INTEGRIDADE CHEIA");
      return;
    }
  } else {
    if (state.shieldPacks <= 0) {
      showBanner("SEM ESCUDO");
      return;
    }
    if (state.shield >= 80) {
      showBanner("ESCUDO CHEIO");
      return;
    }
  }
  state.using = kind;
  state.useDur = kind === "medkit" ? 1.2 : 1.05;
  state.useT = state.useDur;
  state.useApplied = false;
  state.aiming = false;
  state.firing = false;
  while (itemHand.children.length) itemHand.remove(itemHand.children[0]);
  itemHand.add(buildUseItem(kind));
  itemHand.visible = true;
  if (useFx) {
    useFx.className = kind;
    useFx.classList.remove("hidden");
    useFx.style.opacity = "1";
  }
  showBanner(kind === "medkit" ? "APLICANDO KIT..." : "ATIVANDO ESCUDO...");
  updateGearHud();
}

function applyUseItem() {
  if (state.useApplied || !state.using) return;
  state.useApplied = true;
  _v1.copy(player.position);
  _v1.y = EYE * 0.7;
  if (state.using === "medkit") {
    state.medkits = Math.max(0, state.medkits - 1);
    state.hp = Math.min(100, state.hp + 55);
    sfx.kitUse();
    spawnBits(_v1, 0x3dff7a, 4);
    showBanner("INTEGRIDADE +55");
  } else {
    state.shieldPacks = Math.max(0, state.shieldPacks - 1);
    state.shield = Math.min(80, state.shield + 70);
    sfx.shieldUse();
    spawnBits(_v1, 0x4ad4ff, 4);
    showBanner("ESCUDO ATIVO");
  }
  state.iframe = Math.max(state.iframe, 0.45);
  updateGearHud();
}

function endUseItem() {
  if (state.using && !state.useApplied) applyUseItem();
  state.using = null;
  state.useT = 0;
  state.useApplied = false;
  itemHand.visible = false;
  while (itemHand.children.length) itemHand.remove(itemHand.children[0]);
  if (useFx) {
    useFx.style.opacity = "0";
    useFx.classList.add("hidden");
  }
  updateGearHud();
}

function spawnCore(x, z, first = false, locked = false) {
  const group = new THREE.Group();
  group.position.set(x, 1.08, z);
  const scale = first ? 1.15 : 1;
  const cell = cloneAsset("prop_cell", scale, false) || mesh(
    new THREE.CylinderGeometry(0.17 * scale, 0.17 * scale, 0.52 * scale, 12),
    metal(0x1c262e, { roughness: 0.35, metalness: 0.6 })
  );
  const beam = mesh(
    new THREE.CylinderGeometry(0.05, 0.14, 4.4, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x7fffe8, transparent: true, opacity: first ? 0.42 : 0.28, side: THREE.DoubleSide })
  );
  beam.position.y = 2.1;
  beam.castShadow = false;
  const ring = mesh(new THREE.TorusGeometry(0.55 * scale, 0.018, 8, 28), new THREE.MeshBasicMaterial({ color: 0x7fffe8 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.72;
  ring.castShadow = false;
  group.add(cell, beam, ring);
  world.add(group);
  cores.push({ mesh: group, taken: false, baseY: 1.08, locked, cage: locked ? addCage(x, z) : null });
}

function loneMaterial(obj) {
  if (!obj) return null;
  const src = Array.isArray(obj.material) ? obj.material[0] : obj.material;
  if (!src?.clone) return obj;
  obj.material = src.clone();
  return obj;
}

function spawnReactor(x, z, capacity = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = Math.atan2(x, z);
  const glb = cloneAsset("prop_reactor", 1.0, true);
  let band;
  const seats = [];
  if (glb) {
    g.add(glb);
    world.add(g);
    g.updateWorldMatrix(true, true);
    band = loneMaterial(glb.getObjectByName("reactor_band"));
    for (let i = 0; i < 3; i++) {
      const slot = glb.getObjectByName(`reactor_slot_${i}`);
      if (!slot) continue;
      const seat = new THREE.Vector3();
      slot.getWorldPosition(seat);
      g.worldToLocal(seat);
      if (i >= capacity) {
        slot.visible = false;
        g.add(mesh(new THREE.BoxGeometry(0.22, 0.34, 0.06), metal(0x12181e, { roughness: 0.45 }), seat.x, seat.y, seat.z));
        continue;
      }
      seats.push(seat);
    }
  } else {
    const base = mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.3, 10), metal(0x161d24, { roughness: 0.6 }), 0, 0.15, 0);
    const body = mesh(new THREE.CylinderGeometry(0.62, 0.68, 1.9, 10), metal(0x232d36, { roughness: 0.42, metalness: 0.55 }), 0, 1.25, 0);
    band = mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.26, 10), emit(0xb05020, 1.1), 0, 1.72, 0);
    const bay = mesh(new THREE.BoxGeometry(0.46 * capacity + 0.3, 0.5, 0.32), metal(0x1a222b), 0, 1.05, -0.55);
    g.add(base, body, band, bay);
    world.add(g);
    for (let i = 0; i < capacity; i++) {
      const sx = (i - (capacity - 1) / 2) * 0.36;
      seats.push(new THREE.Vector3(sx, 1.02, -0.62));
    }
  }
  const leds = seats.map((seat) =>
    mesh(new THREE.BoxGeometry(0.1, 0.045, 0.025), emit(0x381408, 0.45), seat.x, seat.y + 0.24, seat.z)
  );
  const light = new THREE.PointLight(0xff5030, 1.6, 8);
  light.position.set(0, 1.7, 0);
  const bayLamp = new THREE.PointLight(0xffe6d2, 0.85, 3.2, 2);
  bayLamp.position.set(0, 1.15, -1.35);
  g.add(...leds, light, bayLamp);
  if (!g.parent) world.add(g);
  colliders.push({
    min: new THREE.Vector3(x - 1.05, 0, z - 1.05),
    max: new THREE.Vector3(x + 1.05, 2.3, z + 1.05),
  });
  reactors.push({
    mesh: g,
    leds,
    band,
    light,
    filled: false,
    slots: 0,
    capacity,
    cells: [],
    inserts: [],
    seats,
  });
}

function chargeReactor(r) {
  r.filled = true;
  if (r.band?.material) {
    r.band.material.color.setHex(0x1fd7c4);
    r.band.material.emissive = r.band.material.emissive || new THREE.Color();
    r.band.material.emissive.setHex(0x1fd7c4);
    r.band.material.emissiveIntensity = 1.8;
  }
  r.light.color.setHex(0x66ffe0);
  r.light.intensity = 2.6;
}

function startCellInsert(r, seat, led, onDone) {
  // Berço interno ~0.22 x 0.32. 0.58 deixa a célula dentro do quadrado.
  const cell = cloneAsset("prop_cell", 0.58, false) || mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.26, 10), emit(0x2affd0, 1.4));
  r.mesh.add(cell);
  const end = seat.clone();
  end.z -= 0.03;
  const start = end.clone();
  start.y += 0.42;
  start.z -= 0.36;
  cell.position.copy(start);
  cell.rotation.x = -0.85;
  r.inserts.push({ cell, start, end, led, onDone, t: 0, dur: 0.72, done: false });
  r.cells.push(cell);
}

function tickReactorInserts(r, dt) {
  for (const ins of r.inserts) {
    if (ins.done) continue;
    ins.t += dt / ins.dur;
    const t = Math.min(1, ins.t);
    const slide = t < 0.28 ? (t / 0.28) * 0.22 : 0.22 + (1 - Math.pow(1 - (t - 0.28) / 0.72, 3)) * 0.78;
    ins.cell.position.lerpVectors(ins.start, ins.end, slide);
    ins.cell.rotation.x = -0.85 * (1 - slide);
    if (t < 1) continue;
    ins.done = true;
    ins.cell.position.copy(ins.end);
    ins.cell.rotation.set(0, 0, 0);
    if (ins.led?.material) {
      ins.led.material.color.setHex(0x30ff70);
      ins.led.material.emissive.setHex(0x30ff70);
      ins.led.material.emissiveIntensity = 2.4;
    }
    const spark = ins.end.clone();
    r.mesh.localToWorld(spark);
    spawnBits(spark, 0x7fffe8, 14);
    sfx.deposit();
    ins.onDone?.();
  }
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

function retireAliveEnemies() {
  spawnQ.length = 0;
  for (const e of enemies) {
    e.alive = false;
    e.spawning = false;
    e.carriesCell = false;
    if (e.mesh) e.mesh.visible = false;
    const d = e.deployment;
    if (!d) continue;
    if (d.rig) d.rig.visible = false;
    if (d.cableL) d.cableL.visible = false;
    if (d.cableR) d.cableR.visible = false;
  }
  for (const s of enemyShots) recycle(s.mesh, shotPool);
  enemyShots.length = 0;
}

function spawnReinforcements() {
  let alive = 0;
  for (const e of enemies) if (e.alive) alive += 1;
  const room = 16 - alive;
  if (room <= 0) return;
  const kind = state.phase >= 3 ? "chaser" : "drone";
  const want = Math.min(state.phase >= 3 ? 1 : 2, room);
  const offsets = [
    [5.2, 2.1],
    [-5.2, 2.1],
    [3.4, -4.8],
    [-3.4, -4.8],
  ];
  let queued = 0;
  const px = player.position.x;
  const pz = player.position.z;
  for (const [ox, oz] of offsets) {
    if (queued >= want) break;
    const x = px + ox;
    const z = pz + oz;
    if (wingOf(x, z) !== wingOf(px, pz)) continue;
    if (!inPlayable(x, z)) continue;
    spawnQ.push({ kind, x, z });
    queued += 1;
  }
}

function tickSpawnQ() {
  if (!spawnQ.length || !state.running || state.paused) return;
  for (let n = 0; n < 4 && spawnQ.length; n++) {
    const job = spawnQ.shift();
    if (job.kind === "core") {
      spawnCore(job.x, job.z);
      return;
    }
    if (spawnEnemyNear(job.kind, job.x, job.z)) return;
  }
}

function updateInv() {
  invSlot.textContent = state.carrying ? "BATERIA" : "VAZIA";
  invSlot.classList.toggle("full", state.carrying);
  invSlot.classList.toggle("empty", !state.carrying);
  carryStatus?.classList.toggle("hidden", !state.carrying);
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
  const glb = cloneAsset("prop_generator", 1.0, true);
  let core;
  if (glb) {
    g.add(glb);
    core = mesh(new THREE.OctahedronGeometry(0.28, 0), emit(0xff7a22, 2.2), 0, 1.35, 0);
    g.add(core);
  } else {
    g.add(mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.4, 8), metal(0x2a1810), 0, 0.2, 0));
    core = mesh(new THREE.OctahedronGeometry(0.45, 0), emit(0xff7a22, 2.2), 0, 1.15, 0);
    g.add(core);
    g.add(mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 16), emit(0xff4a18, 1.6), 0, 1.15, 0));
  }
  g.add(new THREE.PointLight(0xff6a22, 2.4, 8));
  world.add(g);
  const col = {
    min: new THREE.Vector3(x - 1.1, 0, z - 1.1),
    max: new THREE.Vector3(x + 1.1, 2.25, z + 1.1),
    noShot: true,
  };
  colliders.push(col);
  props.push({ kind: "gen", mesh: g, col, hp: 8, hpMax: 8, alive: true, core });
}

const deployGeo = {
  panel: new THREE.BoxGeometry(0.68, 0.08, 1.35),
  frameZ: new THREE.BoxGeometry(1.75, 0.11, 0.14),
  frameX: new THREE.BoxGeometry(0.14, 0.11, 1.5),
  warn: new THREE.BoxGeometry(0.16, 0.04, 0.08),
  cable: new THREE.CylinderGeometry(0.014, 0.014, 1, 8),
};
let deployHatchMat;
let deployFrameMat;
let deployWarnMat;
let deployCableMat;

function createDeploymentRig(x, z) {
  if (!deployHatchMat) {
    deployHatchMat = metal(0x141b22, { roughness: 0.3, metalness: 0.9 });
    deployFrameMat = metal(0x303943, { roughness: 0.28, metalness: 0.92 });
    deployWarnMat = emit(0xff6a22, 2.2);
    deployCableMat = metal(0x080a0d, { roughness: 0.4, metalness: 0.95 });
  }
  const rig = new THREE.Group();
  rig.position.set(x, 4.72, z);
  const panelL = mesh(deployGeo.panel, deployHatchMat, -0.35, 0, 0);
  const panelR = mesh(deployGeo.panel, deployHatchMat, 0.35, 0, 0);
  rig.add(
    panelL,
    panelR,
    mesh(deployGeo.frameZ, deployFrameMat, 0, 0.02, -0.75),
    mesh(deployGeo.frameZ, deployFrameMat, 0, 0.02, 0.75),
    mesh(deployGeo.frameX, deployFrameMat, -0.82, 0.02, 0),
    mesh(deployGeo.frameX, deployFrameMat, 0.82, 0.02, 0)
  );
  const warningL = mesh(deployGeo.warn, deployWarnMat, -0.55, -0.08, -0.68);
  const warningR = mesh(deployGeo.warn, deployWarnMat, 0.55, -0.08, -0.68);
  rig.add(warningL, warningR);
  world.add(rig);

  const cableL = mesh(deployGeo.cable, deployCableMat, x - 0.24, 4.65, z);
  const cableR = mesh(deployGeo.cable, deployCableMat, x + 0.24, 4.65, z);
  cableL.visible = cableR.visible = false;
  world.add(cableL, cableR);
  return { rig, panelL, panelR, warningMat: deployWarnMat, cableL, cableR };
}

function stripLights(root) {
  const drop = [];
  root.traverse((o) => {
    if (o.isLight) drop.push(o);
  });
  for (const L of drop) L.parent?.remove(L);
}

function pushEnemy(root, kind, x, z, extra) {
  const glb = cloneAsset(`enemy_${kind}`, 1, false);
  if (glb) {
    const drop = [];
    for (const c of root.children) drop.push(c);
    for (const c of drop) root.remove(c);
    root.add(glb);
    extra.ring = extra.ring || new THREE.Object3D();
    extra.ring2 = extra.ring2 || new THREE.Object3D();
    extra.thrusters = [];
  }
  stripLights(root);
  const deployment = createDeploymentRig(x, z);
  root.position.y = 5.45;
  root.scale.setScalar(1);
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
    spawning: true,
    spawnDelay: 0.18 + (enemies.length % 5) * 0.16,
    spawnProgress: 0,
    spawnStartY: 5.45,
    spawnTargetY: extra.hoverY,
    deployment,
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
    root.add(head, visor, barrel);
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
      shotDmg: 12,
      shotSpeed: 22,
      shotLife: 1.1,
      fireCd: 0.9,
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
    root.add(glow);
    pushEnemy(root, kind, x, z, {
      ring: dummy,
      ring2: dummy,
      visorMat,
      thrusters,
      hp: 3,
      radius: 0.42,
      hoverY: 0.7,
      speed: 2.4,
      chaseSpeed: 5.1,
      range: 12,
      shotDmg: 0,
      shotSpeed: 0,
      shotLife: 0,
      fireCd: 0.82,
      windupTime: 0,
      melee: 1.3,
      meleeDmg: 12,
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
    root.add(b1, b2, ring);
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
    shotDmg: 11,
    shotSpeed: 18,
    shotLife: 1.05,
    fireCd: 1.05,
    windupTime: 0.32,
    melee: 1.45,
    meleeDmg: 8,
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
  gearPickups.length = 0;
  colliders.length = 0;
  gates.length = 0;
  mapLights.length = 0;
  spawnQ.length = 0;
  for (const s of shots) {
    recycle(s.mesh, boltPool);
    shotRecPool.push(s);
  }
  for (const s of enemyShots) {
    recycle(s.mesh, shotPool);
    shotRecPool.push(s);
  }
  for (const b of bits) {
    recycle(b.mesh, bitPool);
    bitRecPool.push(b);
  }
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

function segmentBlocked(ax, ay, az, bx, by, bz, forShot = false) {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  for (let n = 0; n < colliders.length; n++) {
    const c = colliders[n];
    if (forShot && c.noShot) continue;
    let tmin = 0;
    let tmax = 1;
    if (Math.abs(dx) < 1e-8) {
      if (ax < c.min.x || ax > c.max.x) continue;
    } else {
      let t1 = (c.min.x - ax) / dx;
      let t2 = (c.max.x - ax) / dx;
      if (t1 > t2) {
        const s = t1;
        t1 = t2;
        t2 = s;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) continue;
    }
    if (Math.abs(dy) < 1e-8) {
      if (ay < c.min.y || ay > c.max.y) continue;
    } else {
      let t1 = (c.min.y - ay) / dy;
      let t2 = (c.max.y - ay) / dy;
      if (t1 > t2) {
        const s = t1;
        t1 = t2;
        t2 = s;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) continue;
    }
    if (Math.abs(dz) < 1e-8) {
      if (az < c.min.z || az > c.max.z) continue;
    } else {
      let t1 = (c.min.z - az) / dz;
      let t2 = (c.max.z - az) / dz;
      if (t1 > t2) {
        const s = t1;
        t1 = t2;
        t2 = s;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) continue;
    }
    return true;
  }
  return false;
}

function canSee(from) {
  const tx = player.position.x;
  const ty = EYE;
  const tz = player.position.z;
  const dx = tx - from.x;
  const dy = ty - from.y;
  const dz = tz - from.z;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 0.45) return true;
  const inv = 1 / dist;
  return !segmentBlocked(
    from.x + dx * inv * 0.3,
    from.y + dy * inv * 0.3,
    from.z + dz * inv * 0.3,
    tx - dx * inv * 0.25,
    ty - dy * inv * 0.25,
    tz - dz * inv * 0.25
  );
}

function wingOf(x, z) {
  if (x > 13.6) return "east";
  if (x < -13.6) return "west";
  if (z > 13.6) return "south";
  if (z < -13.6) return "north";
  return "hub";
}

function inPlayable(x, z) {
  const ax = Math.abs(x);
  const az = Math.abs(z);
  if (ax < 13.15 && az < 13.15) return true;
  if (x > 13.55 && x < 32.35 && az < 10.35) return true;
  if (x < -13.55 && x > -32.35 && az < 10.35) return true;
  if (z > 13.55 && z < 31.05 && ax < 10.35) return true;
  if (z < -13.55 && z > -31.05 && ax < 10.35) return true;
  if (z > 14.6 && z < 21.1 && ax < 3.35) return true;
  return false;
}

function findOpenSpot(x, z) {
  const y = 1.15;
  const wing = wingOf(x, z);
  for (const r of [0, 1.4, 2.6, 4]) {
    const n = r === 0 ? 1 : 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r;
      const px = x + Math.cos(a) * r;
      const pz = z + Math.sin(a) * r;
      if (wingOf(px, pz) !== wing) continue;
      if (!inPlayable(px, pz)) continue;
      if (pointBlocked(px, y, pz)) continue;
      if (pointBlocked(px + 0.5, y, pz) || pointBlocked(px - 0.5, y, pz)) continue;
      if (pointBlocked(px, y, pz + 0.5) || pointBlocked(px, y, pz - 0.5)) continue;
      return [px, pz];
    }
  }
  return null;
}

function spawnEnemyNear(kind, x, z, carriesCell = false) {
  const spot = findOpenSpot(x, z);
  if (!spot) return false;
  spawnEnemy(kind, spot[0], spot[1], carriesCell);
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
const _see = new THREE.Vector3();
const _body = new THREE.Vector3();
const _hitLocal = new THREE.Vector3();
const damp = THREE.MathUtils.damp;

function movePlayer(dt) {
  if (pressed("KeyQ")) state.lookYaw += 2.2 * dt;
  if (pressed("KeyE")) state.lookYaw -= 2.2 * dt;
  state.lookYaw -= state.mx * 0.00205;
  state.lookPitch = THREE.MathUtils.clamp(state.lookPitch - state.my * 0.00205, -1.25, 1.25);
  state.mx = 0;
  state.my = 0;
  if (isMobilePlay()) {
    state.yaw = state.lookYaw;
    state.pitch = state.lookPitch;
  } else {
    state.yaw = damp(state.yaw, state.lookYaw, 22, dt);
    state.pitch = damp(state.pitch, state.lookPitch, 22, dt);
  }

  const sprint = pressed("ShiftLeft", "ShiftRight");
  const speed = sprint ? 8.4 : 5.5;
  _fwd.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
  _right.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw));
  _wish.set(0, 0, 0);
  if (pressed("KeyW", "ArrowUp")) _wish.add(_fwd);
  if (pressed("KeyS", "ArrowDown")) _wish.sub(_fwd);
  if (pressed("KeyD", "ArrowRight")) _wish.add(_right);
  if (pressed("KeyA", "ArrowLeft")) _wish.sub(_right);
  if (Math.abs(state.touchMoveY) > 0.08) _wish.addScaledVector(_fwd, -state.touchMoveY);
  if (Math.abs(state.touchMoveX) > 0.08) _wish.addScaledVector(_right, state.touchMoveX);
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
  const canAim = state.aiming && !state.reloading && !state.using && sprintAmt !== 1;
  state.aim = damp(state.aim, canAim ? 1 : 0, 13, dt);
  const wantFov = 72 + sprintAmt * 7 - state.aim * 16;
  if (Math.abs(camera.fov - wantFov) > 0.04) {
    camera.fov = damp(camera.fov, wantFov, 4.5, dt);
    camera.updateProjectionMatrix();
  }

  const kick = state.shotKick;
  const reloadPhase = state.reloading ? Math.min(1, 1 - state.reloadT / WEAPONS[state.weapon].reload) : 0;
  const reloadDrop = state.reloading ? Math.sin(reloadPhase * Math.PI) : 0;
  const useDrop = state.using ? 1 : 0;
  const pose = VIEW_POSES[state.weapon];
  const aimPoint = gun.userData.aimPoint || pose.aim;
  gun.position.x = damp(gun.position.x, THREE.MathUtils.lerp(pose.hip.x, aimPoint.x, state.aim) + bobS * 0.014 * (1 - state.aim) + state.swayX * (1 - state.aim * 0.75) + kick * 0.018 + useDrop * 0.28, 18, dt);
  gun.position.y = damp(gun.position.y, THREE.MathUtils.lerp(pose.hip.y, aimPoint.y, state.aim) + Math.abs(bobS) * 0.022 * (1 - state.aim) + state.swayY - state.landKick * 0.45 - kick * 0.045 - reloadDrop * 0.28 - useDrop * 0.55, 18, dt);
  gun.position.z = damp(gun.position.z, THREE.MathUtils.lerp(pose.hip.z, aimPoint.z, state.aim) - sprintAmt * 0.06 + kick * 0.16 + reloadDrop * 0.1 + useDrop * 0.18, 20, dt);
  gun.visible = !state.using;
  if (crosshairEl) crosshairEl.style.opacity = String(1 - state.aim * 0.92);
}

function spawnBits(pos, color, n = 10) {
  if (bits.length >= 18) return;
  const mat = bitMaterial(color);
  const count = Math.min(n, 4, 18 - bits.length);
  for (let i = 0; i < count; i++) {
    const m = takeMesh(bitPool, () => {
      const b = new THREE.Mesh(bitGeo, mat);
      b.castShadow = false;
      b.receiveShadow = false;
      return b;
    });
    m.material = mat;
    m.position.copy(pos);
    const rec = bitRecPool.pop() || { mesh: null, vel: new THREE.Vector3(), life: 0 };
    rec.mesh = m;
    rec.vel.set((Math.random() - 0.5) * 6, Math.random() * 4.5, (Math.random() - 0.5) * 6);
    rec.life = 0.45;
    bits.push(rec);
  }
}

function shoot() {
  if (!state.running || state.paused || state.shootCd > 0 || state.overheat || state.reloading || state.using) return;
  const w = WEAPONS[state.weapon];
  if (state.ammo <= 0) {
    state.shootCd = 0.3;
    sfx.dry();
    startReload();
    return;
  }
  const oc = state.overclock > 0;
  state.shootCd = oc ? w.cd * 0.6 : w.cd;
  state.ammo -= 1;
  tickAmmoHud();
  if (state.ammo <= 0) startReload();
  if (!oc) {
    state.heat = Math.min(100, state.heat + w.heat);
    if (state.heat >= 100) {
      state.overheat = true;
      sfx.overheat();
    }
  }
  sfx.shoot(state.weapon);
  muzzle.intensity = oc ? 4.5 : 3.2;
  const aimControl = THREE.MathUtils.lerp(1, 0.55, state.aim);
  state.shotKick = (state.weapon === "escopeta" ? 1.35 : state.weapon === "rifle" ? 0.72 : 0.9) * aimControl;
  state.shotFlash = state.weapon === "escopeta" ? 0.095 : 0.06;
  gun.rotation.x = -(oc ? w.recoil * 0.75 : w.recoil * 1.15) * aimControl;
  gun.rotation.y = (Math.random() - 0.5) * 0.055;
  gun.rotation.z = (Math.random() - 0.5) * 0.12;
  muzzleFlash.rotation.z = Math.random() * Math.PI;
  muzzleFlash.scale.setScalar(state.weapon === "escopeta" ? 1.55 : state.weapon === "rifle" ? 1.15 : 0.9);
  muzzleFlash.visible = true;
  camera.getWorldPosition(_v1);
  camera.getWorldDirection(_v2);
  _v1.addScaledVector(_v2, 0.55);
  for (let i = 0; i < w.pellets; i++) {
    const rec = shotRecPool.pop() || { dir: new THREE.Vector3() };
    if (!rec.dir) rec.dir = new THREE.Vector3();
    rec.dir.copy(_v2);
    if (w.spread) {
      const spread = w.spread * THREE.MathUtils.lerp(1, 0.32, state.aim);
      rec.dir.x += (Math.random() - 0.5) * spread * 2;
      rec.dir.y += (Math.random() - 0.5) * spread * 2;
      rec.dir.z += (Math.random() - 0.5) * spread * 2;
      rec.dir.normalize();
    }
    const bolt = takeMesh(boltPool, () => {
      const b = new THREE.Mesh(boltGeo, boltMat);
      b.castShadow = false;
      b.receiveShadow = false;
      return b;
    });
    bolt.quaternion.setFromUnitVectors(_upY, rec.dir);
    bolt.position.copy(_v1);
    rec.mesh = bolt;
    rec.life = w.range / w.speed + 0.08;
    rec.dmg = w.dmg;
    rec.speed = w.speed;
    rec.range = w.range;
    rec.falloffStart = w.falloffStart;
    rec.minDamage = w.minDamage;
    rec.traveled = 0;
    shots.push(rec);
  }
}

function enemyShoot(e) {
  _v1.copy(e.mesh.position);
  _v1.y += e.kind === "turret" ? 1.0 : 0.15;
  _v2.set(player.position.x, EYE, player.position.z).sub(_v1).normalize();
  if (segmentBlocked(_v1.x, _v1.y, _v1.z, player.position.x, EYE, player.position.z)) return;
  const bolt = takeMesh(shotPool, () => {
    const b = new THREE.Mesh(enemyBoltGeo, new THREE.MeshBasicMaterial({ color: e.boltColor }));
    b.castShadow = false;
    b.receiveShadow = false;
    return b;
  });
  bolt.material.color.setHex(e.boltColor);
  const s = e.boltSize || 0.08;
  bolt.scale.set(s, s, s);
  bolt.position.copy(_v1).addScaledVector(_v2, 0.28);
  const rec = shotRecPool.pop() || { dir: new THREE.Vector3() };
  if (!rec.dir) rec.dir = new THREE.Vector3();
  rec.mesh = bolt;
  rec.dir.copy(_v2);
  rec.life = e.shotLife;
  rec.speed = e.shotSpeed;
  rec.dmg = e.shotDmg;
  rec.src = e;
  rec.traveled = NaN;
  enemyShots.push(rec);
  sfx.droneShot(e.mesh.position);
}

function stepBolt(s, speed, dt, onMove) {
  const steps = 2;
  const part = (speed * dt) / steps;
  for (let k = 0; k < steps; k++) {
    const ax = s.mesh.position.x;
    const ay = s.mesh.position.y;
    const az = s.mesh.position.z;
    s.mesh.position.addScaledVector(s.dir, part);
    if (Number.isFinite(s.traveled)) {
      s.traveled += part;
      if (s.traveled > s.range) return "range";
    }
    if (segmentBlocked(ax, ay, az, s.mesh.position.x, s.mesh.position.y, s.mesh.position.z, true)) return "wall";
    const r = onMove();
    if (r) return r;
  }
  return null;
}

function shotDamageAtDistance(s) {
  if (s.traveled <= s.falloffStart) return s.dmg;
  const t = THREE.MathUtils.clamp(
    (s.traveled - s.falloffStart) / Math.max(0.01, s.range - s.falloffStart),
    0,
    1
  );
  return s.dmg * THREE.MathUtils.lerp(1, s.minDamage, t);
}

function updateShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.life -= dt;
    const res = stepBolt(s, s.speed, dt, () => {
      const damageNow = shotDamageAtDistance(s);
      const sx = s.mesh.position.x;
      const sy = s.mesh.position.y;
      const sz = s.mesh.position.z;
      for (const p of props) {
        if (!p.alive || !p.col) continue;
        const c = p.col;
        if (sx < c.min.x - 0.35 || sx > c.max.x + 0.35) continue;
        if (sz < c.min.z - 0.35 || sz > c.max.z + 0.35) continue;
        if (sy < 0.2 || sy > c.max.y + 0.5) continue;
        hitGenerator(p, damageNow);
        return "hit";
      }
      for (const e of enemies) {
        if (!e.alive || e.spawning) continue;
        const r = e.radius + 0.55;
        if (s.mesh.position.distanceToSquared(e.mesh.position) < r * r) {
          hitEnemy(e, s.mesh.position, damageNow);
          return "hit";
        }
      }
      return null;
    });
    if (res === "wall") spawnBits(s.mesh.position, 0x9fd8d0, 2);
    if (res || s.life <= 0) {
      recycle(s.mesh, boltPool);
      shots.splice(i, 1);
      shotRecPool.push(s);
    }
  }
  for (let i = enemyShots.length - 1; i >= 0; i--) {
    const s = enemyShots[i];
    s.life -= dt;
    _body.copy(player.position);
    _body.y += EYE * 0.55;
    const res = stepBolt(s, s.speed, dt, () => (s.mesh.position.distanceToSquared(_body) < 0.25 ? "player" : null));
    if (res === "player") {
      damage(s.dmg, s.mesh.position, s.src?.label);
      spawnBits(s.mesh.position, 0xff5a40, 6);
    }
    if (res === "wall") spawnBits(s.mesh.position, 0xff6644, 3);
    if (res || s.life <= 0) {
      recycle(s.mesh, shotPool);
      enemyShots.splice(i, 1);
      shotRecPool.push(s);
    }
  }
}

function showHit(kill, armor = false, critical = false) {
  hitmarker.classList.add("show");
  hitmarker.classList.toggle("kill", !!kill);
  hitmarker.classList.toggle("armor", !!armor);
  hitmarker.classList.toggle("critical", !!critical && !armor);
  if (!armor) sfx.hitmark();
  hitTimer = armor ? 0.08 : 0.12;
}

function isWeakPoint(e, point) {
  if (e.kind !== "heavy") return true;
  _hitLocal.copy(point);
  e.mesh.worldToLocal(_hitLocal);
  return _hitLocal.z > 0.32 && Math.abs(_hitLocal.x) < 0.48 && _hitLocal.y > -0.15 && _hitLocal.y < 0.55;
}

function hitZoneMultiplier(e, point) {
  if (e.kind === "heavy") return 1.35;
  _hitLocal.copy(point);
  e.mesh.worldToLocal(_hitLocal);
  const centerY = e.kind === "turret" ? 0.95 : 0;
  const nx = Math.abs(_hitLocal.x) / Math.max(0.2, e.radius);
  const ny = Math.abs(_hitLocal.y - centerY) / Math.max(0.2, e.radius * 0.9);
  const fromCenter = Math.hypot(nx, ny);
  if (fromCenter <= 0.38) return 1.5;
  if (fromCenter >= 0.82) return 0.7;
  return 1;
}

function hitEnemy(e, point, dmg = 1) {
  if (!isWeakPoint(e, point)) {
    sfx.armor();
    e.mesh.scale.setScalar(1.06);
    showHit(false, true);
    return;
  }
  const zoneMultiplier = hitZoneMultiplier(e, point);
  const finalDamage = dmg * zoneMultiplier;
  e.hp -= finalDamage;
  sfx.droneHit();
  e.mesh.scale.setScalar(1.12);
  const dead = e.hp <= 0;
  showHit(dead, false, zoneMultiplier >= 1.4);
  if (dead) {
    e.alive = false;
    e.mesh.visible = false;
    spawnBits(e.mesh.position, 0xff4028, 4);
    if (e.carriesCell) {
      e.carriesCell = false;
      spawnQ.push({ kind: "core", x: e.mesh.position.x, z: e.mesh.position.z });
      showBanner("CÉLULA RECUPERADA");
    }
    sfx.droneDie();
  }
}

function hitGenerator(p, dmg = 1) {
  p.hp -= dmg;
  sfx.droneHit(p.mesh.position);
  _v1.copy(p.mesh.position);
  _v1.y = 1.15;
  spawnBits(_v1, 0xff8a3a, 4);
  showHit(p.hp <= 0);
  if (p.hp > 0) return;
  p.alive = false;
  retirePickup(p.mesh);
  const i = colliders.indexOf(p.col);
  if (i >= 0) colliders.splice(i, 1);
  spawnBits(p.mesh.position, 0xff6a22, 6);
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
    if (!e.alive || e.spawning || e.kind !== "turret") continue;
    e.alive = false;
    e.mesh.visible = false;
    spawnBits(e.mesh.position, 0xff4028, 4);
  }
}

function damage(amount, fromPos, label) {
  if (state.iframe > 0) return;
  let hpHit = amount;
  if (state.shield > 0) {
    const absorbed = Math.min(state.shield, amount);
    state.shield -= absorbed;
    hpHit = amount - absorbed;
    if (absorbed > 0) sfx.shieldHit();
  }
  state.hp = Math.max(0, state.hp - hpHit);
  state.hurtFlash = hpHit > 0 ? 1 : 0.4;
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
      retirePickup(c.mesh);
      state.carrying = true;
      state.carryingFrom = c;
      sfx.pickup();
      spawnBits(c.mesh.position, 0x7fffe8, 3);
      updateInv();
      showAlert("Célula encontrada. Perigo: robôs ativados.");
      spawnReinforcements();
    }
  }
  for (const r of reactors) {
    tickReactorInserts(r, dt);
    if (r.slots >= r.capacity) continue;
    const d = Math.hypot(r.mesh.position.x - player.position.x, r.mesh.position.z - player.position.z);
    if (d < 2.4) close = true;
    if (d < 1.7 && state.carrying && r.seats[r.slots]) {
      state.carrying = false;
      state.carryingFrom = null;
      const seat = r.seats[r.slots];
      const led = r.leds[r.slots];
      r.slots += 1;
      state.phaseGot += 1;
      state.hp = Math.min(100, state.hp + 8);
      beep(240, 0.07, "triangle", 0.1);
      const finishing = r.slots >= r.capacity;
      const advanceNow = state.phaseGot >= state.phaseNeed;
      startCellInsert(r, seat, led, () => {
        try {
          if (finishing) chargeReactor(r);
        } catch (err) {
          console.warn("reactor charge", err);
        }
        if (advanceNow) nextPhase();
      });
      updateInv();
    }
  }
  if (state.running && state.phase >= 4 && state.phaseGot >= state.phaseNeed) {
    const pending = reactors.some((r) => r.inserts.some((ins) => !ins.done));
    if (!pending) finish(true);
  }
  setText(coreCount, `${state.phaseGot} / ${state.phaseNeed}`);
  let prompt;
  if (blockedByFull) prompt = "Mochila ocupada. Entregue a célula no reator primeiro.";
  else if (state.carrying) prompt = "Encaixe a célula na caixa do reator.";
  else if (cores.some((c) => !c.taken && c.locked)) prompt = "Célula em jaula. Destrua o gerador laranja.";
  else if (enemies.some((e) => e.alive && !e.spawning && e.carriesCell)) prompt = "Derrote o robô portador para obter a célula.";
  else prompt = "Aproxime-se para recolher a célula.";
  setText(nearPrompt, prompt);
  const showNear = close && state.running && !state.paused;
  if (nearPrompt._hide !== !showNear) {
    nearPrompt._hide = !showNear;
    nearPrompt.classList.toggle("hidden", !showNear);
  }
}

function updateEnemyDeployment(e, t, dt) {
  const d = e.deployment;
  if (e.spawnDelay > 0) {
    e.spawnDelay -= dt;
    d.warningMat.emissiveIntensity = 1.4 + Math.sin(t * 14) * 0.8;
    return true;
  }

  e.spawnProgress = Math.min(1, e.spawnProgress + dt / 1.55);
  const p = e.spawnProgress;
  const openIn = 1 - Math.pow(1 - Math.min(1, p / 0.18), 3);
  const closeOut = p < 0.82 ? 1 : 1 - (1 - Math.pow(1 - Math.min(1, (p - 0.82) / 0.18), 3));
  const open = openIn * closeOut;
  d.panelL.position.x = -0.35 - open * 0.7;
  d.panelR.position.x = 0.35 + open * 0.7;
  d.warningMat.emissiveIntensity = 2 + Math.sin(t * 18) * 0.7;

  const descendT = THREE.MathUtils.clamp((p - 0.16) / 0.66, 0, 1);
  const descent = 1 - Math.pow(1 - descendT, 3);
  e.mesh.position.y = THREE.MathUtils.lerp(e.spawnStartY, e.spawnTargetY, descent);

  const cableBottom = e.mesh.position.y + 0.28;
  const cableLength = Math.max(0.04, 4.67 - cableBottom);
  const cablesVisible = descendT > 0 && cableBottom < 4.65;
  for (const cable of [d.cableL, d.cableR]) {
    cable.visible = cablesVisible;
    cable.scale.y = cableLength;
    cable.position.y = 4.67 - cableLength / 2;
  }

  if (p >= 1) {
    e.mesh.position.y = e.spawnTargetY;
    e.mesh.scale.setScalar(1);
    e.spawning = false;
    world.remove(d.rig, d.cableL, d.cableR);
    _v1.set(e.mesh.position.x, Math.max(0.25, e.spawnTargetY), e.mesh.position.z);
    spawnBits(_v1, 0xff8a32, 4);
    sfx.drop();
  }
  return true;
}

function updateEnemies(t, dt) {
  const p = player.position;
  state.grace = Math.max(0, state.grace - dt);
  let nearest = 99;
  let aliveE = 0;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (!e.spawning) aliveE += 1;
    if (e.spawning) {
      updateEnemyDeployment(e, t, dt);
      continue;
    }
    e.mesh.scale.lerp(_one, 10 * dt);
    e.phase += dt;

    const dist = Math.hypot(p.x - e.mesh.position.x, p.z - e.mesh.position.z);
    nearest = Math.min(nearest, dist);
    if (dist > 28) {
      e.attackCd = Math.max(0, e.attackCd - dt);
      continue;
    }

    e.ring.rotation.z += dt * 2.2;
    e.ring2.rotation.y += dt * 2.8;
    for (const th of e.thrusters) th.scale.setScalar(0.85 + Math.sin(t * 14 + e.phase) * 0.15);

    const seeY = e.kind === "turret" ? 1.0 : 0.4;
    _see.copy(e.mesh.position);
    _see.y += seeY;
    const see = canSee(_see);
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
        const mx = (dx / len) * sp;
        const mz = (dz / len) * sp;
        const x0 = e.mesh.position.x;
        const z0 = e.mesh.position.z;
        const y = 1.1;
        if (!segmentBlocked(x0, y, z0, x0 + mx, y, z0 + mz) && inPlayable(x0 + mx, z0 + mz)) {
          e.mesh.position.x = x0 + mx;
          e.mesh.position.z = z0 + mz;
        } else if (!segmentBlocked(x0, y, z0, x0 + mx, y, z0) && inPlayable(x0 + mx, z0)) {
          e.mesh.position.x = x0 + mx;
        } else if (!segmentBlocked(x0, y, z0, x0, y, z0 + mz) && inPlayable(x0, z0 + mz)) {
          e.mesh.position.z = z0 + mz;
        } else {
          const side = Math.sin(e.phase) > 0 ? 1 : -1;
          const sx = -mz * side;
          const sz = mx * side;
          if (!segmentBlocked(x0, y, z0, x0 + sx, y, z0 + sz) && inPlayable(x0 + sx, z0 + sz)) {
            e.mesh.position.x = x0 + sx;
            e.mesh.position.z = z0 + sz;
          }
        }
      }
      resolveRadius(e.mesh.position, e.radius, 0.6);
      if (!inPlayable(e.mesh.position.x, e.mesh.position.z)) {
        e.mesh.position.x = e.home.x;
        e.mesh.position.z = e.home.z;
      }
      if (e.kind !== "turret") e.mesh.position.y = e.hoverY + Math.sin(t * 2.2 + e.phase) * (e.kind === "chaser" ? 0.08 : 0.1);
    }

    let distNow = Math.hypot(p.x - e.mesh.position.x, p.z - e.mesh.position.z);
    const keep = PLAYER_R + e.radius + 0.65;
    if (distNow < keep && distNow > 0.001) {
      const nx = (e.mesh.position.x - p.x) / distNow;
      const nz = (e.mesh.position.z - p.z) / distNow;
      const ox = e.mesh.position.x;
      const oz = e.mesh.position.z;
      const nxPos = p.x + nx * keep;
      const nzPos = p.z + nz * keep;
      if (!segmentBlocked(ox, 1.1, oz, nxPos, 1.1, nzPos)) {
        e.mesh.position.x = nxPos;
        e.mesh.position.z = nzPos;
        resolveRadius(e.mesh.position, e.radius, 0.6);
        distNow = Math.hypot(p.x - e.mesh.position.x, p.z - e.mesh.position.z);
      }
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

    if (e.meleeDmg > 0 && state.grace <= 0 && see && distNow < e.melee + 0.35 && e.attackCd <= 0.15) {
      damage(e.meleeDmg, e.mesh.position, e.label);
      e.attackCd = e.fireCd;
    }
  }
  sfx.hum(nearest);
  state.aliveEnemies = aliveE;

  // separação inimigo-inimigo (não entram um dentro do outro)
  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i];
    if (!a.alive || a.spawning || a.kind === "turret") continue;
    const adx = a.mesh.position.x - p.x;
    const adz = a.mesh.position.z - p.z;
    if (adx * adx + adz * adz > 484) continue;
    for (let j = i + 1; j < enemies.length; j++) {
      const b = enemies[j];
      if (!b.alive || b.spawning || b.kind === "turret") continue;
      const dx = b.mesh.position.x - a.mesh.position.x;
      const dz = b.mesh.position.z - a.mesh.position.z;
      const minD = a.radius + b.radius + 0.25;
      const d = Math.hypot(dx, dz);
      if (d < minD && d > 0.001) {
        const push = (minD - d) / 2;
        const nx = dx / d;
        const nz = dz / d;
        const ax0 = a.mesh.position.x;
        const az0 = a.mesh.position.z;
        const bx0 = b.mesh.position.x;
        const bz0 = b.mesh.position.z;
        const ax1 = ax0 - nx * push;
        const az1 = az0 - nz * push;
        const bx1 = bx0 + nx * push;
        const bz1 = bz0 + nz * push;
        if (!segmentBlocked(ax0, 1.1, az0, ax1, 1.1, az1)) {
          a.mesh.position.x = ax1;
          a.mesh.position.z = az1;
        }
        if (!segmentBlocked(bx0, 1.1, bz0, bx1, 1.1, bz1)) {
          b.mesh.position.x = bx1;
          b.mesh.position.z = bz1;
        }
        resolveRadius(a.mesh.position, a.radius, 0.6);
        resolveRadius(b.mesh.position, b.radius, 0.6);
      }
    }
  }
}

function nearestCarrier() {
  let best = null;
  let bestD = Infinity;
  for (const e of enemies) {
    if (!e.alive || e.spawning || !e.carriesCell) continue;
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
  if (state.hp < 50 && state.medkits <= 0) {
    const kit = nearestGear("medkit");
    if (kit) return { mesh: kit.mesh, kind: "medkit" };
  }
  if (state.hp < 40 && state.shield <= 0 && state.shieldPacks <= 0) {
    const sh = nearestGear("shield");
    if (sh) return { mesh: sh.mesh, kind: "shield" };
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
  const worldPos = _v3.copy(c.mesh.position);
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
  const label =
    c.kind === "gen"
      ? `gerador ${meters}m`
      : c.kind === "reactor"
        ? `reator ${meters}m`
        : c.kind === "weapon"
          ? `arma ${meters}m`
          : c.kind === "carrier"
            ? `portador ${meters}m`
            : c.kind === "medkit"
              ? `kit ${meters}m`
              : c.kind === "shield"
                ? `escudo ${meters}m`
                : `${meters}m`;
  setText(markerDist, label);
  if (meters > 3) {
    guide.visible = true;
    _guideA.set(player.position.x, 0.07, player.position.z);
    _guideB.set(c.mesh.position.x, 0.07, c.mesh.position.z);
    setGuideLine(_guideA.x, _guideA.z, _guideB.x, _guideB.z);
  } else guide.visible = false;
}

function setText(el, v) {
  if (!el || el._txt === v) return;
  el._txt = v;
  el.textContent = v;
}

function setGuideLine(ax, az, bx, bz) {
  const attr = guide.geometry.getAttribute("position");
  if (!attr) return;
  const a = attr.array;
  if (a[0] === ax && a[2] === az && a[3] === bx && a[5] === bz) return;
  a[0] = ax;
  a[1] = 0.07;
  a[2] = az;
  a[3] = bx;
  a[4] = 0.07;
  a[5] = bz;
  attr.needsUpdate = true;
}

function updateLockBanner() {
  const hide = !!document.pointerLockElement || state.paused || !state.running;
  if (lockBanner._hide === hide) return;
  lockBanner._hide = hide;
  lockBanner.classList.toggle("hidden", hide);
}

function updateHudPhase() {
  setText(phaseKicker, `FASE ${state.phase} / 4 — ${PHASE_NAMES[state.phase]}`);
  setText(coreCount, `${state.phaseGot} / ${state.phaseNeed}`);
}

function updateMission() {
  let msg;
  if (state.door && !state.door.open) {
    msg = state.door.opening
      ? "PORTA DE CONTENÇÃO ABRINDO..."
      : "Aproxime-se e clique na porta para iniciar a missão.";
  } else if (!state.moved) {
    msg = "Avance com WASD até o robô portador à frente.";
  } else if (state.carrying) {
    msg = "Leve a célula até o reator-bateria. A linha no piso indica o caminho.";
  } else if (state.ammo <= 0 && state.reserve <= 0 && !state.reloading) {
    msg = "Sem munição. Siga o marcador até uma arma laranja.";
  } else if (state.using) {
    msg = state.using === "medkit" ? "Aplicando kit médico..." : "Ativando escudo de energia...";
  } else if (state.reloading) {
    msg = "Recarregando...";
  } else if (state.hp < 45 && state.medkits <= 0 && nearestGear("medkit")) {
    msg = "Vida baixa. Siga o marcador até um kit médico verde.";
  } else if (state.hp < 40 && state.shield <= 0 && state.shieldPacks <= 0 && nearestGear("shield")) {
    msg = "Pegue um escudo azul no flanco para absorver o próximo hit.";
  } else if (state.medkits > 0 && state.hp < 55) {
    msg = "Vida baixa. Pressione 4 para usar o kit médico.";
  } else if (state.shieldPacks > 0 && state.shield <= 0 && state.hp < 70) {
    msg = "Pressione 5 para ativar o escudo antes do próximo combate.";
  } else if (props.some((p) => p.alive && p.kind === "gen")) {
    msg = "Destrua o gerador laranja, no flanco norte da ala leste.";
  } else if (state.phase === 4 && enemies.some((e) => e.alive && !e.spawning && e.kind === "heavy")) {
    msg = "Mire no visor vermelho da unidade pesada. O casco é blindado.";
  } else if (enemies.some((e) => e.alive && !e.spawning && e.carriesCell)) {
    msg = "Derrote o robô portador. A célula será liberada ao destruí-lo.";
  } else if (state.overclock > 0) {
    msg = `Overclock ${Math.ceil(state.overclock)}s — cadência elevada. A arma não superaquece.`;
  } else {
    msg = PHASE_INFO[state.phase];
  }
  setText(missionText, msg);
}

function showBanner(text) {
  phaseBanner.textContent = text;
  phaseBanner.classList.remove("hidden");
  bannerTimer = 2.3;
}

function updateHpBars() {
  const px = player.position.x;
  const pz = player.position.z;
  const items = [];
  for (const e of enemies) {
    if (!e.alive || e.spawning) continue;
    if (!inPlayable(e.mesh.position.x, e.mesh.position.z)) continue;
    const dx = e.mesh.position.x - px;
    const dz = e.mesh.position.z - pz;
    if (dx * dx + dz * dz > 196) continue;
    _see.copy(e.mesh.position);
    _see.y += 1.05;
    if (!canSee(_see)) continue;
    items.push(e);
  }
  for (const pr of props) {
    if (!pr.alive) continue;
    const dx = pr.mesh.position.x - px;
    const dz = pr.mesh.position.z - pz;
    if (dx * dx + dz * dz > 196) continue;
    items.push(pr);
  }
  while (hpLayer.children.length < items.length) {
    const d = document.createElement("div");
    d.className = "hp-float";
    d.innerHTML = "<i></i>";
    d._fill = d.firstElementChild;
    hpLayer.appendChild(d);
  }
  for (let i = 0; i < hpLayer.children.length; i++) {
    const el = hpLayer.children[i];
    if (i >= items.length) {
      el.classList.add("hidden");
      continue;
    }
    const e = items[i];
    _v1.copy(e.mesh.position);
    _v1.y += e.kind === "turret" ? 1.7 : e.kind === "gen" ? 2.2 : e.kind === "heavy" ? 1.8 : 1.35;
    _v1.project(camera);
    if (_v1.z > 1) {
      el.classList.add("hidden");
      continue;
    }
    el.classList.remove("hidden");
    el.style.transform = `translate(${(_v1.x * 0.5 + 0.5) * innerWidth}px, ${(-_v1.y * 0.5 + 0.5) * innerHeight}px)`;
    const fill = el._fill || (el._fill = el.firstElementChild);
    fill.style.transform = `scaleX(${Math.max(0, e.hp / e.hpMax)})`;
  }
}

function updateFx(dt) {
  state.shootCd = Math.max(0, state.shootCd - dt);
  state.shotKick = THREE.MathUtils.damp(state.shotKick, 0, 18, dt);
  state.shotFlash = Math.max(0, state.shotFlash - dt);
  muzzleFlash.visible = state.shotFlash > 0;
  flashMat.opacity = Math.min(1, state.shotFlash * 18);
  state.iframe = Math.max(0, state.iframe - dt);
  state.overclock = Math.max(0, state.overclock - dt);
  state.heat = Math.max(0, state.heat - (state.overheat ? 24 : 36) * dt);
  if (state.overheat && state.heat <= 18) state.overheat = false;
  if (state.reloading) {
    state.reloadT -= dt;
    const rp = Math.min(1, 1 - state.reloadT / WEAPONS[state.weapon].reload);
    const arc = Math.sin(rp * Math.PI);
    gun.rotation.x = -0.48 * arc;
    gun.rotation.y = 0.42 * arc;
    gun.rotation.z = -0.32 * arc + Math.sin(rp * Math.PI * 2) * 0.06;
    if (state.reloadT <= 0) finishReload();
  }
  if (state.using) {
    state.useT -= dt;
    const p = THREE.MathUtils.clamp(1 - state.useT / state.useDur, 0, 1);
    const rise = Math.min(1, p / 0.22);
    const apply = THREE.MathUtils.smoothstep(p, 0.42, 0.7);
    const away = THREE.MathUtils.clamp((p - 0.8) / 0.2, 0, 1);
    const inject = state.using === "medkit" ? apply : 0;
    const brace = state.using === "shield" ? apply : 0;
    itemHand.visible = true;
    itemHand.position.set(
      0.2 * (1 - inject * 0.9) * (1 - brace * 0.7),
      -0.45 + rise * 0.32 - inject * 0.12 - brace * 0.05 - away * 0.55,
      -0.4 - rise * 0.06 + inject * 0.14 + brace * 0.08 - away * 0.22
    );
    itemHand.rotation.set(
      0.4 - rise * 0.5 - inject * 0.85 + brace * 0.55,
      Math.sin(p * Math.PI) * 0.22,
      (1 - rise) * 0.45 - inject * 0.2 + brace * 0.1
    );
    itemHand.scale.setScalar(0.82 + rise * 0.18 + brace * 0.22 - away * 0.5);
    if (p >= 0.6 && !state.useApplied) applyUseItem();
    if (useFx) useFx.style.opacity = String(Math.max(0, 1 - away) * (0.45 + apply * 0.55));
    if (state.useT <= 0) endUseItem();
  } else if (itemHand.visible) {
    itemHand.visible = false;
  }
  muzzle.intensity = THREE.MathUtils.damp(muzzle.intensity, 0, 10, dt);
  if (!state.reloading && !state.using) {
    gun.rotation.x = THREE.MathUtils.damp(gun.rotation.x, 0, 13, dt);
    gun.rotation.y = THREE.MathUtils.damp(gun.rotation.y, 0, 15, dt);
    gun.rotation.z = THREE.MathUtils.damp(gun.rotation.z, 0, 12, dt);
  }
  state.hurtFlash = Math.max(0, state.hurtFlash - dt * 2.6);
  state.hurtL = Math.max(0, state.hurtL - dt * 2.4);
  state.hurtR = Math.max(0, state.hurtR - dt * 2.4);
  hurt.style.opacity = String(state.hurtFlash * 0.5);
  if (hurtL) hurtL.style.opacity = String(state.hurtL);
  if (hurtR) hurtR.style.opacity = String(state.hurtR);
  if (hpFill._hp !== state.hp) {
    hpFill._hp = state.hp;
    hpFill.style.transform = `scaleX(${state.hp / 100})`;
  }
  if (hpValue) {
    const hpTxt = state.shield > 0
      ? `${Math.max(0, Math.ceil(state.hp))} / 100  ·  ESC ${Math.ceil(state.shield)}`
      : `${Math.max(0, Math.ceil(state.hp))} / 100`;
    setText(hpValue, hpTxt);
  }
  if (shieldFill && shieldFill._sh !== state.shield) {
    shieldFill._sh = state.shield;
    shieldFill.style.transform = `scaleX(${state.shield / 80})`;
  }
  const showGlow = state.shield > 0;
  if (shieldGlow && shieldGlow._on !== showGlow) {
    shieldGlow._on = showGlow;
    shieldGlow.classList.toggle("hidden", !showGlow);
  }
  if (heatFill && heatFill._ht !== state.heat) {
    heatFill._ht = state.heat;
    heatFill.style.transform = `scaleX(${state.heat / 100})`;
  }
  updateLockBanner();
  hitTimer -= dt;
  if (hitTimer <= 0) hitmarker.classList.remove("show", "kill", "armor");
  bannerTimer -= dt;
  if (bannerTimer <= 0) phaseBanner.classList.add("hidden");

  setText(
    enemyCountEl,
    state.door && !state.door.open ? "Setor isolado" : `Inimigos: ${state.aliveEnemies || 0}`
  );

  if (state.timer > 0) {
    state.timer = Math.max(0, state.timer - dt);
    timerLab.classList.remove("hidden");
    timerLab.textContent = `${Math.ceil(state.timer)}s`;
    timerLab.classList.toggle("low", state.timer < 20);
    if (state.timer <= 0 && !state.alarm) {
      state.alarm = true;
      showBanner("TEMPO ESGOTADO");
      sfx.overheat();
    }
  } else if (!state.alarm) timerLab.classList.add("hidden");

  if (state.alarm && state.running) {
    state.alarmT -= dt;
    if (state.alarmT <= 0) {
      state.alarmT = 1.7;
      damage(4, player.position, LABELS.alarm);
    }
  }

  state.beatT -= dt;
  if (state.beatT <= 0 && audio.ctx) {
    const bpm = 68 + state.phase * 16 + (state.timer > 0 && state.timer < 20 ? 22 : 0);
    state.beatT = 60 / bpm;
    sfx.beat(state.phase);
  }
  if (audio.pulseGain && audio.ctx && (state._hudF || 0) % 8 === 0) {
    const t = audio.ctx.currentTime;
    audio.pulseGain.gain.setTargetAtTime(0.03 + state.phase * 0.012 + (state.overclock > 0 ? 0.02 : 0), t, 0.15);
  }
  if (audio.alarmGain && audio.ctx && (state._hudF || 0) % 8 === 0) {
    audio.alarmGain.gain.setTargetAtTime(state.alarm ? 0.035 : 0, audio.ctx.currentTime, 0.1);
  }

  for (const p of props) {
    if (p.alive && p.core) p.core.rotation.y += dt * 2.4;
  }
  if ((state._hudN || 0) !== (performance.now() / 90 | 0)) {
    state._hudN = performance.now() / 90 | 0;
    updateHpBars();
  }

  for (let i = bits.length - 1; i >= 0; i--) {
    const b = bits[i];
    b.life -= dt;
    b.vel.y -= 10 * dt;
    b.mesh.position.addScaledVector(b.vel, dt);
    if (b.life <= 0) {
      recycle(b.mesh, bitPool);
      bits.splice(i, 1);
      bitRecPool.push(b);
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
    if (!isMobilePlay()) canvas.requestPointerLock?.();
  }
  updateLockBanner();
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
  gun.position.copy(VIEW_POSES.pistola.hip);
  state.shootCd = 0;
  state.shotKick = 0;
  state.shotFlash = 0;
  state.aiming = false;
  state.aim = 0;
  state.firing = false;
  state.touchMoveX = 0;
  state.touchMoveY = 0;
  muzzleFlash.visible = false;
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
  state.ownedWeapons = ["pistola"];
  state.weaponAmmo = { pistola: WEAPONS.pistola.mag };
  state.weaponReserve = { pistola: WEAPONS.pistola.reserve, rifle: 0, escopeta: 0 };
  state.ammoGranted = { pistola: true };
  state.weapon = "pistola";
  state.ammo = WEAPONS.pistola.mag;
  state.reserve = WEAPONS.pistola.reserve;
  state.reloading = false;
  state.reloadT = 0;
  state.door = null;
  state.medkits = 0;
  state.shieldPacks = 0;
  state.shield = 0;
  state.using = null;
  state.useT = 0;
  state.useApplied = false;
  itemHand.visible = false;
  while (itemHand.children.length) itemHand.remove(itemHand.children[0]);
  gun.visible = true;
  if (useFx) {
    useFx.style.opacity = "0";
    useFx.classList.add("hidden");
  }
  updateInv();
  updateGearHud();
  setWeapon("pistola", true);
  player.position.set(0, 0, 18);
  pauseScreen.classList.add("hidden");
  alertEl?.classList.add("hidden");
  clearWorld();
  buildWorld();
  warmRenderer();
  updateHudPhase();
}

function warmRenderer() {
  for (let i = 0; i < 12; i++) {
    const bolt = takeMesh(boltPool, () => {
      const b = new THREE.Mesh(boltGeo, boltMat);
      b.castShadow = false;
      b.receiveShadow = false;
      return b;
    });
    recycle(bolt, boltPool);
    const bit = takeMesh(bitPool, () => {
      const b = new THREE.Mesh(bitGeo, bitMaterial(0xff4028));
      b.castShadow = false;
      b.receiveShadow = false;
      return b;
    });
    recycle(bit, bitPool);
  }
  try {
    renderer.compile(scene, camera);
  } catch (err) {
    console.warn("compile", err);
  }
}

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.running && !state.paused) {
    const t = now / 1000;
    movePlayer(dt);
    if (state.firing) shoot();
    updateCores(t, dt);
    updateWeapons(t, dt);
    updateGear(t, dt);
    updateEnemies(t, dt);
    updateSpawnDoor(dt);
    updateShots(dt);
    updateFx(dt);
    tickSpawnQ();
    state._hudF = (state._hudF || 0) + 1;
    if (state._hudF % 2 === 0) {
      updateMarker();
      updateMission();
    }
    if (dust.visible) dust.rotation.y += dt * 0.02;
  } else {
    renderer.render(scene, camera);
    return;
  }
  renderer.render(scene, camera);
}

function start(e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();
  const now = performance.now();
  if (now - (start._t || 0) < 350) return;
  start._t = now;
  try {
    if (btnStart) {
      btnStart.disabled = false;
      btnStart.textContent = "INICIAR";
    }
    if (isMobilePlay()) enterFullscreen();
    initAudio();
    audio.ctx?.resume();
    startAmbience();
    menu.classList.add("hidden");
    endScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    hud.classList.remove("hidden");
    resetGame();
    resizeView();
    if (!isMobilePlay()) canvas.requestPointerLock?.();
  } catch (err) {
    console.warn("start fail", err);
    menu?.classList.add("hidden");
    hud?.classList.remove("hidden");
    state.running = true;
    state.paused = false;
  }
}

function bindStart(el) {
  if (!el) return;
  el.addEventListener("click", start);
  el.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse") return;
    start(e);
  });
  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    start(e);
  });
}
bindStart(btnStart);
bindStart(btnRetry);
menu?.addEventListener("pointerdown", (e) => {
  if (e.target.closest("#btn-start")) start(e);
}, { passive: false });
btnResume.addEventListener("click", () => setPaused(false));

function tryOpenDoor() {
  if (!state.door || state.door.open || state.door.opening) return false;
  const d = player.position.distanceTo(state.door.pos);
  if (d > 4.2) return false;
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = ray.intersectObject(state.door.mesh, true);
  if (hits.length > 0 || d < 3.85) {
    openSpawnDoor();
    return true;
  }
  return false;
}

canvas.addEventListener("mousedown", (e) => {
  if (!state.running || state.paused) return;
  if (e.button !== 0) return;
  if (tryOpenDoor()) {
    if (!isMobilePlay()) canvas.requestPointerLock?.();
    return;
  }
  if (isMobilePlay()) return;
  if (document.pointerLockElement !== canvas) {
    state.dragging = true;
    state.triedLock = true;
    canvas.requestPointerLock();
    return;
  }
  state.firing = true;
  shoot();
});
window.addEventListener("mouseup", (e) => {
  if (e.button === 0) state.firing = false;
  state.dragging = false;
});
document.addEventListener("mousedown", (e) => {
  if (e.button !== 2 || !state.running || state.paused) return;
  e.preventDefault();
  state.aiming = !state.aiming;
});
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement !== canvas) state.firing = false;
  updateLockBanner();
});
window.addEventListener("blur", () => {
  state.firing = false;
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
  const slotWeapon = { Digit1: "pistola", Digit2: "rifle", Digit3: "escopeta" }[e.code];
  if (slotWeapon && state.running && !state.paused && !e.repeat) {
    switchWeapon(slotWeapon);
    return;
  }
  if (e.code === "Digit4" && state.running && !state.paused && !e.repeat) {
    startUseItem("medkit");
    return;
  }
  if (e.code === "Digit5" && state.running && !state.paused && !e.repeat) {
    startUseItem("shield");
    return;
  }
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
  if (state.running && !state.paused && e.code === "KeyR") startReload();
});
document.addEventListener("keyup", (e) => {
  KEYS[e.code] = false;
});

for (const button of gearButtons) {
  button.addEventListener("click", () => {
    if (!state.running || state.paused) return;
    startUseItem(button.dataset.gear);
    if (!isMobilePlay()) canvas.requestPointerLock?.();
  });
}

for (const button of hotbarButtons) {
  button.addEventListener("click", () => {
    if (!state.running || state.paused) return;
    switchWeapon(button.dataset.weapon);
    if (!isMobilePlay()) canvas.requestPointerLock?.();
  });
}

const LOOK_SENS = 2.8;
const touchPtrs = new Map();

function hitStick(x, y) {
  if (!touchStick) return false;
  const r = touchStick.getBoundingClientRect();
  const pad = 28;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const rad = Math.max(r.width, r.height) * 0.5 + pad;
  return Math.hypot(x - cx, y - cy) <= rad;
}

function hitUi(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return false;
  return !!(el.closest && el.closest("#mobile-controls button, .weapon-hotbar, .inv, #btn-start, #btn-resume, #btn-retry"));
}

function applyStick(x, y) {
  if (!touchStick) return;
  const r = touchStick.getBoundingClientRect();
  let sx = (x - (r.left + r.width / 2)) / (r.width * 0.36);
  let sy = (y - (r.top + r.height / 2)) / (r.height * 0.36);
  const len = Math.hypot(sx, sy);
  if (len > 1) {
    sx /= len;
    sy /= len;
  }
  state.touchMoveX = sx;
  state.touchMoveY = sy;
  if (touchKnob) touchKnob.style.transform = `translate(${sx * 34}px, ${sy * 34}px)`;
}

function clearStick() {
  state.touchMoveX = 0;
  state.touchMoveY = 0;
  if (touchKnob) touchKnob.style.transform = "";
}

function hasKind(kind) {
  for (const p of touchPtrs.values()) if (p.kind === kind) return true;
  return false;
}

function onPlayPointerDown(e) {
  if (!isMobilePlay() || !state.running || state.paused) return;
  if (e.pointerType === "mouse") return;
  if (touchPtrs.has(e.pointerId)) return;
  if (hitUi(e.clientX, e.clientY) && !hitStick(e.clientX, e.clientY)) return;
  let kind = hitStick(e.clientX, e.clientY) ? "stick" : "look";
  if (kind === "stick" && hasKind("stick")) kind = "look";
  if (kind === "look" && hasKind("look")) return;
  touchPtrs.set(e.pointerId, { kind, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
  if (kind === "stick") applyStick(e.clientX, e.clientY);
  if (kind === "look") tryOpenDoor();
  e.preventDefault();
}

function onPlayPointerMove(e) {
  const p = touchPtrs.get(e.pointerId);
  if (!p) return;
  if (p.kind === "stick") {
    applyStick(e.clientX, e.clientY);
  } else {
    state.mx += (e.clientX - p.x) * LOOK_SENS;
    state.my += (e.clientY - p.y) * LOOK_SENS;
    p.x = e.clientX;
    p.y = e.clientY;
  }
}

function onPlayPointerUp(e) {
  const p = touchPtrs.get(e.pointerId);
  if (!p) return;
  touchPtrs.delete(e.pointerId);
  if (p.kind === "stick" && !hasKind("stick")) clearStick();
  if (p.kind === "look" && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 14) tryOpenDoor();
}

function bindPlayTouch() {
  const opts = { passive: false };
  touchLook?.addEventListener("pointerdown", onPlayPointerDown, opts);
  touchStick?.addEventListener("pointerdown", onPlayPointerDown, opts);
  window.addEventListener("pointermove", onPlayPointerMove, { passive: true });
  window.addEventListener("pointerup", onPlayPointerUp);
  window.addEventListener("pointercancel", onPlayPointerUp);
}
bindPlayTouch();

touchFire?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!state.running || state.paused || tryOpenDoor()) return;
  state.firing = true;
  shoot();
});
const releaseTouchFire = () => {
  state.firing = false;
};
touchFire?.addEventListener("pointerup", releaseTouchFire);
touchFire?.addEventListener("pointercancel", releaseTouchFire);
touchAim?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (state.running && !state.paused) state.aiming = !state.aiming;
});
touchReload?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (state.running && !state.paused) startReload();
});
touchJump?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (state.running && !state.paused) state.jumpBuf = 0.14;
});
touchKit?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (state.running && !state.paused) startUseItem("medkit");
});
touchShield?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (state.running && !state.paused) startUseItem("shield");
});

function onViewResize() {
  if (isMobilePlay() && state.running) {
    clearTimeout(onViewResize.t);
    onViewResize.t = setTimeout(resizeView, 150);
    return;
  }
  resizeView();
}
window.addEventListener("resize", onViewResize);
window.visualViewport?.addEventListener("resize", onViewResize);
document.addEventListener("fullscreenchange", onViewResize);
document.addEventListener("webkitfullscreenchange", onViewResize);

buildWorld();
requestAnimationFrame(loop);

window.NEXO_DEBUG = { player, state, colliders, assets };

btnStart.disabled = false;
btnStart.textContent = "INICIAR";
loadAssets()
  .then(() => {
    if (state.running) return;
    clearWorld();
    buildWorld();
    while (gun.children.length) gun.remove(gun.children[0]);
    gun.add(buildGunModel(state.weapon));
  })
  .catch((err) => console.warn("boot fail", err));
