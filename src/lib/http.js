export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const data = (res, value, status = 200) =>
  res.status(status).json({ data: value });
export function errors(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = err.status || 500,
    message = err.message;
  if (err.name === "ZodError") {
    status = 422;
    message = err.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
  }
  if (err.name === "SequelizeUniqueConstraintError") {
    status = 409;
    message =
      "Dữ liệu đã tồn tại (email, mã nhân viên hoặc bản ghi trong ngày).";
  }
  if (err.name === "SequelizeForeignKeyConstraintError") {
    status = 422;
    message = "Phòng ban hoặc dữ liệu liên quan không hợp lệ.";
  }
  if (err.name?.startsWith("SequelizeConnection")) {
    status = 503;
    message = "MySQL tạm thời không sẵn sàng.";
  }
  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "JSON không hợp lệ.";
  }
  if (err.type === "entity.too.large") {
    status = 413;
    message = "Nội dung quá lớn.";
  }
  if (status >= 500) {
    console.error(err.name, err.message);
    if (status !== 503) message = "Không thể xử lý yêu cầu lúc này.";
  }
  if (req.path.startsWith("/api/") || req.path === "/health")
    return res.status(status).json({ error: message });
  res.status(status).render("error", {
    title: "Có lỗi xảy ra",
    message,
    user: req.user || null,
  });
}
