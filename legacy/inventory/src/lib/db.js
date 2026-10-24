// HƯỚNG DẪN HỌC: Pool tái sử dụng kết nối MySQL. mysql2/promise cho phép dùng await khi chạy SQL.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

import mysql from "mysql2/promise";
// Nạp cấu hình đã đọc từ môi trường, không hardcode secret trong module.
import { config } from "../config.js";
// Khởi tạo pool theo DB_HOST/PORT/USER/PASSWORD/NAME trong .env.
export const db = mysql.createPool(config.db);
