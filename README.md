# Thiệp sinh nhật Kim Hiếu · HAPPY OUR BIRTHDAY

Thiệp web 8 màn tặng Huỳnh Như Kim Hiếu, mở lúc **00:00 ngày 01/12/2026**. Trang cuối là sinh nhật chung của Hiếu và Phú (cùng sinh 01/12/2002).

| Màn | Nội dung | Tương tác |
|---|---|---|
| 0 | Khởi động: Hiếu chạy dọc thanh tải | |
| 1 | Khóa giờ (đếm ngược, Hiếu phụng phịu) → hộp quà, Hiếu nhảy ra, Phú ló đầu | chạm hộp 3 lần |
| 2 | Hồ sơ Nhân Mã: nối chòm sao, Hiếu bắn cung | chạm từng ngôi sao |
| 3 | Đường chạy 24 năm: Hiếu chạy từ xa về phía người xem, đứt dây đích, đeo huy chương | chạm để tăng tốc |
| 4 | Leo núi: 4 lá cờ lời chúc, lên đỉnh giơ cờ trên biển mây | chạm để leo |
| 5 | Cuộn phim: chụp và rửa ảnh thật | bấm nút chụp |
| 6 | Thư của Phú (gõ từng chữ) | chạm để hiện hết |
| 7 | HAPPY OUR BIRTHDAY: thổi nến, pháo giấy, lưu ảnh kỷ niệm | chạm bánh |

## Chạy thử

```
npm run dev
```

Mở `http://localhost:5179/?preview` (bỏ qua khóa giờ). Các tham số khác:

- `?now=2026-11-30T23:59:50+07:00`: giả lập đồng hồ để xem đếm ngược rồi tự mở.
- `#man=4`: vào thẳng màn 4.
- `?debug`: có `window.__thiep` để điều khiển khi thử.

## Sửa chữ

Toàn bộ chữ nằm trong `content.json`. Chỗ ghi `[điền ...]` là chỗ cần viết. Trong lúc `draftMode: true`, thiệp đánh dấu các chỗ này và nút **Bản nháp** góc trên liệt kê chúng. Viết xong thì đặt `draftMode: false` (chỗ nào còn trống sẽ tự ẩn).

`npm run check` liệt kê những chỗ còn thiếu.

**Tiếng Anh:** `content.en.json` chứa bản dịch cùng cấu trúc, ghép đè lên `content.json` khi bấm nút **EN** (góc trên, cạnh nút âm thanh) hoặc mở link kèm `?lang=en`. Giá trị `null` hoặc khóa bị bỏ trống thì dùng lại chữ tiếng Việt (ví dụ hai dòng thư còn trống). Viết dòng thư nào bằng tiếng Việt thì nhớ thêm bản tiếng Anh ở cùng vị trí trong `content.en.json`.

## Nhạc

`content.json > audio`: `bgm` là nhạc nền cả thiệp (Aetheric - Rainbow, freetouse.com), `party` là Happy Birthday phát ở màn thổi nến (mojihaza, Pixabay). Nguồn nhạc được ghi ở màn 8 (after credit), freetouse.com yêu cầu ghi nguồn nên đừng xóa dòng đó.

## Ảnh thật cho cuộn phim (màn 5)

```
python -I tools/strip_exif.py <thư-mục-ảnh-gốc>
```

Ảnh được xoay đúng chiều, thu nhỏ còn cạnh dài 1200 px, **xóa hết EXIF** (vị trí, máy chụp), ghi vào `assets/photos/`. Lệnh in sẵn đoạn JSON để dán vào `content.json > scene5.photos`. Đặt tên ảnh gốc `01-...`, `02-...` để đúng thứ tự.

## Hình nhân vật

- Bảng hình AI gốc: `assets/sheets/`. Prompt và trạng thái từng bảng: [docs/PROMPT-HINH.md](docs/PROMPT-HINH.md).
- `tools/cut_parts.py` cắt bảng nền trắng thành từng mảnh (vào `tmp/cut/`).
- `tools/build_hieu.py` đổi tên, nén, tách mắt/miệng của ảnh chính, cắt đạo cụ và nền, ghi `assets/hieu/poses.json`.
- `src/hieu.js` đọc `poses.json`. Tư thế chưa có ảnh thì mượn ảnh gần nhất (bảng `ALIAS`), không có gì thì dùng hình SVG tạm.
- Phú (hoodie xám): mọi dáng là ảnh trong `assets/phu/poses/` (đứng yên, vẫy tay, đập tay, thổi nến, cười, nhảy, giơ hai tay, 2 khung đi bộ), khai báo trong `assets/phu/poses.json`, cắt từ bảng 08b, 08c bằng `build_hieu.py` (`src/phu.js`). Bộ mảnh rời `assets/phu/rig/` chỉ là dự phòng khi thiếu ảnh.
- Ảnh xem trước khi dán link: `python -I tools/make_og.py` đọc `assets/sheets/11-duo.webp`, tô lấp dấu ✦, ghi `assets/og-image.jpg`.

## Đưa lên mạng

```
npm run build
```

Thư mục `dist/` (khoảng 2,7 MB) là bản hoàn chỉnh, đưa lên bất kỳ dịch vụ trang tĩnh nào (Netlify, Vercel, GitHub Pages, Cloudflare Pages). `tmp/` và `assets/sheets/` không nằm trong bản build.

Trước khi gửi link:

1. Điền `meta.siteUrl` trong `content.json`, sửa `og:url` và `og:image` trong `index.html` thành địa chỉ đầy đủ (ví dụ `https://.../assets/og-image.jpg`) để ảnh xem trước hiện khi dán link.
2. Đặt `draftMode: false`.
3. Mở thử link trên điện thoại.

Thiệp có `noindex` và `robots.txt` chặn công cụ tìm kiếm, không có mã theo dõi. Ảnh kỷ niệm được vẽ ngay trên máy người xem, không gửi đi đâu.
