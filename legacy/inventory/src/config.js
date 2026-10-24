// HƯỚNG DẪN HỌC: Đọc biến môi trường từ .env, kiểm tra cấu hình trước khi chạy. Không ghi mật khẩu thật vào source.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Các biến bắt buộc phải có trước khi kết nối DB và ký token.
const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET"];
// Thiếu cấu hình thì dừng sớm và báo tên biến cần bổ sung.
for (const key of required)
  if (!process.env[key]) throw new Error(`Missing ${key}`);
// Từ chối secret mẫu hoặc quá ngắn để tránh vô tình chạy với secret dễ đoán.
if (
  process.env.JWT_SECRET.length < 32 ||
  process.env.JWT_SECRET.startsWith("replace-")
)
  throw new Error("Generate JWT_SECRET first");
// Gom cấu hình server, JWT và pool; decimalNumbers đổi DECIMAL MySQL thành số JS.
export const config = {
  port: Number(process.env.PORT),
  secret: process.env.JWT_SECRET,
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
    decimalNumbers: true,
  },
};
