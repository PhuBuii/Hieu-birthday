"""Ảnh xem trước khi dán link (assets/og-image.jpg, 1200 × 630) từ ảnh đôi assets/sheets/11-duo.webp.

  python -I tools/make_og.py [ảnh-đôi]

- Dấu ✦ của Gemini ở góc phải dưới được tô lấp bằng màu nền xung quanh (không cắt ảnh).
- Ảnh đôi (3:2) được đặt trọn chiều cao, hai bên là chính ảnh đó phóng to và làm mờ.
- Ghi thêm assets/sheets/11-duo-sach.webp (bản đã xóa ✦) để kiểm tra.
"""
import os, sys
import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'assets', 'sheets', '11-duo.webp')

img = cv2.cvtColor(np.array(Image.open(src).convert('RGB')), cv2.COLOR_RGB2BGR)
h, w = img.shape[:2]

# tìm ✦ trong ô 240 × 240 góc phải dưới: điểm sáng hơn hẳn màu nền của ô đó
B = 240
patch = img[h - B:, w - B:]
gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY).astype(int)
mask = (gray > np.median(gray) + 10).astype(np.uint8) * 255
n, lab, st, _ = cv2.connectedComponentsWithStats(mask, 8)
keep = np.zeros_like(mask)
for k in range(1, n):
    x, y, bw, bh, area = st[k]
    # chỉ lấy đốm cỡ dấu ✦ nằm gọn trong ô (không chạm mép ô: bỏ mảng tường, mảng nền)
    # và gần vuông, đủ lớn (dấu ✦ khoảng 75 × 75 px; vụn tường giữa các sợi dây nhỏ và dài)
    if 300 < area < 8000 and bw < 160 and bh < 160 and 0.6 < bw / bh < 1.6 \
            and x > 2 and y > 2 and x + bw < B - 2 and y + bh < B - 2:
        keep[lab == k] = 255
keep = cv2.dilate(keep, np.ones((9, 9), np.uint8))
full = np.zeros((h, w), np.uint8)
full[h - B:, w - B:] = keep
clean = cv2.inpaint(img, full, 7, cv2.INPAINT_TELEA)
duo = Image.fromarray(cv2.cvtColor(clean, cv2.COLOR_BGR2RGB))
duo.save(os.path.join(ROOT, 'assets', 'sheets', '11-duo-sach.webp'), 'WEBP', quality=90)

W, H = 1200, 630
k = max(W / duo.width, H / duo.height)
bg = duo.resize((round(duo.width * k), round(duo.height * k)), Image.LANCZOS)
bg = bg.crop(((bg.width - W) // 2, (bg.height - H) // 2, (bg.width - W) // 2 + W, (bg.height - H) // 2 + H)).filter(ImageFilter.GaussianBlur(18))
k = H / duo.height
fg = duo.resize((round(duo.width * k), H), Image.LANCZOS)
bg.paste(fg, ((W - fg.width) // 2, 0))
bg.save(os.path.join(ROOT, 'assets', 'og-image.jpg'), 'JPEG', quality=86)
print('og-image.jpg', bg.size, '- removed pixels:', int((full > 0).sum()))
