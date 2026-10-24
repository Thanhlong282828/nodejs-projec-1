# Auth flow

Register → bcrypt hash cost 12 → MySQL. Login → compare hash → ký JWT có subject=user ID, issuer/audience/expiry → client gửi Authorization: Bearer → middleware verify → đọc user hiện tại → role guard.

JWT không phải password, payload không mã hóa: không bỏ secrets trong payload. Thiếu/sai/hết hạn token: 401. Đăng nhập được nhưng role không đủ: 403. Role lấy từ DB nên promote/demote có hiệu lực trên request kế tiếp. Secrets trong .env (gitignored), tạo bằng crypto.randomBytes. Token sống 1h; chưa có revoke/refresh. API demo loopback; triển khai thật cần HTTPS và quản lý secrets phù hợp.
