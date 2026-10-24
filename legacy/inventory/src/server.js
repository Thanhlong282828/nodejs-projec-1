// HƯỚNG DẪN HỌC: Mở cổng HTTP để trình duyệt/Postman gọi API; đóng server và pool MySQL khi dừng chương trình.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Nạp cấu hình đã đọc từ môi trường, không hardcode secret trong module.
import { app } from "./app.js";
import { config } from "./config.js";
import { db } from "./lib/db.js";
// Cho app lắng nghe cổng cấu hình trên máy cá nhân (127.0.0.1).
const server = app.listen(config.port, "127.0.0.1", () =>
  console.log(`API http://localhost:${config.port}`),
);
// Ctrl+C/tín hiệu dừng: ngừng nhận request, đóng DB; tối đa chờ 5 giây.
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(async () => {
      await db.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  });
