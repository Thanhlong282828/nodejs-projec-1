# REST API

API base `http://localhost:8087/api` (Docker), `http://localhost:3057/api` (host). JSON thành công `{data: ...}`, lỗi `{error: message}`. Trang HTML ở `/employees`, API ở `/api/employees`.

| Method | URL | Quyền |
|---|---|---|
| POST | /auth/login | Public, rate limit, same-origin |
| POST | /auth/logout | Đăng nhập; thu hồi token |
| GET | /auth/me | Đăng nhập |
| GET | /dashboard | Dashboard theo role |
| GET/POST | /employees | Admin/HR |
| GET/PUT/DELETE | /employees/:id | Admin/HR; DELETE vô hiệu hóa |
| GET | /departments | Đăng nhập |
| POST | /departments | Admin/HR |
| PUT/DELETE | /departments/:id | Admin/HR |
| GET/POST | /leaves | Employee chỉ đọc own; Admin/HR đọc all |
| PATCH | /leaves/:id/decision | Admin/HR; không tự duyệt |
| DELETE | /leaves/:id | Owner, pending only |
| GET | /attendance | Employee chỉ own; Admin/HR all |
| POST | /attendance/check-in | Hồ sơ user hiện tại, không nhận employeeId từ client |
| POST | /attendance/check-out | Như trên |
| GET | /notifications | Own notifications qua service nội bộ |
| GET | /audit | Admin/HR, 20/page |
| GET | /system | Admin |

List employees: search, departmentId, page. Leaves: status (pending/approved/rejected), page. Attendance: page. 10 bản ghi/page, có metadata. Chấm công theo ngày VN, unique(employee_id,work_date), không chỉnh giờ từ client.

## Login bằng curl

```sh
curl -s http://localhost:8087/api/auth/login   -H 'Content-Type: application/json'   -d '{"email":"admin@hrm.local","password":"HrmDemo123!"}'
```

Copy `data.token` từ response; gửi header `Authorization: Bearer TOKEN_VUA_LOGIN`. Không ghi token thật vào README/git.

```sh
curl http://localhost:8087/api/employees   -H 'Authorization: Bearer TOKEN_VUA_LOGIN'
```

Body tạo nhân viên:

```json
{"name":"Nguyễn An","email":"an@example.test","password":"StrongPass123!","role":"employee","code":"HRM010","departmentId":1,"position":"Developer","phone":"","joinedOn":"2026-10-25","salary":18000000,"status":"active"}
```

PUT dùng cùng bộ field, password có thể bỏ qua để giữ nguyên. HR chỉ được tạo/sửa tài khoản employee; admin mới được cấp HR/admin. Update password, role hoặc trạng thái vô hiệu hóa thu hồi token cũ.

Body nghỉ: `{"type":"annual","startDate":"2026-11-01","endDate":"2026-11-02","reason":"Việc gia đình"}`. Quyết định: `{"status":"approved","note":"Đã sắp xếp bàn giao"}`.

Web dùng JWT cookie HttpOnly + CSRF token trong meta/header. API Bearer không yêu cầu CSRF vì client chủ động giữ/gửi token; không cấu hình CORS mở rộng. Status: 200/201/204, 400 JSON hỏng, 401, 403, 404, 409 trùng/xung đột, 413 quá lớn, 422 input/FK, 429 auth limit, 503 dependency không sẵn sàng.
