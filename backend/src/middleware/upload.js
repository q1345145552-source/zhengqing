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
    fileSize: 20 * 1024 * 1024, // 单文件最大 20MB
    files: 20,                   // 一次最多 20 个文件
  },
});

// 修复非 ASCII 文件名双重编码问题（UTF-8 → Latin-1 → UTF-8）
function fixEncoding(filename) {
  try {
    // 尝试检测是否为双重编码：将字符串按 Latin-1 解码再 UTF-8 编码对比
    const buf = Buffer.from(filename, 'latin1');
    const restored = buf.toString('utf8');
    // 如果还原后包含有效的多字节 UTF-8 字符且与原字符串不同，说明是双重编码
    if (restored !== filename && /[\u0080-\uffff]/.test(restored)) {
      return restored;
    }
  } catch (e) {
    // 修复失败则返回原值
  }
  return filename;
}

// 包装 multer 方法以修复文件名编码
const _single = upload.single.bind(upload);
const _array = upload.array.bind(upload);
const _fields = upload.fields.bind(upload);
const _any = upload.any.bind(upload);

upload.single = function(name) {
  const mw = _single(name);
  return function(req, res, next) {
    mw(req, res, function(err) {
      if (req.file) req.file.originalname = fixEncoding(req.file.originalname);
      next(err);
    });
  };
};

upload.array = function(name, maxCount) {
  const mw = _array(name, maxCount);
  return function(req, res, next) {
    mw(req, res, function(err) {
      if (req.files) req.files.forEach(f => { f.originalname = fixEncoding(f.originalname); });
      next(err);
    });
  };
};

module.exports = upload;
module.exports.UPLOAD_BASE = UPLOAD_BASE;
