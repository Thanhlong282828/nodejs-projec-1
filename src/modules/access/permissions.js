// Giống permission names trong Spatie: permission quyết định thao tác, role gom quyền.
export const permissionCatalog = {
  "dashboard.view": "Xem tổng quan",
  "employees.view": "Xem nhân viên",
  "employees.create": "Tạo nhân viên",
  "employees.update": "Sửa nhân viên",
  "employees.delete": "Ngừng nhân viên",
  "departments.view": "Xem phòng ban",
  "departments.create": "Tạo phòng ban",
  "departments.update": "Sửa phòng ban",
  "departments.delete": "Xóa phòng ban",
  "leaves.view": "Xem đơn của mình",
  "leaves.viewAll": "Xem đơn toàn công ty",
  "leaves.create": "Xin nghỉ",
  "leaves.update": "Duyệt nghỉ",
  "leaves.delete": "Hủy đơn của mình",
  "attendance.view": "Xem chấm công của mình",
  "attendance.viewAll": "Xem chấm công toàn công ty",
  "attendance.checkIn": "Vào ca",
  "attendance.checkOut": "Kết ca",
  "audit.view": "Xem nhật ký",
  "system.view": "Xem trạng thái hệ thống",
  "companies.view": "Xem công ty",
  "companies.create": "Tạo công ty cùng admin đầu tiên",
  "companies.update": "Sửa công ty",
  "access.manage": "Quản lý chức vụ và phân quyền",
};
export const staffPermissions = [
  "dashboard.view",
  "departments.view",
  "leaves.view",
  "leaves.create",
  "leaves.delete",
  "attendance.view",
  "attendance.checkIn",
  "attendance.checkOut",
];
export const defaultRoles = {
  admin: {
    name: "Quản trị công ty",
    permissions: Object.keys(permissionCatalog),
  },
  hr: {
    name: "Nhân sự",
    permissions: Object.keys(permissionCatalog).filter(
      (k) =>
        !k.startsWith("companies.") &&
        !["access.manage", "system.view"].includes(k),
    ),
  },
  employee: { name: "Nhân viên", permissions: staffPermissions },
};
export const can = (user, key) => Boolean(user?.permissions?.includes(key));
