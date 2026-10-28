// Service kiểm tra nghiệp vụ, gọi model Sequelize và giữ các thay đổi liên quan trong transaction.
import { loadAccess } from "../../access/access-context.js";
import bcrypt from "bcryptjs";
import { User, Employee, safeUser } from "../../../models/index.js";
import { loginSchema } from "../requests/LoginRequest.js";
import { issueToken } from "../../../middleware/auth.js";
import { HttpError } from "../../../lib/http.js";
async function login(input) {
  const { email, password } = loginSchema.parse(input);
  const user = await User.findOne({
    where: { email },
    include: { model: Employee, as: "employee" },
  });
  if (!user || !user.active || !(await bcrypt.compare(password, user.password)))
    throw new HttpError(401, "Email hoặc mật khẩu không đúng.");
  if (!(await loadAccess(user)))
    throw new HttpError(403, "Chưa có công ty/chức vụ hợp lệ.");
  return { ...issueToken(user), user: safeUser(user) };
}

export class LoginCommand {
  constructor(input) {
    this.input = input;
    Object.freeze(this);
  }
}
export class LogoutCommand {
  constructor(actor) {
    this.actor = actor;
    Object.freeze(this);
  }
}
export const commandHandlers = [
  [LoginCommand, ({ input }) => login(input)],
  [
    LogoutCommand,
    async ({ actor }) => {
      await actor.increment("tokenVersion");
      return { loggedOut: true };
    },
  ],
];
