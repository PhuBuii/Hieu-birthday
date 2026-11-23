"""Nén ảnh thật cho cuộn phim (màn 5) và xóa toàn bộ EXIF (vị trí GPS, máy chụp, giờ chụp).

Cách dùng:
  python -I tools/strip_exif.py <thư-mục-ảnh-gốc>

- Ảnh gốc giữ nguyên, không bị sửa. Ảnh đã xử lý ghi vào assets/photos/anh-01.webp, anh-02.webp...
  (xếp theo tên file gốc, nên đặt tên 01-..., 02-... nếu muốn đúng thứ tự).
- Ảnh được xoay đúng chiều theo EXIF trước khi xóa EXIF, cạnh dài tối đa 1200 px.
- Cuối cùng in ra đoạn JSON để dán vào content.json > scene5.photos (nhớ sửa chú thích).
"""
import sys, os, json
from PIL import Image, ImageOps

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'photos')
EXT = ('.jpg', '.jpeg', '.png', '.webp', '.heic')
MAX = 1200

if len(sys.argv) < 2 or not os.path.isdir(sys.argv[1]):
    print(__doc__)
    sys.exit(1)

src_dir = sys.argv[1]
# thêm ảnh vào cuộn đã có: python -I tools/strip_exif.py <thư-mục> 13  -> ghi từ anh-13
START = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
files = sorted(f for f in os.listdir(src_dir) if f.lower().endswith(EXT))
if not files:
    print('Không thấy ảnh .jpg/.png/.webp trong', src_dir)
    sys.exit(1)

photos = []
for i, name in enumerate(files, START):
    try:
        im = Image.open(os.path.join(src_dir, name))
    except Exception as e:
        print('Bỏ qua', name, '-', e)
        continue
    im = ImageOps.exif_transpose(im).convert('RGB')
    im.thumbnail((MAX, MAX), Image.LANCZOS)
    # tạo ảnh mới từ điểm ảnh: không mang theo EXIF, ICC hay thông tin nào của ảnh gốc
    clean = Image.frombytes('RGB', im.size, im.tobytes())
    out_name = f'anh-{i:02d}.webp'
    clean.save(os.path.join(OUT, out_name), 'WEBP', quality=82, method=6)
    kb = os.path.getsize(os.path.join(OUT, out_name)) // 1024
    print(f'{name} -> assets/photos/{out_name} ({clean.width}x{clean.height}, {kb} KB)')
    photos.append({'photo': f'assets/photos/{out_name}', 'caption': f'[điền chú thích ảnh {i}]', 'alt': ''})

print('\nDán vào content.json > scene5.photos:')
print(json.dumps(photos, ensure_ascii=False, indent=2))
