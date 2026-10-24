// Service kiểm tra nghiệp vụ, gọi model Sequelize và giữ các thay đổi liên quan trong transaction.
import bcrypt from "bcryptjs";
import { User, Employee, safeUser } from "../../models/index.js";
import { loginSchema } from "../../lib/validation.js";
import { issueToken } from "../../middleware/auth.js";
import { HttpError } from "../../lib/http.js";
export async function login(input) {
  const { email, password } = loginSchema.parse(input);
  const user = await User.findOne({
    where: { email },
    include: { model: Employee, as: "employee" },
  });
  if (!user || !user.active || !(await bcrypt.compare(password, user.password)))
    throw new HttpError(401, "Email hoặc mật khẩu không đúng.");
  return { ...issueToken(user), user: safeUser(user) };
}
