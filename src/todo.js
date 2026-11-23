// Chỗ trống cần bổ sung: dò content.json, đánh dấu trên trang (chế độ nháp) và liệt kê thành bảng.
// Dùng chung cho thiệp (index.html) và lệnh `npm run check`.

export const isFill = (s) => typeof s === 'string' && /\[(điền|đối chiếu)/.test(s);
export const isDraft = (C) => C?.draftMode !== false;

const OPTIONAL = new Set(['audio.bgm', 'meta.siteUrl']);

/** Đặt tên dễ hiểu cho từng chỗ trống theo đường dẫn trong content.json */
function label(path, C) {
  let m;
  if ((m = path.match(/^scene3\.milestones\.(\d+)\.(\w+)$/))) {
    const km = C.scene3.milestones[+m[1]].km;
    return { group: 'Màn 3 · Đường chạy', text: `${m[2] === 'label' ? 'Mốc thời gian' : 'Kỷ niệm'} ở km ${km}` };
  }
  if ((m = path.match(/^scene5\.photos\.(\d+)\.(\w+)$/))) {
    const f = { photo: 'Ảnh', caption: 'Chú thích' }[m[2]] || m[2];
    return { group: 'Màn 5 · Cuộn phim', text: `${f} số ${+m[1] + 1}${m[2] === 'photo' ? ' (đã xóa EXIF, nằm trong assets/photos/)' : ''}` };
  }
  if ((m = path.match(/^scene6\.lines\.(\d+)$/))) return { group: 'Màn 6 · Thư', text: `Dòng thư số ${+m[1] + 1}` };
  const map = {
    'meta.siteUrl': ['Phát hành', 'Địa chỉ trang thật (dùng cho ảnh xem trước khi dán link)'],
    'audio.bgm': ['Âm thanh', 'Nhạc nền (bản nhạc có quyền dùng, 60–90 giây, dưới 1,5 MB)'],
  };
  if (map[path]) return { group: map[path][0], text: map[path][1] };
  return { group: 'Khác', text: path };
}

/** Trả về danh sách chỗ trống: [{ path, group, text, optional, value }] */
export function collectTodos(C) {
  const out = [];
  const push = (path, value) => out.push({ path, value, optional: OPTIONAL.has(path), ...label(path, C) });
  const walk = (o, base) => {
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith('_') || k === 'alt') continue;
      const p = base ? `${base}.${k}` : k;
      if (typeof v === 'string') {
        if (isFill(v)) push(p, v);
        else if (v === '' && (k === 'photo' || ['audio.bgm', 'meta.siteUrl'].includes(p))) push(p, v);
      } else if (v && typeof v === 'object') walk(v, p);
    }
  };
  walk(C, '');
  return out;
}

/** Đánh dấu một phần tử là chỗ trống (chế độ nháp) */
export function markTodo(el, note) {
  el.classList.add('todo');
  if (note) el.dataset.todo = note;
}

/** Khung giữ chỗ cho ảnh/logo còn thiếu */
export function placeholder(note, cls = '') {
  const d = document.createElement('div');
  d.className = `todo-box ${cls}`;
  d.innerHTML = '<span class="todo-ic" aria-hidden="true">＋</span><b>Chỗ trống</b><small></small>';
  d.querySelector('small').textContent = note;
  return d;
}

/** Nút "Bản nháp · N chỗ trống" + bảng danh sách */
export function mountTodoPanel(C, host = document.body, { extra = [] } = {}) {
  if (!isDraft(C)) return;
  const items = [...collectTodos(C), ...extra];
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'todo-btn';
  btn.setAttribute('aria-haspopup', 'dialog');
  const req = items.filter((i) => !i.optional).length;
  btn.innerHTML = `<span class="todo-dot" aria-hidden="true"></span><span class="todo-full">Bản nháp · </span>${req}<span class="todo-full"> chỗ trống</span>`;
  btn.setAttribute('aria-label', `Bản nháp: ${req} chỗ trống cần bổ sung`);
  // host có thể là { el, before } để chèn nút vào vị trí cụ thể (ví dụ thanh điều khiển)
  // (không kiểm tra host.before trực tiếp: phần tử DOM nào cũng có hàm before())
  if (!(host instanceof Element)) { host.el.insertBefore(btn, host.before || null); host = host.el; }
  else host.appendChild(btn);

  const dlg = document.createElement('div');
  dlg.className = 'todo-panel';
  dlg.hidden = true;
  dlg.setAttribute('role', 'dialog');
  dlg.setAttribute('aria-modal', 'true');
  dlg.setAttribute('aria-label', 'Danh sách chỗ trống cần bổ sung');
  const groups = {};
  items.forEach((i) => (groups[i.group] ||= []).push(i));
  dlg.innerHTML = `<div class="todo-card">
    <header><h2>Cần bổ sung</h2><button type="button" class="todo-x" aria-label="Đóng">×</button></header>
    <p class="todo-lead">Khung <span class="todo-sample">nét đứt</span> trên thiệp là chỗ còn trống. Sửa trong <code>content.json</code> (đường dẫn ghi dưới mỗi mục). Khi đủ, đặt <code>"draftMode": false</code> để ẩn mọi khung nháp và nút này.</p>
    <div class="todo-groups"></div></div>`;
  const box = dlg.querySelector('.todo-groups');
  for (const [g, list] of Object.entries(groups)) {
    const sec = document.createElement('section');
    const h = document.createElement('h3');
    h.textContent = g;
    const ul = document.createElement('ul');
    list.forEach((i) => {
      const li = document.createElement('li');
      if (i.optional) li.className = 'opt';
      li.innerHTML = '<span class="t"></span><code></code>';
      li.querySelector('.t').textContent = i.text + (i.optional ? ' · tùy chọn' : '');
      li.querySelector('code').textContent = i.path;
      ul.appendChild(li);
    });
    sec.append(h, ul);
    box.appendChild(sec);
  }
  host.appendChild(dlg);
  const close = () => { dlg.hidden = true; btn.focus(); };
  btn.addEventListener('click', () => { dlg.hidden = false; dlg.querySelector('.todo-x').focus(); });
  dlg.querySelector('.todo-x').addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
}
