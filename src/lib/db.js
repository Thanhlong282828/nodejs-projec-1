import { Sequelize } from "sequelize";
import { config } from "../config.js";
// ORM quản lý pool và tạo SQL từ model; migration quản lý schema riêng, không dùng sync().
export const db = new Sequelize(config.db);
