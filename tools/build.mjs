// Đóng gói bản phát hành vào dist/ (chỉ chép những gì trang cần; bỏ bảng hình gốc, ảnh gốc trong tmp/ và công cụ).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
const copy = (rel) => { const s = path.join(root, rel); if (fs.existsSync(s)) fs.cpSync(s, path.join(dist, rel), { recursive: true }); };
['index.html', 'content.json', 'content.en.json', 'robots.txt', 'src', 'vendor', 'assets/hieu', 'assets/phu', 'assets/deco', 'assets/bg', 'assets/fonts', 'assets/audio', 'assets/photos', 'assets/og-image.jpg'].forEach(copy);
let total = 0;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : (total += fs.statSync(p).size); });
walk(dist);
console.log(`Đã build vào dist/ - tổng ${(total / 1024 / 1024).toFixed(2)} MB`);
