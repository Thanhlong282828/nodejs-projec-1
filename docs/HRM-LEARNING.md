# Tự học HRM theo thứ tự

## Bước 1 — Nhìn được View và luồng HTTP

```sh
cd ~/Desktop/xinviec/weeksevenfileone
sh scripts/start-hrm.sh
```

Mở [HRM](http://localhost:8087). Đọc [app.js](../src/app.js) → [dashboard.ejs](../src/views/dashboard.ejs) → [app.js của trình duyệt](../public/js/app.js). EJS tạo HTML trên server; fetch gửi yêu cầu và nhận JSON; hai cách cùng tồn tại. Đây là điểm khác API Inventory cũ.

## Bước 2 — ORM / Migration / MVC

```sh
npm ci
npm run migrate:status
npm run cli -- users
```

Đọc [migration](../database/migrations/001-hrm-core.js), [model và association](../src/models/index.js), [employee routes](../src/modules/employees/routes.js), [controller](../src/modules/employees/controller.js), [service](../src/modules/employees/service.js). Tự giải thích include, transaction, lock và constraint. `migrate:undo` yêu cầu `--confirm-data-loss`; không dùng trên dữ liệu cần giữ.

## Bước 3 — Auth / Policy / Validation

Đọc [auth middleware](../src/middleware/auth.js) và [Zod schemas](../src/lib/validation.js). Đăng nhập nhân viên thử truy cập /employees/list (403). Thử lương âm, email sai, đơn nghỉ trùng. Phân biệt 401, 403, 409, 422. Không xem mật khẩu/token như dữ liệu được phép trả từ model.

## Bước 4 — Event / Observer / Cache

Đọc [audit observer](../src/observers/audit-observer.js), [event](../src/events/index.js), [cache](../src/lib/redis.js). Tạo nhân viên rồi kiểm tra audit, dashboard, outbox. Observer gắn vào ORM lifecycle; event diễn tả business action; hai phần không thay thế nhau.

## Bước 5 — Queue / Scheduler / Mail / Microservice

```sh
npm run queue:dispatch
npm run schedule:run
docker compose --profile full logs --tail=30 notifications scheduler
```

Đọc [producer](../src/queue/index.js) → [scheduler](../src/scheduler.js) → [worker/service](../services/notifications/src/server.js). Mở [Mailpit](http://localhost:8037). Học sự khác biệt giữa queue (BullMQ), queue backend (Redis), worker (consumer), scheduler (khi nào tạo/chuyển job). Core transaction không gọi SMTP trực tiếp.

## Bước 6 — Realtime

Đọc [Socket server](../src/server.js), [Socket client](../public/js/realtime.js). Mở hai phiên browser khác nhau; tạo đơn nghỉ để HR nhận thông báo cập nhật, nhân viên khác không nhận event riêng của bạn. Không tự động refresh trang đang nhập.

## Bước 7 — Testing / Docker / Nginx

```sh
npm test
docker compose --profile full ps
docker compose --profile full logs --tail=30 web app
```

Đọc [test](../test/hrm.test.js), [Dockerfile](../Dockerfile), [Compose](../compose.yaml), [Nginx](../docker/nginx.conf). End-to-end host-mode có hướng dẫn trong [bắt đầu](HRM-START.md); cần chạy notification service local trước `npm run test:e2e`. Nếu dùng Docker worker thì nó chia sẻ queue, không cần chạy thêm worker host; E2E script mặc định đọc notification HTTP local :3058 nên ưu tiên host-mode cho bài test này.

[Danh sách link học chính thức và vị trí từng component](HRM-COMPONENTS.md).

## Xử lý job đã hết retry

```sh
npm run cli -- queue:failed
# Sau khi đã sửa nguyên nhân, dùng đúng ID lấy ở lệnh trên:
npm run cli -- queue:retry JOB_ID
```

Trong Docker: `docker compose exec app node scripts/hrm-cli.js queue:failed`. Retry là thao tác chủ động vì email có thể được gửi lại; kiểm tra Message-ID và nhật ký trước.


## URL riêng cho từng thao tác

[Đọc bảng route hiện tại](HRM-API.md). Mở routes.js: mỗi URL list/detail/create/update/delete có một dòng riêng với HTTP method tương ứng. Giao diện, pagination, fetch, kiểm thử và service nội bộ cùng dùng bộ URL này. Không có route resource tự sinh.
