# 23 thành phần — có code và đường kiểm tra

## 1. ORM — Sequelize

[Code](../src/models/index.js) · [Tài liệu chính thức](https://sequelize.org/docs/v6/core-concepts/model-querying-basics/)

Quan hệ User–Employee–Department; không dùng SQL chuỗi trong business service.

## 2. Migration — Umzug + SequelizeStorage

[Code](../database/migrations/001-hrm-core.js) · [Tài liệu chính thức](https://github.com/sequelize/umzug)

npm run migrate; npm run migrate:status

## 3. Routing — Express Router

[Code](../src/modules/employees/routes.js) · [Tài liệu chính thức](https://expressjs.com/en/guide/routing.html)

GET/POST/PUT/DELETE /api/employees

## 4. Validation — Zod

[Code](../src/lib/validation.js) · [Tài liệu chính thức](https://zod.dev/)

Thử salary âm, email sai, endDate trước startDate → 422.

## 5. Middleware — Express

[Code](../src/middleware/auth.js) · [Tài liệu chính thức](https://expressjs.com/en/guide/using-middleware.html)

authenticate → csrf → role policy → controller.

## 6. Authorization — RBAC + ownership

[Code](../src/modules/leaves/service.js) · [Tài liệu chính thức](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

Employee bị 403 khi duyệt đơn; người quản lý không được tự duyệt.

## 7. Authentication — bcrypt + JWT + cookie

[Code](../src/modules/auth/service.js) · [Tài liệu chính thức](https://github.com/auth0/node-jsonwebtoken)

Đăng nhập; logout tăng tokenVersion để thu hồi token.

## 8. API REST — Express JSON API

[Code](../src/app.js) · [Tài liệu chính thức](https://expressjs.com/en/5x/api.html)

Các endpoint HRM có status 200/201/204/401/403/404/409/422.

## 9. Queue — BullMQ producer / worker

[Code](../src/queue/index.js) · [Tài liệu chính thức](https://docs.bullmq.io/)

Welcome/leave/digest đi qua job; retry exponential, giữ failed jobs.

## 10. Queue Backend — Redis AOF / noeviction

[Code](../compose.yaml) · [Tài liệu chính thức](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)

docker compose exec redis redis-cli ping

## 11. Scheduler — node-cron, process riêng

[Code](../src/scheduler.js) · [Tài liệu chính thức](https://nodecron.com/)

Relay 10s; HR digest 08:00 thứ Hai–Sáu; npm run schedule:run để thử ngay.

## 12. Event — EventEmitter + transactional outbox

[Code](../src/events/index.js) · [Tài liệu chính thức](https://nodejs.org/docs/latest-v22.x/api/events.html)

recordEvent cùng transaction, publish sau commit; event khác observer.

## 13. Observer — Sequelize hooks

[Code](../src/observers/audit-observer.js) · [Tài liệu chính thức](https://sequelize.org/docs/v6/other-topics/hooks/)

Tự ghi audit khi create/update/destroy qua ORM, rollback cùng dữ liệu.

## 14. Cache — Redis cache-aside

[Code](../src/lib/redis.js) · [Tài liệu chính thức](https://redis.io/docs/latest/develop/)

GET /api/dashboard: header X-Cache MISS rồi HIT; mutation invalidate.

## 15. Realtime — Socket.IO authenticated rooms

[Code](../src/server.js) · [Tài liệu chính thức](https://socket.io/docs/v4/)

Admin/HR vào room managers; employee vào room user riêng.

## 16. Mail — Nodemailer + Mailpit SMTP

[Code](../services/notifications/src/server.js) · [Tài liệu chính thức](https://nodemailer.com/)

Mở localhost:8037; không gửi mail ra ngoài.

## 17. Testing — Node test + Supertest

[Code](../test/hrm.test.js) · [Tài liệu chính thức](https://nodejs.org/docs/latest-v22.x/api/test.html)

npm test và npm run test:e2e

## 18. CLI — Node script commands

[Code](../scripts/hrm-cli.js) · [Tài liệu chính thức](https://nodejs.org/docs/latest-v22.x/api/process.html)

npm run cli -- users; npm run queue:dispatch

## 19. Package Manager — npm + lockfiles

[Code](../package.json) · [Tài liệu chính thức](https://docs.npmjs.com/cli/commands/npm-ci)

npm ci theo lockfile; microservice có package/lock riêng.

## 20. Template — EJS server-side HTML

[Code](../src/views/dashboard.ejs) · [Tài liệu chính thức](https://ejs.co/)

Vào / để thấy HTML; <%= ... %> escape dữ liệu động.

## 21. Web Server — Node HTTP + Nginx reverse proxy

[Code](../docker/nginx.conf) · [Tài liệu chính thức](https://nginx.org/en/docs/http/websocket.html)

localhost:8087 → Nginx → Express; proxy Socket.IO upgrade.

## 22. Docker — Compose: 7 service

[Code](../compose.yaml) · [Tài liệu chính thức](https://docs.docker.com/compose/)

mysql, redis, mailpit, app, notifications, scheduler, web.

## 23. Microservices — HRM core + notification service

[Code](../services/notifications/src/db.js) · [Tài liệu chính thức](https://microservices.io/patterns/data/transactional-outbox.html)

Process/image/DB user riêng; giao tiếp async queue và internal HTTP có service key.
