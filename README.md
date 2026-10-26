# PeopleFlow HRM — Node.js / Express / MySQL

HRM có giao diện web EJS và REST API. Quản lý nhân viên/phòng ban, chấm công, đơn nghỉ phép, duyệt nghỉ, thông báo và audit. Source được mở rộng từ bài Inventory Week 7 theo yêu cầu; là project học tập có AI hỗ trợ.

## Hướng dẫn cho người chuyển từ Laravel

Đọc [HUONG-DAN-LARAVEL-SANG-NODEJS.txt](HUONG-DAN-LARAVEL-SANG-NODEJS.txt): 40 cặp code PHP/Laravel ↔ JavaScript/Node, trọng tâm Eloquent ↔ Sequelize, kèm câu phỏng vấn, bài tập và lộ trình luyện Junior. [Hướng dẫn cấu trúc](docs/HUONG-DAN-KIEN-TRUC-LARAVEL-NODEJS.txt) được giữ riêng. [Các source DJI đã tham chiếu](docs/DJI-SOURCE-REVIEW.txt).

## Mở web ngay

```sh
cd ~/Desktop/xinviec/weeksevenfileone
sh scripts/start-hrm.sh
```

Cần Docker Desktop đang chạy và Node >=22 để chạy launcher. Script giữ dữ liệu, chạy migration/seed idempotent và khởi động tất cả service. Có thể double-click [Start.command](Start.command) trong Finder.

- [HRM có giao diện](http://localhost:8087)
- [Mailpit — hộp thư thử nghiệm](http://localhost:8037)
- [Health qua Nginx](http://localhost:8087/health)

| Vai trò | Email demo | Mật khẩu demo |
|---|---|---|
| Admin | admin@hrm.local | HrmDemo123! |
| HR | hr@hrm.local | HrmDemo123! |
| Nhân viên | employee@hrm.local | HrmDemo123! |

Đây là dữ liệu demo. Email đi vào Mailpit trên máy, không gửi ra hộp thư ngoài. Không cần Herd để chạy Node; Nginx trong Docker là web server/reverse proxy. Project 2 không thay đổi.

## Đọc và tự kiểm tra

1. [Bắt đầu / chạy local / Docker](docs/HRM-START.md)
2. [Đủ 23 thành phần: dùng gì, code đâu, thử thế nào](docs/HRM-COMPONENTS.md)
3. [Kiến trúc module + MVC và microservice](docs/HRM-ARCHITECTURE.md)
4. [Học theo từng bước, có lệnh terminal](docs/HRM-LEARNING.md)
5. [REST API và ví dụ curl](docs/HRM-API.md)
6. [Kiểm chứng và giới hạn](docs/HRM-VERIFICATION.md)

[Inventory cũ trước khi nâng cấp](legacy/inventory/README.md), gồm source, test, docs và cấu hình cũ. .env đã được giữ riêng và gitignore. Ghi chú D43–D49 cũ thuộc bản Inventory; hướng dẫn HRM là các file `HRM-*` ở trên.

## Kiểm thử

```sh
npm ci
npm test
# Chạy notification service local trước khi dùng test end-to-end; xem HRM-START.md.
npm run test:e2e
```

`npm test`: MySQL + Redis thật, dọn dữ liệu test có nhãn riêng. `test:e2e`: thêm Socket.IO, queue, notification service và Mailpit; giữ mail có nhãn E2E để kiểm chứng. Không gọi đây là kết quả bài thi unaided.

## Routing rõ từng thao tác

Dùng URL riêng: `/api/employees/list`, `/detail/:id`, `/create`, `/update/:id`, `/delete/:id` dưới cùng tên module. Ví dụ đầy đủ: `PUT /api/employees/update/:id`. Không dùng resource route hoặc URL CRUD chung. [Bảng API mới](docs/HRM-API.md). Web danh sách nhân viên ở `/employees/list`.
