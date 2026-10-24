// HƯỚNG DẪN HỌC: View của API là JSON, không phải trang HTML. Response chuẩn có dạng { data: ... }.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Gửi HTTP status (mặc định 200) và dữ liệu dưới khóa data.
export const json = (res, data, status = 200) =>
  res.status(status).json({ data });
