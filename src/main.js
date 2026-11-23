// Thiệp sinh nhật Kim Hiếu · HAPPY OUR BIRTHDAY - điều phối các màn.
import { Hieu } from "./hieu.js";
import { Phu } from "./phu.js";
import {
  initAudio,
  unlockAudio,
  setEnabled,
  isEnabled,
  duck,
  sfx,
  playSong,
  currentSong,
} from "./audio.js";
import { makeKeepsake } from "./card-maker.js";
import {
  isFill,
  isDraft,
  markTodo,
  placeholder,
  mountTodoPanel,
} from "./todo.js";

const gsap = window.gsap;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $("#app");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const scenes = $$(".scene");
const nextBtn = $(".btn-next");
const sayBox = $("#say");
const fx = $(".fx");

// ?preview: xem thiệp trước giờ mở khóa. ?now=2026-11-30T23:59:50+07:00: giả lập đồng hồ để thử đếm ngược.
const params = new URLSearchParams(location.search);
const PREVIEW = params.has("preview");
const fakeNow = params.get("now")
  ? Date.parse(params.get("now").replace(" ", "+"))
  : NaN;
const clockOffset = Number.isNaN(fakeNow) ? 0 : fakeNow - Date.now();
const now = () => Date.now() + clockOffset;

let C = null;
// Ngôn ngữ: content.json là tiếng Việt; content.en.json chỉ chứa chữ tiếng Anh cùng cấu trúc, ghép đè lên.
// Chọn bằng nút VI/EN (nhớ trong trình duyệt) hoặc gửi link kèm ?lang=en.
const LANGS = ["vi", "en"];
let lang = "vi";
let BASE = null,
  EN = null;
function pickLang() {
  const q = params.get("lang");
  if (LANGS.includes(q)) return q;
  try {
    const s = localStorage.getItem("thiep-lang");
    if (LANGS.includes(s)) return s;
  } catch (e) {}
  return "vi";
}
/** ghép b đè lên a: object ghép theo khóa, mảng ghép theo vị trí (giữ độ dài của a), null = giữ bản tiếng Việt */
function mergeText(a, b) {
  if (b === undefined || b === null) return a;
  if (Array.isArray(a) && Array.isArray(b))
    return a.map((v, i) => (i < b.length ? mergeText(v, b[i]) : v));
  if (
    a &&
    typeof a === "object" &&
    !Array.isArray(a) &&
    typeof b === "object"
  ) {
    const o = { ...a };
    for (const k of Object.keys(b)) o[k] = mergeText(a[k], b[k]);
    return o;
  }
  return b;
}
async function useLang(l) {
  if (l === "en" && !EN) {
    try {
      EN = await (await fetch("content.en.json", { cache: "no-cache" })).json();
    } catch (e) {
      l = "vi";
    }
  }
  lang = l;
  C = l === "en" ? mergeText(BASE, EN) : BASE;
  document.documentElement.lang = l;
}
let hieu = null;
let phu = null;
let current = 0;
let busy = false;
let audioCfg = { sfxVolume: 0.6 };
let sceneCleanup = [];
const state = {};

const get = (path) =>
  path.split(".").reduce((o, k) => (o == null ? o : o[k]), C);
const later = (fn, ms) => {
  const t = setTimeout(fn, ms);
  sceneCleanup.push(() => clearTimeout(t));
  return t;
};
const every = (fn, ms) => {
  const t = setInterval(fn, ms);
  sceneCleanup.push(() => clearInterval(t));
  return t;
};
const rand = (a, b) => a + Math.random() * (b - a);
const COLORS = [
  "#F26A2E",
  "#F5C242",
  "#6E8F7E",
  "#AFC3CE",
  "#F6B3B3",
  "#FFF6EA",
  "#E2475A",
];

// ---------------------------------------------------------------- khởi động
boot();

async function boot() {
  const t0 = performance.now();
  try {
    BASE = await (await fetch("content.json", { cache: "no-cache" })).json();
    await useLang(pickLang());
  } catch (e) {
    $(".loader-text").textContent =
      "Không đọc được content.json. Hãy mở thiệp qua máy chủ web (npm run dev). / Could not load content.json.";
    return;
  }
  document.title = C.meta.title;
  fillTexts();
  audioCfg = initAudio(C.audio || {});

  // hình AI của Hiếu (nếu đã có): assets/hieu/poses.json
  const getJson = (u) =>
    fetch(u, { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  const [poses, phuPoses] = await Promise.all([
    getJson("assets/hieu/poses.json"),
    getJson("assets/phu/poses.json"),
  ]);
  hieu = new Hieu($("#hieu"), { reduced, poses });
  phu = new Phu($("#phu"), { reduced, poses: phuPoses });
  hieu.pose("run").anim("run");
  // đứng sẵn ở đầu thanh tải (không trượt từ giữa màn vào)
  hieu.root.style.transition = "none";
  progress(0);
  void hieu.root.offsetWidth;
  hieu.root.style.removeProperty("transition");
  setDots();
  applyBackgrounds();

  const rig = [
    "arm-l-fore",
    "arm-l-orig",
    "arm-l-upper",
    "arm-r-fore",
    "arm-r-orig",
    "arm-r-upper",
    "blink-l",
    "blink-r",
    "body",
    "hand-l",
    "hand-r",
    "happy-l",
    "happy-r",
    "head",
    "iris-l",
    "iris-r",
    "leg-l",
    "leg-r",
    "lens-cover",
    "mouth-o",
    "mouth-open",
    "side-l",
    "side-r",
  ];
  const deco = [
    "gift",
    "gift-open",
    "sparkle",
    "heart",
    "cake",
    "candle-2",
    "candle-4",
    "flame-1",
    "flame-2",
    "flame-3",
    "hat-orange",
    "hat-mint",
    "popper",
  ];
  const first = [
    ...rig.map((n) => `assets/phu/rig/${n}.webp`),
    ...hieu.files(),
    ...phu.files(),
    ...deco.map((n) => `assets/deco/${n}.webp`),
  ];
  let done = 0;
  await Promise.all(
    first.map((src) =>
      preload(src).finally(() => progress(++done / first.length)),
    ),
  );
  // nền từng màn + ảnh thật: tải dần phía sau
  setTimeout(
    () =>
      ["nen-dem-sao", "nen-ve-dich", "nen-nui", "nen-ho", "nen-tiec"].forEach(
        (n) => preload(`assets/bg/${n}.webp`),
      ),
    300,
  );
  C.scene5.photos.forEach(
    (p) => p.photo && setTimeout(() => preload(p.photo), 1500),
  );

  const jump = +(location.hash.match(/man=(\d)/)?.[1] || 0);
  const wait = jump ? 0 : Math.max(0, 2600 - (performance.now() - t0));
  setTimeout(() => {
    goTo(1);
    if (jump > 1)
      setTimeout(() => {
        busy = false;
        goTo(jump);
      }, 700);
  }, wait);

  bindGlobal();
  if (/[?&]debug/.test(location.search))
    window.__thiep = {
      goTo: (n) => {
        busy = false;
        goTo(n);
      },
      hieu,
      phu,
      state,
    };
}

function preload(src) {
  return new Promise((res) => {
    const i = new Image();
    i.onload = i.onerror = res;
    i.src = src;
  });
}

function progress(k) {
  $(".loader-fill").style.transform = `scaleX(${k})`;
  $(".loader-track").setAttribute("aria-valuenow", Math.round(k * 100));
  $(".loader-km b").textContent = Math.round(k * 24);
  // Hiếu chạy dọc thanh tải
  if (hieu && current === 0) {
    const a = app.getBoundingClientRect(),
      t = $(".loader-track").getBoundingClientRect();
    hieu.moveTo(
      ((t.left - a.left + t.width * k) / a.width) * 100,
      ((a.bottom - t.top) / a.height) * 100 - 0.3,
      15,
    );
  }
}

/** content.json > backgrounds: thay ảnh nền mặc định của màn (để trống = dùng ảnh trong assets/bg) */
function applyBackgrounds() {
  for (const [s, url] of Object.entries(C.backgrounds || {})) {
    const el = $(`.${s} .bg`) || $(`.${s} .summit-view`);
    if (url && el) el.style.backgroundImage = `url("${url}")`;
  }
}

let todoMounted = false;
function fillTexts() {
  const draft = isDraft(C);
  $$("[data-t]").forEach((el) => {
    const v = get(el.dataset.t);
    if (typeof v !== "string") return;
    el.textContent = v;
    el.classList.remove("todo");
    if (isFill(v)) {
      if (draft) markTodo(el, "cần bổ sung");
      else el.hidden = true;
    }
  });
  // nhãn cho trình đọc màn hình
  $$("[data-ta]").forEach((el) => {
    const v = get(el.dataset.ta);
    if (typeof v === "string") el.setAttribute("aria-label", v);
  });
  $$("[data-ta-alt]").forEach((el) => {
    const v = get(el.dataset.taAlt);
    if (typeof v === "string") el.alt = v;
  });
  $$(".cd small").forEach((s, i) => {
    s.textContent = C.scene1.units[i];
  });
  const lb = $(".lang-btn");
  lb.textContent = C.ui.lang;
  lb.lang = lang === "vi" ? "en" : "vi";
  lb.setAttribute("aria-label", C.ui.langLabel);
  const sb = $(".sound-btn");
  sb.setAttribute("aria-label", isEnabled() ? C.ui.soundOff : C.ui.soundOn);
  if (!todoMounted) mountTodoPanel(C, app);
  todoMounted = true;
}

/** Đổi ngôn ngữ ngay tại chỗ: thay chữ rồi chạy lại màn đang xem */
async function switchLang() {
  if (busy) return;
  const to = lang === "vi" ? "en" : "vi";
  await useLang(to);
  try {
    localStorage.setItem("thiep-lang", lang);
  } catch (e) {}
  if (params.has("lang")) {
    params.set("lang", lang);
    history.replaceState(history.state, "", "?" + params + location.hash);
  }
  fillTexts();
  if (current < 1) return;
  sceneCleanup.forEach((f) => f());
  sceneCleanup = [];
  closeModal();
  hideSay();
  showNext(false);
  fx.innerHTML = "";
  app.classList.remove("gift-open");
  hieu.reset();
  hieu.show();
  phu.reset();
  enter[current]?.();
}

function setDots() {
  const ol = $(".dots");
  ol.innerHTML = "";
  for (let i = 1; i <= 8; i++) ol.appendChild(document.createElement("li"));
}

// ---------------------------------------------------------------- điều hướng
const FLOW = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 1 };
const enter = {
  1: enter1,
  2: enter2,
  3: enter3,
  4: enter4,
  5: enter5,
  6: enter6,
  7: enter7,
  8: enter8,
};

let fromHistory = false,
  firstRecord = true;
function recordScene(n) {
  if (fromHistory) return;
  if (firstRecord) {
    firstRecord = false;
    history.replaceState({ man: n }, "");
  } else history.pushState({ man: n }, "");
}
function onHistoryBack(e) {
  const n = e.state?.man;
  if (!n) return;
  if (!$("#modal").hidden) {
    closeModal();
    history.pushState({ man: current }, "");
    return;
  }
  const go = () => {
    if (busy) {
      setTimeout(go, 120);
      return;
    }
    fromHistory = true;
    goTo(n);
    fromHistory = false;
  };
  go();
}

function goTo(n) {
  if (busy || n === current) return;
  busy = true;
  recordScene(n);
  sceneCleanup.forEach((f) => f());
  sceneCleanup = [];
  closeModal();
  hideSay();
  showNext(false);
  fx.innerHTML = "";

  const from = scenes[current];
  const to = scenes[n];
  to.classList.add("is-active");
  from.classList.add("is-leaving");
  from.classList.remove("is-active");
  app.dataset.scene = n;
  // nhạc: Happy Birthday ở màn thổi nến, còn lại là Rainbow
  playSong(n === 7 ? "party" : "bgm");
  app.classList.remove("gift-open");
  hieu.reset();
  hieu.show();
  phu.reset();
  sfx.whoosh();

  const done = () => {
    from.classList.remove("is-leaving");
    gsap.set([from, to], { clearProps: "transform,opacity" });
    busy = false;
  };
  if (reduced) done();
  else {
    gsap
      .timeline({ onComplete: done })
      .fromTo(
        to,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.6, ease: "power3.out" },
        0,
      )
      .to(
        from,
        { xPercent: -25, opacity: 0.3, duration: 0.6, ease: "power3.out" },
        0,
      );
  }
  current = n;
  $$(".dots li").forEach((d, i) => d.classList.toggle("on", i === n - 1));
  enter[n]?.();
  to.setAttribute("tabindex", "-1");
  to.focus({ preventScroll: true });
}

function next() {
  if (!busy) goTo(FLOW[current]);
}

function showNext(on, label) {
  nextBtn.hidden = !on;
  nextBtn.firstChild.textContent = (label || C.ui.next) + " ";
  if (on && !reduced)
    gsap.fromTo(
      nextBtn,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
    );
}

function bindGlobal() {
  nextBtn.addEventListener("click", next);
  addEventListener("popstate", onHistoryBack);
  const sb = $(".sound-btn");
  sb.addEventListener("click", () => {
    if (!isEnabled()) unlockAudio(audioCfg.sfxVolume);
    else setEnabled(false);
    sb.setAttribute("aria-pressed", String(isEnabled()));
    sb.setAttribute("aria-label", isEnabled() ? C.ui.soundOff : C.ui.soundOn);
  });
  $(".lang-btn").addEventListener("click", switchLang);
  // lần chạm đầu tiên vào thiệp: bật âm thanh (trình duyệt điện thoại chặn âm thanh tự phát)
  app.addEventListener("pointerdown", function first(e) {
    if (e.target.closest(".sound-btn")) return;
    app.removeEventListener("pointerdown", first);
    if (!isEnabled()) {
      unlockAudio(audioCfg.sfxVolume);
      sb.setAttribute("aria-pressed", "true");
      sb.setAttribute("aria-label", C.ui.soundOff);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (
      (e.key === "ArrowRight" || e.key === "PageDown") &&
      !nextBtn.hidden &&
      $("#modal").hidden
    )
      next();
  });
  $(".modal-close").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });
  bind1();
  bind2();
  bind3();
  bind4();
  bind5();
  bind6();
  bind7();
  bind8();
  addEventListener("resize", () => {
    if (current === 4) layoutClimb();
  });
}

// ---------------------------------------------------------------- tiện ích chung
// Bóng thoại bám theo người đang nói (Hiếu hoặc Phú)
let sayWho = "hieu";
function placeSay() {
  if (sayBox.hidden) return;
  const target = sayWho === "phu" ? phu.root : hieu.root;
  const a = app.getBoundingClientRect(),
    m = target.getBoundingClientRect();
  const W = a.width,
    H = a.height,
    pad = 10,
    top0 = 60;
  const mx = m.left - a.left,
    my = m.top - a.top,
    mw = m.width,
    mh = m.height,
    cx = mx + mw / 2;
  // nhân vật đứng giữa, hoặc chỉ ló đầu ở mép dưới: bóng thoại nằm phía trên
  // Phú ló đầu ở mép phải phía trên (màn 1): bóng thoại nằm bên trái, ngang mặt
  const corner = target.classList.contains("peek");
  const peeking = !corner && m.bottom - a.bottom > mh * 0.15;
  // hai người cùng đứng (màn 7): bóng thoại nằm trên đầu để không che người kia
  const duo =
    !corner &&
    !phu.root.classList.contains("is-hidden") &&
    !hieu.root.classList.contains("is-hidden") &&
    !peeking;
  let mode = corner
    ? "left"
    : (cx > W * 0.3 && cx < W * 0.7) || peeking || duo
      ? "above"
      : cx <= W * 0.3
        ? "right"
        : "left";
  let sw = 0;
  if (corner) sw = Math.min(270, mx - 16 - pad);
  else if (mode !== "above") {
    const avail =
      mode === "right" ? W - (mx + mw * 0.72) - pad : mx + mw * 0.28 - pad;
    if (avail < 170) mode = "above";
    else sw = Math.min(280, avail);
  }
  if (mode === "above") sw = Math.min(W - pad * 2, 320);
  sayBox.style.width = sw + "px";
  const bh = sayBox.offsetHeight;
  let sx, sy;
  if (mode === "above") {
    sx = Math.max(pad, Math.min(cx - sw / 2, W - pad - sw));
    sy = Math.max(top0, my) - bh - 14;
    if (sy < top0) sy = top0;
    sayBox.style.setProperty(
      "--tail",
      Math.max(22, Math.min(sw - 34, cx - sx - 7)) + "px",
    );
  } else if (corner) {
    // đầu nghiêng vào trong màn: mép phải bóng thoại sát bên trái mặt, giữa bóng ngang mặt
    sx = Math.max(pad, mx - 16 - sw);
    sy = my + mh * 0.16 - bh / 2;
  } else {
    sx = mode === "right" ? mx + mw * 0.72 : mx + mw * 0.28 - sw;
    sy = Math.max(top0, my) + Math.min(mh, H - my) * 0.12 - bh * 0.4;
  }
  sy = Math.max(top0, Math.min(sy, H - bh - pad));
  sayBox.dataset.tail = mode;
  sayBox.style.left = sx + "px";
  sayBox.style.top = sy + "px";
}
let sayRaf = 0;
function followSay() {
  cancelAnimationFrame(sayRaf);
  const loop = () => {
    if (sayBox.hidden) return;
    placeSay();
    sayRaf = requestAnimationFrame(loop);
  };
  loop();
}
function say(text, delay = 0, who = "hieu") {
  later(() => {
    sayWho = who;
    sayBox.querySelector("p").textContent = text;
    sayBox.classList.toggle("todo", isFill(text) && isDraft(C));
    sayBox.hidden = false;
    followSay();
    if (who === "hieu") hieu.talk(Math.min(3600, text.length * 45));
    if (!reduced)
      gsap.fromTo(
        sayBox,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" },
      );
    clearTimeout(say._h);
    say._h = setTimeout(hideSay, Math.max(4200, text.length * 85));
  }, delay);
}
function hideSay() {
  sayBox.hidden = true;
  cancelAnimationFrame(sayRaf);
}

/** Pháo giấy: nổ tại (x%, y%) của thiệp, hoặc rơi từ trên xuống khi rain = true */
function confetti(
  count = 40,
  { x = 50, y = 40, rain = false, spread = 1 } = {},
) {
  if (reduced) return;
  const W = app.clientWidth,
    H = app.clientHeight;
  const n = Math.min(count, 90 - fx.children.length);
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i");
    p.className = "confetti";
    p.style.background = COLORS[i % COLORS.length];
    if (i % 3 === 0) p.style.borderRadius = "50%";
    fx.appendChild(p);
    const sx = rain ? Math.random() * W : (W * x) / 100,
      sy = rain ? -20 : (H * y) / 100;
    gsap.set(p, {
      x: sx,
      y: sy,
      rotation: Math.random() * 360,
      scale: rand(0.7, 1.2),
    });
    if (rain) {
      gsap.to(p, {
        y: H + 30,
        x: sx + rand(-80, 80),
        rotation: "+=" + rand(200, 600),
        duration: rand(2.6, 4.6),
        delay: Math.random() * 1.5,
        ease: "none",
        onComplete: () => p.remove(),
      });
    } else {
      const ang = rand(-Math.PI, 0),
        v = rand(120, 300) * spread;
      gsap
        .timeline({ onComplete: () => p.remove() })
        .to(p, {
          x: sx + Math.cos(ang) * v * 1.3,
          y: sy + Math.sin(ang) * v,
          rotation: "+=" + rand(180, 540),
          duration: rand(0.5, 0.8),
          ease: "power2.out",
        })
        .to(p, {
          y: H + 30,
          x: "+=" + rand(-60, 60),
          rotation: "+=" + rand(180, 360),
          duration: rand(1.6, 2.6),
          ease: "power1.in",
        });
    }
  }
}
function balloons(count = 6) {
  if (reduced) return;
  const W = app.clientWidth,
    H = app.clientHeight;
  for (let i = 0; i < count; i++) {
    const b = document.createElement("div");
    b.className = "balloon";
    const c = ["#F26A2E", "#FFF6EA", "#6FC2A6", "#F5C242", "#F6B3B3"][i % 5];
    b.innerHTML = `<svg viewBox="0 0 46 90"><path d="M23 54 q-3 12 2 20 q-5 8 0 16" fill="none" stroke="#3A2A20" stroke-width="2"/><ellipse cx="23" cy="26" rx="20" ry="24" fill="${c}" stroke="#3A2A20" stroke-width="3"/><path d="M19 50 h8 l-4 6z" fill="${c}" stroke="#3A2A20" stroke-width="2.5"/><ellipse cx="15" cy="16" rx="4" ry="7" fill="#fff" opacity=".6"/></svg>`;
    // bay phía sau nhân vật (gắn vào màn hiện tại, không vào lớp hiệu ứng trên cùng)
    scenes[current].appendChild(b);
    const sx = rand(0.05, 0.9) * W;
    gsap.set(b, { x: sx, y: H + 20, scale: rand(0.8, 1.3) });
    gsap.to(b, {
      y: -140,
      x: sx + rand(-40, 40),
      duration: rand(5, 8),
      delay: i * 0.35,
      ease: "none",
      onComplete: () => b.remove(),
    });
    gsap.to(b, {
      rotation: rand(-10, 10),
      duration: 1.2,
      repeat: 6,
      yoyo: true,
      ease: "sine.inOut",
    });
  }
}

/** Điểm (x, y) tính theo tỉ lệ khung ảnh nhân vật hiện tại -> tọa độ px trong thiệp */
function charPoint(fx_ = 0.5, fy = 0.3, who = hieu) {
  const a = app.getBoundingClientRect();
  const el =
    who === hieu && hieu.curBox && !hieu.curBox.hidden ? hieu.curBox : who.root;
  const r = el.getBoundingClientRect();
  return {
    x: r.left - a.left + r.width * fx_,
    y: r.top - a.top + r.height * fy,
  };
}
/** Vòng lấp lánh (ảnh sparkle) tỏa ra từ một điểm */
function sparkles(x, y, n = 8, radius = 90) {
  if (reduced) return;
  for (let i = 0; i < n; i++) {
    const s = new Image();
    s.src = "assets/deco/sparkle.webp";
    s.className = "spark";
    fx.appendChild(s);
    const ang = (i / n) * Math.PI * 2 + rand(-0.3, 0.3),
      d = radius * rand(0.7, 1.2);
    gsap
      .timeline({ onComplete: () => s.remove() })
      .fromTo(
        s,
        { x, y, scale: 0.2, opacity: 1, rotation: 0 },
        {
          x: x + Math.cos(ang) * d,
          y: y + Math.sin(ang) * d,
          scale: rand(0.7, 1.2),
          rotation: rand(-90, 90),
          duration: 0.6,
          ease: "power2.out",
        },
      )
      .to(
        s,
        { scale: 0, opacity: 0, duration: 0.35, ease: "power1.in" },
        "+=0.1",
      );
  }
}
/** Lấp lánh tại chỗ (không tỏa ra), dùng cho huy chương */
function glint(x, y, n = 3) {
  if (reduced) return;
  for (let i = 0; i < n; i++) {
    const s = new Image();
    s.src = "assets/deco/sparkle.webp";
    s.className = "medal-glint";
    fx.appendChild(s);
    gsap
      .timeline({ delay: i * 0.22, onComplete: () => s.remove() })
      .fromTo(
        s,
        { x: x + rand(-26, 26), y: y + rand(-22, 22), scale: 0, rotation: 0 },
        {
          scale: rand(0.8, 1.3),
          rotation: 45,
          duration: 0.3,
          ease: "back.out(2)",
        },
      )
      .to(s, { scale: 0, rotation: 90, duration: 0.3, ease: "power1.in" });
  }
}
/** Trái tim bay lên từ một điểm */
function hearts(x, y, n = 5) {
  if (reduced) return;
  for (let i = 0; i < n; i++) {
    const h = new Image();
    h.src = "assets/deco/heart.webp";
    h.className = "spark";
    fx.appendChild(h);
    gsap
      .timeline({ delay: i * 0.25, onComplete: () => h.remove() })
      .fromTo(
        h,
        { x: x + rand(-20, 20), y, scale: 0.2, opacity: 1 },
        {
          y: y - rand(110, 170),
          x: `+=${rand(-50, 50)}`,
          scale: rand(0.7, 1.1),
          duration: 1.6,
          ease: "power1.out",
        },
      )
      .to(h, { opacity: 0, duration: 0.4 }, "-=0.4");
  }
}

function openModal({ title = "", text = "", node = null, actions = [] }) {
  $("#modal-title").textContent = title;
  $(".modal-text").textContent = text;
  const ph = $(".modal-photo");
  ph.innerHTML = "";
  if (node) ph.appendChild(node);
  const box = $(".modal-actions");
  box.innerHTML = "";
  actions.forEach((a) => box.appendChild(a));
  $("#modal").hidden = false;
  $(".modal-close").focus();
}
function closeModal() {
  $("#modal").hidden = true;
}

function toast(msg) {
  const t = $(".toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._h);
  toast._h = setTimeout(() => {
    t.hidden = true;
  }, 2600);
}

function photoNode(p, i) {
  const ph = document.createElement("div");
  ph.className = "ph";
  if (p.photo) {
    const img = new Image();
    img.src = p.photo;
    img.alt = p.alt || p.caption || `${C.ui.photo} ${i + 1}`;
    ph.appendChild(img);
  } else if (isDraft(C)) {
    ph.appendChild(placeholder(`Ảnh ${i + 1} (scene5.photos.${i}.photo)`));
  }
  return ph;
}
function captionNode(p) {
  const fc = document.createElement("figcaption");
  fc.textContent = p.caption;
  if (isFill(p.caption)) {
    if (isDraft(C)) markTodo(fc, "chú thích");
    else fc.hidden = true;
  }
  return fc;
}

// ---------------------------------------------------------------- màn 1: khóa giờ + hộp quà
const unlockTime = () => Date.parse(C.unlockAt);
function isLocked() {
  return !PREVIEW && now() < unlockTime();
}

function enter1() {
  const s = $(".s1");
  s.classList.remove("opened");
  gsap.set([".gift", ".gift-lid", ".gift-body", ".gift-glow"], {
    clearProps: "all",
  });
  hieu.root.classList.remove("in-box");
  duck(0.8);
  // muốn xem thử màn khóa: mở link KHÔNG có ?preview (hoặc thêm ?now=2026-11-30T23:59:50+07:00)
  if (isLocked()) {
    $(".lock").hidden = false;
    $(".gift-wrap").hidden = true;
    hieu.pose("pout").feel("pout");
    say(C.scene1.lockedSay, 700);
    // phụng phịu: thở phì phò, giậm chân
    every(() => {
      if (reduced || !$(".gift-wrap").hidden) return;
      const p = charPoint(0.5, 0.27);
      [-1, 1].forEach((side) => {
        const el = document.createElement("i");
        el.className = "puff";
        fx.appendChild(el);
        gsap.fromTo(
          el,
          { x: p.x + side * 26, y: p.y, scale: 0.3, opacity: 0.95 },
          {
            x: p.x + side * rand(60, 80),
            y: p.y - rand(4, 24),
            scale: rand(1, 1.5),
            opacity: 0,
            duration: 0.9,
            ease: "power2.out",
            onComplete: () => el.remove(),
          },
        );
      });
      gsap
        .timeline()
        .to(hieu.rig, { scaleY: 0.95, scaleX: 1.03, duration: 0.1 })
        .to(hieu.rig, {
          scaleY: 1,
          scaleX: 1,
          duration: 0.4,
          ease: "elastic.out(1, .4)",
        });
    }, 2600);
    const tick = () => {
      const left = Math.max(0, unlockTime() - now());
      const d = Math.floor(left / 864e5),
        h = Math.floor(left / 36e5) % 24,
        m = Math.floor(left / 6e4) % 60,
        sec = Math.floor(left / 1e3) % 60;
      const set = (k, v) => {
        $(`[data-cd="${k}"]`).textContent = String(v).padStart(2, "0");
      };
      set("d", d);
      set("h", h);
      set("m", m);
      set("s", sec);
      if (left <= 0) {
        clearInterval(t);
        unlockNow();
      }
    };
    const t = every(tick, 1000);
    tick();
  } else {
    $(".lock").hidden = true;
    startGift();
  }
}
function unlockNow() {
  sfx.bell();
  confetti(50, { x: 50, y: 35 });
  hieu.pose("surprised").feel("surprised");
  hieu.hop(2);
  later(() => {
    $(".lock").hidden = true;
    startGift();
  }, 1400);
}
function startGift() {
  hideSay();
  hieu.hide(true);
  state.taps = 0;
  state.giftOpen = false;
  $(".gift-wrap").hidden = false;
  $$(".taps li").forEach((li) => li.classList.remove("on"));
  if (!reduced)
    gsap.fromTo(
      ".gift",
      { y: -120, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "bounce.out" },
    );
  // hộp tự rung nhẹ như có gì bên trong
  every(() => {
    if (state.giftOpen || reduced) return;
    gsap
      .timeline()
      .to(".gift", { rotation: -4, duration: 0.07 })
      .to(".gift", { rotation: 4, duration: 0.07, repeat: 3, yoyo: true })
      .to(".gift", { rotation: 0, duration: 0.3, ease: "elastic.out(1, .3)" });
  }, 2400);
}
function bind1() {
  $(".gift").addEventListener("click", () => {
    if (state.giftOpen || current !== 1) return;
    state.taps++;
    $$(".taps li").forEach((li, i) =>
      li.classList.toggle("on", i < state.taps),
    );
    sfx.pop();
    if (!reduced) {
      // nén xuống, bật lên, phồng to dần theo số lần chạm
      const k = 1 + state.taps * 0.05;
      gsap
        .timeline()
        .to(".gift", {
          scaleX: k * 1.1,
          scaleY: k * 0.86,
          rotation: 0,
          duration: 0.08,
          ease: "power2.out",
        })
        .to(".gift", {
          scaleX: k * 0.94,
          scaleY: k * 1.1,
          y: -18,
          rotation: state.taps % 2 ? 6 : -6,
          duration: 0.14,
          ease: "power2.out",
        })
        .to(".gift", {
          scaleX: k,
          scaleY: k,
          y: 0,
          rotation: 0,
          duration: 0.5,
          ease: "elastic.out(1, .4)",
        });
      gsap.to(".gift-glow", {
        opacity: state.taps * 0.22,
        scale: 0.6 + state.taps * 0.12,
        duration: 0.4,
      });
    }
    if (state.taps >= 3) openGift();
  });
}
function openGift() {
  state.giftOpen = true;
  sfx.sparkle();
  const s = $(".s1");
  const gift = $(".gift");
  hieu.pose("surprised").feel("surprised");
  if (reduced) {
    s.classList.add("opened");
    app.classList.add("gift-open");
    hieu.show();
  } else {
    // cỡ hộp lúc chạm lần 3 (1 + 3 × 0.05), dừng nhịp nảy của lần chạm để đo đúng miệng hộp
    const k = 1.15;
    gsap.killTweensOf(gift);
    gsap.set(gift, {
      scaleX: k,
      scaleY: k,
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
    });
    const g = gift.getBoundingClientRect(),
      a = app.getBoundingClientRect();
    // miệng hộp (mép trước thân hộp): giữa ngang 47% khung, cao 50% khung tính từ đáy
    const mx = g.left - a.left + g.width * 0.47,
      my = g.bottom - a.top - g.height * 0.5;
    sparkles(mx, my, 10, 80);
    confetti(60, { x: (mx / a.width) * 100, y: (my / a.height) * 100 });

    // 1. thân hộp nén xuống rồi nảy, nắp bật tung: bay lên, xoay, mờ dần
    gsap
      .timeline()
      .to(gift, {
        scaleX: k * 1.08,
        scaleY: k * 0.9,
        duration: 0.1,
        ease: "power2.in",
      })
      .to(gift, {
        scaleX: k,
        scaleY: k,
        duration: 0.5,
        ease: "elastic.out(1, .4)",
      });
    gsap.to(".gift-lid", {
      y: "-80%",
      x: "24%",
      rotation: 34,
      opacity: 0,
      duration: 0.75,
      ease: "power2.out",
      delay: 0.06,
    });
    gsap.fromTo(
      ".gift-glow",
      { opacity: 1, scale: 0.8 },
      { opacity: 0, scale: 1.7, duration: 1.3, ease: "power2.out", delay: 0.1 },
    );

    // 2. Hiếu trồi lên từ trong hộp: phần dưới miệng hộp bị cắt nên như khuất sau thành trước
    const r = hieu.root;
    later(() => {
      r.style.transition = "none";
      hieu.moveTo(
        (mx / a.width) * 100,
        ((a.height - my) / a.height) * 100,
        (g.height / a.height) * 100 * 0.62,
      );
      r.classList.add("in-box");
      hieu.show();
      void r.offsetWidth;
      gsap.fromTo(
        hieu.rig,
        { y: "85%", rotation: 0, scaleX: 1, scaleY: 1 },
        { y: "-14%", duration: 0.42, ease: "power2.out" },
      );
    }, 200);

    // 3. bật ra khỏi hộp theo đường cong, to dần, đáp xuống; hộp trượt về góc trái dưới
    later(() => {
      r.classList.remove("in-box");
      r.style.transition =
        "transform .85s cubic-bezier(.25,.6,.35,1), height .85s cubic-bezier(.25,.6,.35,1)";
      app.classList.add("gift-open");
      hieu.moveTo();
      gsap
        .timeline()
        .to(hieu.rig, {
          y: "-42%",
          rotation: 6,
          duration: 0.4,
          ease: "power1.out",
        })
        .to(hieu.rig, { y: 0, rotation: 0, duration: 0.42, ease: "power2.in" })
        .to(hieu.rig, { scaleX: 1.1, scaleY: 0.88, duration: 0.09 })
        .to(hieu.rig, {
          scaleX: 1,
          scaleY: 1,
          duration: 0.45,
          ease: "elastic.out(1, .4)",
        });
      // đổi chỗ hộp (góc trái dưới, nhỏ hơn) rồi trượt từ chỗ cũ sang
      gsap.killTweensOf(gift);
      const before = gift.getBoundingClientRect();
      gsap.set(gift, { clearProps: "transform" });
      s.classList.add("opened");
      const after = gift.getBoundingClientRect();
      gsap.fromTo(
        gift,
        {
          x: before.left + before.width / 2 - (after.left + after.width / 2),
          y: before.bottom - after.bottom,
          scale: before.width / after.width,
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.inOut",
          delay: 0.15,
        },
      );
      later(() => r.style.removeProperty("transition"), 1000);
    }, 640);
  }
  // thứ tự thoại: Hiếu hỏi "ai gọi?" → Phú ló đầu trả lời → Hiếu vẫy tay "biết rồi nha!"
  say(C.scene1.lines[0], 1400);
  later(() => {
    hieu.pose("idle").feel("surprised");
    // đặt sẵn ở góc (không trượt từ giữa màn sang), rồi mới hiện
    const pr = phu.root;
    pr.style.transition = "none";
    pr.classList.add("peek");
    void pr.offsetWidth;
    pr.style.removeProperty("transition");
    phu.show();
    phu.wave(2400);
    if (!reduced)
      gsap.fromTo(
        phu.rig,
        { x: "70%" },
        { x: 0, duration: 0.7, ease: "back.out(1.8)" },
      );
  }, 3800);
  say(C.scene1.phuPeek, 4100, "phu");
  later(() => {
    hieu.pose("wave").feel("happy");
    hieu.hop(1);
  }, 7300);
  say(C.scene1.lines[1], 7400);
  later(() => showNext(true, C.ui.toProfile), 9200);
  sceneCleanup.push(() => phu.root.classList.remove("peek"));
}

// ---------------------------------------------------------------- màn 2: nối chòm Nhân Mã
// Chòm Nhân Mã thật. Tọa độ J2000 lấy từ Wikipedia (List of stars in Sagittarius), chiếu gnomonic
// vào khung 100 × 100 (python -I tools/sgr_proj.py), phía đông bên trái như khi ngẩng lên trời.
// m: cấp sao (số càng nhỏ càng sáng) -> cỡ chấm. Thứ tự chạm đi vòng "ấm trà":
// γ (đầu mũi tên) → δ (tâm cây cung) → λ (nắp) → φ → σ → τ (quai) → ζ → ε (sáng nhất) → về γ.
const STARS = [
  { id: "γ²", name: "Alnasl", x: 87.5, y: 58.6, m: 2.98 },
  { id: "δ", name: "Kaus Media", x: 69.2, y: 54.3, m: 2.72 },
  { id: "λ", name: "Kaus Borealis", x: 61.2, y: 29.3, m: 2.82 },
  { id: "φ", name: "Nandou", x: 38.9, y: 38.1, m: 3.17 },
  { id: "σ", name: "Nunki", x: 26.7, y: 34.5, m: 2.05 },
  { id: "τ", name: "τ Sgr", x: 12.5, y: 43.0, m: 3.32 },
  { id: "ζ", name: "Ascella", x: 18.6, y: 55.1, m: 2.6 },
  { id: "ε", name: "Kaus Australis", x: 64.6, y: 79.7, m: 1.85 },
];
// đủ 11 nét ấm trà: thân δ-ε-ζ-φ, nắp λ, quai σ-τ, vòi γ
const EXTRA_LINES = [
  [7, 0],
  [1, 3],
  [1, 7],
  [3, 6],
];
// các sao khác của chòm (mờ, không chạm): μ, π, ξ², ο ở đầu người bắn cung, η dưới chân
const BG_STARS = [
  { x: 80.6, y: 5.0, m: 3.84 },
  { x: 6.2, y: 5.3, m: 2.88 },
  { x: 22.3, y: 5.1, m: 3.52 },
  { x: 13.2, y: 9.1, m: 3.76 },
  { x: 71.7, y: 93.5, m: 3.1 },
];
const starSize = (m) => Math.round(26 - 5 * m);
function enter2() {
  const box = $(".con-stars");
  const lines = $(".con-lines");
  box.innerHTML = "";
  lines.innerHTML = "";
  $(".constellation").classList.remove("complete", "revealed");
  gsap.set(".constellation", { clearProps: "filter" });
  $(".profile").hidden = true;
  state.star = 0;
  BG_STARS.forEach(({ x, y, m }) => {
    const s = document.createElement("i");
    s.className = "bg-star";
    s.style.cssText = `left:${x}%;top:${y}%;--d:${starSize(m)}px`;
    box.appendChild(s);
  });
  STARS.forEach(({ x, y, m, name }, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "star" + (i === 0 ? " next" : "");
    b.style.cssText = `left:${x}%;top:${y}%;--d:${starSize(m)}px`;
    b.setAttribute("aria-label", `${C.ui.star} ${i + 1}: ${name}`);
    b.dataset.i = i;
    box.appendChild(b);
  });
  // nhãn hiện sau khi nối xong (chữ lấy từ content.json > scene2.sky)
  const sky = C.scene2.sky;
  [
    ["lb-gamma", sky.alnasl, 87.5, 58.6],
    ["lb-eps", sky.kausAustralis, 64.6, 79.7],
    ["lb-sigma", sky.nunki, 26.7, 34.5],
    ["lb-antares", sky.antares, 100, 61.5],
    ["lb-mw", sky.milkyWay, 93, 22],
  ].forEach(([cls, text, x, y]) => {
    const l = document.createElement("span");
    l.className = "con-label " + cls;
    l.style.cssText = `left:${x}%;top:${y}%`;
    l.textContent = text;
    box.appendChild(l);
  });
  hieu.pose("archer").feel("focus").anim("aim");
  say(C.scene2.say, 700);
  // sao băng thỉnh thoảng vụt qua
  every(() => {
    if (reduced) return;
    const W = app.clientWidth,
      H = app.clientHeight;
    const st = document.createElement("i");
    st.className = "shoot";
    fx.appendChild(st);
    const x = rand(0.3, 1) * W,
      y = rand(0.04, 0.3) * H;
    gsap.fromTo(
      st,
      { x, y, rotation: 155, opacity: 0, scaleX: 0.3 },
      {
        x: x - 220,
        y: y + 100,
        opacity: 1,
        scaleX: 1,
        duration: 0.9,
        ease: "power1.in",
        onComplete: () => st.remove(),
      },
    );
  }, 3200);
}
function drawLine(a, b) {
  const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
  const { x: x1, y: y1 } = STARS[a],
    { x: x2, y: y2 } = STARS[b];
  l.setAttribute("x1", x1);
  l.setAttribute("y1", y1);
  l.setAttribute("x2", x2);
  l.setAttribute("y2", y2);
  $(".con-lines").appendChild(l);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (!reduced)
    gsap.fromTo(
      l,
      { attr: { x2: x1, y2: y1 } },
      { attr: { x2, y2 }, duration: 0.35 + len / 200, ease: "power2.out" },
    );
}
function bind2() {
  $(".con-stars").addEventListener("click", (e) => {
    const b = e.target.closest(".star");
    if (!b || current !== 2) return;
    const i = +b.dataset.i;
    if (i !== state.star) {
      if (!reduced)
        gsap.fromTo(
          $(`.star[data-i="${state.star}"]`),
          { scale: 1.4 },
          { scale: 1, duration: 0.4 },
        );
      return;
    }
    // bóng thoại "Nối sao giúp..." nằm đè phần dưới chòm sao: bắt đầu nối thì ẩn đi
    if (i === 0) hideSay();
    b.classList.remove("next");
    b.classList.add("done");
    b.disabled = true;
    sfx.ting();
    if (i > 0) drawLine(i - 1, i);
    state.star++;
    const nb = $(`.star[data-i="${state.star}"]`);
    if (nb) nb.classList.add("next");
    else finishConstellation();
  });
}
function finishConstellation() {
  EXTRA_LINES.forEach(([a, b], k) =>
    later(() => drawLine(a, b), 200 + k * 180),
  );
  $(".constellation").classList.add("complete");
  later(() => {
    sfx.sparkle();
    shootArrow();
  }, 1000);
  // lộ nghĩa gốc: 8 sao ấm trà chính là cây cung + mũi tên chĩa về Antares, "hơi nước" là Ngân Hà
  later(() => {
    $(".constellation").classList.add("revealed");
    say(C.scene2.reveal, 0);
  }, 1700);
  later(() => {
    hideSay();
    hieu.hop(1);
    const card = $(".profile");
    $(".pf-name").textContent = C.people.hieu.fullName;
    $(".pf-birth").textContent = C.people.hieu.birth;
    $(".pf-sign").textContent = C.scene2.card.sign;
    const ul = $(".pf-stats");
    ul.innerHTML = "";
    C.scene2.card.stats.forEach((s) => {
      const li = document.createElement("li");
      li.innerHTML = '<span></span><b></b><span class="bar"><i></i></span>';
      li.children[0].textContent = s.label;
      li.children[1].textContent = s.value;
      ul.appendChild(li);
    });
    card.hidden = false;
    if (!reduced)
      gsap.fromTo(
        card,
        { rotationY: 90, scale: 0.8, opacity: 0 },
        {
          rotationY: 0,
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.4)",
        },
      );
    later(
      () =>
        $$(".pf-stats .bar i").forEach((bar, k) => {
          bar.style.width = C.scene2.card.stats[k].value + "%";
        }),
      500,
    );
    say(C.scene2.done, 1200);
    later(() => showNext(true, C.ui.toRace), 2600);
  }, 6500);
}
function shootArrow() {
  hieu.svg.classList.add("shot");
  sceneCleanup.push(() => hieu.svg.classList.remove("shot"));
  const a = app.getBoundingClientRect(),
    c = $(".constellation").getBoundingClientRect();
  // mũi tên rời đầu cung (bên phải ảnh kéo cung)
  const s0 = charPoint(0.92, 0.42);
  hieu.anim(null);
  // sau khi bắn: che mắt nhìn theo, mắt sao
  hieu.pose(hieu.has("stargaze") ? "stargaze" : "cheer").feel("excited");
  if (reduced) return;
  const arrow = document.createElement("div");
  arrow.innerHTML =
    '<svg viewBox="0 0 80 20" width="80"><path d="M2 10 H66" stroke="#F5C242" stroke-width="4" stroke-linecap="round"/><path d="M78 10 L64 3 L66 10 L64 17Z" fill="#F5C242" stroke="#3A2A20" stroke-width="2"/></svg>';
  arrow.style.position = "absolute";
  arrow.style.filter = "drop-shadow(0 0 6px rgba(245,194,66,.9))";
  fx.appendChild(arrow);
  // bắn trúng giữa thân "ấm trà"
  const tx = c.left - a.left + c.width * 0.45,
    ty = c.top - a.top + c.height * 0.52;
  const ang = (Math.atan2(ty - s0.y, tx - s0.x) * 180) / Math.PI;
  gsap
    .timeline({
      onComplete: () => {
        arrow.remove();
        sparkles(tx, ty, 10, 110);
        confetti(30, {
          x: (tx / a.width) * 100,
          y: (ty / a.height) * 100,
          spread: 0.7,
        });
      },
    })
    .fromTo(
      arrow,
      { x: s0.x - 40, y: s0.y - 10, rotation: ang },
      { x: tx - 40, y: ty - 10, duration: 0.6, ease: "power2.in" },
    );
  gsap.fromTo(
    ".constellation",
    { filter: "brightness(1)" },
    {
      filter: "brightness(1.8)",
      duration: 0.25,
      delay: 0.6,
      yoyo: true,
      repeat: 1,
    },
  );
}

// ---------------------------------------------------------------- màn 3: đường chạy 24 năm
// Phối cảnh đường chạy: Hiếu chạy từ xa (giữa đường) về phía người xem. p = 0 (xa) .. 1 (sát mép dưới).
// f là hệ số to/nhỏ theo khoảng cách (1 / độ sâu): xa nhỏ, gần to.
const RACE_K = 3,
  RACE_HORIZON = 52,
  RACE_NEAR_MY = 3,
  RACE_NEAR_MH = 36;
const raceF = (p) => 1 / (1 + RACE_K * (1 - p));
function enter3() {
  const world = $(".race-world");
  world.innerHTML = "";
  state.race = {
    dist: 0,
    speed: 0,
    boost: 0,
    shown: new Set(),
    done: false,
    line: false,
  };
  // biển km dọc hai bên đường, đứng yên theo phối cảnh
  C.scene3.milestones.forEach((m, i) => {
    if (m.km <= 0 || m.km >= 24) return;
    const s = document.createElement("div");
    s.className = "km-sign";
    s.innerHTML = `<b>km ${m.km}</b><i></i>`;
    s.dataset.km = m.km;
    const f = raceF(m.km / 24);
    const side = i % 2 ? 1 : -1;
    s.style.left = 50 + side * (10 + 34 * f) + "%";
    s.style.bottom = RACE_HORIZON - (RACE_HORIZON - RACE_NEAR_MY) * f + "%";
    s.style.transform = `scale(${(0.45 + 1.1 * f).toFixed(3)})`;
    world.appendChild(s);
  });
  const fl = $(".finish-line");
  fl.classList.remove("on", "broken");
  gsap.set(fl, { clearProps: "all" });
  gsap.set(".race-bg", { clearProps: "transform" });
  $(".mile-pop").hidden = true;
  hieu.pose("runfront").anim("run");
  say(C.scene3.say, 500);
  duck(1);
  let last = performance.now();
  const tick = () => {
    const t = performance.now(),
      dt = Math.min(0.25, (t - last) / 1000);
    last = t;
    const r = state.race;
    if (r.done) return;
    r.boost = Math.max(0, r.boost - dt * 1.4);
    r.speed = 0.85 + r.boost;
    r.dist = Math.min(24, r.dist + r.speed * dt);
    placeRunner(r.dist);
    $(".watch-km").textContent = r.dist.toFixed(1);
    for (const m of C.scene3.milestones) {
      if (m.km < 24 && r.dist >= Math.max(m.km, 1.2) && !r.shown.has(m.km)) {
        r.shown.add(m.km);
        $(`.km-sign[data-km="${m.km}"]`)?.classList.add("passed");
        milePop(m);
      }
    }
    // vạch đích trồi lên khi còn 4 km
    if (r.dist >= 20 && !r.line) {
      r.line = true;
      fl.classList.add("on");
      if (!reduced)
        gsap.fromTo(
          fl,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.8, ease: "back.out(1.4)" },
        );
    }
    if (r.dist >= 24) finishRace();
  };
  placeRunner(0);
  gsap.ticker.add(tick);
  sceneCleanup.push(() => gsap.ticker.remove(tick));
}
function placeRunner(dist) {
  const p = dist / 24,
    f = raceF(p),
    f0 = raceF(0);
  const near = (f - f0) / (1 - f0);
  const sway = Math.sin(dist * 2.2) * 3 * f;
  hieu.moveTo(
    50 + sway,
    RACE_HORIZON - (RACE_HORIZON - RACE_NEAR_MY) * f,
    RACE_NEAR_MH * f,
  );
  // máy quay tiến nhẹ theo
  $(".race-bg").style.transform = `scale(${(1 + 0.1 * near).toFixed(4)})`;
}
function milePop(m) {
  const box = $(".mile-pop");
  box.children[0].textContent = `km ${m.km} · ${m.label}`;
  box.children[1].textContent = m.text;
  const draft = isDraft(C);
  box.classList.toggle("todo", (isFill(m.text) || isFill(m.label)) && draft);
  if ((isFill(m.text) || isFill(m.label)) && !draft) return;
  hideSay();
  box.hidden = false;
  sfx.smallBell();
  if (!reduced)
    gsap.fromTo(
      box,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.6)" },
    );
  clearTimeout(milePop._h);
  milePop._h = setTimeout(() => {
    box.hidden = true;
  }, 4600);
}
function bind3() {
  $(".s3 .tap-zone").addEventListener("pointerdown", () => {
    const r = state.race;
    if (!r || r.done || current !== 3) return;
    r.boost = Math.min(2.6, r.boost + 0.45);
    sfx.bubble();
    if (!reduced)
      gsap.fromTo(".s3 .watch", { scale: 1.08 }, { scale: 1, duration: 0.25 });
  });
}
/** Ảnh thật (polaroid) rơi xuống sau khoảnh khắc hoạt hình. p = { photo, caption, alt } trong content.json */
function showRealPhoto(p, delay) {
  if (!p?.photo) return;
  const el = $(".real-pop");
  el.onclick = () => {
    el.hidden = true;
  };
  sceneCleanup.push(() => {
    el.hidden = true;
    gsap.killTweensOf(el);
  });
  later(() => {
    el.querySelector("img").src = p.photo;
    el.querySelector("img").alt = p.alt || "";
    el.querySelector("figcaption").textContent = p.caption || "";
    hideSay();
    el.hidden = false;
    sfx.sparkle();
    if (!reduced)
      gsap.fromTo(
        el,
        { y: -80, rotation: -12, opacity: 0, scale: 0.85 },
        {
          y: 0,
          rotation: 0,
          opacity: 1,
          scale: 1,
          duration: 0.75,
          ease: "back.out(1.5)",
        },
      );
  }, delay);
}
function finishRace() {
  const r = state.race;
  r.done = true;
  hideSay();
  const fl = $(".finish-line");
  fl.classList.add("on", "broken");
  $(".mile-pop").hidden = true;
  $(".watch-km").textContent = "24.0";
  sfx.bell();
  confetti(80, { x: 50, y: 62, spread: 1.2 });
  later(() => confetti(50, { rain: true }), 300);
  // đứt dây: giơ ngón cái
  hieu.anim(null).pose("finish").feel("happy");
  hieu.hop(2, "-8%");
  // rồi dọn vạch đích, chống gối thở, đeo huy chương lấp lánh
  later(() => {
    if (!reduced)
      gsap.to(fl, { yPercent: 110, duration: 0.6, ease: "power2.in" });
    hieu.pose(hieu.has("medal") ? "medal" : "finish");
    const p = charPoint(0.55, 0.47);
    glint(p.x, p.y, 4);
    sfx.sparkle();
    every(() => {
      const q = charPoint(0.55, 0.47);
      glint(q.x, q.y, 2);
    }, 1500);
  }, 2600);
  say(C.scene3.finish, 500);
  later(() => showNext(true, C.ui.toClimb), 3200);
  showRealPhoto(C.scene3.realPhoto, 4200);
}

// ---------------------------------------------------------------- màn 4: leo núi
const FLAG_AT = [0.17, 0.37, 0.57, 0.78];
// cờ cam có biểu tượng theo thứ tự lời chúc: sức khỏe, tiền bạc, phiêu lưu, đồng đội
const FLAG_ICON = ["flag-health", "flag-money", "flag-adventure", "flag-team"];
const flagSrc = (n) => `assets/deco/mt/${n}.webp`;
function setFlag(el, name) {
  el.querySelectorAll("img").forEach((im) => (im.src = flagSrc(name)));
  // bảng cắt mất tia lấp lánh của cờ 05: cờ sắp tới phát sáng bằng CSS (.next)
  el.classList.toggle("next", name === "flag-glow");
}
function enter4() {
  const flagsBox = $(".mt-flags");
  flagsBox.innerHTML = "";
  C.scene4.flags.forEach((f, i) => {
    const el = document.createElement("div");
    el.className = "mt-flag";
    el.innerHTML = '<img class="pole" alt=""><img class="cloth" alt="">';
    // cờ sắp tới thì vàng lấp lánh, các cờ sau vàng trơn
    setFlag(el, i === 0 ? "flag-glow" : "flag-wait");
    flagsBox.appendChild(el);
  });
  $(".s4").classList.remove("clear", "top");
  $(".wish-card").hidden = true;
  state.climb = { p: 0, stop: 0, moving: false, done: false };
  hieu.pose(hieu.has("point") ? "point" : "idle", "hike").feel("calm");
  layoutClimb();
  say(C.scene4.say, 600);
}
/** Đổi tọa độ trên đường mòn (SVG slice, canh đáy) sang tọa độ trong khối núi (đặt từ đỉnh khung, dịch bằng translateY) */
function climbGeom() {
  const mt = $(".mountain"),
    path = $(".trail");
  const W = mt.clientWidth,
    H = mt.clientHeight,
    view = app.clientHeight;
  const vb = $(".mt-svg").viewBox.baseVal;
  const k = Math.max(W / vb.width, H / vb.height);
  const ox = (W - vb.width * k) / 2 - vb.x * k,
    oy = H - vb.height * k - vb.y * k;
  const len = path.getTotalLength();
  const at = (p) => {
    const pt = path.getPointAtLength(len * p);
    return { x: ox + pt.x * k, y: oy + pt.y * k };
  };
  return { W, H, view, k, ox, oy, at };
}
function layoutClimb() {
  const g = climbGeom();
  $$(".mt-flag").forEach((el, i) => {
    const pt = g.at(FLAG_AT[i]);
    el.style.left = pt.x + 24 + "px";
    el.style.top = pt.y + 6 + "px";
  });
  const s = g.at(1);
  const st = $(".summit-stone");
  st.style.left = s.x + 40 + "px";
  st.style.top = s.y + 10 + "px";
  placeClimber(state.climb?.p || 0, g);
}
function placeClimber(p, g = climbGeom()) {
  const pt = g.at(p);
  const minT = g.view - g.H;
  const t = Math.max(minT, Math.min(0, g.view * 0.68 - pt.y));
  $(".mountain").style.transform = `translateY(${t}px)`;
  const W = app.clientWidth;
  hieu.moveTo((pt.x / W) * 100, ((g.view - (pt.y + t)) / g.view) * 100);
}
function climbStep() {
  const c = state.climb;
  if (!c || c.moving || c.done || current !== 4) return;
  $(".wish-card").hidden = true;
  hideSay();
  const target = c.stop < FLAG_AT.length ? FLAG_AT[c.stop] : 1;
  c.moving = true;
  hieu.pose("walk").feel("focus").anim("walk");
  const g = climbGeom();
  const obj = { p: c.p };
  let dir = 0;
  gsap.to(obj, {
    p: target,
    duration: reduced ? 0.01 : 1.6 + (target - c.p) * 2,
    ease: "sine.inOut",
    onUpdate: () => {
      // quay mặt theo hướng đường mòn
      const d = Math.sign(g.at(Math.min(1, obj.p + 0.004)).x - g.at(obj.p).x);
      if (d && d !== dir) {
        dir = d;
        hieu.face(d);
      }
      c.p = obj.p;
      placeClimber(obj.p, g);
    },
    onComplete: () => {
      c.moving = false;
      hieu.anim(null);
      hieu.face(1);
      arrive();
    },
  });
  sfx.whoosh();
}
function arrive() {
  const c = state.climb;
  if (c.stop < FLAG_AT.length) {
    const f = C.scene4.flags[c.stop];
    const flags = $$(".mt-flag");
    const fl = flags[c.stop];
    fl.classList.add("reached");
    setFlag(fl, FLAG_ICON[c.stop] || "flag-health");
    if (flags[c.stop + 1]) setFlag(flags[c.stop + 1], "flag-glow");
    if (!reduced) {
      gsap.fromTo(fl, { scale: 0.55 }, { scale: 1, duration: 0.6, ease: "back.out(3)" });
      const a = app.getBoundingClientRect(),
        r = fl.getBoundingClientRect();
      sparkles(r.left - a.left + r.width * 0.62, r.top - a.top + r.height * 0.25, 6, 46);
    }
    const card = $(".wish-card");
    card.children[0].textContent = f.title;
    card.children[1].textContent = f.text;
    card.hidden = false;
    if (!reduced)
      gsap.fromTo(
        card,
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "back.out(1.6)" },
      );
    // cờ 2: ngồi nghỉ uống nước; các cờ khác: chỉ tay về phía trước
    const rest = c.stop === 1 && hieu.has("rest");
    hieu
      .pose(rest ? "rest" : hieu.has("point") ? "point" : "cheer", "hike")
      .feel(c.stop % 2 ? "wink" : "happy");
    if (!rest) hieu.hop(1);
    sfx.ting();
    c.stop++;
  } else {
    c.done = true;
    $(".wish-card").hidden = true;
    $(".s4").classList.add("clear", "top");
    // lên đỉnh: chuyển sang nền biển mây, đứng trên đá giơ cờ
    const r = hieu.root;
    if (!reduced)
      r.style.transition =
        "transform 1.2s cubic-bezier(.22,1,.36,1), height 1.2s cubic-bezier(.22,1,.36,1), opacity .4s";
    hieu.moveTo(50, 8, 42);
    hieu.pose("summit").feel("proud").anim("sway");
    hieu.hop(1, "-6%");
    sfx.bell();
    later(() => confetti(60, { x: 50, y: 30 }), 500);
    say(C.scene4.summit, 1300);
    later(() => showNext(true, C.ui.toPhotos), 2800);
    showRealPhoto(C.scene4.realPhoto, 4300);
  }
}
function bind4() {
  const z = $(".climb-zone");
  let y0 = 0;
  z.addEventListener("pointerdown", (e) => {
    y0 = e.clientY;
  });
  z.addEventListener("pointerup", () => climbStep());
  z.addEventListener("click", (e) => {
    if (e.detail === 0) climbStep();
  });
}

// ---------------------------------------------------------------- màn 5: cuộn phim
function enter5() {
  $(".prints").innerHTML = "";
  $(".prints").hidden = false;
  $(".film").hidden = true;
  $(".shutter").hidden = false;
  state.shots = 0;
  updateShots();
  hieu.pose(hieu.has("camlaugh") ? "camlaugh" : "camera").feel("focus");
  say(C.scene5.say, 600);
}
function updateShots() {
  $(".shutter-count").textContent = C.scene5.photos.length - state.shots;
}
function bind5() {
  $(".shutter").addEventListener("click", () => {
    if (
      current !== 5 ||
      state.shots >= C.scene5.photos.length ||
      state.shotBusy
    )
      return;
    state.shotBusy = true;
    // bóng thoại nằm đè vùng ảnh rửa ra: bấm chụp thì ẩn đi
    if (state.shots === 0) hideSay();
    const i = state.shots++;
    updateShots();
    sfx.shutter();
    // đưa máy lên mắt bấm, rồi hạ máy cười
    hieu.pose("camera").feel("focus");
    gsap.fromTo(
      hieu.rig,
      { y: "2%" },
      { y: 0, duration: 0.3, ease: "power2.out" },
    );
    later(
      () =>
        hieu.pose(hieu.has("camlaugh") ? "camlaugh" : "camfront").feel("wink"),
      650,
    );
    if (!reduced)
      gsap.fromTo(
        ".flash",
        { opacity: 0.9 },
        { opacity: 0, duration: 0.5, ease: "power2.out" },
      );
    const p = C.scene5.photos[i];
    const fig = document.createElement("figure");
    fig.className = "print";
    const ph = photoNode(p, i);
    const dev = document.createElement("div");
    dev.className = "dev";
    ph.appendChild(dev);
    fig.append(ph, captionNode(p));
    fig.addEventListener("click", () => {
      const big = photoNode(p, i);
      openModal({
        title: "",
        text: isFill(p.caption) ? "" : p.caption,
        node: big,
      });
    });
    $(".prints").appendChild(fig);
    const rot = rand(-10, 10),
      dx = rand(-22, 22),
      dy = rand(-14, 10);
    gsap.set(fig, { xPercent: -50 + dx, yPercent: -50 + dy, rotation: rot });
    if (!reduced) {
      gsap.from(fig, {
        x: 140,
        y: 160,
        scale: 0.4,
        rotation: rot + 30,
        duration: 0.7,
        ease: "back.out(1.3)",
      });
      gsap.to(dev, {
        opacity: 0,
        duration: 2.2,
        delay: 0.5,
        ease: "power1.in",
      });
    } else dev.style.opacity = 0;
    later(() => {
      state.shotBusy = false;
    }, 700);
    if (state.shots >= C.scene5.photos.length) later(showFilm, 2600);
  });
}
function showFilm() {
  $(".shutter").hidden = true;
  const track = $(".film-track");
  track.innerHTML = "";
  // hai bản nối nhau để cuộn vòng không thấy chỗ nối
  for (let copy = 0; copy < 2; copy++)
    C.scene5.photos.forEach((p, i) => {
      const fig = document.createElement("figure");
      fig.append(photoNode(p, i), captionNode(p));
      if (copy) fig.setAttribute("aria-hidden", "true");
      track.appendChild(fig);
    });
  autoRollFilm();
  if (!reduced)
    gsap.to(".prints", {
      opacity: 0,
      duration: 0.4,
      onComplete: () => {
        $(".prints").hidden = true;
        gsap.set(".prints", { clearProps: "opacity" });
      },
    });
  else $(".prints").hidden = true;
  $(".film").hidden = false;
  if (!reduced)
    gsap.from(".film", { x: "100%", duration: 0.8, ease: "power3.out" });
  // giơ tấm ảnh vừa rửa
  hieu.pose(hieu.has("polaroid") ? "polaroid" : "signature").feel("happy");
  hieu.hop(1);
  later(() => {
    const p = charPoint(0.1, 0.42);
    sparkles(p.x, p.y, 6, 50);
  }, 300);
  say(C.scene5.done, 600);
  later(() => showNext(true, C.ui.toLetter), 1600);
}

// cuộn phim tự trôi vòng lặp; người xem kéo/vuốt thì tạm dừng, thả tay 1,5 giây sau trôi tiếp
function autoRollFilm() {
  const film = $(".film");
  const n = C.scene5.photos.length;
  const figs = film.querySelectorAll(".film-track figure");
  const period = () => figs[n].offsetLeft - figs[0].offsetLeft;
  const SPEED = 38; // px mỗi giây
  let pos = 0,
    holdUntil = 0,
    drag = null;
  const wrap = () => {
    const P = period();
    if (P <= 0) return;
    if (film.scrollLeft >= P) film.scrollLeft -= P;
    else if (film.scrollLeft <= 0) film.scrollLeft += P;
  };
  const hold = (ms = 1500) => (holdUntil = performance.now() + ms);
  const tick = (_t, dt) => {
    if (current !== 5 || film.hidden) return;
    if (drag || performance.now() < holdUntil || reduced) {
      pos = film.scrollLeft;
      return;
    }
    pos += (SPEED * Math.min(dt, 100)) / 1000;
    const P = period();
    if (P > 0 && pos >= P) pos -= P;
    film.scrollLeft = pos;
  };
  const onScroll = () => {
    if (drag || performance.now() < holdUntil) wrap();
  };
  const onDown = (e) => {
    hold(1e9);
    if (e.pointerType === "mouse") {
      drag = { x: e.clientX, s: film.scrollLeft };
      film.setPointerCapture(e.pointerId);
    }
  };
  const onMove = (e) => {
    if (!drag) return;
    film.scrollLeft = drag.s - (e.clientX - drag.x);
    wrap();
    drag.s = film.scrollLeft + (e.clientX - drag.x);
  };
  const onUp = () => {
    drag = null;
    hold();
  };
  const onWheel = () => hold();
  film.scrollLeft = 0;
  film.addEventListener("scroll", onScroll, { passive: true });
  film.addEventListener("pointerdown", onDown);
  film.addEventListener("pointermove", onMove);
  film.addEventListener("pointerup", onUp);
  film.addEventListener("pointercancel", onUp);
  film.addEventListener("touchend", onUp, { passive: true });
  film.addEventListener("wheel", onWheel, { passive: true });
  gsap.ticker.add(tick);
  sceneCleanup.push(() => {
    gsap.ticker.remove(tick);
    film.removeEventListener("scroll", onScroll);
    film.removeEventListener("pointerdown", onDown);
    film.removeEventListener("pointermove", onMove);
    film.removeEventListener("pointerup", onUp);
    film.removeEventListener("pointercancel", onUp);
    film.removeEventListener("touchend", onUp);
    film.removeEventListener("wheel", onWheel);
  });
}

// ---------------------------------------------------------------- màn 6: thư của Phú
function enter6() {
  const body = $(".letter-body");
  body.innerHTML = "";
  $(".letter-sign").classList.remove("on");
  hieu.pose("letter").feel("focus");
  duck(0.6);
  const draft = isDraft(C);
  const lines = C.scene6.lines.filter((l) => draft || !isFill(l));
  state.typing = { skip: false };
  let li = 0;
  const typeLine = () => {
    if (li >= lines.length) return finishLetter();
    const text = lines[li++];
    const p = document.createElement("p");
    body.appendChild(p);
    if (isFill(text) || reduced || state.typing.skip) {
      p.textContent = text;
      if (isFill(text)) markTodo(p, "thư");
      body.parentElement.scrollTop = body.parentElement.scrollHeight;
      later(typeLine, reduced || state.typing.skip ? 0 : 500);
      return;
    }
    let k = 0;
    const caret = document.createElement("span");
    caret.className = "caret";
    const step = () => {
      if (state.typing.skip) {
        p.textContent = text;
        return later(typeLine, 0);
      }
      k = Math.min(text.length, k + 1);
      p.textContent = text.slice(0, k);
      p.appendChild(caret);
      if (k % 3 === 0) sfx.tick();
      body.parentElement.scrollTop = body.parentElement.scrollHeight;
      if (k < text.length) later(step, /[,.!?]/.test(text[k - 1]) ? 220 : 32);
      else {
        caret.remove();
        later(typeLine, 450);
      }
    };
    step();
  };
  later(typeLine, 700);
}
function finishLetter() {
  $(".letter-sign").classList.add("on");
  // thư dài hơn khung: cuộn tới chữ ký (người xem vẫn kéo lên đọc lại được)
  const card = $(".letter-card");
  later(() => card.scrollTo({ top: card.scrollHeight, behavior: reduced ? "auto" : "smooth" }), 150);
  // đọc xong: rưng rưng, tim bay lên, rồi cười tươi
  hieu.pose("touched").feel("touched");
  later(() => {
    const p = charPoint(0.5, 0.12);
    hearts(p.x, p.y, 6);
  }, 400);
  later(() => hieu.feel("love"), 1400);
  later(() => {
    hieu.pose("cheer").feel("happy");
    hieu.hop(2);
    sfx.sparkle();
  }, 2600);
  later(() => showNext(true, C.ui.toLast), 3200);
}
function bind6() {
  $(".letter-card").addEventListener("click", () => {
    if (state.typing) state.typing.skip = true;
  });
}

// ---------------------------------------------------------------- màn 7: HAPPY OUR BIRTHDAY
function enter7() {
  const t = $(".hob-text");
  t.innerHTML = "";
  $(".hob-sub").classList.remove("on");
  $(".hob-wish").hidden = true;
  $(".end-actions").hidden = true;
  $(".blow-hint").hidden = true;
  const cake = $(".cake");
  cake.classList.remove("out");
  cake.disabled = true;
  gsap.set([".popper", cake], { clearProps: "all" });
  state.blown = false;
  hieu.pose("idle").feel("calm");
  hieu.extra("party", true);
  duck(1);
  if (!reduced)
    gsap.from(cake, {
      y: 60,
      scale: 0.6,
      opacity: 0,
      duration: 0.7,
      delay: 0.3,
      ease: "back.out(1.8)",
    });
  later(() => {
    hieu.feel("surprised");
    hieu.hop(1);
  }, 400);
  say(C.scene7.hieuSay, 600);
  later(() => {
    phu.party(true);
    phu.walkIn();
    phu.follow(true);
  }, 3300);
  later(() => phu.wave(1800), 4500);
  say(C.scene7.phuSay, 4600, "phu");
  later(() => {
    hieu.pose("highfive").feel("happy");
    phu.highfive(1800);
  }, 7200);
  say(C.scene7.phuSay2, 7600, "phu");
  later(() => {
    hieu.pose("idle").feel("excited");
    cake.disabled = false;
    // gợi ý thổi nến hiện ra thì cất bóng thoại của Phú (tránh đè lên gợi ý)
    hideSay();
    $(".blow-hint").hidden = false;
    if (!reduced)
      gsap.fromTo(
        cake,
        { scale: 1 },
        {
          scale: 1.06,
          duration: 0.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        },
      );
  }, 10200);
}
function bind7() {
  $(".cake").addEventListener("click", blowCandles);
  $('.s7 [data-act="save"]').addEventListener("click", saveKeepsake);
  $('.s7 [data-act="replay"]').addEventListener("click", () => goTo(1));
}
function blowCandles() {
  if (state.blown || current !== 7) return;
  state.blown = true;
  const cake = $(".cake");
  gsap.killTweensOf(cake);
  gsap.set(cake, { scale: 1 });
  $(".blow-hint").hidden = true;
  hideSay();
  hieu.pose("blow").feel("blow");
  phu.blow(true);
  sfx.blow();
  later(() => {
    cake.classList.add("out");
    smoke();
  }, 500);
  later(() => {
    phu.blow(false);
    phu.cheer(true);
    hieu.pose("cheer").feel("happy");
    hieu.hop(2);
    sfx.tada();
    firePoppers();
    later(() => confetti(60, { rain: true }), 600);
    balloons(7);
    popTitle();
    duck(1.25);
  }, 1100);
  later(() => {
    $(".hob-sub").classList.add("on");
    $(".hob-wish").hidden = false;
    $(".end-actions").hidden = false;
    if (!reduced)
      gsap.from(".end-actions .btn", {
        y: 20,
        opacity: 0,
        stagger: 0.12,
        duration: 0.5,
        ease: "back.out(1.6)",
      });
    phu.cheer(false);
    phu.wave(2000);
    showNext(true, C.ui.toCredits);
  }, 3600);
  // hai người nhảy luân phiên mừng
  later(() => {
    let k = 0;
    const t = every(() => {
      if (k++ % 2) phu.jump();
      else {
        // dáng nhảy (hai chân rời đất) chỉ lúc đang bay lên, chạm đất thì về dáng giơ hai tay
        if (hieu.has("jump")) {
          hieu.pose("jump");
          later(() => hieu.pose("cheer"), 470);
        }
        hieu.hop(1, "-9%");
      }
      if (k >= 8) {
        clearInterval(t);
        // kết: tạo dáng chữ V nháy mắt (nếu đã có hình), không thì vẫy tay
        hieu.pose(hieu.has("peace") ? "peace" : "wave").feel("wink");
        phu.laugh(2400);
      }
    }, 650);
  }, 5800);
}
// ---------------------------------------------------------------- màn 8: after credit
const fileName = (src) => src.split("/").pop();
/** Tải ảnh về dạng phổ thông: ảnh thật → JPG, chibi (nền trong suốt) → PNG. Ảnh trong thiệp là WebP nên đổi ngay trên máy. */
function saveImage(src, name, type) {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const x = c.getContext("2d");
    if (type === "image/jpeg") {
      x.fillStyle = "#fff";
      x.fillRect(0, 0, c.width, c.height);
    }
    x.drawImage(img, 0, 0);
    c.toBlob(
      (blob) => {
        if (!blob) return toast(C.ui.keepsakeFail);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      },
      type,
      0.92,
    );
  };
  img.onerror = () => toast(C.ui.keepsakeFail);
  img.src = src;
}
const asName = (src, ext, prefix = "") =>
  prefix + fileName(src).replace(/\.\w+$/, "") + ext;
function enter8() {
  hieu.hide(true);
  const S = C.scene8;
  $(".s8 .cr-scroll").scrollTop = 0;

  // nhạc: chạm để nghe lại bản nào
  const tracks = $(".cr-tracks");
  tracks.innerHTML = "";
  S.tracks.forEach((tr) => {
    const card = document.createElement("div");
    card.className = "cr-track";
    card.dataset.song = tr.song;
    card.innerHTML =
      '<span class="cr-disc" aria-hidden="true">♪</span><span class="cr-meta"><b></b><small></small><em></em></span><button class="btn btn-ghost cr-play" type="button"></button>';
    card.querySelector("b").textContent = tr.name;
    card.querySelector("small").textContent = `${tr.artist} · ${tr.source}`;
    card.querySelector("em").textContent = tr.role;
    tracks.appendChild(card);
  });
  updateTracks();

  // ảnh thật: ảnh về đích, ảnh đỉnh núi, rồi cả cuộn phim
  const photos = [
    C.scene3.realPhoto,
    C.scene4.realPhoto,
    ...C.scene5.photos,
  ].filter((p) => p && p.photo);
  const pg = $(".cr-photos");
  pg.innerHTML = "";
  photos.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cr-photo";
    const img = new Image();
    img.loading = "lazy";
    img.src = p.photo;
    img.alt = p.alt || p.caption || "";
    b.appendChild(img);
    b.addEventListener("click", () => {
      const big = new Image();
      big.src = p.photo;
      big.alt = img.alt;
      const dl = document.createElement("button");
      dl.type = "button";
      dl.className = "btn btn-ghost";
      dl.textContent = S.download;
      dl.addEventListener("click", () =>
        saveImage(p.photo, asName(p.photo, ".jpg", "kim-hieu-"), "image/jpeg"),
      );
      openModal({ text: p.caption || "", node: big, actions: [dl] });
    });
    pg.appendChild(b);
  });

  // chibi: chạm là tải về
  const cg = $(".cr-chibi");
  cg.innerHTML = "";
  // ảnh "idle" của Hiếu tách rời mắt/miệng nên dùng bản đủ mặt (idle-full.webp)
  const chibi = [
    ["hieu", "assets/hieu/idle-full.webp"],
    ...Object.values(hieu.P || {})
      .filter((p) => !p.face)
      .map((p) => ["hieu", "assets/hieu/" + p.file]),
    ...phu.files().map((f) => ["phu", f]),
    ["phu", "assets/phu/bodoi.webp"],
  ];
  [...new Map(chibi.map((c) => [c[1], c])).values()].forEach(([who, src]) => {
    const a = document.createElement("a");
    a.className = "cr-chibi-item";
    a.href = src;
    const name = asName(src, ".png", `chibi-${who}-`);
    a.download = name;
    a.setAttribute("aria-label", `${S.download}: ${name}`);
    a.addEventListener("click", (e) => {
      e.preventDefault();
      saveImage(src, name, "image/png");
    });
    const img = new Image();
    img.loading = "lazy";
    img.src = src;
    img.alt = "";
    a.append(img);
    a.insertAdjacentHTML("beforeend", '<span aria-hidden="true">⬇</span>');
    cg.appendChild(a);
  });

  const roll = $(".cr-roll");
  roll.innerHTML = "";
  S.credits.forEach((c) => {
    const dt = document.createElement("dt");
    dt.textContent = c.role;
    const dd = document.createElement("dd");
    dd.textContent = c.name;
    roll.append(dt, dd);
  });

  if (!reduced)
    gsap.from(".s8 .cr-scroll > *", {
      y: 30,
      opacity: 0,
      stagger: 0.08,
      duration: 0.6,
      delay: 0.3,
      ease: "power3.out",
    });
}
function updateTracks() {
  $$(".cr-track").forEach((card) => {
    const on = isEnabled() && currentSong() === card.dataset.song;
    card.classList.toggle("on", on);
    const b = card.querySelector(".cr-play");
    b.textContent = on ? C.scene8.playing : C.scene8.play;
    b.setAttribute("aria-pressed", String(on));
  });
}
function bind8() {
  $(".cr-tracks").addEventListener("click", (e) => {
    const card = e.target.closest(".cr-track");
    if (!card || current !== 8) return;
    if (!isEnabled()) {
      unlockAudio(audioCfg.sfxVolume);
      const sb = $(".sound-btn");
      sb.setAttribute("aria-pressed", "true");
      sb.setAttribute("aria-label", C.ui.soundOff);
    }
    playSong(card.dataset.song);
    updateTracks();
  });
  $(".cr-replay").addEventListener("click", () => goTo(1));
  $(".sound-btn").addEventListener(
    "click",
    () => current === 8 && updateTracks(),
  );
}

/** Ống pháo giấy hai góc dưới bắn chéo lên */
function firePoppers() {
  confetti(70, { x: 50, y: 60, spread: 1.3 });
  if (reduced) return;
  const W = app.clientWidth,
    H = app.clientHeight;
  $$(".popper").forEach((el, i) => {
    gsap
      .timeline()
      .fromTo(
        el,
        { opacity: 0, y: 80, rotation: i ? 8 : -8 },
        { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)" },
      )
      .to(el, { scale: 1.18, rotation: i ? 16 : -16, duration: 0.08 })
      .add(() => {
        const r = el.getBoundingClientRect(),
          a = app.getBoundingClientRect();
        const mx = i
          ? r.left - a.left + r.width * 0.15
          : r.right - a.left - r.width * 0.15;
        burst(mx, r.top - a.top + r.height * 0.1, i ? -1 : 1);
        sfx.pop();
      })
      .to(el, {
        scale: 1,
        rotation: 0,
        duration: 0.4,
        ease: "elastic.out(1, .4)",
      })
      .to(el, {
        opacity: 0,
        y: 60,
        duration: 0.5,
        delay: 1.4,
        ease: "power2.in",
      });
  });
  function burst(x, y, dir) {
    for (let k = 0; k < 40 && fx.children.length < 120; k++) {
      const p = document.createElement("i");
      p.className = "confetti";
      p.style.background = COLORS[k % COLORS.length];
      fx.appendChild(p);
      const ang = ((-70 + rand(-22, 22)) * Math.PI) / 180,
        v = rand(220, 420);
      const vx = Math.cos(ang) * v * dir,
        vy = Math.sin(ang) * v;
      gsap.set(p, { x, y, rotation: rand(0, 360) });
      gsap
        .timeline({ onComplete: () => p.remove() })
        .to(p, {
          x: x + vx,
          y: y + vy,
          rotation: "+=" + rand(200, 500),
          duration: rand(0.5, 0.8),
          ease: "power2.out",
        })
        .to(p, {
          y: H + 30,
          x: "+=" + rand(-50, 50) * dir,
          rotation: "+=" + rand(180, 360),
          duration: rand(1.6, 2.4),
          ease: "power1.in",
        });
    }
  }
}
function smoke() {
  if (reduced) return;
  const a = app.getBoundingClientRect();
  $$(".candle").forEach((cd) => {
    const c = cd.getBoundingClientRect();
    for (let i = 0; i < 4; i++) {
      const s = document.createElement("i");
      s.style.cssText =
        "position:absolute;width:12px;height:12px;border-radius:50%;background:rgba(255,246,234,.7)";
      fx.appendChild(s);
      const x = c.left - a.left + c.width / 2 - 6,
        y = c.top - a.top - 4;
      gsap.fromTo(
        s,
        { x, y, scale: 0.5, opacity: 0.8 },
        {
          x: x + rand(-14, 14),
          y: y - rand(50, 90),
          scale: rand(1.6, 2.4),
          opacity: 0,
          duration: rand(1, 1.6),
          delay: i * 0.12,
          onComplete: () => s.remove(),
        },
      );
    }
  });
}
function popTitle() {
  const t = $(".hob-text");
  t.innerHTML = "";
  const words = C.scene7.title.split(" ");
  words.forEach((w, wi) => {
    const span = document.createElement("span");
    span.style.whiteSpace = "nowrap";
    [...w].forEach((ch) => {
      const c = document.createElement("span");
      c.className = "ch";
      c.textContent = ch;
      span.appendChild(c);
    });
    t.appendChild(span);
    if (wi < words.length - 1)
      t.appendChild(document.createTextNode(wi === 1 ? "\n" : " "));
  });
  t.style.whiteSpace = "pre-line";
  if (!reduced)
    gsap.from(".hob-text .ch", {
      y: -40,
      scale: 0.2,
      opacity: 0,
      rotation: () => rand(-30, 30),
      duration: 0.6,
      stagger: 0.05,
      ease: "back.out(2.4)",
    });
}
async function saveKeepsake() {
  const btn = $('.s7 [data-act="save"]');
  btn.disabled = true;
  try {
    const blob = await makeKeepsake(C, hieu, phu);
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    img.alt = C.ui.keepsakeAlt;
    const dl = document.createElement("a");
    dl.className = "btn btn-main";
    dl.href = url;
    dl.download = "happy-our-birthday.png";
    dl.textContent = C.ui.download;
    const actions = [dl];
    const file = new File([blob], "happy-our-birthday.png", {
      type: "image/png",
    });
    if (navigator.canShare?.({ files: [file] })) {
      const sh = document.createElement("button");
      sh.type = "button";
      sh.className = "btn btn-ghost";
      sh.textContent = C.ui.share;
      sh.addEventListener("click", () =>
        navigator
          .share({ files: [file], title: C.scene7.title })
          .catch(() => {}),
      );
      actions.push(sh);
    }
    openModal({
      title: C.scene7.title,
      text: C.scene7.saveNote,
      node: img,
      actions,
    });
  } catch (e) {
    console.error(e);
    toast(C.ui.keepsakeFail);
  } finally {
    btn.disabled = false;
  }
}
