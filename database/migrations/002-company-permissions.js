import { DataTypes as D } from "sequelize";
import {
  permissionCatalog,
  defaultRoles,
} from "../../src/modules/access/permissions.js";
// Migration nâng cấp dữ liệu cũ: đưa vào công ty mặc định, không reset DB.
export async function up({ context: q }) {
  const id = {
    type: D.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  };
  const stamps = {
    created_at: { type: D.DATE, allowNull: false },
    updated_at: { type: D.DATE, allowNull: false },
  };
  const fk = (table, nullable = false) => ({
    type: D.INTEGER.UNSIGNED,
    allowNull: nullable,
    references: { model: table, key: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await q.createTable("hrm_companies", {
    id,
    name: { type: D.STRING(150), allowNull: false },
    code: { type: D.STRING(40), allowNull: false, unique: true },
    address: D.STRING(300),
    email: D.STRING(191),
    ...stamps,
  });
  await q.bulkInsert("hrm_companies", [
    {
      id: 1,
      name: "PeopleFlow",
      code: "PEOPLEFLOW",
      address: "",
      email: "admin@hrm.local",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
  for (const table of [
    "hrm_users",
    "hrm_departments",
    "hrm_employees",
    "hrm_leaves",
    "hrm_attendances",
    "hrm_audits",
  ]) {
    await q.addColumn(table, "company_id", fk("hrm_companies", true));
    await q.sequelize.query(`UPDATE ${table} SET company_id=1`);
    await q.changeColumn(table, "company_id", fk("hrm_companies"));
    await q.addIndex(table, ["company_id"]);
  }
  await q.createTable("hrm_roles", {
    id,
    company_id: fk("hrm_companies"),
    name: { type: D.STRING(120), allowNull: false },
    code: { type: D.STRING(60), allowNull: false },
    system_key: { type: D.ENUM("admin", "hr", "employee"), allowNull: true },
    ...stamps,
  });
  await q.addIndex("hrm_roles", ["company_id", "code"], { unique: true });
  await q.addIndex("hrm_roles", ["company_id", "system_key"], { unique: true });
  await q.createTable("hrm_permissions", {
    id,
    key: { type: D.STRING(80), unique: true, allowNull: false },
    name: { type: D.STRING(150), allowNull: false },
    ...stamps,
  });
  await q.createTable("hrm_role_permissions", {
    role_id: { ...fk("hrm_roles"), primaryKey: true },
    permission_id: { ...fk("hrm_permissions"), primaryKey: true },
  });
  await q.createTable("hrm_user_permissions", {
    user_id: { ...fk("hrm_users"), primaryKey: true },
    permission_id: { ...fk("hrm_permissions"), primaryKey: true },
    allowed: { type: D.BOOLEAN, allowNull: false },
  });
  await q.addColumn("hrm_users", "role_id", fk("hrm_roles", true));
  let permissionId = 0,
    roleId = 0;
  const ids = {};
  for (const [key, name] of Object.entries(permissionCatalog)) {
    ids[key] = ++permissionId;
    await q.bulkInsert("hrm_permissions", [
      {
        id: permissionId,
        key,
        name,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  }
  for (const [code, spec] of Object.entries(defaultRoles)) {
    roleId++;
    await q.bulkInsert("hrm_roles", [
      {
        id: roleId,
        company_id: 1,
        code,
        name: spec.name,
        system_key: code,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    await q.bulkInsert(
      "hrm_role_permissions",
      spec.permissions.map((k) => ({ role_id: roleId, permission_id: ids[k] })),
    );
    await q.sequelize.query(
      "UPDATE hrm_users SET role_id=:roleId WHERE role=:code",
      { replacements: { roleId, code } },
    );
  }
  await q.changeColumn("hrm_users", "role_id", fk("hrm_roles"));
  // Cùng tên phòng ban/mã nhân viên được dùng ở các công ty khác nhau.
  for (const [table, col] of [
    ["hrm_departments", "name"],
    ["hrm_employees", "code"],
  ]) {
    const indexes = await q.showIndex(table);
    for (const index of indexes)
      if (
        index.unique &&
        index.fields.length === 1 &&
        index.fields[0].attribute === col
      )
        await q.removeIndex(table, index.name);
    await q.addIndex(table, ["company_id", col], { unique: true });
  }
  // FK ghép chống ghép nhân viên với user/phòng ban hoặc role của công ty khác.
  for (const table of [
    "hrm_roles",
    "hrm_users",
    "hrm_departments",
    "hrm_employees",
  ])
    await q.addIndex(table, ["id", "company_id"], {
      unique: true,
      name: `${table}_id_company`,
    });
  for (const [table, fields, ref, refFields, name] of [
    [
      "hrm_users",
      ["role_id", "company_id"],
      "hrm_roles",
      ["id", "company_id"],
      "users_role_company",
    ],
    [
      "hrm_employees",
      ["user_id", "company_id"],
      "hrm_users",
      ["id", "company_id"],
      "employees_user_company",
    ],
    [
      "hrm_employees",
      ["department_id", "company_id"],
      "hrm_departments",
      ["id", "company_id"],
      "employees_department_company",
    ],
    [
      "hrm_leaves",
      ["employee_id", "company_id"],
      "hrm_employees",
      ["id", "company_id"],
      "leaves_employee_company",
    ],
    [
      "hrm_attendances",
      ["employee_id", "company_id"],
      "hrm_employees",
      ["id", "company_id"],
      "attendance_employee_company",
    ],
  ])
    await q.addConstraint(table, {
      fields,
      type: "foreign key",
      references: { table: ref, fields: refFields },
      name,
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
}
export async function down() {
  throw new Error(
    "Company/RBAC migration preserves tenant data; use a reviewed backup/restore instead of automatic downgrade.",
  );
}
