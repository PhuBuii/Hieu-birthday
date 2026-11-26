// GET /api/replies?key=...: trang riêng để Phú đọc các lời đáp đã gửi.
// Cần biến môi trường REPLY_KEY trên Vercel (một chuỗi dài, chỉ Phú biết). Sai khóa: trả 404 như không tồn tại.
import { list, get } from '@vercel/blob';
import { blobAuth } from './_blob-auth.js';
import { timingSafeEqual } from 'node:crypto';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const page = (status, inner) =>
  new Response(
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Lời đáp</title>
<style>body{margin:0;padding:20px 16px;font:16px/1.55 system-ui,sans-serif;background:#FFF6EA;color:#2A2122}h1{font-size:22px;margin:0 0 14px}article{background:#fff;border:2px solid #2A2122;border-radius:14px;padding:12px 14px;margin:0 0 12px;white-space:pre-wrap;overflow-wrap:anywhere}time{display:block;font-size:13px;opacity:.65;margin-top:6px}p{opacity:.75}</style></head><body>${inner}</body></html>`,
    {
      status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
        'referrer-policy': 'no-referrer',
      },
    },
  );

function keyOk(given) {
  const want = process.env.REPLY_KEY;
  if (!want || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request) {
  const key = new URL(request.url).searchParams.get('key');
  if (!keyOk(key)) return page(404, '<p>Không tìm thấy.</p>');
  const auth = blobAuth();
  if (!auth) return page(503, '<p>Chưa kết nối Blob store.</p>');

  const { blobs } = await list({ prefix: 'replies/', limit: 1000, ...auth });
  const items = (
    await Promise.all(
      blobs.map(async (b) => {
        try {
          let r = null;
          for (const access of ['private', 'public']) {
            try {
              r = await get(b.pathname, { access, useCache: false, ...auth });
              if (r) break;
            } catch {}
          }
          return r ? JSON.parse(await new Response(r.stream).text()) : null;
        } catch {
          return null;
        }
      }),
    )
  )
    .filter((x) => x && typeof x.text === 'string')
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));

  const fmt = (iso) =>
    new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' });
  const body = items.length
    ? items.map((x) => `<article>${esc(x.text)}<time>${esc(fmt(x.at))} · ${x.lang === 'en' ? 'EN' : 'VI'}</time></article>`).join('')
    : '<p>Chưa có lời đáp nào.</p>';
  return page(200, `<h1>Lời đáp từ Héo (${items.length})</h1>${body}`);
}
