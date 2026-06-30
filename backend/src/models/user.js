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
   * 查询用户列表（管理员使用，支持分页+搜索）
   */
  async findAll({ page = 1, pageSize = 10, search = '', role = '' } = {}) {
    const params = [];
    const conditions = [];

    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(username ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const [{ rows: [cnt] }, { rows }] = await Promise.all([
      query(`SELECT COUNT(*) FROM users ${where}`, params),
      query(
        `SELECT id, username, role, email, status, created_at, updated_at
         FROM users ${where} ORDER BY id
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset]
      ),
    ]);

    return { list: rows, total: parseInt(cnt.count), page, pageSize };
  },
};

module.exports = User;
