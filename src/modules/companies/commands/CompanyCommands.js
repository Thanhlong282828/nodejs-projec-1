import bcrypt from "bcryptjs";
import { db } from "../../../lib/db.js";
import { Company, User, Audit } from "../../../models/index.js";
import { companyWhere } from "../../../core/tenant.js";
import { parseId } from "../../../lib/validation.js";
import { HttpError } from "../../../lib/http.js";
import {
  companySchema,
  createCompanySchema,
} from "../requests/CompanyRequest.js";
import { createCompanyRoles } from "../../access/bootstrap.js";
import { CompanyPolicy } from "../policies/CompanyPolicy.js";
import { publish } from "../../../events/index.js";
async function create(actor, input) {
  if (!CompanyPolicy.create(actor))
    throw new HttpError(403, "Không có quyền tạo công ty.");
  const values = createCompanySchema.parse(input),
    password = await bcrypt.hash(values.adminPassword, 12);
  return db.transaction(async (transaction) => {
    const company = await Company.create(
      {
        name: values.name,
        code: values.code,
        address: values.address,
        email: values.email,
      },
      { transaction },
    );
    const roles = await createCompanyRoles(company.id, transaction);
    await User.create(
      {
        companyId: company.id,
        roleId: roles.admin.id,
        role: "admin",
        name: values.adminName,
        email: values.adminEmail,
        password,
        active: true,
      },
      { transaction },
    );
    await Audit.create(
      {
        companyId: company.id,
        actorId: null,
        entity: "Company",
        entityId: company.id,
        action: "created",
        details: { createdByCompanyId: actor.companyId },
      },
      { transaction },
    );
    return company;
  });
}
async function update(actor, id, input) {
  if (!CompanyPolicy.update(actor))
    throw new HttpError(403, "Không có quyền sửa công ty.");
  const values = companySchema.parse(input);
  const row = await db.transaction(async (transaction) => {
    const company = await Company.findOne({
      where: { id: parseId(id) },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!company || company.id !== companyWhere(actor).companyId)
      throw new HttpError(404, "Không tìm thấy công ty.");
    await company.update(values, { transaction });
    await Audit.create(
      {
        companyId: actor.companyId,
        actorId: actor.id,
        entity: "Company",
        entityId: company.id,
        action: "updated",
        details: { fields: ["name", "code", "address", "email"] },
      },
      { transaction },
    );
    return company;
  });
  await publish({ companyId: actor.companyId, topic: "company.updated" });
  return row;
}
export class CreateCompanyCommand {
  constructor(actor, input) {
    Object.assign(this, { actor, input });
    Object.freeze(this);
  }
}
export class UpdateCompanyCommand {
  constructor(actor, id, input) {
    Object.assign(this, { actor, id, input });
    Object.freeze(this);
  }
}
export const commandHandlers = [
  [CreateCompanyCommand, ({ actor, input }) => create(actor, input)],
  [UpdateCompanyCommand, ({ actor, id, input }) => update(actor, id, input)],
];
