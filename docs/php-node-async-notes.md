# PHP và Node async

PHP-FPM thường mỗi worker xử lý một request; I/O blocking giữ worker chờ. Node dùng event loop và I/O async: nhiều request có thể chờ I/O đồng thời, CPU nặng vẫn chặn JS thread.

Trong `day46/experiment.js`, readFile, db.execute, delay trả Promise. await chờ Promise settle và nhường điều khiển; không block toàn bộ process. Bỏ await thì biến là Promise, có thể trả response quá sớm và bỏ sót rejection. try/catch bắt rejection của Promise được await trong block; không bắt async task bị thả ra ngoài. Promise.all fail khi một Promise reject, không hủy các thao tác khác.

Flow lỗi: SQL reject → service reject → controller reject → Express 5 → errors middleware → JSON status. Không trả SQL/stack/password ra client. Chạy `npm run async` để xem lỗi SQL được bắt và connection đóng.
