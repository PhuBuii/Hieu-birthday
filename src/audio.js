// Âm thanh: hiệu ứng được tổng hợp ngay trong trình duyệt (Web Audio), không tải tệp ngoài.
// Nhạc: content.audio.bgm (nhạc nền cả thiệp) và content.audio.party (Happy Birthday lúc thổi nến).

let ctx = null;
let master = null;
let sfxGain = null;
let enabled = false;
// Hai bản nhạc: bgm (nhạc nền cả thiệp) và party (Happy Birthday lúc thổi nến). Chỉ một bản phát, đổi bằng playSong().
let bgm = null;
let party = null;
let song = 'bgm';
let bgmBase = 0.35;
let bgmDuck = 1;

function track(src) {
  const a = new Audio(src);
  a.loop = true;
  a.preload = 'none';
  a.volume = 0;
  return a;
}

export function initAudio(cfg) {
  bgmBase = cfg.bgmVolume ?? 0.35;
  if (cfg.bgm) bgm = track(cfg.bgm);
  if (cfg.party) party = track(cfg.party);
  return { sfxVolume: cfg.sfxVolume ?? 0.6 };
}

/** Đổi bản nhạc đang phát: 'bgm' hoặc 'party' (party luôn phát lại từ đầu) */
export function playSong(name) {
  const from = song;
  song = name === 'party' && party ? 'party' : 'bgm';
  if (song === 'party' && from !== 'party' && party) party.currentTime = 0;
  bgmDuck = 1;
  applySong();
}
export function currentSong() { return song; }

function active() { return song === 'party' ? party : bgm; }

function applySong() {
  const on = active();
  for (const a of [bgm, party]) {
    if (!a) continue;
    if (a === on && enabled) {
      a.play().catch(() => {});
      fadeTo(a, Math.min(1, bgmBase * bgmDuck));
    } else if (!a.paused) fadeTo(a, 0, () => a.pause());
  }
}

function fadeTo(a, target, done) {
  const start = a.volume;
  const t0 = performance.now();
  const id = (a._fade = (a._fade || 0) + 1);
  const step = (t) => {
    if (a._fade !== id) return;
    const k = Math.min(1, (t - t0) / 900);
    a.volume = start + (target - start) * k;
    if (k < 1) requestAnimationFrame(step);
    else done?.();
  };
  requestAnimationFrame(step);
}

function ensureCtx(sfxVolume) {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = sfxVolume;
  sfxGain.connect(master);
}

/** Gọi trong sự kiện chạm đầu tiên (trình duyệt điện thoại chặn âm thanh tự phát). */
export function unlockAudio(sfxVolume = 0.6) {
  ensureCtx(sfxVolume);
  if (ctx && ctx.state === 'suspended') ctx.resume();
  setEnabled(true);
}

export function isEnabled() { return enabled; }

export function setEnabled(on) {
  enabled = on;
  if (master && ctx) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.05);
  if (on) applySong();
  else for (const a of [bgm, party]) a?.pause();
}

/** Mức nhạc theo màn: 1 = bình thường, 0.5 = hạ nhỏ, 1.25 = cao trào, 0 = tắt dần */
export function duck(level) {
  bgmDuck = level;
  const a = active();
  if (a && enabled) fadeTo(a, Math.min(1, bgmBase * bgmDuck));
}

// ---------- tổng hợp hiệu ứng ----------
function tone(freq, { type = 'sine', dur = 0.6, vol = 0.3, at = 0, attack = 0.005, glide = 0 } = {}) {
  if (!ctx || !enabled) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(freq * glide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(sfxGain);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise({ dur = 0.3, vol = 0.2, at = 0, filter = 'bandpass', freq = 1200, q = 1, attack = 0.01 } = {}) {
  if (!ctx || !enabled) return;
  const t = ctx.currentTime + at;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = filter; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(sfxGain);
  src.start(t);
}

export const sfx = {
  bell() { // chuông ngân
    [880, 1320, 1760, 2640].forEach((f, i) => tone(f, { dur: 2.2 - i * 0.3, vol: 0.18 / (i + 1), type: 'sine' }));
  },
  smallBell() { tone(1568, { dur: 0.9, vol: 0.1 }); tone(2352, { dur: 0.6, vol: 0.04 }); },
  tick() { tone(2093, { dur: 0.12, vol: 0.035 }); },
  ting() { tone(2637, { dur: 0.5, vol: 0.12 }); tone(3951, { dur: 0.35, vol: 0.06, at: 0.06 }); },
  sparkle() { [1760, 2217, 2637, 3520].forEach((f, i) => tone(f, { dur: 0.35, vol: 0.07, at: i * 0.07 })); },
  crack() { noise({ dur: 0.35, vol: 0.25, freq: 2500, q: 0.7 }); noise({ dur: 0.5, vol: 0.12, freq: 600, q: 0.5, at: 0.05 }); },
  pop() { tone(520, { dur: 0.12, vol: 0.18, type: 'triangle', glide: 1.8 }); },
  bubble() { tone(180 + Math.random() * 160, { dur: 0.09, vol: 0.05, type: 'sine', glide: 2.2 }); },
  rustle() { noise({ dur: 0.6, vol: 0.12, freq: 3800, q: 0.6, attack: 0.08 }); },
  boom() { noise({ dur: 0.9, vol: 0.12, filter: 'lowpass', freq: 380, attack: 0.01 }); noise({ dur: 0.6, vol: 0.03, freq: 5000, q: 0.5, at: 0.15, attack: 0.2 }); },
  brush() { noise({ dur: 0.7, vol: 0.06, freq: 2200, q: 0.4, attack: 0.2 }); },
  shutter() { noise({ dur: 0.05, vol: 0.2, freq: 3000, q: 1 }); noise({ dur: 0.06, vol: 0.15, freq: 2000, q: 1, at: 0.09 }); },
  whoosh() { noise({ dur: 0.5, vol: 0.05, freq: 900, q: 0.6, attack: 0.2 }); },
  blow() { noise({ dur: 0.9, vol: 0.16, filter: 'lowpass', freq: 900, attack: 0.08 }); noise({ dur: 0.7, vol: 0.05, freq: 2600, q: 0.4, at: 0.05, attack: 0.1 }); },
  tada() { [523, 659, 784, 1047].forEach((f, i) => tone(f, { dur: 0.9 - i * 0.1, vol: 0.12, type: 'triangle', at: i * 0.09 })); tone(1568, { dur: 1.2, vol: 0.05, at: 0.36 }); },
};
