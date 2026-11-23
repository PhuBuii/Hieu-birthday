// Chibi Phú. Hai lớp:
//  - Ảnh vẽ sẵn từng dáng (đứng yên, vẫy, đập tay, thổi nến, cười, nhảy, giơ tay, 2 khung đi) trong
//    assets/phu/poses.json, tạo bởi tools/build_hieu.py từ bảng 08b, 08c. Đây là cách hiển thị chính.
//  - Dự phòng: bộ mảnh rời từ chibi-hello (assets/phu/rig, hệ tọa độ 1086 × 1448), xoay khớp tay.
//    Chỉ dùng khi thiếu poses.json hoặc thiếu ảnh của một động tác.

const gsap = window.gsap;
const L = {
  body: [357, 660, 375, 467], sideL: ['side-l', 349, 776, 65, 246], sideR: ['side-r', 673, 775, 37, 189],
  head: [192, 7, 704, 710], legL: ['leg-l', 310, 1100, 239, 327], legR: ['leg-r', 533, 1100, 245, 327],
  irisL: ['iris-l', 377, 431, 110, 122], irisR: ['iris-r', 603, 431, 110, 122], lens: ['lens-cover', 305, 396, 479, 172],
  armLUp: ['arm-l-upper', 288, 776, 142, 164], armLFore: ['arm-l-fore', 243, 877, 143, 180], handL: ['hand-l', 221, 979, 112, 116],
  armRUp: ['arm-r-upper', 657, 778, 143, 165], armRFore: ['arm-r-fore', 700, 876, 143, 180], handR: ['hand-r', 753, 980, 113, 113],
  armLOrig: ['arm-l-orig', 214, 766, 213, 325], armROrig: ['arm-r-orig', 659, 768, 215, 323],
  blinkL: ['blink-l', 350, 481, 126, 38], blinkR: ['blink-r', 607, 481, 131, 39],
  happyL: ['happy-l', 365, 458, 97, 62], happyR: ['happy-r', 624, 459, 96, 62],
  mouthOpen: ['mouth-open', 489, 595, 112, 66], mouthO: ['mouth-o', 518, 595, 54, 70],
};
const img = (l, name) => {
  const [n, x, y, w, h] = typeof l[0] === 'string' ? l : [name, ...l];
  return `<image href="assets/phu/rig/${n}.webp" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
};

function markup() {
  return `<svg class="pr" viewBox="180 0 730 1440" aria-hidden="true" focusable="false">
  <g class="pr-body">
    <g class="pr-leg pr-leg--l">${img(L.legL)}</g>
    <g class="pr-leg pr-leg--r">${img(L.legR)}</g>
    <g class="pr-arm pr-arm--l">
      <g class="pr-fore pr-fore--l">${img(L.armLFore)}${img(L.handL)}</g>
      ${img(L.armLUp)}
      <g class="pr-orig">${img(L.armLOrig)}</g>
    </g>
    <g class="pr-arm pr-arm--r">
      <g class="pr-fore pr-fore--r"><g class="pr-wag">${img(L.armRFore)}${img(L.handR)}</g></g>
      ${img(L.armRUp)}
      <g class="pr-orig">${img(L.armROrig)}</g>
    </g>
    ${img(L.body, 'body')}
    <g class="pr-side pr-side--l">${img(L.sideL)}</g>
    <g class="pr-side pr-side--r">${img(L.sideR)}</g>
    <g class="pr-head">
      <rect class="pr-sclera" x="335" y="410" width="165" height="150"/>
      <rect class="pr-sclera" x="585" y="410" width="170" height="150"/>
      <g class="pr-iris">${img(L.irisL)}</g>
      <g class="pr-iris">${img(L.irisR)}</g>
      ${img(L.head, 'head')}
      <g class="pr-shut">
        ${img(L.lens)}
        <g class="pr-lid pr-lid--blink">${img(L.blinkL)}${img(L.blinkR)}</g>
        <g class="pr-lid pr-lid--happy">${img(L.happyL)}${img(L.happyR)}</g>
      </g>
      <g class="pr-mouth pr-mouth--open"><rect class="pr-skin" x="466" y="592" width="158" height="46" rx="20"/>${img(L.mouthOpen)}</g>
      <g class="pr-mouth pr-mouth--o"><rect class="pr-skin" x="466" y="592" width="158" height="46" rx="20"/>${img(L.mouthO)}</g>
      <g class="pr-party"><g transform="translate(600 40) rotate(18)">
        <image href="assets/deco/hat-mint.webp" x="-125" y="-262" width="250" height="351"/>
      </g></g>
    </g>
  </g>
</svg>`;
}


const BASE = 'assets/phu/poses/';

export class Phu {
  constructor(root, { reduced = false, poses = null } = {}) {
    this.root = root;
    this.reduced = reduced;
    this.rig = root.querySelector('.phu-rig');
    this.rig.innerHTML = markup();
    this._t = {};
    this._onMove = (e) => this.lookAt(e.clientX, e.clientY);
    this.P = poses?.poses || {};
    this.boxes = {};
    this.cur = null;
    this.hat = new Image();
    this.hat.className = 'hat';
    this.hat.alt = '';
    this.hat.src = 'assets/deco/hat-mint.webp';
    this.hat.hidden = true;
    this._pose(null, false);
  }

  /** Ảnh động tác cần tải trước */
  files() { return Object.values(this.P).map((p) => BASE + p.file); }
  has(name) { return !!this.P[name]; }

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
    const im = new Image();
    im.className = 'pose-img';
    im.alt = '';
    im.src = BASE + p.file;
    box.appendChild(im);
    this.rig.appendChild(box);
    this.boxes[key] = box;
    return box;
  }

  /** Hiện ảnh một động tác. null: về dáng đứng yên (ảnh "idle" nếu có, không thì bộ mảnh) */
  _pose(key, squash = true) {
    clearInterval(this._cycleT);
    if (this.cur) this.boxes[this.cur].hidden = true;
    this.cur = key && this.P[key] ? key : this.P.idle ? 'idle' : null;
    this.root.classList.toggle('img-pose', !!this.cur);
    this.hat.hidden = !this._party || !this.cur;
    if (!this.cur) return;
    const b = this._box(this.cur);
    b.hidden = false;
    b.appendChild(this.hat);
    if (squash && !this.reduced) gsap.fromTo(b, { scaleX: 1.05, scaleY: 0.93 }, { scaleX: 1, scaleY: 1, duration: 0.35, ease: 'back.out(3)', overwrite: true });
  }
  /** Giữ động tác trong ms rồi về dáng đứng yên */
  _hold(key, ms) {
    this._pose(key);
    clearTimeout(this._holdT);
    if (ms) this._holdT = setTimeout(() => this._pose(null), ms);
  }

  // cách cũ (xoay khớp tay), chỉ dùng khi chưa có ảnh động tác
  _state(cls, ms) {
    this.root.classList.add(cls);
    clearTimeout(this._t[cls]);
    if (ms) this._t[cls] = setTimeout(() => this.root.classList.remove(cls), ms);
  }
  _off(cls) { clearTimeout(this._t[cls]); this.root.classList.remove(cls); }

  wave(ms = 1600) { if (this.has('wave')) this._hold('wave', ms); else this._state('is-waving', ms); return this; }
  highfive(ms = 1600) { if (this.has('highfive')) this._hold('highfive', ms); else this.wave(ms); return this; }
  laugh(ms = 1600) { if (this.has('laugh')) this._hold('laugh', ms); else this.wave(ms); return this; }
  jump() {
    if (!this.has('jump')) { this._state('is-jump', 600); return this; }
    this._hold('jump', 700);
    if (!this.reduced) {
      gsap.timeline()
        .to(this.rig, { y: '-14%', duration: 0.24, ease: 'power2.out' })
        .to(this.rig, { y: 0, duration: 0.22, ease: 'power2.in' })
        .to(this.rig, { scaleY: 0.94, scaleX: 1.04, duration: 0.08 })
        .to(this.rig, { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'elastic.out(1, .4)' });
    }
    return this;
  }
  blow(on = true) {
    if (this.has('blow')) { clearTimeout(this._holdT); this._pose(on ? 'blow' : null); } else if (on) this._state('is-blow'); else this._off('is-blow');
    return this;
  }
  cheer(on = true) {
    if (this.has('cheer')) { clearTimeout(this._holdT); this._pose(on ? 'cheer' : null); } else if (on) this._state('is-cheer'); else this._off('is-cheer');
    return this;
  }
  party(on = true) {
    this._party = on;
    this.root.classList.toggle('has-party', on);
    this.hat.hidden = !on || !this.cur;
    return this;
  }

  /** Đầu và tròng mắt nhìn theo con trỏ / ngón tay (dáng đứng yên) */
  follow(on = true) {
    removeEventListener('pointermove', this._onMove);
    if (on && !this.reduced) addEventListener('pointermove', this._onMove, { passive: true });
  }
  lookAt(x, y) {
    const r = this.root.getBoundingClientRect();
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    this.root.style.setProperty('--lx', clamp((x - (r.left + r.width / 2)) / (innerWidth * 0.35)).toFixed(3));
    this.root.style.setProperty('--ly', clamp((y - (r.top + r.height * 0.3)) / (innerHeight * 0.4)).toFixed(3));
  }

  hide() { this.root.classList.add('is-hidden'); }
  show() { this.root.classList.remove('is-hidden'); }

  /** Đi vào từ mép phải màn hình (có ảnh đi bộ thì bước 2 khung, không thì lắc lư) */
  walkIn() {
    this.show();
    if (this.reduced) return gsap.timeline();
    const steps = this.has('walkA') && this.has('walkB');
    if (steps) {
      let k = 0;
      this._pose('walkA', false);
      clearInterval(this._walkT);
      this._walkT = setInterval(() => { k ^= 1; this._pose(k ? 'walkB' : 'walkA', false); }, 160);
    }
    const tl = gsap.timeline({ onComplete: () => { if (steps) { clearInterval(this._walkT); this._pose(null); } } })
      .fromTo(this.rig, { x: '160%' }, { x: 0, duration: 1.1, ease: 'power2.out' });
    if (!steps) {
      tl.fromTo(this.rig, { rotation: -4 }, { rotation: 4, duration: 0.18, repeat: 5, yoyo: true, ease: 'sine.inOut' }, 0)
        .to(this.rig, { rotation: 0, duration: 0.2 });
    }
    return tl;
  }

  reset() {
    ['is-waving', 'is-jump', 'is-blow', 'is-cheer'].forEach((c) => this._off(c));
    clearTimeout(this._holdT);
    clearInterval(this._walkT);
    this._pose(null);
    this.party(false);
    this.follow(false);
    gsap.killTweensOf(this.rig);
    gsap.set(this.rig, { clearProps: 'transform' });
    this.hide();
  }
}
