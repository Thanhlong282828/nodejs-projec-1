// HƯỚNG DẪN HỌC: Ghép các module thành ứng dụng Express. Request đi qua middleware rồi route; lỗi đi tới errors ở cuối.
// async trả Promise; await chờ kết quả I/O. Đọc theo luồng routes → controller → service → model → JSON.

// Nạp Express/Router để tạo ứng dụng hoặc khai báo endpoint.
import express from 'express';
// Nạp middleware bổ sung các HTTP header bảo vệ cơ bản.
import helmet from 'helmet';
// Dùng pool MySQL chung thay vì tạo một connection cho mỗi hàm.
import {db} from './lib/db.js';
// Nạp các hàm kiểm tra đầu vào và lỗi HTTP dùng chung.
import {errors,HttpError} from './lib/http.js';
// Nạp nhóm route để gắn vào đường dẫn gốc của module.
import {authRoutes} from './modules/auth/routes.js';
// Nạp nhóm route để gắn vào đường dẫn gốc của module.
import {productRoutes} from './modules/products/routes.js';
// Nạp nhóm route để gắn vào đường dẫn gốc của module.
import {categoryRoutes} from './modules/categories/routes.js';
// Tạo app; helmet thêm header; express.json đọc JSON body, giới hạn kích thước 32 KB.
export const app=express();app.use(helmet());app.use(express.json({limit:'32kb'}));
// GET /health thử SELECT 1 trên DB thật; chỉ trả ok khi MySQL phản hồi.
app.get('/health',async(req,res)=>{await db.execute('SELECT 1');res.json({status:'ok'});});
// Gắn register/login/profile dưới tiền tố /api.
app.use('/api',authRoutes);
// Gắn API sản phẩm/danh mục; ví dụ router.get("/") thành GET /api/products.
app.use('/api/products',productRoutes);app.use('/api/categories',categoryRoutes);
// Không route nào khớp thì chuyển lỗi 404; đặt error middleware cuối cùng để gom lỗi.
app.use((req,res,next)=>next(new HttpError(404,'Route missing')));app.use(errors);
