# REST API

API base `http://localhost:8087/api` (Docker), `http://localhost:3057/api` (host). JSON thành công `{data: ...}`, lỗi `{error: message}`. Trang HTML ở `/employees/list`, danh sách JSON ở `/api/employees/list`. Mỗi thao tác có URL riêng, không dùng resource route hoặc chung URL CRUD. Router chỉ tổ chức module; từng dòng khai báo đủ method, URL, middleware và handler.

| Method | URL (sau /api) | Quyền |
|---|---|---|
| POST | /auth/login | Public, rate limit, same-origin |
| POST | /auth/logout | Đăng nhập; thu hồi token |
| GET | /auth/profile | Thông tin user hiện tại |
| GET | /dashboard/summary | Dashboard theo role |
| GET | /employees/list | Admin/HR; search, filter, page |
| GET | /employees/detail/:id | Admin/HR |
| POST | /employees/create | Admin/HR |
| PUT | /employees/update/:id | Admin/HR |
| DELETE | /employees/delete/:id | Admin/HR; vô hiệu hóa, giữ lịch sử |
| GET | /departments/list | Đăng nhập |
| POST | /departments/create | Admin/HR |
| PUT | /departments/update/:id | Admin/HR |
| DELETE | /departments/delete/:id | Admin/HR; phòng ban không có nhân viên |
| GET | /leaves/list | Employee chỉ own; Admin/HR all |
| POST | /leaves/create | Tạo đơn cho chính mình |
| PATCH | /leaves/update/:id | Admin/HR duyệt/từ chối; không tự duyệt |
| DELETE | /leaves/delete/:id | Owner, pending only |
| GET | /attendance/list | Employee chỉ own; Admin/HR all |
| POST | /attendance/check-in | Check-in user hiện tại |
| POST | /attendance/check-out | Check-out user hiện tại |
| GET | /notifications/list | Thông báo của user hiện tại |
| GET | /audit/list | Admin/HR; 20/page |
| GET | /system/status | Admin |

List employees: search, departmentId, page. Leaves: status (pending/approved/rejected), page. Attendance: page. 10 bản ghi/page, có metadata. Chấm công theo ngày VN, unique(employee_id,work_date), không chỉnh giờ từ client.

## Login bằng curl

```sh
curl -s http://localhost:8087/api/auth/login   -H 'Content-Type: application/json'   -d '{"email":"admin@hrm.local","password":"HrmDemo123!"}'
```

Copy `data.token` từ response; gửi header `Authorization: Bearer TOKEN_VUA_LOGIN`. Không ghi token thật vào README/git.

```sh
curl http://localhost:8087/api/employees/list   -H 'Authorization: Bearer TOKEN_VUA_LOGIN'
```

Body tạo nhân viên tại `POST /api/employees/create`:

```json
{"name":"Nguyễn An","email":"an@example.test","password":"StrongPass123!","role":"employee","code":"HRM010","departmentId":1,"position":"Developer","phone":"","joinedOn":"2026-10-25","salary":18000000,"status":"active"}
```

`PUT /api/employees/update/:id` dùng cùng bộ field, password có thể bỏ qua để giữ nguyên. HR chỉ được tạo/sửa tài khoản employee; admin mới được cấp HR/admin. Update password, role hoặc trạng thái vô hiệu hóa thu hồi token cũ.

Body nghỉ: `{"type":"annual","startDate":"2026-11-01","endDate":"2026-11-02","reason":"Việc gia đình"}`. Quyết định: `{"status":"approved","note":"Đã sắp xếp bàn giao"}`.

Web dùng JWT cookie HttpOnly + CSRF token trong meta/header. API Bearer không yêu cầu CSRF vì client chủ động giữ/gửi token; không cấu hình CORS mở rộng. Status: 200/201/204, 400 JSON hỏng, 401, 403, 404, 409 trùng/xung đột, 413 quá lớn, 422 input/FK, 429 auth limit, 503 dependency không sẵn sàng.


## Web và microservice

Web: `/employees/list`, `/departments/list`, `/leaves/list`, `/attendance/list`, `/notifications/list`, `/audit/list`, `/system/status`. Dashboard vẫn ở `/`, login vẫn `/login`. Các form/dialog gọi đúng API create/update/delete riêng. GET không sửa hoặc xóa dữ liệu.

Notification service: `GET /internal/messages/list?userId=...` có `x-internal-key`. `/health`, `/socket.io/` và API bên thứ ba Mailpit giữ nguyên vì là endpoint hạ tầng, không phải CRUD resource của HRM.

Các endpoint cũ như `/api/employees`, `/api/employees/:id`, `/api/leaves` đã bỏ, không có alias hay resource fallback; client cũ phải đổi sang bảng trên. `legacy/inventory` là bản lịch sử độc lập, giữ nguyên route cũ.
