# REST API

API base `http://localhost:8087/api` (Docker), `http://localhost:3057/api` (host). JSON thành công `{data: ...}`, lỗi `{error: message}`. Trang HTML ở `/employees/list`, danh sách JSON ở `/api/employees/list`. Mỗi thao tác có URL riêng, không dùng resource route hoặc chung URL CRUD. Router chỉ tổ chức module; từng dòng khai báo đủ method, URL, middleware và handler.

| Method | URL (sau /api) | Quyền |
|---|---|---|
| POST | /auth/login | Public, rate limit, same-origin |
| POST | /auth/logout | Đăng nhập; thu hồi token |
| GET | /auth/profile | Thông tin user hiện tại |
| GET | /dashboard/summary | dashboard.view; thống kê theo company/quyền |
| GET | /employees/list | employees.view; trong company hiện tại |
| GET | /employees/detail/:id | employees.view; trong company hiện tại |
| POST | /employees/create | employees.create; trong company hiện tại |
| PUT | /employees/update/:id | employees.update; trong company hiện tại |
| DELETE | /employees/delete/:id | employees.delete; trong company hiện tại |
| GET | /departments/list | departments.view; trong company hiện tại |
| POST | /departments/create | departments.create; trong company hiện tại |
| PUT | /departments/update/:id | departments.update; trong company hiện tại |
| DELETE | /departments/delete/:id | departments.delete; trong company hiện tại |
| GET | /leaves/list | view: own; viewAll: toàn company |
| POST | /leaves/create | Tạo đơn cho chính mình |
| PATCH | /leaves/update/:id | leaves.update; cùng company, không tự duyệt |
| DELETE | /leaves/delete/:id | Owner, pending only |
| GET | /attendance/list | view: own; viewAll: toàn company |
| POST | /attendance/check-in | Check-in user hiện tại |
| POST | /attendance/check-out | Check-out user hiện tại |
| GET | /notifications/list | Thông báo của user hiện tại |
| GET | /audit/list | audit.view; cùng company, 20/page |
| GET | /system/status | system.view |

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

## Company và quyền MySQL

| Method | URL (sau /api) | Quyền |
|---|---|---|
| GET | /companies/list | companies.view; company hiện tại |
| GET | /companies/detail/:id | companies.view; own company |
| POST | /companies/create | admin + companies.create; kèm adminName/adminEmail/adminPassword |
| PUT | /companies/update/:id | companies.update; own company |
| GET | /access/list | admin + access.manage |
| POST | /roles/create | admin + access.manage |
| PUT | /roles/update/:id | admin + access.manage; own company |
| PUT | /accounts/assign/:id | admin + access.manage; own company |

Body role: `{"name":"Trưởng nhóm","code":"team_lead","permissions":["dashboard.view","employees.view"]}`.
Body assign: `{"roleId":4,"allow":["departments.create"],"deny":["employees.view"]}`; thay 4 bằng ID role thật của company.
Role/admin và tự thay quyền được bảo vệ. Assignment thay toàn bộ override của account, tăng tokenVersion.
Trang web: `/companies/list`, `/access/list`. [Hướng dẫn đầy đủ](COMPANY-PERMISSION-LARAVEL-NODEJS.txt).
