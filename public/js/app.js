// Giao diện gọi REST API bằng fetch; EJS render HTML ban đầu, JSON dùng cho thao tác không tải form truyền thống.
const csrf = () =>
  document.querySelector('meta[name="csrf-token"]')?.content || "";
function toast(message) {
  const node = document.getElementById("toast");
  if (!node) return alert(message);
  node.textContent = message;
  node.hidden = false;
  setTimeout(() => (node.hidden = true), 6000);
}
async function api(url, method = "GET", body) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf() },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 401 && url !== "/api/auth/login") {
    location.href = "/login";
    throw new Error("Phiên đăng nhập hết hạn.");
  }
  const result = response.status === 204 ? {} : await response.json();
  if (!response.ok)
    throw new Error(result.error || "Không thể thực hiện thao tác.");
  return result.data;
}
for (const form of document.querySelectorAll("form[data-api]"))
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector(
      'button[type="submit"], button:not([type])',
    );
    const error = form.querySelector(".form-error");
    if (error) error.textContent = "";
    if (submit) submit.disabled = true;
    try {
      const body = Object.fromEntries(new FormData(form));
      for (const input of form.querySelectorAll("[data-number]"))
        body[input.name] = Number(body[input.name]);
      if (form.dataset.method === "PUT" && !body.password) delete body.password;
      await api(form.dataset.api, form.dataset.method || "POST", body);
      location.href = form.dataset.redirect || location.href;
    } catch (e) {
      if (error) error.textContent = e.message;
      else toast(e.message);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
for (const button of document.querySelectorAll("[data-open]"))
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.open);
    const form = dialog.querySelector("form");
    form.reset();
    form.dataset.method = "POST";
    if (form.id === "employee-form") {
      form.dataset.api = "/api/employees/create";
      form.elements.password.required = true;
    }
    if (form.id === "department-form")
      form.dataset.api = "/api/departments/create";
    dialog.showModal();
  });
for (const button of document.querySelectorAll("[data-close]"))
  button.addEventListener("click", () =>
    document.getElementById(button.dataset.close).close(),
  );
for (const button of document.querySelectorAll("[data-delete]"))
  button.addEventListener("click", async () => {
    if (
      !confirm(button.dataset.confirm || "Bạn chắc chắn muốn xóa dữ liệu này?")
    )
      return;
    try {
      await api(button.dataset.delete, "DELETE");
      location.reload();
    } catch (e) {
      toast(e.message);
    }
  });
for (const button of document.querySelectorAll("[data-action]"))
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await api(button.dataset.action, "POST", {});
      location.reload();
    } catch (e) {
      toast(e.message);
      button.disabled = false;
    }
  });
for (const button of document.querySelectorAll("[data-decision]"))
  button.addEventListener("click", async () => {
    const note = prompt("Ghi chú phản hồi (có thể để trống):", "");
    if (note === null) return;
    try {
      await api(`/api/leaves/update/${button.dataset.id}`, "PATCH", {
        status: button.dataset.decision,
        note,
      });
      location.reload();
    } catch (e) {
      toast(e.message);
    }
  });
for (const button of document.querySelectorAll("[data-edit-employee]"))
  button.addEventListener("click", () => {
    const employee = JSON.parse(button.dataset.editEmployee),
      form = document.getElementById("employee-form");
    form.reset();
    const values = { ...employee, ...employee.user };
    for (const [key, value] of Object.entries(values))
      if (form.elements[key] && key !== "password")
        form.elements[key].value = value ?? "";
    form.elements.password.required = false;
    form.elements.password.placeholder = "Để trống nếu giữ mật khẩu";
    form.dataset.method = "PUT";
    form.dataset.api = `/api/employees/update/${employee.id}`;
    document.getElementById("employee-dialog").showModal();
  });
for (const button of document.querySelectorAll("[data-edit-department]"))
  button.addEventListener("click", () => {
    const value = JSON.parse(button.dataset.editDepartment),
      form = document.getElementById("department-form");
    form.elements.name.value = value.name;
    form.elements.description.value = value.description || "";
    form.dataset.api = `/api/departments/update/${value.id}`;
    form.dataset.method = "PUT";
    document.getElementById("department-dialog").showModal();
  });
document.getElementById("logout")?.addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", "POST", {});
    location.href = "/login";
  } catch (e) {
    toast(e.message);
  }
});
let attendancePage = 1;
async function loadAttendance() {
  const rows = document.getElementById("attendance-rows");
  if (!rows) return;
  try {
    const result = await api(`/api/attendance/list?page=${attendancePage}`);
    rows.replaceChildren();
    for (const item of result.items) {
      const tr = document.createElement("tr");
      for (const value of [
        item.employee.user.name,
        item.workDate,
        new Date(item.checkIn).toLocaleTimeString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        }),
        item.checkOut
          ? new Date(item.checkOut).toLocaleTimeString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
            })
          : "—",
        item.checkOut ? "Đã kết thúc" : "Đang làm việc",
      ]) {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      }
      rows.append(tr);
    }
    if (!result.items.length) {
      const tr = document.createElement("tr"),
        td = document.createElement("td");
      td.colSpan = 5;
      td.className = "empty-state";
      td.textContent = "Chưa có lịch sử chấm công.";
      tr.append(td);
      rows.append(tr);
    }
    document.getElementById("attendance-page-label").textContent =
      `Trang ${attendancePage} · ${result.pagination.total} bản ghi`;
    document.getElementById("attendance-prev").disabled = attendancePage <= 1;
    document.getElementById("attendance-next").disabled =
      attendancePage * 10 >= result.pagination.total;
  } catch (e) {
    rows.textContent = e.message;
  }
}
document.getElementById("attendance-prev")?.addEventListener("click", () => {
  attendancePage--;
  loadAttendance();
});
document.getElementById("attendance-next")?.addEventListener("click", () => {
  attendancePage++;
  loadAttendance();
});
loadAttendance();
if (document.getElementById("system-stats"))
  api("/api/system/status")
    .then((result) => {
      document.getElementById("system-stats").textContent = JSON.stringify(
        result,
        null,
        2,
      );
    })
    .catch((e) => toast(e.message));
