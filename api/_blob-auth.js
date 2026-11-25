// Dùng chung cho api/reply.js và api/replies.js (tệp bắt đầu bằng "_" nên Vercel không biến nó thành endpoint).
// Khi kết nối Blob store, Vercel tạo biến theo tiền tố bạn đặt, ví dụ:
//   tiền tố mặc định "BLOB"      -> BLOB_READ_WRITE_TOKEN, BLOB_STORE_ID
//   tiền tố "BLOB_READ_WRITE_TOKEN" -> BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN, BLOB_READ_WRITE_TOKEN_STORE_ID
// Hàm này tìm cả hai kiểu: có token đọc-ghi thì dùng token, không thì dùng store id + OIDC (Vercel tự cấp lúc chạy).
const pick = (suffix) => {
  if (process.env['BLOB' + suffix]) return process.env['BLOB' + suffix];
  const k = Object.keys(process.env).find((n) => n.startsWith('BLOB') && n.endsWith(suffix) && process.env[n]);
  return k ? process.env[k] : '';
};

/** Tùy chọn xác thực truyền vào put()/list(); null nếu project chưa kết nối Blob store */
export function blobAuth() {
  const token = pick('_READ_WRITE_TOKEN');
  if (token) return { token };
  const storeId = pick('_STORE_ID');
  if (storeId) return { storeId };
  return null;
}
