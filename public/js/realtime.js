// Socket.IO dùng cookie HttpOnly của phiên hiện tại; không lưu token vào localStorage.
if (typeof io === "function") {
  const socket = io();
  const status = document.getElementById("live-status");
  socket.on("connect", () => {
    if (status) {
      status.textContent = "Đã kết nối";
      status.classList.add("online");
    }
  });
  socket.on("disconnect", () => {
    if (status) {
      status.textContent = "Mất kết nối";
      status.classList.remove("online");
    }
  });
  socket.on("connect_error", () => {
    if (status) status.textContent = "Chưa kết nối";
  });
  socket.on("hrm:changed", () => {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent =
        "Có cập nhật mới trong workspace. Tải lại trang để xem dữ liệu mới.";
      toast.hidden = false;
    }
  });
}
