require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');

const path = require('path');

// 路由模块
const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submission');
const clientProfileRoutes = require('./routes/clientProfile');
const employeeReviewRoutes = require('./routes/employeeReview');
const adminRoutes = require('./routes/admin');
const financeRoutes = require('./routes/finance');

const app = express();

// ---------- 全局中间件 ----------

// CORS 跨域
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));

// 请求日志
app.use(morgan('dev'));

// 解析 JSON 请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（上传的文件）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ---------- 健康检查 ----------
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'OK', timestamp: new Date().toISOString() });
});

// ---------- 注册路由 ----------
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/client', clientProfileRoutes);
app.use('/api/employee', employeeReviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/finance', financeRoutes);

// ---------- Multer 错误处理 ----------
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ code: 400, message: '文件大小超过限制（最大20MB）' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ code: 400, message: '文件数量超过限制' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ code: 400, message: '上传字段名不正确' });
  }
  if (err.message && err.message.indexOf('不支持的文件类型') >= 0) {
    return res.status(400).json({ code: 400, message: err.message });
  }
  next(err);
});

// ---------- 404 处理 ----------
app.use((req, res) => {
  res.status(404).json({ code: 404, message: `接口不存在: ${req.method} ${req.originalUrl}` });
});

// ---------- 全局错误处理 ----------
app.use((err, req, res, _next) => {
  console.error('[App] Unhandled error:', err);
  res.status(500).json({
    code: 500,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
  });
});

// ---------- 启动服务 ----------
app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║       湘泰正清系统 - 后端服务已启动           ║
║                                              ║
║  地址: http://localhost:${config.port}              ║
║  环境: ${process.env.NODE_ENV || 'development'}                      ║
║  数据库: PostgreSQL @ ${config.db.host}:${config.db.port}/${config.db.database}
╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
