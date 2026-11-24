// Đóng gói bản phát hành vào dist/ (chỉ chép những gì trang cần; bỏ bảng hình gốc, ảnh gốc trong tmp/ và công cụ).
// JS gộp + rút gọn bằng esbuild (giống Vite), CSS gộp + rút gọn, HTML/JSON bỏ khoảng trắng và chú thích.
// Không có source map, nên mở dist ra chỉ thấy mã đã nén (khó đọc, khó sửa). Lưu ý: đây là rút gọn, không phải mã hóa:
// trình duyệt vẫn phải tải được mã thì mới chạy được.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const R = (...p) => path.join(root, ...p);
const D = (...p) => path.join(dist, ...p);
fs.rmSync(dist, { recursive: true, force: true });

const copy = (rel) => { const s = R(rel); if (fs.existsSync(s)) fs.cpSync(s, D(rel), { recursive: true }); };
['robots.txt', 'vendor', 'assets/hieu', 'assets/phu', 'assets/deco', 'assets/bg', 'assets/fonts', 'assets/audio', 'assets/photos', 'assets/og-image.jpg', 'teaser'].forEach(copy);

// 1) JS: gộp src/main.js và mọi module nó import thành 1 tệp rút gọn
await esbuild.build({
  entryPoints: [R('src/main.js')], outfile: D('src/app.js'),
  bundle: true, format: 'esm', minify: true, target: 'es2020', legalComments: 'none', sourcemap: false, charset: 'utf8',
});

// 2) CSS: gộp 3 tệp thành src/app.css (giữ ở src/ để đường dẫn ../assets/... vẫn đúng)
const cssIn = ['src/fonts.css', 'src/style.css', 'src/todo.css'].map((f) => fs.readFileSync(R(f), 'utf8')).join('\n');
const css = await esbuild.transform(cssIn, { loader: 'css', minify: true, legalComments: 'none', charset: 'utf8' });
fs.writeFileSync(D('src/app.css'), css.code);

// 3) HTML: bỏ chú thích, gộp khoảng trắng, rút gọn <script>/<style> nội tuyến
async function minifyHtml(html) {
  const parts = [];
  html = html.replace(/<(script|style)([^>]*)>([\s\S]*?)<\/\1>/gi, (m, tag, attrs, body) => {
    parts.push({ tag, attrs, body });
    return `\u0000${parts.length - 1}\u0000`;
  });
  // gộp khoảng trắng thành 1 dấu cách (không xóa hẳn: chữ cách nhau bằng các thẻ <span> cần dấu cách đó)
  html = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
  const out = [];
  for (const p of parts) {
    let body = p.body;
    if (body.trim()) {
      if (p.tag.toLowerCase() === 'style') body = (await esbuild.transform(body, { loader: 'css', minify: true, charset: 'utf8' })).code.trim();
      else if (!/type=["']?application\/(ld\+)?json/i.test(p.attrs)) body = (await esbuild.transform(body, { loader: 'js', minify: true, target: 'es2020', charset: 'utf8' })).code.trim();
    }
    out.push(`<${p.tag}${p.attrs}>${body}</${p.tag}>`);
  }
  return html.replace(/\u0000(\d+)\u0000/g, (m, i) => out[+i]);
}

// Chấp nhận mọi kiểu viết thẻ (có/không " />", nháy đơn/kép, thứ tự thuộc tính) vì Prettier có thể định dạng lại index.html
const CSS_FILES = ['fonts', 'style', 'todo'];
let index = fs.readFileSync(R('index.html'), 'utf8');
let firstCss = true;
for (const name of CSS_FILES) {
  const re = new RegExp(`[ \\t]*<link\\b[^>]*href=["']\\.?/?src/${name}\\.css["'][^>]*>[ \\t]*\\r?\\n?`, 'i');
  if (!re.test(index)) throw new Error(`build: không thấy <link> tới src/${name}.css trong index.html`);
  index = index.replace(re, firstCss ? '<link rel="stylesheet" href="src/app.css">\n' : '');
  firstCss = false;
}
const jsRe = /<script\b[^>]*src=["']\.?\/?src\/main\.js["'][^>]*>\s*<\/script>/i;
if (!jsRe.test(index)) throw new Error('build: không thấy <script src="src/main.js"> trong index.html');
index = index.replace(jsRe, '<script type="module" src="src/app.js"></script>');
if (!index.includes('src/app.css') || !index.includes('src/app.js')) throw new Error('build: không tìm thấy thẻ CSS/JS trong index.html để thay bằng bản gộp');
fs.writeFileSync(D('index.html'), await minifyHtml(index));

const teaser = await minifyHtml(fs.readFileSync(R('teaser', 'teaser.html'), 'utf8'));
fs.writeFileSync(D('teaser', 'teaser.html'), teaser);
fs.writeFileSync(D('teaser', 'index.html'), teaser); // xem ở /teaser/

// 4) JSON nội dung: bỏ khoảng trắng
for (const f of ['content.json', 'content.en.json']) fs.writeFileSync(D(f), JSON.stringify(JSON.parse(fs.readFileSync(R(f), 'utf8'))));

let total = 0;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : (total += fs.statSync(p).size); });
walk(dist);
console.log(`Đã build vào dist/ - tổng ${(total / 1024 / 1024).toFixed(2)} MB`);
