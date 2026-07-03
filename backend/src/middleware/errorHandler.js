/**
 * 统一错误响应格式
 * 用法：在 catch 中调用 next(err) 或直接 res.error(message, status)
 */
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? (statusCode === 500 ? '服务器内部错误' : err.message)
    : (err.message || '服务器内部错误');

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    code: statusCode,
    message,
  });
};

/**
 * 挂载到 res 上的快捷错误方法
 */
const attachResError = (req, res, next) => {
  res.error = (message, status = 500) => {
    res.status(status).json({ code: status, message });
  };
  next();
};

/**
 * 生产环境下统一错误消息的辅助函数
 */
const prodMsg = (err) =>
  process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message;

module.exports = { errorHandler, attachResError, prodMsg };
