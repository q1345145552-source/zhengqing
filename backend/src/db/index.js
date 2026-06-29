const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 测试连接
pool.on('connect', () => {
  console.log('[DB] New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

/**
 * 执行 SQL 查询
 * @param {string} text - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<Object>} 查询结果
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
