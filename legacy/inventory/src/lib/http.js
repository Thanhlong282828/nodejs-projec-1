// HƯỚNG DẪN HỌC: Thư viện dùng chung: kiểm tra đầu vào, phân trang và đổi lỗi thành HTTP JSON response.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Lỗi nghiệp vụ mang status HTTP để middleware biết phải trả 401/404/422...
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
// Kiểm tra ID/page từ URL: query/params là chuỗi, cần chuyển thành số nguyên dương.
export function integer(value, name = "id", fallback) {
  if (value === undefined && fallback !== undefined) return fallback;
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value) ||
    !Number.isSafeInteger(Number(value))
  )
    throw new HttpError(422, `${name} must be a positive integer`);
  return Number(value);
}
// Chuỗi bắt buộc: kiểm tra kiểu, bỏ khoảng trắng hai đầu và giới hạn độ dài.
export function text(value, name, max = 255) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new HttpError(422, `${name} is required (max ${max})`);
  return value.trim();
}
// Phân trang 10 dòng: offset=(page-1)*10; chỉ dùng số đã kiểm tra để ghép LIMIT/OFFSET.
export function page(query) {
  const page = integer(query.page, "page", 1);
  if (page > 1000000) throw new HttpError(422, "page too large");
  return { page, limit: 10, offset: (page - 1) * 10 };
}
// Search vắng mặt thì dùng chuỗi rỗng; từ chối mảng/object hoặc chuỗi quá dài.
export function search(value) {
  if (value === undefined) return "";
  if (typeof value !== "string" || value.length > 100)
    throw new HttpError(422, "search must be text <=100 characters");
  return value;
}
// Error middleware có đủ 4 tham số (err,req,res,next) để Express nhận diện.
export function errors(err, req, res, next) {
  // Nếu đã gửi response thì chuyển lỗi tiếp, tránh gửi header hai lần.
  if (res.headersSent) return next(err);
  let status = err.status || 500,
    message = err.message;
  // Unique constraint bị trùng (ví dụ email) trả 409 Conflict.
  if (err.code === "ER_DUP_ENTRY") {
    status = 409;
    message = "Duplicate value";
  }
  // Lỗi khóa ngoại: category không tồn tại hoặc còn dữ liệu liên quan → 422.
  if (["ER_NO_REFERENCED_ROW_2", "ER_ROW_IS_REFERENCED_2"].includes(err.code)) {
    status = 422;
    message = "Invalid relationship";
  }
  if (
    [
      // Lỗi kết nối MySQL trả 503 để client biết database tạm không sẵn sàng.
      "ECONNREFUSED",
      "ETIMEDOUT",
      "PROTOCOL_CONNECTION_LOST",
      "ER_ACCESS_DENIED_ERROR",
      "ER_BAD_DB_ERROR",
    ].includes(err.code)
  ) {
    status = 503;
    message = "Database unavailable";
  }
  // Body JSON sai cú pháp trả 400, chưa đi tới controller.
  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON";
  }
  if (status >= 500) {
    console.error(err.code || err.message);
    if (status !== 503) message = "Internal server error";
  }
  // Trả lỗi theo định dạng chung { error: message }.
  res.status(status).json({ error: message });
}
