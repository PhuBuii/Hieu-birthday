// Ảnh kỷ niệm 1080 × 1350 "HAPPY OUR BIRTHDAY", vẽ bằng canvas ngay trên máy người xem. Không gửi dữ liệu đi đâu.

const W = 1080, H = 1350;

function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

/** Lấy các luật CSS của chibi tạm (.pup) để nhúng vào SVG khi vẽ lên canvas */
function pupCss() {
  const root = getComputedStyle(document.documentElement);
  const vars = ['--line', '--gold', '--orange', '--cream', '--blush', '--ease-out'].map((v) => `${v}:${root.getPropertyValue(v)}`).join(';');
  let css = `.pup{${vars}}`;
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) if (r.selectorText && r.selectorText.includes('.pup')) css += r.cssText;
  }
  // ảnh tĩnh: tắt mọi chuyển động
  return css + '.pup *{animation:none!important;transition:none!important}';
}

function svgToImg(svg, w, h) {
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', w);
  clone.setAttribute('height', h);
  clone.removeAttribute('style');
  return clone;
}


/** Ảnh Hiếu cho ảnh kỷ niệm: ảnh AI dáng cười (kèm đỉnh đầu để đội mũ). Chưa có ảnh AI thì dùng hình tạm */
async function hieuImage(hieu) {
  const pick = ['cheer', 'laugh', 'wave', 'idle'].find((n) => hieu.has(n));
  if (pick) {
    const p = hieu.P[pick];
    return { img: await loadImg('assets/hieu/' + p.file), head: p.head || [p.ax, 0], ph: p.h || 1, ax: p.ax ?? 0.5 };
  }
  const s = svgToImg(hieu.svg, 600, 1120);
  s.dataset.pose = 'cheer';
  s.dataset.outfit = 'main';
  s.dataset.eyes = 'happy';
  s.dataset.mouth = 'grin';
  s.classList.add('x-party');
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = pupCss();
  s.insertBefore(style, s.firstChild);
  const xml = new XMLSerializer().serializeToString(s);
  return { img: await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)), head: null, ph: 1, ax: 0.5 };
}

/** Bánh ghép từ ảnh: bánh + nến 2, 4 + lửa, vẽ ra một canvas riêng */
async function cakeImage() {
  const [cake, c2, c4, fl] = await Promise.all(['cake', 'candle-2', 'candle-4', 'flame-2'].map((n) => loadImg(`assets/deco/${n}.webp`)));
  const w = 600, k = w / cake.width, ch = cake.height * k;
  const cw = w * 0.19, top = 230;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = Math.round(ch + top);
  const x = cv.getContext('2d');
  // giống CSS: nến đứng trên mặt bánh (đáy nến cách đáy ảnh bánh 71%), vẽ sau bánh
  x.drawImage(cake, 0, top, w, ch);
  [[c2, 0.29, -0.07], [c4, 0.51, 0.07]].forEach(([img, left, rot]) => {
    const h = cw * img.height / img.width;
    x.save();
    x.translate(w * left + cw / 2, top + ch * 0.29);
    x.rotate(rot);
    x.drawImage(img, -cw / 2, -h, cw, h);
    const fw = cw * 0.68, fh = fw * fl.height / fl.width;
    x.shadowColor = 'rgba(255,190,90,.95)';
    x.shadowBlur = 26;
    x.drawImage(fl, -fw / 2, -h - fh + h * 0.12, fw, fh);
    x.restore();
  });
  return cv;
}

function cover(x, img, w, h) {
  const k = Math.max(w / img.width, h / img.height);
  const dw = img.width * k, dh = img.height * k;
  x.drawImage(img, (w - dw) / 2, h - dh, dw, dh);
}

export async function makeKeepsake(C, hieu, phu, { story = false } = {}) {
  // story: khổ 9:16 (1080 × 1920) để đăng tin; chữ dời xuống, nhân vật vẫn đứng sát đáy
  // story chừa khoảng trên/dưới cho thanh tên và ô trả lời của Instagram/Facebook che
  const W2 = W, H2 = story ? 1920 : H, top = story ? 330 : 0, bottom = story ? 190 : 0;
  await Promise.all([
    document.fonts.load('900 80px "Playfair Display"'),
    document.fonts.load('700 30px "Be Vietnam Pro"'),
    document.fonts.load('400 40px "Pacifico"'),
  ]).catch(() => {});
  const [hi, pImg, cImg, bg, hatO, hatM] = await Promise.all([
    hieuImage(hieu), loadImg(phu?.has('wave') ? 'assets/phu/poses/wave.webp' : 'assets/phu/idle-hoodie.webp'), cakeImage(),
    loadImg('assets/bg/nen-tiec.webp').catch(() => null), loadImg('assets/deco/hat-orange.webp'), loadImg('assets/deco/hat-mint.webp'),
  ]);

  const cv = document.createElement('canvas');
  cv.width = W2; cv.height = H2;
  const x = cv.getContext('2d');

  // nền: phòng tiệc (hoặc chuyển màu tím chiều sang cam nếu thiếu ảnh), phủ tối phía trên cho rõ chữ
  if (bg) cover(x, bg, W2, H2);
  else {
    const g = x.createLinearGradient(0, 0, 0, H2);
    g.addColorStop(0, '#2E2142'); g.addColorStop(0.55, '#6A3B57'); g.addColorStop(1, '#C8653F');
    x.fillStyle = g;
    x.fillRect(0, 0, W2, H2);
  }
  const sh = x.createLinearGradient(0, 0, 0, H2);
  sh.addColorStop(0, 'rgba(36,22,34,.82)'); sh.addColorStop(0.42, 'rgba(36,22,34,.5)'); sh.addColorStop(0.7, 'rgba(36,22,34,0)');
  x.fillStyle = sh;
  x.fillRect(0, 0, W2, H2);
  // pháo giấy
  const colors = ['#F26A2E', '#F5C242', '#6FC2A6', '#AFC3CE', '#F6B3B3', '#FFF6EA'];
  for (let i = 0; i < 80; i++) {
    x.save();
    x.translate(Math.random() * W2, 60 + Math.random() * (H2 - 260));
    x.rotate(Math.random() * Math.PI);
    x.fillStyle = colors[i % colors.length];
    x.globalAlpha = 0.85;
    x.fillRect(-7, -11, 14, 22);
    x.restore();
  }

  // tiêu đề
  x.textAlign = 'center';
  x.fillStyle = '#3A2A20';
  x.font = '900 128px "Playfair Display", Georgia, serif';
  x.fillText('HAPPY OUR', W2 / 2 + 6, 222 + top);
  x.fillText('BIRTHDAY', W2 / 2 + 6, 352 + top);
  x.fillStyle = '#FFE3A8';
  x.fillText('HAPPY OUR', W2 / 2, 216 + top);
  x.fillText('BIRTHDAY', W2 / 2, 346 + top);
  x.font = '700 34px "Be Vietnam Pro", system-ui, sans-serif';
  x.fillStyle = '#FFF6EA';
  x.fillText(C.scene7.sub, W2 / 2, 422 + top);

  // Hiếu (trái) đội mũ cam
  const base = H2 - 130 - bottom;
  const stand = 640;
  const hh = stand * hi.ph, hw = hh * hi.img.width / hi.img.height;
  const hx = 250 - hw * hi.ax, hy = base - hh;
  x.drawImage(hi.img, hx, hy, hw, hh);
  if (hi.head) hat(x, hatO, hx + hw * hi.head[0] + stand * 0.035, hy + hh * hi.head[1] + stand * 0.07, stand * 0.14, 0.35);
  // Phú (phải) đội mũ xanh bạc hà
  const pp = phu?.P?.wave;
  const ph = 640 * (pp?.h || 1), pw = ph * pImg.width / pImg.height;
  const px = 830 - pw * (pp?.ax ?? 0.5), py = base - ph;
  x.drawImage(pImg, px, py, pw, ph);
  if (pp) hat(x, hatM, px + pw * pp.head[0] + 640 * 0.05, py + ph * pp.head[1] + 640 * 0.1, 640 * 0.17, 0.32);
  else hat(x, hatM, px + pw * 0.6, py + ph * 0.1, 125, 0.32);
  // bánh ở giữa
  const cw = 360, ch = cw * cImg.height / cImg.width;
  x.drawImage(cImg, W2 / 2 - cw / 2, base - ch + 40, cw, ch);

  // lời chúc
  x.font = '400 40px "Pacifico", cursive';
  x.fillStyle = '#FFF6EA';
  x.shadowColor = 'rgba(0,0,0,.5)';
  x.shadowBlur = 10;
  x.fillText(C.scene7.wish, W2 / 2, H2 - 50 - bottom);

  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'));
}

/** Mũ tiệc: (cx, cy) là giữa vành mũ */
function hat(x, img, cx, cy, w, rot) {
  const h = w * img.height / img.width;
  x.save();
  x.translate(cx, cy);
  x.rotate(rot);
  x.drawImage(img, -w / 2, -h, w, h);
  x.restore();
}
