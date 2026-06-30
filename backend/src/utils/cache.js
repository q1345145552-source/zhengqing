/**
 * 简单内存缓存模块
 * 用于缓存不经常变化的数据（如价格规则）
 */

const cache = new Map();

const DEFAULT_TTL = 5 * 60 * 1000; // 默认 TTL: 5 分钟

module.exports = {
  /**
   * 获取缓存
   * @param {string} key
   * @returns {*} 缓存值，过期返回 null
   */
  get(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }
    return entry.value;
  },

  /**
   * 设置缓存
   * @param {string} key
   * @param {*} value
   * @param {number} ttlMs - 过期时间（毫秒），默认 5 分钟
   */
  set(key, value, ttlMs = DEFAULT_TTL) {
    cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  },

  /**
   * 删除缓存
   * @param {string} key
   */
  del(key) {
    cache.delete(key);
  },

  /**
   * 按前缀批量删除
   * @param {string} prefix
   */
  delByPrefix(prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  },

  /**
   * 清空全部缓存
   */
  clear() {
    cache.clear();
  },
};
