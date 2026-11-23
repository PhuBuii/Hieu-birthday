// Liệt kê chỗ trống trong content.json -> docs/CAN-BO-SUNG.md (và in ra màn hình).
// Chạy: npm run check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectTodos } from '../src/todo.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const C = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
const items = collectTodos(C);
const req = items.filter((i) => !i.optional);
const groups = {};
items.forEach((i) => (groups[i.group] ||= []).push(i));

let md = `# Cần bổ sung\n\nTự tạo bằng \`npm run check\` từ \`content.json\`. Còn **${req.length} chỗ trống bắt buộc**, ${items.length - req.length} mục tùy chọn.\n\n`;
md += `Trong thiệp, các chỗ này hiện bằng **khung nét đứt vàng** kèm nhãn "Chỗ trống" (khi \`"draftMode": true\`). Nút "Bản nháp · N chỗ trống" ở góc màn hình mở cùng danh sách này.\n\n`;
for (const [g, list] of Object.entries(groups)) {
  md += `## ${g}\n\n`;
  for (const i of list) md += `- [ ] ${i.text}${i.optional ? ' *(tùy chọn)*' : ''} · \`${i.path}\`\n`;
  md += '\n';
}
md += `## Ngoài content.json\n\n- [ ] Bảng hình AI trong \`assets/sheets/\` (prompt ở \`docs/PROMPT-HINH.md\`)\n- [ ] Khi có địa chỉ thật: sửa \`og:url\`, \`og:image\` (địa chỉ tuyệt đối) trong \`index.html\`\n- [ ] Thử trên điện thoại thật: Safari iPhone, trình duyệt trong Messenger và Zalo\n- [ ] Khi đã đủ: đặt \`"draftMode": false\` rồi \`npm run build\`\n`;
fs.writeFileSync(path.join(root, 'docs', 'CAN-BO-SUNG.md'), md);
console.log(`Còn ${req.length} chỗ trống bắt buộc, ${items.length - req.length} tùy chọn. Đã ghi docs/CAN-BO-SUNG.md`);
for (const i of req) console.log(` - [${i.group}] ${i.text}  (${i.path})`);
