// POST /api/reply: nhận lời đáp Hiếu viết ở màn after credit, lưu thành 1 tệp JSON trong Vercel Blob.
// Cần: kết nối 1 Blob store vào project trên Vercel (tự thêm biến BLOB_READ_WRITE_TOKEN).
// Không lưu IP hay thông tin máy, chỉ lưu nội dung, ngôn ngữ và giờ gửi.
import { put, list } from '@vercel/blob';
import { blobAuth } from './_blob-auth.js';

const MAX_TEXT = 1000; // khớp maxlength của ô nhập
const MAX_BODY = 8 * 1024;
const MAX_REPLIES = 200; // chặn spam làm đầy kho

const json = (status, data) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export async function POST(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json'))
    return json(415, { error: 'json-only' });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { error: 'too-large' });
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'bad-json' });
  }
  // ô bẫy bot có chữ: giả vờ thành công, không lưu
  if (body?.website) return json(200, { ok: true });
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) return json(400, { error: 'empty' });
  if (text.length > MAX_TEXT) return json(400, { error: 'too-long' });
  const lang = body.lang === 'en' ? 'en' : 'vi';

  const auth = blobAuth();
  if (!auth) return json(503, { error: 'storage-not-configured' });
  try {
    const { blobs } = await list({ prefix: 'replies/', limit: MAX_REPLIES, ...auth });
    if (blobs.length >= MAX_REPLIES) return json(429, { error: 'full' });
    const at = new Date().toISOString();
    await put(`replies/${at.replace(/[:.]/g, '-')}.json`, JSON.stringify({ text, lang, at }), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/json; charset=utf-8',
      ...auth,
    });
    return json(200, { ok: true });
  } catch (e) {
    console.error('reply store failed', e?.message);
    return json(500, { error: 'store-failed' });
  }
}

export function GET() {
  return json(405, { error: 'post-only' });
}
