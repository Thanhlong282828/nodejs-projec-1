# Week 7 — Node Inventory API

Bản học tập có AI hỗ trợ; PHP/Laravel/MySQL vẫn là stack chính. D43–D47: CLI và inventory.

## Setup

Node >=22, npm, Docker Desktop đang chạy. MySQL 8.4 chạy port 3377 để không đụng MySQL sẵn có.

```sh
cd ~/Desktop/xinviec/weeksevenfileone
docker compose up -d --wait
cd ~/Desktop/xinviec/weeksevenfileone
npm install
node scripts/init-env.mjs
npm run db:setup
npm test
npm start
```

[Health](http://localhost:3047/health). `npm run dev` để tự restart. `.env` là cấu hình riêng; không commit. Nếu dùng MySQL có sẵn, tạo database `week7_inventory` và user có quyền trên database đó, sửa DB_* trong `.env`, bỏ bước Docker.

## Module + MVC

`src/modules/*/routes.js` → controller → service (quy tắc/validation) → model (SQL) → `src/views/json.js` (JSON response). API dùng JSON view, không có HTML. `src/lib` là thư viện dùng chung trong project, `middleware` xác thực/quyền, `config.js` cấu hình. Auth dùng cùng khái niệm nhưng source từng project độc lập.

## Auth

POST `/api/register`: `{"name":"An","email":"an@example.com","password":"StrongPass123!"}`.
POST `/api/login`: email/password → `data.token`. Gửi `Authorization: Bearer TOKEN` cho endpoint bảo vệ. GET `/api/profile`. Token sống 1h, logout phía client xóa token; chưa có refresh/revocation. Đăng ký bỏ qua role từ client. Password bcrypt, secret ngẫu nhiên, auth rate limit.

## API

GET `/api/products?search=book&category_id=1&page=1`; GET `/api/products/:id`.
POST/PUT `/api/products[/id]`: `{"name":"Book","price":25.5,"stock":3,"category_id":1}`.
DELETE `/api/products/:id`. GET/POST `/api/categories` (body `{"name":"Office"}`).
Product writes và category create yêu cầu admin; promote tại máy bằng `npm run admin -- an@example.com` sau register.

List có `data.items`, `data.pagination`, 10 item/trang. Status: 200 đọc/sửa, 201 tạo, 204 xóa, 400 JSON lỗi, 401 token/credentials, 403 quyền, 404 thiếu, 409 trùng, 422 validation/FK, 429 rate limit, 503 DB offline. Request mẫu và kiểm tra tự động: [tests](test/api.test.js).

## Ghi chú học

[Hướng dẫn theo ngày](docs/INDEX.md). Markdown links mở bằng Cmd+click trong editor. Lệnh terminal nằm trong khối `sh`: copy vào Terminal để chạy; Cmd+click một file không tự thực thi shell command.

[Express error handling](https://expressjs.com/en/guide/error-handling/) · [mysql2 prepared statements](https://sidorares.github.io/node-mysql2/docs) · [Node test runner](https://nodejs.org/docs/latest-v22.x/api/test.html).

## Mở nhanh macOS

[Start.command](Start.command): Cmd+click để mở file; từ Finder double-click để chạy trong Terminal (tùy editor/macOS có thể chỉ mở source). Cần MySQL đã chạy và schema đã setup.
