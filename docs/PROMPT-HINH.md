# Prompt vẽ hình bằng ChatGPT / Gemini (tạo ảnh)

## Trạng thái (cập nhật 21/11/2026)

| Bảng | Tệp | Tình trạng | Dùng ở |
|---|---|---|---|
| P1 | `01-hieu-master` | ✅ đã có | ảnh chính, tách mắt/miệng (màn 1, 6, 7) |
| P2 | `02-hieu-bieu-cam` | ✅ đã có | 7 kiểu mắt, 6 kiểu miệng |
| P3a | `03a-hieu-tu-the` | ✅ đã có | vẫy tay, tay lên tóc, cười lớn, phụng phịu |
| P3b | `03b-hieu-tu-the` | ✅ đã có | nhảy bất ngờ (màn 1), xúc động (màn 6), chữ V (màn 7), đọc thư (màn 6) |
| P4 | `04-hieu-chay-bo` | ✅ đã có | màn 0, 3 |
| P4b | `04b-hieu-chay-chinh-dien` | ⬜ không bắt buộc | 2 khung chạy chính diện cho màn 3 (hiện đang lật ảnh giơ ngón cái theo nhịp bước, vẫn ổn) |
| P5 | `05-hieu-leo-nui` | ✅ đã có | màn 4 |
| P6 | `06-hieu-chup-anh` | ✅ đã có | màn 5 |
| P7 | `07-hieu-nhan-ma` | ✅ đã có | màn 2 |
| P8a | `08a-hieu-sinh-nhat` | ✅ đã có | thổi nến, đập tay, nhảy mừng, giơ hai tay (màn 7, ảnh lưu niệm) |
| P8b | `08b-phu-dong-tac` | ✅ đã có (hoodie) | Phú đứng yên, vẫy tay, đập tay, thổi nến, cười (màn 1, 7) |
| P8c | `08c-phu-nhay` | ✅ đã có (hoodie) | Phú nhảy, giơ hai tay, 2 khung đi bộ (màn 7) |
| P9a | `09a-dao-cu-sinh-nhat` | ✅ đã có | bánh, nến, lửa, hộp quà, mũ, pháo |
| P9b | `09b-dao-cu-phieu-luu` | không cần | |
| P10 | `10a` đến `10e` (nền) | ✅ đã có | màn 2, 3, 4, 5, 7 (`10b` trời sao đã thay bằng bản vẽ phẳng, không có ✦; bản cũ ở `tmp/goc/`) |
| P11 | `11-duo` | ✅ đã có (hoodie) | ảnh xem trước khi dán link (`assets/og-image.jpg`, làm bằng `tools/make_og.py`) |

Đã đủ hình cho cả 8 màn. P4b là tùy chọn: thiếu thì thiệp mượn ảnh gần nhất, có thì thiệp tự dùng sau khi cắt (xem cuối tệp).

Thứ tự làm ban đầu: **P1 → chốt ảnh chính → P2 → P3 → P4 đến P11**. Chưa chốt P1 thì đừng làm các bước sau, vì mọi bảng hình khác đều lấy P1 làm mẫu.

## Cách dùng

1. Làm tất cả trong **một đoạn chat ChatGPT** để nét vẽ đồng nhất. Mỗi lượt chỉ yêu cầu **một bảng hình**.
2. Ảnh đính kèm cho từng prompt:
   - **Ảnh 1**: ảnh chibi chính của Hiếu (`01-hieu-master.png`, có sau khi làm P1). Riêng P1 thì ảnh 1 là ảnh thật của Hiếu mặc áo trench lửng.
   - **Ảnh 2**: chibi Phú mặc hoodie, tệp `assets/sheets/00-phu-hoodie-mau.png`, dùng làm mẫu phong cách (các bảng đã làm trước đây dùng `hero.webp`, Phú mặc polo; từ nay dùng ảnh hoodie).
   - **Ảnh 3**: ảnh thật có trang phục và tư thế cần vẽ (chỉ có ở P4, P5, P6).
3. Dán **KHỐI PHONG CÁCH** vào cuối mọi prompt.
4. Tải ảnh PNG về, đặt tên theo tên tệp ghi ở mỗi mục rồi lưu vào `assets/sheets/`.
5. **Không yêu cầu AI viết chữ vào hình**, vì AI hay viết sai dấu tiếng Việt. Chữ sẽ thêm bằng HTML.
6. **Ảnh thật của Hiếu chỉ để trong `tmp/`**, không chép vào `assets/`. Lệnh build không đưa `tmp/` lên mạng.

## KHỐI PHONG CÁCH (dán cuối mọi prompt)

```
STYLE: flat 2D chibi illustration matching the attached reference character "Phu" exactly: same thick dark-brown outline (#3A2A20) with uniform line weight, same soft cel shading with a single shadow tone, same big glossy eyes with two white highlights, same soft pink blush, same proportions (head about 40% of total height, about 2.5 heads tall), same warm skin rendering. No gradients, no texture, no 3D, no painterly effects. Every piece has a fully closed, continuous outline around its whole silhouette. Plain pure white background (#FFFFFF), no ground shadow, no text, no letters, no numbers, no logos, no watermark, no frame. At least 60 px of empty white space between separate pieces.
Avoid: realistic, photo, anime screentone, sketchy or thin lines, extra fingers, extra limbs, different art style, cropped pieces, overlapping pieces.
```

> **Vì sao viền phải kín:** `tools/cut_parts.py` chỉ xóa vùng trắng nối liền với mép ảnh. Áo trắng, quần kem có viền kín thì không bị cắt mất.

---

## P1 · Nhân vật chính → `01-hieu-master.png` (khổ dọc 2:3)

Đính kèm: ảnh thật Hiếu mặc áo trench lửng (ảnh 1) và `hero.webp` (ảnh 2).

```
Image 1 is a photo of my best friend Kim Hieu. Image 2 is my existing chibi character "Phu". Create a chibi character of Kim Hieu in exactly the same art style as image 2, so the two look like they belong to the same set.
Keep her likeness from image 1: young Vietnamese woman, soft round face, gentle closed-lip smile, dark brown eyes, fair skin. Hair: very long jet-black hair reaching her waist, straight at the top and softly wavy toward the ends, airy see-through bangs that reach her eyebrows, a few thin strands framing her cheeks.
Copy the outfit exactly from image 1:
- a boxy cropped trench jacket in light stone-greige (#D9D2C6) that ends at the hip, double-breasted with dark brown-grey round buttons, wide notched lapels with one button on the upper lapel, long full sleeves with a buttoned strap at each cuff;
- under it a white sheer chiffon blouse with a high round neckline, a long thin black ribbon tied at the neck with its two ends hanging down, and a gathered ruffled peplum hem edged with white lace that shows below the jacket;
- a black pleated A-line skirt reaching just below the knee;
- an orange smartwatch with an orange strap on her LEFT wrist.
Not visible in the photo, add: black Mary Jane shoes with short white socks.
Pose: full body, front view, standing straight, both arms hanging relaxed with a small gap between arms and torso, feet slightly apart, happy face looking at the viewer. Same character height on the canvas as image 2. Portrait 2:3.
```

Sửa tiếp trong cùng đoạn chat cho tới khi ưng, ví dụ: "mái thưa hơn", "tóc dài hơn", "mặt giống ảnh hơn". **Ảnh này phải đứng thẳng, mặt nhìn thẳng, hai tay hơi tách khỏi thân**, vì đây là ảnh sẽ được tách mắt và miệng để làm chớp mắt và nhép miệng.

## P2 · Biểu cảm → `02-hieu-bieu-cam.png` (khổ ngang)

```
Using image 1 (the chibi girl Kim Hieu) as the exact reference, draw a sprite sheet of facial parts only, each at exactly the same size as on her face, evenly spaced in a grid:
Row 1, eye pairs (left and right eye as two separate pieces): normal open; closed for blinking (gentle curved lines with lashes); happy closed (upside-down U); sparkling star eyes; heart eyes; wink pair (left open, right closed); teary touched eyes with a shine and one small tear.
Row 2, mouths: small closed smile; wide open laughing mouth; small round "o" (surprised / blowing candles); cat-like ":3" smile; pouting mouth; tongue sticking out playfully.
Row 3, extras: two pink blush ovals, a blue sweat drop, a small red anger mark, three small sparkles, a small heart.
No face shape, no hair, no skin around the parts.
```

## P3 · Tư thế với trang phục chính → `03a-hieu-tu-the.png`, `03b-hieu-tu-the.png` (khổ ngang)

```
Same character Kim Hieu as image 1, same outfit, same size and line weight. Draw these full-body poses as separate figures side by side, all at the same scale:
(1) waving her right hand high with a big open smile; (2) her signature pose from the original photo: LEFT hand (the one with the orange watch) resting lightly on top of her head, right hand relaxed in front of her skirt, head slightly tilted, calm sweet smile; (3) laughing hard with eyes closed, hands on her tummy; (4) arms crossed, pouting with puffed cheeks.
```

### P3b → `03b-hieu-tu-the.png` (khổ ngang) · ⬜ cần làm

Đính kèm: ảnh 1 `01-hieu-master`, ảnh 2 `00-phu-hoodie-mau.png`, ảnh 3 `03a-hieu-tu-the` (để giữ đúng cỡ và nét). **Đúng 4 dáng, đúng thứ tự trái sang phải**, vì thiệp đọc dáng theo thứ tự.

```
Image 1 is my chibi character Kim Hieu, image 2 is the style reference "Phu", image 3 is an existing pose sheet of Kim Hieu. Same character, same outfit as images 1 and 3 (stone-greige cropped trench jacket, white blouse with a thin black neck ribbon and lace peplum, black pleated skirt, orange smartwatch on her LEFT wrist, black Mary Jane shoes with white socks), same size, same line weight as image 3.
Draw exactly 4 full-body poses side by side in ONE row, left to right, all at the same scale, evenly spaced, nothing else on the sheet:
(1) surprised jump: both feet off the ground, both arms thrown up high, sparkling star eyes, small round "o" mouth;
(2) touched: standing straight, both hands clasped together at her chest, teary happy eyes with one small tear, soft wobbly smile;
(3) peace sign: standing, right hand making a V sign next to her face, winking, playful grin;
(4) reading a letter: standing, holding an open cream envelope letter with both hands at chest height, looking down at it with a gentle smile.
```

---

## P4 · Chạy bộ (theo ảnh về đích marathon) → `04-hieu-chay-bo.png` (khổ ngang)

Đính kèm: ảnh 1 `01-hieu-master.png`, ảnh 2 `hero.webp`, **ảnh 3 là ảnh Hiếu về đích marathon**.

```
Image 1 is my chibi character Kim Hieu, image 2 is the style reference "Phu", image 3 is a real photo of Kim Hieu crossing a marathon finish line (she is the woman in the center). Draw Kim Hieu as the same chibi (same face, same proportions, same scale and art style as images 1 and 2). Copy her race outfit exactly from image 3; if anything below differs from image 3, follow image 3:
- a white sun visor, long black hair pulled back in a ponytail through the visor;
- a fitted black short-sleeve running tee;
- loose black running shorts;
- black knee-high compression calf sleeves;
- white running shoes with a soft peach-pink tint;
- a white race bib with a blue top stripe pinned on her stomach, with NO numbers and NO letters on it;
- her orange smartwatch on her LEFT wrist.
Draw these full-body poses as separate figures at the same scale:
(1) her finish-line pose from image 3: running toward the viewer, both elbows bent and both hands raised beside her shoulders giving two thumbs up, huge happy open smile;
(2) run frame A: side view facing right, left leg forward, right arm forward, ponytail flying back;
(3) run frame B: identical size, head position and outfit as frame A, only the arms and legs swapped;
(4) after the race: hands on knees catching her breath, a small sweat drop, grinning, a gold finisher medal on a ribbon around her neck.
```

> Bảng đã tạo khớp mô tả trên: mũ lưỡi trai trắng, buộc đuôi ngựa cao, áo thun đen, quần short đen, ống bó bắp chân đen, giày trắng hồng, số đeo ngực sọc xanh. Cần tạo lại thì dùng nguyên prompt này.

### P4b · Chạy chính diện → `04b-hieu-chay-chinh-dien.png` (khổ ngang) · ⬜ nên làm

Màn 3 cho Hiếu chạy từ xa về phía người xem. Hiện thiệp lật qua lật lại ảnh "giơ ngón cái" để giả bước chạy. Có 2 khung này thì bước chạy thật hơn.

Đính kèm: ảnh 1 `01-hieu-master`, ảnh 2 `00-phu-hoodie-mau.png`, **ảnh 3 `04-hieu-chay-bo`** (bảng chạy bộ đã có, để giữ đúng đồ và cỡ).

```
Image 1 is my chibi character Kim Hieu, image 2 is the style reference "Phu", image 3 is her existing running sheet. Same character in exactly the race outfit from image 3: white sun visor, high black ponytail, fitted black short-sleeve running tee, white race bib with a blue top stripe and NO numbers or letters, loose black running shorts, black knee-high compression calf sleeves, white running shoes with a soft peach-pink tint, orange smartwatch on her LEFT wrist. Same size and line weight as image 3.
Draw exactly 2 full-body running frames side by side in ONE row, same scale, evenly spaced, both in FRONT view running straight toward the viewer:
(1) frame A: right knee lifted forward, left foot pushing off behind her, left arm swinging forward and right arm back, elbows bent, fists loose, determined happy smile, ponytail swinging to one side;
(2) frame B: identical size, head position, face and outfit as frame A, only the arms and legs swapped (left knee lifted, right arm forward), ponytail swinging to the other side.
No thumbs up, no medal.
```

## P5 · Leo núi (theo ảnh cắm cờ trên đỉnh) → `05-hieu-leo-nui.png` (khổ ngang)

> Bảng đã tạo khớp mô tả dưới (nón kaki, áo thun navy, ống tay chống nắng đen, áo khoác vàng nhạt buộc eo, quần navy, giày kem vàng, buộc tóc). Cần tạo lại thì dùng nguyên prompt này.

Đính kèm: ảnh 1 `01-hieu-master.png`, ảnh 2 `hero.webp`, **ảnh 3 là ảnh Hiếu cầm cờ trên đỉnh núi**.

```
Image 1 is my chibi character Kim Hieu, image 2 is the style reference "Phu", image 3 is a real photo of Kim Hieu on a misty mountain summit. Draw Kim Hieu as the same chibi (same face, same proportions, same scale and art style as images 1 and 2). Copy her hiking outfit exactly from image 3; if anything below differs from image 3, follow image 3:
- a khaki-tan bucket hat;
- dark sporty sunglasses with blue-tinted lenses;
- a navy blue short-sleeve T-shirt, with black UV arm sleeves covering both arms from under the T-shirt sleeves down to the wrists;
- a pink-and-white lanyard hanging around her neck;
- a small navy crossbody sling bag, its strap across her chest, with a small light-green pouch clipped at her hip;
- a pale lemon-yellow windbreaker jacket tied around her waist by its sleeves, hanging down over her hips;
- loose dark navy hiking pants;
- beige trail shoes with yellow accents;
- a red-orange glove on her left hand;
- her black hair tied back behind her head.
Draw these full-body poses as separate figures at the same scale:
(1) her summit pose from image 3: standing tall, right arm stretched straight up and out to the side holding a red Vietnamese flag with a yellow five-pointed star on a thin dark stick, the flag waving, left arm relaxed at her side, sunglasses on, proud big smile;
(2) hiking uphill: side view facing right, leaning forward, a trekking pole in one hand, sunglasses pushed up onto her hat;
(3) taking a break sitting on a grey rock, sunglasses pushed up onto her hat, drinking from a water bottle;
(4) shading her eyes with one hand and pointing far away with the other, excited, sunglasses pushed up onto her hat.
```

## P6 · Chụp ảnh (theo ảnh bên hồ) → `06-hieu-chup-anh.png` (khổ ngang)

Đính kèm: ảnh 1 `01-hieu-master.png`, ảnh 2 `hero.webp`, **ảnh 3 là ảnh Hiếu cầm máy ảnh bên hồ**.

```
Image 1 is my chibi character Kim Hieu, image 2 is the style reference "Phu", image 3 is a real photo of Kim Hieu taking photos by a lake. Draw Kim Hieu as the same chibi (same face, same proportions, same scale and art style as images 1 and 2). Copy her outfit exactly from image 3; if anything below differs from image 3, follow image 3:
- a long oversized khaki-olive trench coat (#B8AD86) reaching just above her knees, worn open, with wide lapels, buttons and long sleeves;
- a cream-white top under the coat;
- cream-white wide-leg trousers with a tan leather belt;
- chunky black leather loafers;
- a small burgundy-red leather shoulder bag, its strap over her shoulder, the bag resting at her hip;
- long, loose, wavy jet-black hair down to her mid-back.
She holds a small black compact point-and-shoot camera.
Draw these full-body poses as separate figures at the same scale:
(1) her pose from image 3: three-quarter view, holding the compact camera up beside her face with her right hand, head turned to look off to the side with a dreamy soft smile;
(2) front view, camera to her eye, taking a photo of the viewer, a small white flash sparkle at the camera;
(3) looking down at the camera in her hands, giggling;
(4) proudly holding up a developed photo print with a blank white frame.
```

---

## P7 · Nhân Mã → `07-hieu-nhan-ma.png`

```
Same character Kim Hieu as image 1, same signature outfit, same scale, adding a short navy-blue cape with tiny gold stars. Poses as separate figures:
(1) drawing a golden bow with a star-tipped golden arrow, aiming up and to the right, determined cute face; (2) after the shot, hand shading her eyes, watching the sky with excited star eyes.
```

## P8a · Hiếu ngày sinh nhật → `08a-hieu-sinh-nhat.png` (khổ ngang) · ⬜ cần làm

Màn 7: Hiếu đứng bên trái, bánh ở giữa, Phú bên phải, nên các dáng hướng về **bên phải ảnh**. Đính kèm: ảnh 1 `01-hieu-master`, ảnh 2 `00-phu-hoodie-mau.png`, ảnh 3 `03a-hieu-tu-the`. **Đúng 4 dáng, đúng thứ tự.**

```
Image 1 is my chibi character Kim Hieu, image 2 is the style reference "Phu", image 3 is an existing pose sheet of Kim Hieu. Same character, same outfit as images 1 and 3 (stone-greige cropped trench jacket, white blouse with a thin black neck ribbon and lace peplum, black pleated skirt, orange smartwatch on her LEFT wrist, black Mary Jane shoes with white socks), same size, same line weight as image 3. No party hat, no cake, no props.
Draw exactly 4 full-body poses side by side in ONE row, left to right, all at the same scale, evenly spaced, nothing else on the sheet:
(1) blowing out candles: standing, upper body leaning slightly toward the RIGHT side of the image, hands behind her back, cheeks puffed, eyes closed, small round "o" mouth;
(2) high-five: standing, her LEFT hand raised high out toward the RIGHT side of the image, palm open, big happy open smile;
(3) celebration jump: both feet off the ground, one fist punched up high, eyes closed happily, big open smile;
(4) cheering: standing, both arms raised up in a V shape, big open laughing smile.
```

## P8b, P8c · Động tác của Phú (mặc hoodie)

Phú làm giống Hiếu: mọi dáng là ảnh vẽ sẵn, không xoay khớp tay nữa. Phú mặc **hoodie xám như bộ mảnh cũ** (không mặc polo). Cả hai bảng đã có và đã cắt (9 dáng trong `assets/phu/poses/`). Prompt dưới đây giữ lại để làm lại khi cần. Bộ mảnh hoodie cũ chỉ còn là dự phòng khi thiếu ảnh.

Trong bảng hiện tại, dáng đập tay và 2 khung đi bộ vẽ hướng sang phải nên `build_hieu.py` lật ngang (số âm trong `PHU_SHEETS`). Làm lại bảng mà hướng khác thì sửa dấu ở đó.

Đính kèm **chỉ `assets/sheets/00-phu-hoodie-mau.png`** (ảnh 1: Phú mặc hoodie, ghép từ bộ mảnh). **Không** đính kèm `hero.webp`, `11-duo` hay các ảnh polo cũ, vì AI sẽ vẽ lại áo polo.

Ở màn 7 Phú đứng **bên phải**, Hiếu và bánh ở bên trái, nên các động tác hướng về **bên trái ảnh**. **Dáng số 0 là dáng đứng thẳng giống hệt ảnh 1**: công cụ lấy dáng này làm thước đo chiều cao, nên bắt buộc phải có và phải đứng đầu tiên bên trái.

### P8b → `08b-phu-dong-tac.png` (khổ ngang, 5 dáng)

```
Image 1 is my chibi character "Phu". Draw the SAME character exactly as in image 1: same face, same short messy black hair, same round thin dark-brown glasses, same light heather-grey pullover hoodie (hood down behind his neck, two white drawstrings with small metal tips, a front kangaroo pocket, ribbed cuffs and ribbed hem), same beige-tan khaki chino pants, same grey low-top sneakers with white laces and white soles, no logo on the shoes, no watch, no polo shirt, no belt. Same art style, same thick dark-brown outline, same proportions, same size as image 1.
Draw exactly 5 full-body figures side by side in ONE row, left to right, all at exactly the same scale, with at least 80 px of pure white space between figures (raised hands must NOT touch or overlap the neighbouring figure), plain pure white background, nothing else on the sheet, no text:
(0) reference: standing straight, front view, arms relaxed at his sides, gentle closed smile, exactly like image 1;
(1) waving: front view, his right hand raised beside his head waving hello, big open happy smile;
(2) high-five: his RIGHT hand raised high and stretched out toward the LEFT side of the image, palm open, excited big smile;
(3) blowing out birthday candles: upper body clearly leaning toward the LEFT side of the image, hands behind his back, cheeks puffed, eyes closed, small round "o" mouth;
(4) laughing hard: eyes squeezed shut happily, wide open laughing mouth, one hand on his tummy over the hoodie pocket.
```

### P8c → `08c-phu-nhay.png` (khổ ngang, 5 dáng)

```
Image 1 is my chibi character "Phu". Draw the SAME character exactly as in image 1: same face, same short messy black hair, same round thin dark-brown glasses, same light heather-grey pullover hoodie (hood down behind his neck, two white drawstrings with small metal tips, a front kangaroo pocket, ribbed cuffs and ribbed hem), same beige-tan khaki chino pants, same grey low-top sneakers with white laces and white soles, no logo on the shoes, no watch, no polo shirt, no belt. Same art style, same thick dark-brown outline, same proportions, same size as image 1.
Draw exactly 5 full-body figures side by side in ONE row, left to right, all at exactly the same scale, with at least 80 px of pure white space between figures (raised hands must NOT touch or overlap the neighbouring figure), plain pure white background, nothing else on the sheet, no text:
(0) reference: standing straight, front view, arms relaxed at his sides, gentle closed smile, exactly like image 1;
(1) celebration jump: both feet off the ground, knees bent, both fists pumped up, big open smile;
(2) cheering: standing, both arms raised high in a V shape, laughing with eyes closed;
(3) walking frame A: side view facing RIGHT, mid-stride, left leg forward, right arm swinging forward, cheerful smile;
(4) walking frame B: identical size, head position and face as frame A, only the arms and legs swapped.
```

> Khung đi bộ vẽ hướng **sang phải** cũng được: `build_hieu.py` tự lật ngang để Phú đi từ phải vào. Nếu AI vẽ sang trái thì báo để bỏ bước lật.

## P9 · Đạo cụ → `09a-dao-cu-sinh-nhat.png`, `09b-dao-cu-phieu-luu.png`

```
A sprite sheet of separate cute props in the same chibi style, evenly spaced:
(1) a round two-tier birthday cake with cream frosting, strawberries and orange accents, with NO candles; (2) a number-shaped candle "2" and (3) a number-shaped candle "4", unlit, separate; (4) three separate candle flames in slightly different flicker shapes; (5) a gift box body and (6) its lid with an orange ribbon bow, as two separate pieces; (7) three balloons on strings (cream, orange, misty green); (8) two cone party hats (orange stripes, mint stripes); (9) a party popper; (10) about 12 small confetti pieces and ribbons.
```

Bảng 09b dùng cùng câu mở đầu, thay danh sách bằng:
`(1) three frost-covered snowy pine trees in small, medium and large sizes; (2) a grey granite summit marker stone with a flat blank face; (3) a finish-line tape snapped into two halves; (4) a gold finisher medal on a ribbon; (5) a grey rock; (6) three soft mist cloud puffs; (7) a small black compact film camera; (8) a blank instant photo frame; (9) a short film-strip segment with blank frames; (10) three gold stars; (11) a golden star-tipped arrow.`

## P10 · Nền màn hình (khổ dọc 2:3)

Với các prompt nền, **bỏ câu "Plain pure white background"** trong khối phong cách.

| Tệp | Màn | Prompt |
|---|---|---|
| `10a-nen-nui.png` | 4 | `Vertical background in the same flat chibi style: a misty mountain summit area with big grey granite boulders and small red rhododendron bushes in the lower part, layered blue-green ridges fading into white fog behind, sea of clouds in the valleys, soft palette of misty green #6E8F7E, mist blue #AFC3CE and pale grey sky, simple flat shapes, calm empty center area, no characters, no text.` |
| `10b-nen-dem-sao.png` | 2 | `Vertical background: deep navy night sky fading to soft purple, many tiny stars, a soft silhouette of mountain ridges at the bottom, calm empty center, no constellations drawn, no characters, no text.` |
| `10c-nen-ve-dich.png` | 3 | `Vertical background in the same flat chibi style: a sunny city marathon finish area, a wide blue-carpet road leading toward the viewer, blank colorful banners and barriers along both sides with no logos and no writing, a simplified cheering crowd as soft rounded shapes, a few tall buildings and trees far away, bright blue sky, the lower third left fairly plain for the running track, no characters in the foreground, no text.` |
| `10d-nen-tiec.png` | 7 | `Vertical background: cozy warm evening party scene, string lights across the top, a few floating balloons at the edges in cream, orange and mint, soft bokeh, calm empty center for two characters and a cake, no characters, no text.` |
| `10e-nen-ho.png` | 5 | `Vertical background in the same flat chibi style: a calm highland lake at golden hour, soft pink-orange sunset sky, pine-covered hills and tiny houses on the far shore reflected in the still water, a grassy bank in the lowest part, calm empty center area, no characters, no text.` |

## P11 · Ảnh đôi → `11-duo.png` (khổ ngang 3:2)

Dùng làm ảnh xem trước khi dán link. Đính kèm `01-hieu-master` và `assets/sheets/00-phu-hoodie-mau.png`.

Có ảnh mới thì lưu thành `assets/sheets/11-duo.webp` rồi chạy `python -I tools/make_og.py`: công cụ tô lấp dấu ✦ ở góc phải dưới và ghi `assets/og-image.jpg` (1200 × 630, ảnh đôi ở giữa, hai bên là nền mờ).

```
Image 1 is Kim Hieu, image 2 is Phu, same art style. Draw both together: Kim Hieu on the left in her trench outfit and Phu on the right in his light grey pullover hoodie and beige chino pants exactly as in image 2 (no polo shirt), both wearing cone party hats, happily holding one birthday cake together between them with two lit number candles "2" and "4", confetti and balloons around. Landscape 3:2, the top third left empty for a title added later, no text.
```

---

## Kiểm tra mỗi ảnh trước khi dùng

- Đủ 5 ngón tay, không thừa tay chân.
- Viền liền và kín quanh từng hình.
- Không có chữ lạ, logo hay số.
- Các dáng trong cùng một bảng có cùng tỉ lệ.
- Mặt Hiếu giống ảnh chính (P1).

## Sau khi có hình

1. Lưu bảng vào `assets/sheets/` đúng tên (đuôi `.png` hay `.webp` đều được).
2. Cắt bảng (đổi đuôi tệp nếu cần):

   ```
   python -I tools/cut_parts.py assets/sheets/03b-hieu-tu-the.webp tmp/cut/pose3b pose3b 8 2000
   python -I tools/cut_parts.py assets/sheets/08a-hieu-sinh-nhat.webp tmp/cut/party party 8 2000
   python -I tools/cut_parts.py assets/sheets/04b-hieu-chay-chinh-dien.png tmp/cut/runfront runfront 8 2000
   python -I tools/cut_parts.py assets/sheets/08b-phu-dong-tac.png tmp/cut/phu1 phu1 1 2000
   python -I tools/cut_parts.py assets/sheets/08c-phu-nhay.png tmp/cut/phu2 phu2 1 2000
   ```

   Ảnh của Phú được ghi vào `assets/phu/poses/` và `assets/phu/poses.json`.

3. Mở `tmp/cut/<bảng>/<bảng>-_index.png` xem các mảnh đã đánh số đúng thứ tự trái sang phải chưa, và mỗi dáng là **một** mảnh (không bị dính hai dáng, không bị tách rời tay). Bị dính thì giảm số `8`, bị tách thì tăng lên.
4. Chạy `python -I tools/build_hieu.py tmp/cut`. Công cụ tự thêm tư thế mới vào `assets/hieu/poses.json`, thiệp tự dùng, không cần sửa code.

Hoặc gửi ảnh cho Claude, Claude làm các bước trên.

**Dấu ✦ của Gemini:** trên bảng nền trắng thì dấu này bị bỏ khi cắt (mảnh quá nhỏ, hoặc dính vào dáng của Phú thì chỉ giữ mảnh lớn nhất). Trên ảnh nền, `build_hieu.py` cắt bỏ dải đáy 150 px (ảnh nền không có ✦ thì thêm tên vào `NO_MARK` để giữ nguyên). Trên ảnh đôi, `make_og.py` tô lấp.
