// Chibi Kim Hiếu.
// Hai chế độ:
//  - Hình AI (assets/hieu/poses.json, tạo bởi tools/build_hieu.py): mỗi tư thế một ảnh, canh theo đáy và tâm thân.
//    Ảnh "idle" có lớp mắt/miệng rời nên chớp mắt, nhép miệng, đổi biểu cảm được.
//    Tư thế chưa có ảnh thì mượn ảnh gần nhất (ALIAS). Có ảnh mới: thêm vào poses.json là tự dùng.
//  - Hình tạm (SVG dựng bằng code): dùng khi không có poses.json, hoặc tư thế không có ảnh lẫn ảnh thay thế.

const gsap = window.gsap;
const BASE = 'assets/hieu/';

// trang phục của hình tạm: main (trench lửng), run (về đích marathon), hike (đỉnh núi), photo (bên hồ)
export const OUTFITS = ['main', 'run', 'hike', 'photo'];
const POSE_OUTFIT = {
  idle: 'main', wave: 'main', signature: 'main', pout: 'main', cheer: 'main', touched: 'main', letter: 'main', blow: 'main', highfive: 'main', archer: 'main',
  run: 'run', runfront: 'run', finish: 'run', medal: 'run', walk: 'hike', point: 'hike', rest: 'hike', summit: 'hike', camera: 'photo', camfront: 'photo',
};
// tâm trạng -> [mắt, miệng]
const MOODS = {
  calm: ['open', 'smile'], happy: ['happy', 'grin'], excited: ['star', 'grin'], love: ['heart', 'grin'],
  surprised: ['star', 'o'], pout: ['open', 'pout'], wink: ['wink', 'cat'], touched: ['teary', 'smile'],
  focus: ['open', 'cat'], cheeky: ['wink', 'tongue'], blow: ['closed', 'o'], proud: ['happy', 'smile'],
};
// Tư thế chưa có ảnh riêng thì mượn ảnh khác (thử lần lượt theo fallback).
// frames > 1 ảnh: thay phiên (chạy). lean: nghiêng người (độ). step: lật ngang theo nhịp bước.
const ALIAS = {
  run: { frames: ['runA', 'runB'], ms: 120 },
  runfront: { frames: ['runF1', 'runF2'], ms: 150, fallback: { frames: ['finish'], step: true } },
  cheer: { frames: ['jump'], fallback: { frames: ['laugh'] } },
  highfive: { frames: ['wave'] },
  touched: { frames: ['idle'] },
  letter: { frames: ['idle'] },
  blow: { frames: ['idle'], lean: 7 },
  surprised: { frames: ['signature'] },
  camfront: { frames: ['camlaugh'] },
};

const INK = '#3A2A20';

function svgMarkup() {
  return `<svg class="pup" viewBox="0 0 300 560" aria-hidden="true" focusable="false">
  <g class="pup-all">
    <path class="hair hair-back" d="M72 150 C56 230 52 330 64 418 Q78 446 100 432 Q118 452 138 436 Q150 452 162 436 Q182 452 200 432 Q222 446 236 418 C248 330 244 230 228 150 Z"/>
    <path class="hair ponytail" d="M214 104 C262 96 284 160 268 236 C262 262 252 286 238 292 C246 246 246 196 222 150 Z"/>
    <g class="cape"><path d="M104 270 L196 270 L232 452 Q150 474 68 452 Z"/>
      <path class="ns star-dot" d="M100 400 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z M196 420 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z M150 446 l2 5 5 1 -4 4 1 5 -4 -2 -4 2 1 -5 -4 -4 5 -1z"/></g>

    <g class="leg leg-r"><g class="leg-in">
      <rect class="skin" x="121" y="436" width="26" height="90" rx="11"/>
      <rect class="sock sock-short" x="121" y="500" width="26" height="24" rx="7"/>
      <rect class="sock sock-long" x="121" y="462" width="26" height="62" rx="9"/>
      <path class="shoe" d="M117 518 h32 q10 0 10 12 v6 q0 7 -7 7 h-38 q-9 0 -9 -9 q0 -16 12 -16z"/>
      <path class="strap ns-fill" d="M120 528 h30"/>
    </g></g>
    <g class="leg leg-l"><g class="leg-in">
      <rect class="skin" x="153" y="436" width="26" height="90" rx="11"/>
      <rect class="sock sock-short" x="153" y="500" width="26" height="24" rx="7"/>
      <rect class="sock sock-long" x="153" y="462" width="26" height="62" rx="9"/>
      <path class="shoe" d="M183 518 h-32 q-10 0 -10 12 v6 q0 7 7 7 h38 q9 0 9 -9 q0 -16 -12 -16z"/>
      <path class="strap ns-fill" d="M150 528 h30"/>
    </g></g>

    <path class="pants pants-hike" d="M104 398 L196 398 L206 528 L158 528 L150 456 L142 528 L94 528 Z"/>
    <path class="pants pants-photo" d="M106 398 L194 398 L210 530 L160 530 L150 462 L140 530 L90 530 Z"/>
    <g class="skirt"><path d="M106 396 L194 396 L218 478 Q150 494 82 478 Z"/>
      <path class="ns-fill fold" d="M128 404 L116 480 M150 404 L150 486 M172 404 L184 480"/></g>
    <path class="shorts" d="M104 396 L196 396 L204 450 L158 450 L150 426 L142 450 L96 450 Z"/>

    <path class="torso" d="M106 262 Q150 250 194 262 L200 406 Q150 416 100 406 Z"/>
    <g class="peplum"><path d="M98 384 Q150 396 202 384 L210 414 Q180 426 150 420 Q120 426 90 414 Z"/>
      <path class="ns-fill lace" d="M92 416 q5 7 10 1 q5 7 10 1 q5 7 10 1 q5 7 10 1 q5 7 10 1 q5 7 10 1 q5 7 10 1 q5 7 10 1 q5 7 10 1 q5 7 10 1 q5 7 10 1 q5 7 10 1"/></g>
    <g class="bib"><rect x="122" y="342" width="56" height="40" rx="4"/><rect class="ns stripe" x="124.5" y="344.5" width="51" height="9"/></g>
    <g class="tied"><path d="M98 392 Q150 408 202 392 L206 412 Q150 428 94 412 Z"/>
      <path d="M140 410 Q128 440 118 470 L134 474 Q144 444 152 414 Z"/><path d="M160 410 Q172 440 184 470 L168 474 Q158 444 150 414 Z"/></g>
    <path class="belt" d="M106 396 h88 v10 h-88z"/>
    <g class="coat coat-short">
      <path d="M104 260 L140 270 L148 394 L96 398 Z"/><path d="M196 260 L160 270 L152 394 L204 398 Z"/>
      <path class="lapel" d="M140 270 L118 304 L130 306 L124 330 L148 300 Z"/><path class="lapel" d="M160 270 L182 304 L170 306 L176 330 L152 300 Z"/>
      <circle class="btn" cx="122" cy="352" r="5"/><circle class="btn" cx="122" cy="376" r="5"/><circle class="btn" cx="178" cy="352" r="5"/><circle class="btn" cx="178" cy="376" r="5"/><circle class="btn" cx="124" cy="296" r="4"/>
    </g>
    <g class="coat coat-long">
      <path d="M102 258 L138 268 L146 488 L92 486 Z"/><path d="M198 258 L162 268 L154 488 L208 486 Z"/>
      <path class="lapel" d="M138 268 L114 306 L126 308 L120 336 L146 300 Z"/><path class="lapel" d="M162 268 L186 306 L174 308 L180 336 L154 300 Z"/>
      <circle class="btn" cx="118" cy="360" r="5"/><circle class="btn" cx="182" cy="360" r="5"/>
    </g>
    <g class="bag"><path class="ns-fill strap-line" d="M196 266 L120 400"/><rect x="100" y="392" width="44" height="34" rx="8"/><path class="ns-fill" d="M104 404 h36"/></g>
    <g class="sling"><path class="ns-fill strap-line" d="M196 266 L118 380"/><rect x="104" y="372" width="36" height="24" rx="8"/><rect class="pouch" x="186" y="398" width="16" height="22" rx="6"/></g>
    <rect class="skin neck" x="137" y="242" width="26" height="28" rx="9"/>
    <g class="ribbon"><path class="ns-fill" d="M150 268 L140 322 M150 268 L160 322"/><path d="M150 268 l-12 -6 v12z M150 268 l12 -6 v12z"/></g>
    <path class="lanyard ns-fill" d="M134 266 Q150 330 166 266"/>
    <g class="medal"><path class="ns-fill" d="M134 266 L150 318 L166 266"/><circle cx="150" cy="326" r="13"/><path class="ns" d="M150 318 l3 6 6 1 -4 4 1 6 -6 -3 -6 3 1 -6 -4 -4 6 -1z"/></g>

    <g transform="translate(103 274)"><g class="arm arm-r">
      <g transform="translate(0 56)"><g class="fore">
        <g class="flag"><path class="pole ns-fill" d="M0 50 L0 196"/>
          <g transform="translate(0 196) rotate(-142)"><g class="cloth"><path d="M0 0 h-92 v58 h92z"/><path class="ns flag-star" d="M-46 10 l5.3 16.3 h17.1 l-13.8 10 5.3 16.3 -13.9 -10.1 -13.9 10.1 5.3 -16.3 -13.8 -10 h17.1z"/></g></g></g>
        <rect class="sleeve-fore" x="-15" y="-6" width="30" height="50" rx="14"/>
        <path class="cuff ns-fill" d="M-14 40 h28"/>
        <circle class="skin hand" cx="0" cy="58" r="15"/>
        <rect class="skin thumb" x="-5" y="64" width="11" height="17" rx="5.5"/>
      </g></g>
      <rect class="sleeve-up" x="-17" y="-8" width="34" height="68" rx="16"/>
    </g></g>
    <g transform="translate(197 274)"><g class="arm arm-l">
      <g transform="translate(0 56)"><g class="fore">
        <g class="bow"><path class="ns-fill string" d="M-84 34 L84 34"/><path class="limb" d="M-84 34 Q0 82 84 34"/></g>
        <rect class="sleeve-fore" x="-15" y="-6" width="30" height="50" rx="14"/>
        <path class="cuff ns-fill" d="M-14 40 h28"/>
        <rect class="watch" x="-15" y="30" width="30" height="10" rx="3"/>
        <circle class="skin hand glove" cx="0" cy="58" r="15"/>
        <rect class="skin thumb" x="-6" y="64" width="11" height="17" rx="5.5"/>
      </g></g>
      <rect class="sleeve-up" x="-17" y="-8" width="34" height="68" rx="16"/>
    </g></g>

    <g class="head">
      <ellipse class="skin face" cx="150" cy="166" rx="94" ry="86"/>
      <g class="eyes">
        <g class="e e-open"><ellipse class="pupil" cx="118" cy="188" rx="15" ry="19"/><ellipse class="pupil" cx="182" cy="188" rx="15" ry="19"/><circle class="hl" cx="123" cy="181" r="6"/><circle class="hl" cx="187" cy="181" r="6"/><circle class="hl" cx="113" cy="196" r="3"/><circle class="hl" cx="177" cy="196" r="3"/></g>
        <g class="e e-closed"><path d="M102 190 Q118 202 134 190"/><path d="M166 190 Q182 202 198 190"/></g>
        <g class="e e-happy"><path d="M103 196 Q118 176 133 196"/><path d="M167 196 Q182 176 197 196"/></g>
        <g class="e e-star"><path class="star" d="M118 168 l6 13 14 2 -10 10 2 14 -12 -7 -12 7 2 -14 -10 -10 14 -2z"/><path class="star" d="M182 168 l6 13 14 2 -10 10 2 14 -12 -7 -12 7 2 -14 -10 -10 14 -2z"/></g>
        <g class="e e-heart"><path class="heart" d="M118 204 C96 190 104 170 118 182 C132 170 140 190 118 204Z"/><path class="heart" d="M182 204 C160 190 168 170 182 182 C196 170 204 190 182 204Z"/></g>
        <g class="e e-wink"><ellipse class="pupil" cx="118" cy="188" rx="15" ry="19"/><circle class="hl" cx="123" cy="181" r="6"/><path d="M168 194 Q182 178 196 194"/></g>
        <g class="e e-teary"><ellipse class="pupil" cx="118" cy="188" rx="16" ry="20"/><ellipse class="pupil" cx="182" cy="188" rx="16" ry="20"/><circle class="hl" cx="123" cy="180" r="7"/><circle class="hl" cx="187" cy="180" r="7"/><circle class="hl" cx="112" cy="196" r="4"/><circle class="hl" cx="176" cy="196" r="4"/><path class="tear" d="M104 206 q-6 12 0 16 q6 -4 0 -16z"/></g>
      </g>
      <g class="blush"><ellipse cx="100" cy="216" rx="16" ry="8"/><ellipse cx="200" cy="216" rx="16" ry="8"/></g>
      <circle class="nose ns" cx="150" cy="208" r="2.5"/>
      <g class="mouths">
        <path class="m m-smile ns-fill" d="M139 224 Q150 233 161 224"/>
        <path class="m m-grin" d="M136 221 Q150 222 164 221 Q162 240 150 240 Q138 240 136 221Z"/>
        <path class="m m-open" d="M138 220 Q150 218 162 220 Q164 246 150 246 Q136 246 138 220Z"/>
        <ellipse class="m m-o" cx="150" cy="229" rx="7" ry="9"/>
        <path class="m m-cat ns-fill" d="M136 224 q7 8 14 0 q7 8 14 0"/>
        <path class="m m-pout ns-fill" d="M143 230 q7 -6 14 0"/>
        <g class="m m-tongue"><path class="ns-fill" d="M138 224 Q150 232 162 224"/><path class="tongue" d="M146 228 q4 12 10 0z"/></g>
      </g>
      <path class="hair hair-top" d="M58 172 C50 96 96 60 150 60 C204 60 250 96 242 172 L232 160 L226 140 L216 162 L206 136 L196 160 L184 132 L174 158 L162 130 L152 156 L140 130 L128 158 L116 134 L106 160 L96 138 L86 162 L74 142 L68 166 Z"/>
      <path class="hair side side-r" d="M60 160 C54 200 58 236 72 262 C78 230 74 196 76 168 Z"/>
      <path class="hair side side-l" d="M240 160 C246 200 242 236 228 262 C222 230 226 196 224 168 Z"/>
      <path class="hair-hl ns-fill" d="M104 84 Q130 72 158 74"/>
      <g class="visor"><path d="M70 128 Q150 104 230 128 L230 142 Q150 120 70 142 Z"/><path d="M76 138 Q150 114 224 138 Q240 162 150 160 Q60 162 76 138Z"/></g>
      <g class="bucket"><path d="M78 118 Q80 52 150 50 Q220 52 222 118 Z"/><path d="M52 122 Q150 92 248 122 Q256 138 150 136 Q44 138 52 122Z"/></g>
      <g class="shades"><path d="M96 178 h44 q2 26 -22 26 q-22 0 -22 -26z"/><path d="M160 178 h44 q0 26 -22 26 q-24 0 -22 -26z"/><path class="ns-fill" d="M140 182 h20"/></g>
      <g class="party"><g transform="translate(196 74) rotate(22)"><path d="M-40 26 L0 -78 L40 26 Q0 40 -40 26Z"/><path class="ns stripe2" d="M-26 -10 L12 -22 L18 -4 L-32 10Z M-14 -44 L4 -50 L8 -36 L-20 -30Z"/><circle cx="0" cy="-82" r="12"/></g></g>
    </g>

    <g class="camera-front"><rect x="56" y="186" width="66" height="44" rx="9"/><circle class="lens" cx="80" cy="208" r="13"/><circle class="ns" cx="80" cy="208" r="5"/><rect class="ns flash" x="104" y="192" width="10" height="7" rx="2"/>
      <circle class="skin" cx="122" cy="226" r="14"/><circle class="skin" cx="58" cy="230" r="14"/></g>
    <g class="letter"><rect x="112" y="292" width="76" height="50" rx="6"/><path class="ns-fill" d="M112 296 L150 324 L188 296"/><path class="ns heart-seal" d="M150 330 C140 322 144 314 150 320 C156 314 160 322 150 330Z"/></g>
    <g class="arrow"><path class="ns-fill shaft" d="M202 272 L330 214"/><path class="tip" d="M336 211 L323.7 223.3 L318.7 212.3 Z"/><path class="ns-fill fletch" d="M202 272 l-6 -12 M202 272 l-12 2"/></g>
  </g>
</svg>`;
}

export class Hieu {
  constructor(root, { reduced = false, poses = null } = {}) {
    this.root = root;
    this.reduced = reduced;
    this.rig = root.querySelector('.hieu-rig');
    this.P = poses?.poses || {};
    this.F = poses?.face || {};
    this.body = document.createElement('div');
    this.body.className = 'hieu-body';
    this.rig.appendChild(this.body);
    this.body.innerHTML = svgMarkup();
    this.svg = this.body.querySelector('.pup');
    this.boxes = {};
    this.hat = new Image();
    this.hat.className = 'hat';
    this.hat.alt = '';
    this.hat.src = 'assets/deco/hat-orange.webp';
    this.hat.hidden = true;
    this.eyes = 'open';
    this.mouth = 'smile';
    this._shown = ['open', 'smile'];
    this.pose('idle');
    this.feel('calm');
    if (!reduced) this._blinkLoop();
  }

  /** Danh sách ảnh để tải trước */
  files() { return [...Object.values(this.P).map((p) => BASE + p.file), ...Object.values(this.F).map((f) => BASE + f.file)]; }
  /** Có ảnh thật cho tư thế này không */
  has(name) { return !!this.P[name]; }
  /** Ảnh đang hiện (để ghép ảnh lưu niệm) */
  get currentFile() { return this.cur ? BASE + this.P[this.cur].file : null; }

  _resolve(name) {
    if (this.P[name]) return { frames: [name] };
    let a = ALIAS[name];
    while (a) {
      if (a.frames.every((f) => this.P[f])) return a;
      a = a.fallback;
    }
    return null;
  }

  _box(key) {
    if (this.boxes[key]) return this.boxes[key];
    const p = this.P[key];
    const box = document.createElement('div');
    box.className = 'pose-box';
    box.hidden = true;
    box.style.setProperty('--ph', p.h);
    box.style.setProperty('--ax', p.ax);
    box.style.aspectRatio = String(p.ar || 0.5);
    const head = p.head || [p.ax, 0];
    box.style.setProperty('--hx', head[0]);
    box.style.setProperty('--hy', head[1]);
    const img = new Image();
    img.className = 'pose-img';
    img.alt = '';
    img.src = BASE + p.file;
    box.appendChild(img);
    if (p.face) {
      const face = document.createElement('div');
      face.className = 'face';
      this.faceImgs = {};
      for (const [k, f] of Object.entries(this.F)) {
        const el = new Image();
        el.alt = '';
        el.src = BASE + f.file;
        el.style.left = f.left + '%';
        el.style.top = f.top + '%';
        el.style.width = f.width + '%';
        el.hidden = true;
        face.appendChild(el);
        this.faceImgs[k] = el;
      }
      box.appendChild(face);
    }
    this.body.appendChild(box);
    this.boxes[key] = box;
    return box;
  }

  _showFrame(key, lean = 0) {
    const box = this._box(key);
    if (this.curBox && this.curBox !== box) this.curBox.hidden = true;
    box.hidden = false;
    box.style.rotate = lean + 'deg';
    this.curBox = box;
    this.cur = key;
    box.appendChild(this.hat);
    return box;
  }

  /** Đổi tư thế (hình tạm: kèm trang phục mặc định của tư thế, trừ khi truyền outfit) */
  pose(name, outfit) {
    const prev = this.poseName;
    this.poseName = name;
    clearInterval(this._cycleT);
    this.root.dataset.pose = name;
    const spec = this._resolve(name);
    this.root.classList.toggle('step', !!spec?.step && !this.reduced);
    if (!spec) {
      // hình tạm SVG
      if (this.curBox) this.curBox.hidden = true;
      this.cur = this.curBox = null;
      this.svg.style.display = '';
      this.svg.dataset.pose = name;
      this.svg.dataset.outfit = outfit || POSE_OUTFIT[name] || 'main';
      this.hat.hidden = true;
      return this;
    }
    this.svg.style.display = 'none';
    const box = this._showFrame(spec.frames[0], spec.lean);
    this.hat.hidden = !this._party;
    if (spec.frames.length > 1 && !this.reduced) {
      let k = 0;
      this._cycleT = setInterval(() => {
        k = (k + 1) % spec.frames.length;
        this._showFrame(spec.frames[k], spec.lean);
      }, spec.ms || 140);
    }
    if (this.P[this.cur].face) this._show(this.eyes, this.mouth);
    // đổi dáng: nảy nhẹ cho khỏi giật
    if (prev && prev !== name && !this.reduced && spec.frames.length === 1) {
      gsap.fromTo(box, { scaleX: 1.05, scaleY: 0.93 }, { scaleX: 1, scaleY: 1, duration: 0.35, ease: 'back.out(3)', overwrite: true });
    }
    return this;
  }

  /** Phụ kiện: 'party' (mũ sinh nhật) */
  extra(name, on = true) {
    if (name === 'party') {
      this._party = on;
      this.hat.hidden = !on || !this.cur;
    }
    this.svg.classList.toggle('x-' + name, on);
    return this;
  }

  feel(mood) {
    const f = MOODS[mood] || MOODS.calm;
    this.setFace(f[0], f[1]);
    return this;
  }

  setFace(eyes = this.eyes, mouth = this.mouth) {
    this.eyes = eyes;
    this.mouth = mouth;
    this._show(eyes, mouth);
  }

  _show(eyes, mouth) {
    this.svg.dataset.eyes = eyes;
    this.svg.dataset.mouth = mouth;
    this._shown = [eyes, mouth];
    if (!this.faceImgs) return;
    const m = mouth === 'open' ? 'grin' : mouth;
    const want = new Set([`eye-${eyes}-l`, `eye-${eyes}-r`, `mouth-${m}`]);
    for (const [k, el] of Object.entries(this.faceImgs)) el.hidden = !want.has(k);
  }

  talk(ms = 1800) {
    clearInterval(this._talkT);
    if (this.reduced) return;
    let open = false;
    const until = Date.now() + ms;
    const openMouth = () => (this.mouth === 'grin' || this.mouth === 'open' ? 'o' : 'grin');
    this._talkT = setInterval(() => {
      open = !open && Date.now() < until;
      this._show(this.eyes, open ? openMouth() : this.mouth);
      if (Date.now() >= until) { clearInterval(this._talkT); this._show(this.eyes, this.mouth); }
    }, 150);
  }

  _blinkLoop() {
    const tick = () => {
      if (this.eyes === 'open' && !document.hidden) {
        this._show('closed', this._shown[1]);
        setTimeout(() => this._show(this.eyes, this._shown[1]), 130);
      }
      this._blinkT = setTimeout(tick, 2600 + Math.random() * 1400);
    };
    this._blinkT = setTimeout(tick, 2000);
  }

  /** instant: ẩn ngay, không mờ dần (khi vào màn mà Hiếu chưa được xuất hiện) */
  hide(instant = false) {
    const r = this.root;
    if (!instant) { r.classList.add('is-hidden'); return; }
    r.style.transition = 'none';
    r.classList.add('is-hidden');
    void r.offsetWidth;
    r.style.removeProperty('transition');
  }
  show() { this.root.classList.remove('is-hidden'); }
  /** Nhịp chuyển động nền: 'run' (nhún khi chạy), 'sway' (lắc nhẹ), 'aim' (rung khi ngắm), 'float' (bồng bềnh). null: chỉ thở */
  anim(name) {
    if (name && !this.reduced) this.root.dataset.anim = name;
    else delete this.root.dataset.anim;
    return this;
  }
  running(on) { return this.anim(on ? 'run' : null); }

  /** Vị trí trong màn (cqw / cqh). moveTo() không tham số: về vị trí mặc định của màn */
  moveTo(x, y, h) {
    const s = this.root.style;
    if (x == null) { s.removeProperty('--mx'); s.removeProperty('--my'); s.removeProperty('--mh'); return; }
    s.setProperty('--mx', x + 'cqw');
    if (y != null) s.setProperty('--my', y + 'cqh');
    if (h != null) s.setProperty('--mh', h + 'cqh');
  }

  face(dir) { gsap.to(this.rig, { scaleX: dir < 0 ? -1 : 1, duration: 0.25, ease: 'power2.out' }); }

  hop(times = 1, height = '-12%') {
    if (this.reduced) return gsap.timeline();
    const tl = gsap.timeline();
    for (let i = 0; i < times; i++) {
      tl.to(this.rig, { y: height, scaleY: 1.03, duration: 0.22, ease: 'power2.out' })
        .to(this.rig, { y: 0, scaleY: 0.95, duration: 0.2, ease: 'power2.in' })
        .to(this.rig, { scaleY: 1, duration: 0.15, ease: 'power2.out' });
    }
    return tl;
  }

  wiggle() {
    if (this.reduced) return gsap.timeline();
    return gsap.timeline()
      .to(this.rig, { rotation: -5, duration: 0.15, ease: 'power2.out' })
      .to(this.rig, { rotation: 5, duration: 0.25, ease: 'sine.inOut', repeat: 3, yoyo: true })
      .to(this.rig, { rotation: 0, duration: 0.25, ease: 'power3.out' });
  }

  pop() {
    if (this.reduced) return gsap.timeline();
    return gsap.timeline().fromTo(this.rig, { scale: 0.2, y: '30%' }, { scale: 1, y: 0, duration: 0.7, ease: 'back.out(2.2)' });
  }

  reset() {
    clearInterval(this._talkT);
    clearInterval(this._cycleT);
    gsap.killTweensOf(this.rig);
    gsap.set(this.rig, { clearProps: 'transform' });
    this.root.style.removeProperty('transition');
    this.root.classList.remove('in-box');
    this.anim(null);
    this.extra('party', false);
    this.moveTo();
    this.pose('idle');
    this.feel('calm');
  }
}

export { INK };
