# Module + MVC + CQRS (đối chiếu Laravel DJI)

```mermaid
flowchart LR
  Browser[Web EJS / client REST] --> Nginx[Nginx :8087]
  Nginx --> Core[Express HRM core]
  Core --> MW[Auth / CSRF / Permission middleware]
  MW --> Routes[Module Routes]
  Routes --> Controller[Controller]
  Controller --> Query[QueryBus / Query Handler]
  Query --> Repo[Read Repository]
  Repo --> ORM[Sequelize Models]
  Controller --> Command[CommandBus / Validation / Transaction]
  Command --> ORM
  ORM --> DB[(MySQL HRM)]
  ORM --> Observer[Audit Observer]
  Command --> Outbox[Transactional Outbox]
  Outbox --> Relay[Scheduler / Relay]
  Relay --> Redis[(Redis BullMQ)]
  Redis --> Notify[Notification Microservice / Worker]
  Notify --> NDB[(MySQL Notification DB)]
  Notify --> Mail[Mailpit SMTP]
  Core --> Cache[(Redis Dashboard Cache)]
  Core --> Socket[Authenticated Socket.IO]
  Socket --> Browser
```

Các module nghiệp vụ nằm ở `src/modules`: employees, departments, leaves, attendance, auth, dashboard, audit, notifications, system, companies, access; module core sở hữu model outbox/daily run. Model ORM đặt trong `src/modules/*/models/`; `src/models/index.js` là registry và association dùng chung. Views EJS trả HTML; REST controller trả JSON. Helpers trong lib là thư viện nội bộ project; không phải npm package riêng.

`src/app.js` chỉ cấu hình pipeline. Routes ở `src/routes` và trong module; controller riêng cho web/API gửi Query hoặc Command qua bus. Query Handler dùng read repository; Command Handler giữ nghiệp vụ và transaction; observer tự ghi audit. Không dùng `sequelize.sync()` tạo bảng: migration là nguồn schema, chạy trước server.

## Một luồng tạo nhân viên

POST /api/employees/create → authenticate → CSRF (cookie) → authorize(EmployeePolicy, action) → controller → CommandBus → Command Handler → Zod → transaction(User, Employee, observer audit, Outbox) → commit → publish nội bộ (invalidate cache, Socket) → response 201.

Scheduler lấy pending outbox → BullMQ jobId=UUID → Notification Worker → DB notification (eventId unique) → Nodemailer → Mailpit → status sent. HRM không cần service notification đang sống để commit nghiệp vụ.

## Ranh giới microservice

HRM dùng `week7_hrm` / user `week7_hrm`. Notification dùng `week7_hrm_notifications` / user `week7_notify`; quyền DB không chéo. Cùng MySQL instance Docker để tiết kiệm máy, nhưng schema/user riêng. Notification có package.json, lockfile, migration, Dockerfile và process độc lập; không import model core. Queue job contract là eventId/topic/recipient/userId/subject/text. Core đọc thông báo qua endpoint nội bộ có INTERNAL_KEY; browser không biết khóa này.

## Giới hạn có chủ đích

Đây là HRM học tập gồm hồ sơ/phòng ban/chấm công/nghỉ phép; chưa tính payroll, thuế, bảo hiểm, số dư phép năm, ca kíp, upload tài liệu hoặc SSO. Không phải sản phẩm HRM doanh nghiệp hoàn chỉnh.

SMTP có cửa sổ gửi trùng nếu process chết sau khi SMTP nhận nhưng trước khi update sent; at-least-once, Message-ID cố định, không cam kết exactly-once. Job fail hết retry được giữ lại; outbox queued nghĩa đã vào queue, không đồng nghĩa email sent. UI system phân biệt queue state.

Cache có TTL 30 giây và invalidate sau mutation. Cache fail thì đọc DB; nếu Redis hỏng đúng lúc invalidate, cache cũ có thể tồn tại tới TTL sau khi Redis phục hồi. Relay nhiều process có thể đọc cùng outbox nhưng jobId chống thêm trùng trong thời gian retention. Scheduler digest unique theo ngày. Chưa có audit archive/retention cho dữ liệu dài hạn.

Realtime hiện một instance web, chưa có Socket.IO Redis adapter để scale nhiều app. Socket bị đóng lúc token hết hạn và recheck role/version 15 giây; payload chỉ tên sự kiện, không có hồ sơ/lương; mỗi lần gửi đều resolveToken/loadAccess từ MySQL và lọc company/permission. Không claim production-ready hoặc đã deploy Internet.

Demo cookies HttpOnly, SameSite=Lax; JWT expiry 8 giờ, logout thu hồi mọi phiên user, password/role/active thay đổi tăng tokenVersion. Khi public cần HTTPS, COOKIE_SECURE=true, APP_ORIGIN chính xác, secret thật, thay tài khoản/password demo, SMTP thật và chính sách backup. Không đưa khóa vào git.


## Khai báo URL theo thao tác

Module Router không dùng shared resource prefix. Ví dụ employeeRoutes.get("/api/employees/list", authorize(EmployeePolicy,"view"), c.list) và employeeRoutes.post("/api/employees/create", authorize(EmployeePolicy,"create"), c.create). App chỉ gắn Router; middleware quyền đặt trên từng route, không áp cho các module khác. Xem [bảng endpoint đầy đủ](HRM-API.md).


## Đối chiếu với Laravel DJI

[Hướng dẫn TXT cho người chuyển từ Laravel](../HUONG-DAN-LARAVEL-SANG-NODEJS.txt). Provider: `src/providers/HrmServiceProvider.js`; bus: `src/core/MessageBus.js`. Module employees có controllers, requests, models, policies, queries, commands, repositories, routes riêng. Refactor ban đầu giữ schema; migration 002 bổ sung company/role/permission và backfill dữ liệu.

## Tenant và RBAC MySQL

`hrm_users.company_id/role_id` gắn account với company và role. Role–Permission qua `hrm_role_permissions`; override account qua `hrm_user_permissions.allowed`. Mỗi request đọc quyền mới, áp Policy và `companyWhere(actor)`; client không quyết định company scope. FK ghép chặn quan hệ chéo company. Role/assignment thay đổi thu hồi phiên qua tokenVersion. Cache key chứa company/user/permission; mail digest tính theo company. Một account/role/company, chưa có branch hay nhiều memberships. [Hướng dẫn](COMPANY-PERMISSION-LARAVEL-NODEJS.txt).
