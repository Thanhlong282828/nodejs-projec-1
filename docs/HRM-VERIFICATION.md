# Kiểm chứng PeopleFlow HRM — 25/10/2026

## Đã thực hiện

- Cài bằng npm, lockfile riêng cho core và notification service.
- Core migration tạo bảng trên MySQL thật, chạy lại không thay đổi; notification migration có metadata riêng. Seed 6 nhân viên/3 phòng ban; seed lại giữ tài khoản cũ.
- `npm test`: **20 pass, 0 fail**. Gồm hai lỗi hạ tầng giả lập (cache fallback khi Redis không có, 503 khi MySQL không có) và integration: JWT, 401/403, role escalation, CSRF, ownership, overlap concurrency, check-in/out, constraint/rollback, observer, transactional outbox, cache MISS/HIT/invalidation, scheduler idempotency, HTML render, revoke/deactivate.
- `npm run test:e2e`: Socket không có token bị từ chối; socket quản lý nhận event sau commit; nhân viên → outbox → BullMQ/Redis → service độc lập → notification DB → SMTP/Mailpit; internal HTTP không có service key bị 401; event đã hoàn tất không gửi lại; job hỏng retry hai lần rồi failed.
- `docker compose --profile full build` thành công cho app/scheduler/notification. 7 service đang chạy, app/MySQL/Redis/Mailpit/notification health OK; scheduler và Nginx đang chạy.
- Docker smoke qua Nginx: health, login cookie, 8 trang HTML, CSS/JS, REST, Socket.IO transport và notification health. Kiểm tra MySQL quyền chéo DB bị từ chối.
- Phát hiện và sửa Nginx giữ IP container cũ sau rebuild: dùng Docker DNS resolver với biến upstream, đã test/reload cấu hình và smoke lại thành công.
- `npm run schedule:run`: daily digest tạo 2 outbox rồi dispatch; kiểm thử xác nhận không tạo lại digest cùng ngày. Lịch tự động 08:00 ngày làm việc chưa chờ tới giờ thực để quan sát.
- `npm audit --omit=dev`: 0 vulnerabilities ở core và notification sau nâng Nodemailer và override uuid tương thích Sequelize. Đây là kết quả tại thời điểm kiểm tra, không phải bảo đảm bảo mật tuyệt đối.

## Chưa xác nhận

Công cụ trình duyệt bị từ chối quyền mở địa chỉ preview, nên **chưa kiểm tra trực quan/screenshot hoặc thao tác người dùng bằng browser**. Đã kiểm thử server-side HTML và HTTP; chưa xác nhận bố cục trên từng màn hình hoặc tương tác bàn phím ngoài code review.

Chưa deploy Internet, chưa load test, chưa thử scheduler đúng mốc 08:00 ngoài mô phỏng, chưa kiểm chứng trên Windows/Linux máy người dùng khác. Đây là HRM học tập, chưa có payroll/thuế/số dư nghỉ phép, không nhận là HRM enterprise hoặc production-ready.

## Chạy lại

```sh
cd ~/Desktop/xinviec/weeksevenfileone
npm ci
npm test
# E2E dùng host mode với notification service ở :3058:
npm run test:e2e
# Hoặc smoke full Docker sau build hiện tại:
docker compose exec -T app node scripts/docker-smoke.mjs
```

Không chạy các bài self-test như bằng chứng người học đã tự code không AI. Test dữ liệu có prefix test/e2e; integration dọn bản ghi riêng; email/notification E2E được giữ ở Mailpit/service để đối chiếu. Không có email gửi ra Internet.


## Cập nhật routing theo thao tác — 25/10/2026

Mỗi thao tác có URL riêng: list/detail/create/update/delete. Router khai báo đầy đủ đường dẫn và middleware trên từng route, không mount chung resource prefix. Web links/form/fetch, pagination, notification microservice, test và tài liệu đã đồng bộ. Bản legacy/inventory giữ nguyên vì là lịch sử.

Kiểm chứng sau sửa: 20 tests pass; regression xác nhận endpoint resource cũ trả 404, URL mới đúng HTTP method và phân quyền; E2E queue/mail/realtime pass; smoke Docker/Nginx qua 8 trang HTML, assets, API, Socket.IO và service nội bộ pass. Không kiểm tra trực quan bằng browser trong lần thay đổi này.


## 26/10/2026 — tổ chức code giống Laravel DJI

Đã refactor Module + CQRS, giữ chức năng HRM, schema và 33 URL. Phiên kiểm chứng mới: **26 tests pass**, Docker/Nginx smoke và E2E queue/mail/realtime pass. [Báo cáo TXT](HRM-LARAVEL-REFACTOR-VERIFICATION.txt) · [Hướng dẫn so sánh Laravel → Node](../HUONG-DAN-LARAVEL-SANG-NODEJS.txt).
