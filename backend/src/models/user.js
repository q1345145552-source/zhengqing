const { query } = require('../db');

const User = {
  /**
   * 根据用户名查找用户
   */
  async findByUsername(username) {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  },

  /**
   * 根据 ID 查找用户
   */
  async findById(id) {
    const result = await query(
      'SELECT id, username, role, email, status, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * 创建用户
   */
  async create({ username, password, role, email, status = 'active', real_name }) {
    const result = await query(
      `INSERT INTO users (username, password, role, email, status, real_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, role, email, status, real_name, created_at, updated_at`,
      [username, password, role, email, status, real_name || null]
    );
    return result.rows[0];
  },

  /**
   * 查询所有用户（管理员使用）
   */
  async findAll() {
    const result = await query(
      'SELECT id, username, role, email, status, created_at, updated_at FROM users ORDER BY id'
    );
    return result.rows;
  },
};

module.exports = User;
