# Kiểm chứng — 24/10/2026

Môi trường Node 22.22, MySQL 8.4 qua Docker port 3377. Đã chạy setup schema và integration test trên DB thật: register/login, profile, sai token/credentials, duplicate email, CRUD, filter/search, pagination vượt 10 item, validation; inventory kiểm tra admin/FK/category trùng, task kiểm tra ownership GET/PUT/DELETE và list cách ly user.

`node --env-file=.env scripts/check-db-offline.mjs`: chuyển riêng process test sang port DB không hoạt động, xác nhận 503 và API còn sống. Không tắt DB dùng chung.

Project một còn chạy 8 JS exercises, CLI (3 products / stock 19 / value 190) và async experiment (SQL rejection được bắt). Đây là kiểm chứng code tham khảo, không phải kết quả thi unaided hoặc điểm kiến thức/career của bạn.

Chạy lại:

```sh
npm test
node --env-file=.env scripts/check-db-offline.mjs
```

Không có dữ liệu W6/45 JD/application history nên gate, applications, mock, scorecard để trống. Không có đơn nào được gửi. Chưa deploy public; không có live Laravel project trong phạm vi hai thư mục để kiểm tra.
