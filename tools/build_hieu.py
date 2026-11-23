"""Dựng hình Hiếu, đạo cụ và nền từ các bảng hình AI (assets/sheets) -> assets/hieu, assets/deco, assets/bg.

Chạy (sau khi đã cắt bảng bằng tools/cut_parts.py vào tmp/cut/<tên>):
  python -I tools/cut_parts.py assets/sheets/01-hieu-master.webp tmp/cut/master master 6 5000
  python -I tools/cut_parts.py assets/sheets/02-hieu-bieu-cam.webp tmp/cut/emo emo 6 150
  python -I tools/cut_parts.py assets/sheets/03a-hieu-tu-the.webp tmp/cut/pose3a pose3a 8 2000
  python -I tools/cut_parts.py assets/sheets/04-hieu-chay-bo.webp tmp/cut/run run 8 2000
  python -I tools/cut_parts.py assets/sheets/05-hieu-leo-nui.webp tmp/cut/hike hike 10 2000
  python -I tools/cut_parts.py assets/sheets/06-hieu-chup-anh.webp tmp/cut/cam cam 8 2000
  python -I tools/cut_parts.py assets/sheets/07-hieu-nhan-ma.webp tmp/cut/archer archer 12 2000
  python -I tools/cut_parts.py assets/sheets/09a-dao-cu-sinh-nhat.webp tmp/cut/props props 12 200
  python -I tools/cut_parts.py assets/sheets/09a-dao-cu-sinh-nhat.webp tmp/cut/props2 props2 3 2500
  python -I tools/build_hieu.py tmp/cut

Bảng tạo thêm (tự nhận nếu đã cắt; xem OPTIONAL bên dưới):
  python -I tools/cut_parts.py assets/sheets/03b-hieu-tu-the.webp tmp/cut/pose3b pose3b 8 2000
  python -I tools/cut_parts.py assets/sheets/08a-hieu-sinh-nhat.webp tmp/cut/party party 8 2000
  python -I tools/cut_parts.py assets/sheets/04b-hieu-chay-chinh-dien.png tmp/cut/runfront runfront 8 2000   (chưa có)

  python -I tools/cut_parts.py assets/sheets/08b-phu-dong-tac.png tmp/cut/phu1 phu1 1 2000
  python -I tools/cut_parts.py assets/sheets/08c-phu-nhay.png tmp/cut/phu2 phu2 1 2000

Mở tmp/cut/<bảng>/<bảng>-_index.png xem thứ tự mảnh đã đúng chưa (trái sang phải). Sai thứ tự thì sửa số mảnh trong OPTIONAL.
Thêm tư thế khác: thêm một dòng vào POSES (tên tư thế, bảng, số mảnh, chiều cao đứng S của bảng).
"""
import sys, os, json
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tmp', 'cut')
OUT = os.path.join(ROOT, 'assets', 'hieu')
DECO = os.path.join(ROOT, 'assets', 'deco')
BG = os.path.join(ROOT, 'assets', 'bg')
for d in (OUT, DECO, BG):
    os.makedirs(d, exist_ok=True)

STAND_PX = 760  # chiều cao ảnh khi nhân vật đứng thẳng (đủ nét cho màn hình 2x)


def load(sheet, idx):
    return Image.open(os.path.join(CUT, sheet, f'{sheet}-{idx:02d}.png')).convert('RGBA')


def save_webp(img, path, q=86):
    img.save(path, 'WEBP', quality=q, method=6)


def body_center(img):
    """Tâm ngang của phần thân (60% dưới của ảnh), để cờ, cung... không làm lệch nhân vật"""
    a = np.array(img)[..., 3]
    h = a.shape[0]
    low = a[int(h * 0.4):]
    xs = np.nonzero(low.sum(axis=0))[0]
    if not len(xs):
        return 0.5
    w = low.sum(axis=0).astype(float)
    return float((w * np.arange(len(w))).sum() / w.sum() / a.shape[1])


def head_top(img, ax):
    """Đỉnh đầu (x, y theo tỉ lệ ảnh): hàng đầu tiên có tóc trong dải giữa thân, để đội mũ tiệc"""
    a = np.array(img)[..., 3] > 8
    h, w = a.shape
    x0, x1 = int(w * max(0, ax - 0.16)), int(w * min(1, ax + 0.16))
    rows = np.nonzero(a[:, x0:x1].sum(axis=1) > w * 0.05)[0]
    t = int(rows[0]) if len(rows) else 0
    band = a[t:t + int(h * 0.1), int(w * max(0, ax - 0.3)):int(w * min(1, ax + 0.3))]
    xs = np.nonzero(band.sum(axis=0))[0]
    cx = (xs.mean() + int(w * max(0, ax - 0.3))) / w if len(xs) else ax
    return [round(float(cx), 3), round(t / h, 3)]


# tên tư thế: (bảng, số mảnh, S = chiều cao một dáng đứng thẳng của bảng đó, tính cả lề 4 px mỗi phía)
POSES = {
    'wave': ('pose3a', 0, 983), 'signature': ('pose3a', 1, 983), 'laugh': ('pose3a', 2, 983), 'pout': ('pose3a', 3, 983),
    'finish': ('run', 0, 870), 'runA': ('run', 1, 870), 'runB': ('run', 2, 870), 'medal': ('run', 3, 870),
    # bảng leo núi bản nền trắng (21/11): dáng chỉ tay cao 645 px ~ 0.984 chiều cao đứng
    'summit': ('hike', 0, 655), 'walk': ('hike', 1, 655), 'point': ('hike', 2, 655), 'rest': ('hike', 3, 655),
    'camera': ('cam', 0, 1082), 'camlaugh': ('cam', 1, 1082), 'polaroid': ('cam', 2, 1082),
    'archer': ('archer', 0, 735), 'stargaze': ('archer', 1, 735),
}

# Bảng sẽ tạo thêm (docs/PROMPT-HINH.md). Có thư mục tmp/cut/<bảng> thì tự thêm, chưa có thì bỏ qua.
# S lấy theo chiều cao của một dáng đứng thẳng trong chính bảng đó: (bảng, số mảnh của dáng đứng, hệ số h của dáng đó).
OPTIONAL = {
    'pose3b': ({'surprised': 0, 'touched': 1, 'peace': 2, 'letter': 3}, (1, 1.0)),
    'party': ({'blow': 0, 'highfive': 1, 'jump': 2, 'cheer': 3}, (1, 1.0)),
    'runfront': ({'runF1': 0, 'runF2': 1}, (0, 0.98)),
}
for sheet, (names, (ref, ref_h)) in OPTIONAL.items():
    if not os.path.isdir(os.path.join(CUT, sheet)):
        continue
    S = load(sheet, ref).height / ref_h
    for name, idx in names.items():
        if os.path.exists(os.path.join(CUT, sheet, f'{sheet}-{idx:02d}.png')):
            POSES[name] = (sheet, idx, S)
    print('extra sheet', sheet, '->', ', '.join(names))

# Ảnh đã sửa tay (đã xóa nền sẵn), dùng thay mảnh cắt: tên tư thế -> (tệp, hệ số chiều cao h so với dáng đứng)
OVERRIDE = {
    'archer': ('assets/sheets/07b-hieu-keo-cung-sua.webp', 0.966),  # xóa nền tay, lấp lại chân/tất/giày (22/11)
}

poses = {}
for name, (sheet, idx, S) in POSES.items():
    img = load(sheet, idx)
    if name in OVERRIDE:
        f, hk = OVERRIDE[name]
        img = Image.open(os.path.join(ROOT, f)).convert('RGBA')
        S = img.height / hk
    k = STAND_PX / S
    out = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
    save_webp(out, os.path.join(OUT, name + '.webp'))
    ax = body_center(img)
    poses[name] = {'file': name + '.webp', 'h': round(img.height / S, 4), 'ax': round(ax, 3),
                   'ar': round(img.width / img.height, 4), 'head': head_top(img, ax)}

# ---------- ảnh chính: xóa mắt + miệng, lớp phủ biểu cảm ----------
meta = json.load(open(os.path.join(CUT, 'master', 'master-_meta.json')))[0]
ox, oy = meta['x'] - 4, meta['y'] - 4
body = cv2.imread(os.path.join(CUT, 'master', 'master-00.png'), cv2.IMREAD_UNCHANGED)
src = cv2.imread(os.path.join(ROOT, 'assets', 'sheets', '01-hieu-master.webp'))
EYE_L, EYE_R, EYE_AX = (518, 556), (841, 556), (96, 84)
MOUTH, MOUTH_AX = (680, 700), (84, 30)

skin = np.median(src[505:600, 630:735].reshape(-1, 3), axis=0)
mask = np.zeros(src.shape[:2], np.uint8)
for c in (EYE_L, EYE_R):
    cv2.ellipse(mask, c, EYE_AX, 0, 0, 360, 255, -1)
cv2.ellipse(mask, MOUTH, MOUTH_AX, 0, 0, 360, 255, -1)
soft = cv2.GaussianBlur(mask, (7, 7), 0)[..., None] / 255.0
clean = (src * (1 - soft) + skin[None, None, :] * soft).astype(np.uint8)
h, w = body.shape[:2]
base = body.copy()
base[..., :3] = np.where(body[..., 3:4] > 0, clean[oy:oy + h, ox:ox + w], body[..., :3])
S_MASTER = h
K = STAND_PX / S_MASTER
BW, BH = round(w * K), round(h * K)
save_webp(Image.fromarray(cv2.cvtColor(base, cv2.COLOR_BGRA2RGBA)).resize((BW, BH), Image.LANCZOS), os.path.join(OUT, 'idle.webp'), 90)
save_webp(Image.fromarray(cv2.cvtColor(body, cv2.COLOR_BGRA2RGBA)).resize((BW, BH), Image.LANCZOS), os.path.join(OUT, 'idle-full.webp'), 90)
face = {}


def crop_src(c, ax):
    x0, y0 = c[0] - ax[0], c[1] - ax[1]
    cw, ch = ax[0] * 2, ax[1] * 2
    piece = src[y0:y0 + ch, x0:x0 + cw]
    a = np.zeros((ch, cw), np.uint8)
    cv2.ellipse(a, (ax[0], ax[1]), (ax[0] - 2, ax[1] - 2), 0, 0, 360, 255, -1)
    rgba = cv2.cvtColor(piece, cv2.COLOR_BGR2BGRA)
    rgba[..., 3] = cv2.GaussianBlur(a, (5, 5), 0)
    return Image.fromarray(cv2.cvtColor(rgba, cv2.COLOR_BGRA2RGBA))


def place(name, img, cx, cy, target_w):
    r = target_w / img.width
    tw, th = round(img.width * r * K), round(img.height * r * K)
    save_webp(img.resize((max(tw, 1), max(th, 1)), Image.LANCZOS), os.path.join(OUT, 'face-' + name + '.webp'), 90)
    face[name] = {'file': 'face-' + name + '.webp',
                  'left': round(((cx - ox) * K - tw / 2) / BW * 100, 3),
                  'top': round(((cy - oy) * K - th / 2) / BH * 100, 3),
                  'width': round(tw / BW * 100, 3)}


EW = 176  # bề rộng một mắt trên ảnh gốc
place('eye-open-l', crop_src(EYE_L, EYE_AX), *EYE_L, EYE_AX[0] * 2)
place('eye-open-r', crop_src(EYE_R, EYE_AX), *EYE_R, EYE_AX[0] * 2)
place('mouth-smile', crop_src(MOUTH, MOUTH_AX), *MOUTH, MOUTH_AX[0] * 2)
place('eye-closed-l', load('emo', 2), EYE_L[0], EYE_L[1] + 30, EW)
place('eye-closed-r', load('emo', 3), EYE_R[0], EYE_R[1] + 30, EW)
place('eye-happy-l', load('emo', 4), EYE_L[0], EYE_L[1] + 12, EW * 0.92)
place('eye-happy-r', load('emo', 5), EYE_R[0], EYE_R[1] + 12, EW * 0.92)
place('eye-star-l', load('emo', 6), *EYE_L, EW)
place('eye-star-r', load('emo', 7), *EYE_R, EW)
place('eye-heart-l', load('emo', 8), *EYE_L, EW * 0.97)
place('eye-heart-r', load('emo', 9), *EYE_R, EW * 0.97)
place('eye-wink-l', load('emo', 10), *EYE_L, EW)
place('eye-wink-r', load('emo', 11), EYE_R[0], EYE_R[1] + 20, EW * 0.9)
place('eye-teary-l', load('emo', 12), *EYE_L, EW)
place('eye-teary-r', load('emo', 13), *EYE_R, EW)
place('mouth-grin', load('emo', 15), MOUTH[0], MOUTH[1] + 14, 128)
place('mouth-o', load('emo', 16), MOUTH[0], MOUTH[1] + 8, 58)
place('mouth-cat', load('emo', 17), MOUTH[0], MOUTH[1], 120)
place('mouth-pout', load('emo', 18), MOUTH[0], MOUTH[1] + 4, 100)
place('mouth-tongue', load('emo', 19), MOUTH[0], MOUTH[1] + 12, 132)
place('sweat', load('emo', 22), 900, 470, 54)

poses['idle'] = {'file': 'idle.webp', 'h': 1.0, 'ax': 0.5, 'ar': round(w / h, 4), 'face': True,
                 'head': head_top(Image.fromarray(cv2.cvtColor(body, cv2.COLOR_BGRA2RGBA)), 0.5)}
json.dump({
    '_ghiChu': 'Tạo bởi tools/build_hieu.py. h: chiều cao so với dáng đứng thẳng, ax: tâm thân theo bề ngang ảnh, face: có lớp mắt/miệng.',
    'poses': poses,
    'face': face,
}, open(os.path.join(OUT, 'poses.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------- Phú: ảnh động tác (bảng 08b, 08c) ----------
def keep_largest(img):
    """Chỉ giữ mảng lớn nhất (bỏ dấu ✦ hay vụn nét dính vào khung cắt)"""
    a = np.array(img)
    n, lab, st, _ = cv2.connectedComponentsWithStats((a[..., 3] > 8).astype(np.uint8), 8)
    if n <= 2:
        return img
    big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    a[..., 3] = np.where(lab == big, a[..., 3], 0)
    return Image.fromarray(a)


# Mảnh số 0 của mỗi bảng là dáng đứng thẳng làm thước đo chiều cao. Có thư mục tmp/cut/<bảng> mới xử lý.
PHU_SHEETS = {
    'phu1': {'idle': 0, 'wave': 1, 'highfive': -2, 'blow': 3, 'laugh': 4},  # đập tay: lật để giơ tay về phía Hiếu
    'phu2': {'jump': 1, 'cheer': 2, 'walkA': -3, 'walkB': -4},  # số âm: lật ngang (bảng vẽ đi sang phải, Phú cần đi sang trái)
}
phu_poses = {}
PHU_OUT = os.path.join(ROOT, 'assets', 'phu', 'poses')
for sheet, names in PHU_SHEETS.items():
    if not os.path.isdir(os.path.join(CUT, sheet)):
        continue
    os.makedirs(PHU_OUT, exist_ok=True)
    S = load(sheet, 0).height
    for name, idx in names.items():
        flip, idx = idx < 0, abs(idx)
        if not os.path.exists(os.path.join(CUT, sheet, f'{sheet}-{idx:02d}.png')):
            continue
        img = keep_largest(load(sheet, idx))
        if flip:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        k = STAND_PX / S
        save_webp(img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS), os.path.join(PHU_OUT, name + '.webp'))
        ax = body_center(img)
        phu_poses[name] = {'file': name + '.webp', 'h': round(img.height / S, 4), 'ax': round(ax, 3),
                           'ar': round(img.width / img.height, 4), 'head': head_top(img, ax)}
    print('phu sheet', sheet, '->', ', '.join(names))
if phu_poses:
    json.dump({'_ghiChu': 'Tạo bởi tools/build_hieu.py từ bảng 08b, 08c. Động tác chưa có ở đây thì Phú dùng bộ mảnh xoay khớp.',
               'poses': phu_poses},
              open(os.path.join(ROOT, 'assets', 'phu', 'poses.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------- đạo cụ ----------
DECO_MAP = {
    'cake': ('props2', 0, 520), 'candle-2': ('props2', 1, 110), 'candle-4': ('props2', 2, 120),
    'gift': ('props2', 4, 420), 'gift-open': ('props2', 5, 420), 'hat-orange': ('props2', 6, 160), 'hat-mint': ('props2', 7, 160),
    'popper': ('props2', 8, 200), 'flame-1': ('props', 4, 60), 'flame-2': ('props', 5, 60), 'flame-3': ('props', 6, 60),
    'heart': ('emo', 26, 90), 'sparkle': ('emo', 24, 70), 'balloons': ('props2', 3, 360),
}
for name, (sheet, idx, tw) in DECO_MAP.items():
    im = load(sheet, idx)
    if name.startswith('candle'):
        # bỏ ngọn lửa vẽ sẵn trên đầu nến (lửa là lớp riêng để lập lòe và thổi tắt)
        a = np.array(im)[..., 3] > 8
        rows = np.nonzero(a.sum(axis=1) > im.width * 0.35)[0]
        im = im.crop((0, max(0, int(rows[0]) - 3), im.width, im.height))
    r = min(1.0, tw / im.width)
    save_webp(im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS), os.path.join(DECO, name + '.webp'))

# ---------- nền: bỏ dải đáy có dấu ✦ của Gemini ----------
# Ảnh không có dấu ✦ (ví dụ tạo bằng ChatGPT) thì ghi 0 vào NO_MARK để giữ nguyên mép dưới.
NO_MARK = {'10b-nen-dem-sao'}  # bản trời sao vẽ phẳng (ChatGPT), không có ✦
for src_name, out_name in [('10a-nen-nui', 'nen-nui'), ('10b-nen-dem-sao', 'nen-dem-sao'), ('10c-nen-ve-dich', 'nen-ve-dich'), ('10d-nen-tiec', 'nen-tiec'), ('10e-nen-ho', 'nen-ho')]:
    im = Image.open(os.path.join(ROOT, 'assets', 'sheets', src_name + '.webp')).convert('RGB')
    if src_name not in NO_MARK:
        im = im.crop((0, 0, im.width, im.height - 150))
    if im.height > 1400:
        im = im.resize((round(im.width * 1400 / im.height), 1400), Image.LANCZOS)
    im.save(os.path.join(BG, out_name + '.webp'), 'WEBP', quality=80, method=6)

# ảnh xem trước khi dán link: tools/make_og.py

print('ok', len(poses), 'poses,', len(face), 'face layers,', len(DECO_MAP), 'props')
