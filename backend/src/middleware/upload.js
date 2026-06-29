const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE = path.join(__dirname, '../../uploads');

// 确保上传目录存在
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 按 submission_id/stage 或 profile/user_id 组织目录
    const subPath = req.params.id
      ? path.join(String(req.params.id), req.body.stage || '0')
      : path.join('profile', String(req.user?.id || 'anonymous'));
    const dir = path.join(UPLOAD_BASE, subPath);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // 唯一文件名：时间戳_随机数_原始名
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// 文件类型过滤
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 单文件最大 10MB
    files: 10,                   // 一次最多 10 个文件
  },
});

module.exports = upload;
module.exports.UPLOAD_BASE = UPLOAD_BASE;
