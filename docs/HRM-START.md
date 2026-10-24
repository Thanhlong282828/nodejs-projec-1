# Khởi động và cách dùng

## Cách 1 — toàn bộ Docker (nên dùng để xem web)

```sh
cd ~/Desktop/xinviec/weeksevenfileone
sh scripts/start-hrm.sh
```

[Web HRM](http://localhost:8087) · [Mailpit](http://localhost:8037). Admin `admin@hrm.local`, HR `hr@hrm.local`, nhân viên `employee@hrm.local`; mật khẩu demo `HrmDemo123!`.

```sh
docker compose --profile full ps
docker compose --profile full logs --tail=50 app notifications scheduler web
# Dừng phần ứng dụng; giữ MySQL/Redis/mail và toàn bộ dữ liệu:
docker compose --profile full stop app notifications scheduler web
```

Không chạy `docker compose down -v` nếu cần giữ dữ liệu. MySQL dùng port 3377, không sửa MySQL Herd/port 3306. Redis riêng cổng 6387.

## Cách 2 — sửa code Node trên máy, hạ tầng Docker

Dừng các service app/web/scheduler/notifications Docker để tránh hai worker hoặc scheduler cùng chạy.

```sh
cd ~/Desktop/xinviec/weeksevenfileone
docker compose --profile full stop app notifications scheduler web
docker compose up -d --wait mysql redis mailpit
npm ci
node scripts/init-env.mjs
npm run infra:setup
npm run migrate
npm run seed
npm run dev
```

Terminal thứ hai:

```sh
cd ~/Desktop/xinviec/weeksevenfileone/services/notifications
npm ci
npm run migrate
npm start
```

Terminal thứ ba:

```sh
cd ~/Desktop/xinviec/weeksevenfileone
npm run schedule
```

[Web Node local](http://localhost:3057). Cổng 3047 thuộc bản API cũ nếu vẫn đang chạy; không phải HRM mới. Với Docker web dùng 8087. Chỉ chọn một chế độ khi tự học.

## Thử từng vai trò

1. Admin: tạo phòng ban; thêm nhân viên với email/mã riêng; mở audit xem sự kiện created.
2. Nhân viên: đăng nhập bằng tài khoản mới; check-in, check-out; tạo đơn nghỉ.
3. HR: mở nghỉ phép, duyệt đơn của nhân viên; không được tự duyệt đơn của mình.
4. Chờ relay tối đa 10 giây; mở Mailpit xem welcome/leave email; mở Thông báo xem lịch sử của tài khoản.
5. Mở hai cửa sổ đăng nhập khác vai trò (dùng cửa sổ ẩn danh); khi có thay đổi, Socket hiển thị thông báo cập nhật. Giao diện không tự tải lại lúc đang nhập form.
6. Admin mở Hệ thống xem queue/outbox. Dashboard dùng dữ liệu thật, không giả số thống kê.

Nhân viên thường không được xem lương/danh sách của toàn công ty hoặc endpoint audit/system. Xóa nhân viên là vô hiệu hóa (giữ lịch sử). Phòng ban đang có nhân viên không xóa được.
