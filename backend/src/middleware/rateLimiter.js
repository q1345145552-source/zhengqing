/**
 * 简易内存限流中间件
 * 基于 IP + 端点，可配置窗口时间和最大请求数
 */

const rateStores = new Map();

/**
 * @param {Object} opts
 * @param {number} opts.windowMs - 时间窗口（毫秒），默认 60000
 * @param {number} opts.max - 窗口内最大请求数，默认 10
 * @param {string} opts.message - 超限返回消息
 */
const rateLimiter = (opts = {}) => {
  const windowMs = opts.windowMs || 60000;
  const max = opts.max || 10;
  const message = opts.message || '请求过于频繁，请稍后再试';

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `${req.method}:${req.originalUrl}:${ip}`;

    const now = Date.now();
    let store = rateStores.get(key);

    if (!store || now - store.start > windowMs) {
      store = { start: now, count: 0 };
      rateStores.set(key, store);
    }

    store.count++;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - store.count));

    if (store.count > max) {
      return res.status(429).json({ code: 429, message });
    }

    next();
  };
};

// 定期清理过期记录（每5分钟）
setInterval(() => {
  const cutoff = Date.now() - 300000;
  for (const [key, store] of rateStores) {
    if (store.start < cutoff) rateStores.delete(key);
  }
}, 300000).unref?.();

module.exports = rateLimiter;
