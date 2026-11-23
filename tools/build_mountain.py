"""Mảnh trang trí màn leo núi (bảng 09c dụng cụ/cây/mây, 09d cờ/bia/biển) -> assets/deco/mt/*.webp

Cách dùng: python -I tools/build_mountain.py
- Đọc các mảnh đã cắt trong tmp/cut/dungcu và tmp/cut/moc (tools/cut_parts.py).
- Mây gần như trắng, không có viền: cách tách nền chung ăn mất thân mây,
  nên cắt lại cả 4 đám từ bảng 09d với ngưỡng trắng chặt hơn (clouds()).
- Bia đá (moc-08) có chữ mẫu "FLAT BLANK": xóa chữ để thiệp tự viết số 24 lên.
"""
import os, json
import numpy as np, cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'deco', 'mt')
os.makedirs(OUT, exist_ok=True)
J = lambda *p: os.path.join(ROOT, *p)


def piece(folder, i):
    return Image.open(J('tmp', 'cut', folder, f'moc-{i:02d}.png')).convert('RGBA')



def clouds():
    """4 đám mây ở hàng y 1760-2090 của bảng 09d: nền là trắng tinh, mây trắng ngả xanh."""
    a = np.array(Image.open(J('assets', 'sheets', '09d-moc-leo-nui.png')).convert('RGB'))[1760:2090]
    ai = a.astype(int)
    fg = ((ai[..., 0] < 248) | (ai[..., 1] < 249)).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg)
    big = sorted([i for i in range(1, n) if st[i, 4] > 3000], key=lambda i: st[i, 0])
    out = []
    for i in big:
        x, y, w, h = st[i, :4]
        m = (lab == i).astype(np.uint8) * 255
        m = cv2.GaussianBlur(m, (3, 3), 0)
        rgba = np.dstack([a, m])[y:y + h, x:x + w]
        out.append(Image.fromarray(rgba))
    return out


def clean_stone(im):
    """Xóa chữ mẫu trên mặt bia: khớp một mặt cong bậc 2 cho màu xám của mặt bia
    (bỏ qua nét chữ) rồi tô lại vùng mặt bia bằng mặt cong đó + chút nhiễu giấy.
    Chỉ tô những điểm cách viền nâu đủ xa, nên viền và cạnh bia giữ nguyên."""
    a = np.array(im)
    rgb = a[..., :3].astype(np.float32)
    H, W = rgb.shape[:2]
    g = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2GRAY)
    dark = (g < 80).astype(np.uint8)  # viền nâu ~50, nét chữ ~110
    dist = cv2.distanceTransform(1 - dark, cv2.DIST_L2, 5)
    box = np.zeros((H, W), bool); box[int(H * .1):int(H * .68), int(W * .12):int(W * .66)] = True
    face = box & (dist > max(6, W * .02)) & (a[..., 3] > 200) & (g > 120)
    # chỉ lấy mảng mặt bia lớn nhất (không lấy cạnh bên tối hơn)
    n, lab, st, _ = cv2.connectedComponentsWithStats(face.astype(np.uint8))
    k = 1 + int(np.argmax(st[1:, 4]))
    face = cv2.morphologyEx((lab == k).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((31, 31), np.uint8)).astype(bool)
    face &= (dist > max(6, W * .02))
    ys, xs = np.nonzero(face)
    txt = cv2.dilate(((g < 170) & face).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
    ref = face & ~txt & (g > 180)
    yr, xr = np.nonzero(ref)
    X = lambda x, y: np.stack([np.ones_like(x), x, y, x * x, y * y, x * y], 1).astype(np.float32)
    nx, ny = W, H
    A = X(xr / nx, yr / ny)
    fit = np.zeros((len(ys), 3), np.float32)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, rgb[yr, xr, c], rcond=None)
        fit[:, c] = X(xs / nx, ys / ny) @ coef
    noise = np.random.default_rng(1).normal(0, 1.6, (len(ys), 1)).astype(np.float32)
    new = rgb.copy()
    new[ys, xs] = fit + noise
    m = cv2.GaussianBlur(face.astype(np.float32), (0, 0), 2.5)[..., None]
    out = rgb * (1 - m) + new * m
    a[..., :3] = np.clip(out, 0, 255).astype(np.uint8)
    return Image.fromarray(a)


def save(im, name, h=None, w=None):
    if h and im.height > h:
        im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    if w and im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.webp'), quality=88, method=6)
    return im.size



sizes = {}
G = 'dungcu'
for i, n in [(0, 'backpack'), (1, 'poles'), (4, 'bottle'), (5, 'hat'), (2, 'shoe'), (22, 'compass'), (23, 'map')]:
    sizes[n] = save(piece(G, i), n, h=200)
for i, n in [(6, 'tree-a'), (7, 'tree-b'), (8, 'tree-c'), (9, 'tree-d')]:
    sizes[n] = save(piece(G, i), n, h=260)
for i, n in [(10, 'bush-a'), (11, 'bush-b'), (12, 'rock-a'), (13, 'rock-b'), (14, 'rock-c')]:
    sizes[n] = save(piece(G, i), n, w=220)
sizes['tent'] = save(piece(G, 21), 'tent', w=320)
for im, n in zip(clouds(), ['cloud-a', 'cloud-b', 'cloud-c', 'cloud-d']):
    sizes[n] = save(im, n, w=300)

M = 'moc'
for i, n in [(0, 'flag-health'), (1, 'flag-money'), (2, 'flag-adventure'), (3, 'flag-team'), (4, 'flag-wait'), (5, 'flag-glow')]:
    sizes[n] = save(piece(M, i), n, h=220)
sizes['stone'] = save(clean_stone(piece(M, 8)), 'stone', h=300)
sizes['sign'] = save(piece(M, 9), 'sign', h=280)
sizes['vn-flag'] = save(piece(M, 10), 'vn-flag', h=260)
sizes['cairn'] = save(piece(M, 11), 'cairn', h=200)
json.dump(sizes, open(os.path.join(OUT, 'sizes.json'), 'w'), indent=1)
print(json.dumps(sizes))
