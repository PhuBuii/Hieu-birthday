// Ảnh kỷ niệm 1080 × 1350 "HAPPY OUR BIRTHDAY" kiểu vé lưu niệm (cuống vé có tên hai người + ngày), vẽ bằng canvas ngay trên máy người xem. Không gửi dữ liệu đi đâu.

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
  // story: khổ 9:16 (1080 × 1920) để đăng tin; vé chừa khoảng trên/dưới cho thanh tên và ô trả lời của Instagram/Facebook
  const W2 = W, H2 = story ? 1920 : H, top = story ? 200 : -24, bottom = 0;
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

  // khung vé: viền ngoài màu mực, vé bo góc ở trong, cuống vé phía dưới cách bằng đường răng cưa
  const M = 30, R = 40, STUB = 210;
  const T = { x: M, y: M + (story ? 120 : 0), w: W2 - 2 * M };
  T.h = H2 - T.y - M - (story ? 150 : 0);
  const cut = T.y + T.h - STUB; // y của đường xé
  x.fillStyle = '#2A2122';
  x.fillRect(0, 0, W2, H2);
  const ticketPath = () => {
    x.beginPath();
    x.roundRect(T.x, T.y, T.w, T.h, R);
  };
  x.save();
  ticketPath();
  x.clip();
  // cảnh vẽ theo khổ rộng 1080 rồi co đều vào thân vé; VH là chiều cao thân vé theo khổ đó
  const k = T.w / W2, VH = (cut - T.y) / k;
  x.translate(T.x, T.y);
  x.scale(k, k);

  // nền: phòng tiệc (hoặc chuyển màu tím chiều sang cam nếu thiếu ảnh), phủ tối phía trên cho rõ chữ
  if (bg) cover(x, bg, W2, VH);
  else {
    const g = x.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#2E2142'); g.addColorStop(0.55, '#6A3B57'); g.addColorStop(1, '#C8653F');
    x.fillStyle = g;
    x.fillRect(0, 0, W2, VH);
  }
  const sh = x.createLinearGradient(0, 0, 0, VH);
  sh.addColorStop(0, 'rgba(36,22,34,.82)'); sh.addColorStop(0.42, 'rgba(36,22,34,.5)'); sh.addColorStop(0.7, 'rgba(36,22,34,0)');
  x.fillStyle = sh;
  x.fillRect(0, 0, W2, VH);
  // pháo giấy
  const colors = ['#F26A2E', '#F5C242', '#6FC2A6', '#AFC3CE', '#F6B3B3', '#FFF6EA'];
  for (let i = 0; i < 80; i++) {
    x.save();
    x.translate(Math.random() * W2, 60 + Math.random() * (VH - 260));
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
  const base = VH - 130 - bottom;
  const stand = Math.min(640, VH - 620); // khổ vuông thì nhỏ lại cho khỏi đè tiêu đề
  const hh = stand * hi.ph, hw = hh * hi.img.width / hi.img.height;
  const hx = 250 - hw * hi.ax, hy = base - hh;
  x.drawImage(hi.img, hx, hy, hw, hh);
  if (hi.head) hat(x, hatO, hx + hw * hi.head[0] + stand * 0.035, hy + hh * hi.head[1] + stand * 0.07, stand * 0.14, 0.35);
  // Phú (phải) đội mũ xanh bạc hà
  const pp = phu?.P?.wave;
  const ph = stand * (pp?.h || 1), pw = ph * pImg.width / pImg.height;
  const px = 830 - pw * (pp?.ax ?? 0.5), py = base - ph;
  x.drawImage(pImg, px, py, pw, ph);
  if (pp) hat(x, hatM, px + pw * pp.head[0] + stand * 0.05, py + ph * pp.head[1] + stand * 0.1, stand * 0.17, 0.32);
  else hat(x, hatM, px + pw * 0.6, py + ph * 0.1, stand * 0.2, 0.32);
  // bánh ở giữa
  const cw = stand * 0.56, ch = cw * cImg.height / cImg.width;
  x.drawImage(cImg, W2 / 2 - cw / 2, base - ch + 40, cw, ch);

  // lời chúc
  x.font = '400 40px "Pacifico", cursive';
  x.fillStyle = '#FFF6EA';
  x.shadowColor = 'rgba(0,0,0,.5)';
  x.shadowBlur = 10;
  x.fillText(C.scene7.wish, W2 / 2, VH - 50 - bottom);
  x.restore();

  drawStub(x, C, T, cut);

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

/** Cuống vé: nền kem, đường răng cưa, khuyết tròn hai bên, tên + ngày + số vé */
function drawStub(x, C, T, cut) {
  const t = C.scene7.ticket || {};
  const R = 40, NOTCH = 26;
  x.save();
  x.beginPath();
  x.roundRect(T.x, cut, T.w, T.y + T.h - cut, [0, 0, R, R]);
  x.fillStyle = '#FFF6EA';
  x.fill();
  // khuyết tròn hai bên đường xé
  x.fillStyle = '#2A2122';
  [T.x, T.x + T.w].forEach((cx) => { x.beginPath(); x.arc(cx, cut, NOTCH, 0, Math.PI * 2); x.fill(); });
  // đường răng cưa ngang
  x.strokeStyle = '#2A2122';
  x.lineWidth = 4;
  x.setLineDash([2, 14]);
  x.lineCap = 'round';
  x.beginPath(); x.moveTo(T.x + NOTCH + 14, cut); x.lineTo(T.x + T.w - NOTCH - 14, cut); x.stroke();
  // vạch dọc ngăn phần số vé
  const sx = T.x + T.w - 250;
  x.beginPath(); x.moveTo(sx, cut + 26); x.lineTo(sx, T.y + T.h - 26); x.stroke();
  x.setLineDash([]);

  const left = T.x + 50, mid = cut + (T.y + T.h - cut) / 2;
  x.textAlign = 'left';
  x.textBaseline = 'alphabetic';
  x.fillStyle = '#F26A2E';
  x.font = '800 24px "Be Vietnam Pro", system-ui, sans-serif';
  if ('letterSpacing' in x) x.letterSpacing = '3px';
  x.fillText(t.label || 'BIRTHDAY PASS · ADMIT TWO', left, mid - 46);
  if ('letterSpacing' in x) x.letterSpacing = '0px';
  x.fillStyle = '#2A2122';
  x.font = '900 60px "Playfair Display", Georgia, serif';
  fitText(x, t.names || 'KIM HIẾU × PHÚ', left, mid + 22, sx - left - 30);
  x.font = '700 28px "Be Vietnam Pro", system-ui, sans-serif';
  x.fillStyle = '#6B5A52';
  fitText(x, t.line || '01.12.2026', left, mid + 68, sx - left - 30);

  // số vé + mã vạch trang trí
  const cx = sx + (T.x + T.w - sx) / 2;
  x.textAlign = 'center';
  x.fillStyle = '#6B5A52';
  x.font = '800 22px "Be Vietnam Pro", system-ui, sans-serif';
  x.fillText('Nº', cx, mid - 46);
  x.fillStyle = '#F26A2E';
  x.font = '900 72px "Playfair Display", Georgia, serif';
  x.fillText(t.no || '024', cx, mid + 22);
  x.fillStyle = '#2A2122';
  const bars = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1];
  const bw = bars.reduce((a, b) => a + b * 3 + 3, 0);
  let bx = cx - bw / 2;
  bars.forEach((b) => { x.fillRect(bx, mid + 42, b * 3, 34); bx += b * 3 + 3; });
  x.restore();
}

function fitText(x, text, px, py, maxW) {
  const w = x.measureText(text).width;
  if (w <= maxW) return x.fillText(text, px, py);
  x.save();
  x.translate(px, py);
  x.scale(maxW / w, 1);
  x.fillText(text, 0, 0);
  x.restore();
}

// ---------------------------------------------------------------- bằng khen tuổi 24 (1080 × 1350)
/** Chữ chạy vòng quanh tâm (cx, cy), dùng cho con dấu */
function circleText(x, text, cx, cy, r) {
  const chars = [...text];
  const step = (Math.PI * 2) / chars.length;
  chars.forEach((ch, i) => {
    x.save();
    x.translate(cx, cy);
    x.rotate(i * step);
    x.fillText(ch, 0, -r);
    x.restore();
  });
}

export async function makeCertificate(C, hieu) {
  const t = C.scene8.cert;
  await Promise.all([
    document.fonts.load('900 80px "Playfair Display"'),
    document.fonts.load('700 30px "Be Vietnam Pro"'),
    document.fonts.load('400 40px "Pacifico"'),
  ]).catch(() => {});
  const hi = await hieuImage(hieu);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const INK = '#2A2122', ORANGE = '#F26A2E', RED = '#C8372D', GOLD = '#C9962B';

  // nền giấy kem + vân nhẹ
  x.fillStyle = '#FFF6EA';
  x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 900);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(201,150,43,.16)');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  // khung đôi + góc trang trí
  x.strokeStyle = INK; x.lineWidth = 8;
  x.strokeRect(28, 28, W - 56, H - 56);
  x.strokeStyle = GOLD; x.lineWidth = 3;
  x.strokeRect(50, 50, W - 100, H - 100);
  x.fillStyle = ORANGE;
  [[50, 50], [W - 50, 50], [50, H - 50], [W - 50, H - 50]].forEach(([cx, cy]) => {
    x.save(); x.translate(cx, cy); x.rotate(Math.PI / 4); x.fillRect(-14, -14, 28, 28); x.restore();
  });

  // đầu giấy kiểu công văn
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.fillStyle = INK;
  x.font = '800 30px "Be Vietnam Pro", system-ui, sans-serif';
  fitText2(x, t.org, 290, 140, 380);
  x.font = '600 22px "Be Vietnam Pro", system-ui, sans-serif';
  x.fillText(t.no || 'Số: 24/2026/SN', 290, 180);
  x.font = 'italic 700 26px "Be Vietnam Pro", system-ui, sans-serif';
  fitText2(x, t.motto, 770, 140, 470);
  x.fillRect(220, 154, 140, 3);
  x.fillRect(690, 154, 160, 3);

  // tiêu đề
  x.font = '900 128px "Playfair Display", Georgia, serif';
  x.fillStyle = '#E8C9A0';
  fitText2(x, t.title, W / 2 + 5, 345, 900);
  x.fillStyle = RED;
  fitText2(x, t.title, W / 2, 340, 900);
  x.fillStyle = INK;
  x.font = '600 30px "Be Vietnam Pro", system-ui, sans-serif';
  x.fillText(t.to, W / 2, 415);
  x.font = '400 66px "Pacifico", cursive';
  x.fillStyle = ORANGE;
  fitText2(x, t.name, W / 2, 505, 860);
  x.fillStyle = INK;
  x.font = '600 28px "Be Vietnam Pro", system-ui, sans-serif';
  fitText2(x, t.reason, W / 2, 568, 880);

  // thành tích
  x.textAlign = 'left';
  // 4–5 dòng đều vừa phần trên chibi (đáy danh sách không quá y ≈ 830)
  const step = Math.min(56, 200 / Math.max(1, t.items.length - 1));
  t.items.forEach((it, i) => {
    const y = 630 + i * step;
    x.fillStyle = ORANGE;
    x.font = '800 30px "Be Vietnam Pro", system-ui, sans-serif';
    x.fillText('✓', 150, y);
    x.fillStyle = INK;
    x.font = '700 29px "Be Vietnam Pro", system-ui, sans-serif';
    fitText2(x, it, 196, y, 780);
  });

  // Hiếu ở góc trái dưới
  const hh = 370 * hi.ph, hw = hh * hi.img.width / hi.img.height;
  x.drawImage(hi.img, 250 - hw * hi.ax, H - 72 - hh, hw, hh);

  // ngày + chữ ký + con dấu bên phải
  const sx = 740;
  x.textAlign = 'center';
  x.fillStyle = INK;
  x.font = 'italic 600 27px "Be Vietnam Pro", system-ui, sans-serif';
  fitText2(x, t.date, sx, 940, 520);
  x.font = '800 22px "Be Vietnam Pro", system-ui, sans-serif';
  fitText2(x, t.signRole.toUpperCase(), sx, 980, 520);
  // con dấu đỏ, hơi nghiêng, đè lên chữ ký như thật
  x.save();
  x.globalAlpha = 0.82;
  x.translate(sx - 80, 1095);
  x.rotate(-0.18);
  x.strokeStyle = RED; x.fillStyle = RED;
  x.lineWidth = 7; x.beginPath(); x.arc(0, 0, 112, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 80, 0, Math.PI * 2); x.stroke();
  x.font = '800 19px "Be Vietnam Pro", system-ui, sans-serif';
  x.textAlign = 'center';
  circleText(x, ' ' + t.seal + ' ', 0, 0, 88);
  x.font = '900 70px "Playfair Display", Georgia, serif';
  x.fillText('24', 0, 25);
  x.restore();
  x.fillStyle = '#1F3A68';
  x.font = '400 62px "Pacifico", cursive';
  x.fillText(t.signer, sx + 20, 1105);
  x.fillStyle = INK;
  x.font = '800 28px "Be Vietnam Pro", system-ui, sans-serif';
  x.fillText(t.signer, sx, 1205);

  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'));
}

/** Như fitText nhưng theo textAlign hiện tại (dùng cho chữ căn giữa) */
function fitText2(x, text, px, py, maxW) {
  const w = x.measureText(text).width;
  if (w <= maxW) return x.fillText(text, px, py);
  x.save();
  x.translate(px, py);
  x.scale(maxW / w, 1);
  x.fillText(text, 0, 0);
  x.restore();
}
