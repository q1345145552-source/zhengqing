const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const EmployeeReview = require('../models/employeeReview');
const User = require('../models/user');
const Finance = require('../models/finance');
const { query } = require('../db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.use(auth);
// ==================== 客户审核（员工+管理员） ====================
router.get('/client-review', async (req, res) => {
  try {
    var filter = req.query.filter || 'pending';
    var page = Math.max(1, parseInt(req.query.page) || 1);
    var pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    var offset = (page - 1) * pageSize;
    var where = "role = 'client'";
    if (filter === 'pending') where += " AND status = 'pending'";
    else if (filter === 'rejected') where += " AND status = 'rejected'";
    else if (filter === 'active') where += " AND status = 'active'";
    else where += " AND status IN ('pending','rejected')";
    var cnt = await query('SELECT COUNT(*) FROM users WHERE ' + where);
    var rows = await query('SELECT id, username, real_name, email, status, created_at FROM users WHERE ' + where + ' ORDER BY created_at DESC LIMIT $1 OFFSET $2', [pageSize, offset]);
    res.json({ code: 200, data: { list: rows.rows, total: parseInt(cnt.rows[0].count), page: page, pageSize: pageSize } });
  } catch (err) { console.error(err); var msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message; res.status(500).json({ code: 500, message: msg }); }
});

router.put('/client-review/:id', async (req, res) => {
  try {
    var action = req.body.action;
    var comment = req.body.comment;
    if (!action || ['approve','reject'].indexOf(action) === -1) {
      return res.json({ code: 400, message: '请指定操作: approve 或 reject' });
    }
    var newStatus = action === 'approve' ? 'active' : 'rejected';
    var result = await query('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = $3 RETURNING id, username, real_name, status', [newStatus, req.params.id, 'client']);
    if (result.rowCount === 0) return res.json({ code: 404, message: '客户不存在' });
    var client = result.rows[0];
    // Notify client
    var notiTitle, notiContent;
    if (action === 'approve') {
      notiTitle = '账号审核通过';
      notiContent = '恭喜，您的账号已通过审核，现在可以登录使用了';
    } else {
      notiTitle = '账号审核未通过';
      notiContent = '您的账号审核未通过' + (comment ? '，原因：' + comment : '，请联系客服了解详情');
    }
    await query("INSERT INTO notifications (user_id, title, content, type) VALUES ($1, $2, $3, 'warning')", [client.id, notiTitle, notiContent]);
    res.json({ code: 200, message: action === 'approve' ? '已通过审核' : '已拒绝', data: client });
  } catch (err) { console.error(err); var msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message; res.status(500).json({ code: 500, message: msg }); }
});



router.use(role('admin'));

// ==================== 统计 ====================
router.get('/stats', async (req, res) => {
  try {
    const [u, s, p, a, r, reg] = await Promise.all([
      query('SELECT COUNT(*) AS c FROM users'), query("SELECT COUNT(*) AS c FROM submissions WHERE status='submitted'"),
      query("SELECT COUNT(*) AS c FROM submissions WHERE status='submitted' AND (review_status='pending' OR review_status IS NULL)"),
      query("SELECT COUNT(*) AS c FROM submissions WHERE review_status='approved'"),
      query("SELECT COUNT(*) AS c FROM submissions WHERE review_status='rejected'"),
      query("SELECT COUNT(*) AS c FROM submissions WHERE review_status='registered'"),
    ]);
    res.json({ code: 200, data: { total_users: parseInt(u.rows[0].c), total_submissions: parseInt(s.rows[0].c), pending_reviews: parseInt(p.rows[0].c), approved: parseInt(a.rows[0].c), rejected: parseInt(r.rows[0].c), registered: parseInt(reg.rows[0].c) } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 管理后台首页全量统计
router.get('/dashboard', async (req, res) => {
  try {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const monthStr = monthStart.toISOString().split('T')[0];

    const [
      { rows: [totalClients] },
      { rows: [newClients] },
      { rows: [monthOrders] },
      { rows: [monthRevenue] },
      { rows: [pendingCount] },
      { rows: [approvedCount] },
      { rows: [transitCount] },
      { rows: [completedCount] },
      { rows: [nanningCount] },
      { rows: [guangzhouCount] },
      { rows: [yiwuCount] },
      { rows: [monthDeposit] },
      { rows: [monthCharge] },
      { rows: [totalBalance] },
      { rows: recentOrders },
    ] = await Promise.all([
      query("SELECT COUNT(*) AS c FROM users WHERE role='client'"),
      query("SELECT COUNT(*) AS c FROM users WHERE role='client' AND created_at >= $1", [monthStr]),
      query("SELECT COUNT(*) AS c FROM submissions WHERE status='submitted' AND created_at >= $1", [monthStr]),
      query(`SELECT COALESCE(SUM(scl.total_amount),0) AS c FROM submission_charge_logs scl JOIN submissions s ON scl.submission_id=s.id WHERE scl.status='charged' AND scl.charged_at >= $1`, [monthStr]),
      query("SELECT COUNT(*) AS c FROM submissions WHERE status='submitted' AND (review_status='pending' OR review_status IS NULL)"),
      query("SELECT COUNT(*) AS c FROM submissions WHERE status='submitted' AND review_status IN ('approved','registered') AND (tracking_status < 3 OR tracking_status IS NULL)"),
      query("SELECT COUNT(*) AS c FROM submissions WHERE status='submitted' AND tracking_status >= 5 AND tracking_status <= 10"),
      query("SELECT COUNT(*) AS c FROM submissions WHERE status='submitted' AND tracking_status = 11"),
      query("SELECT COUNT(*) AS c FROM submissions WHERE status='submitted' AND international_route = 'nanning_bangkok'"),
      query("SELECT COUNT(*) AS c FROM submissions WHERE status='submitted' AND international_route = 'guangzhou_bangkok'"),
      query("SELECT COUNT(*) AS c FROM submissions WHERE status='submitted' AND international_route = 'yiwu_bangkok'"),
      query("SELECT COALESCE(SUM(amount),0) AS c FROM wallet_transactions WHERE type='deposit' AND created_at >= $1", [monthStr]),
      query("SELECT COALESCE(SUM(amount),0) AS c FROM wallet_transactions WHERE type='charge' AND created_at >= $1", [monthStr]),
      query("SELECT COALESCE(SUM(balance),0) AS c FROM client_wallets"),
      query(`SELECT s.id, s.application_no, s.tracking_status, s.created_at, u.username AS client_name,
              COALESCE(sp.thai_name, sp.english_name, '未填写') AS product_name
       FROM submissions s JOIN users u ON s.user_id=u.id LEFT JOIN submission_products sp ON sp.submission_id=s.id
       WHERE s.status='submitted' ORDER BY s.created_at DESC LIMIT 10`),
    ]);

    res.json({
      code: 200,
      data: {
        overview: {
          total_clients: parseInt(totalClients.c),
          new_clients_month: parseInt(newClients.c),
          orders_month: parseInt(monthOrders.c),
          revenue_month: parseFloat(monthRevenue.c),
        },
        status_distribution: {
          pending: parseInt(pendingCount.c),
          approved: parseInt(approvedCount.c),
          in_transit: parseInt(transitCount.c),
          completed: parseInt(completedCount.c),
        },
        route_distribution: {
          nanning: parseInt(nanningCount.c),
          guangzhou: parseInt(guangzhouCount.c),
          yiwu: parseInt(yiwuCount.c),
        },
        finance: {
          deposit_month: parseFloat(monthDeposit.c),
          charge_month: parseFloat(monthCharge.c),
          total_balance: parseFloat(totalBalance.c),
        },
        recent_orders: recentOrders,
      },
    });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// ==================== 申请管理 ====================
router.get('/submissions', async (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * pageSize;

    const params = [];
    let where;
    if (filter === 'pending') where = `s.status = 'submitted' AND (s.review_status = 'pending' OR s.review_status = 'approved')`;
    else if (filter === 'all') where = `s.status = 'submitted'`;
    else where = `s.status = 'submitted' AND s.review_status IN ('approved', 'registered', 'rejected')`;

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (COALESCE(s.application_no,'') ILIKE $${params.length} OR u.username ILIKE $${params.length} OR COALESCE(sp.thai_name,'') ILIKE $${params.length} OR COALESCE(sp.english_name,'') ILIKE $${params.length})`;
    }

    const { rows: [cnt] } = await query(`SELECT COUNT(*) FROM submissions s JOIN users u ON s.user_id = u.id LEFT JOIN submission_products sp ON sp.submission_id = s.id WHERE ${where}`, params);
    const allParams = [...params, pageSize, offset];
    const { rows } = await query(
      `SELECT s.id, s.user_id, s.current_step, s.status, s.review_status, s.review_comment, s.next_account, s.next_register_status,
              s.application_no, s.tracking_status, s.tracking_status_updated_at, s.created_at, s.updated_at,
              u.username AS client_name, COALESCE(sp.thai_name, sp.english_name, '未填写') AS product_name
       FROM submissions s JOIN users u ON s.user_id = u.id LEFT JOIN submission_products sp ON sp.submission_id = s.id
       WHERE ${where} ORDER BY s.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, allParams
    );
    res.json({ code: 200, data: { list: rows, total: parseInt(cnt.count), page, pageSize } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.get('/submissions/:id', async (req, res) => {
  try { const data = await EmployeeReview.detail(req.params.id); if (!data) return res.status(404).json({ code: 404, message: '提交不存在' }); res.json({ code: 200, data }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// ==================== 员工管理 ====================
router.get('/employees', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
    const search = (req.query.search || '').trim();
    const params = [];
    let where = `role = 'employee'`;
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (username ILIKE $${params.length} OR COALESCE(real_name,'') ILIKE $${params.length})`;
    }
    const offset = (page - 1) * pageSize;
    const [{ rows: [cnt] }, { rows }] = await Promise.all([
      query(`SELECT COUNT(*) FROM users WHERE ${where}`, params),
      query(`SELECT id, username, real_name, email, role, status, created_at, updated_at FROM users WHERE ${where} ORDER BY id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, pageSize, offset]),
    ]);
    res.json({ code: 200, data: { list: rows, total: parseInt(cnt.count), page, pageSize } });
  }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.post('/employees', async (req, res) => {
  try {
    const { username, real_name, email } = req.body;
    if (!username) return res.status(400).json({ code: 400, message: '用户名必填' });
    const existing = await User.findByUsername(username);
    if (existing) return res.status(400).json({ code: 400, message: '用户名已存在' });
    const password = crypto.randomBytes(4).toString('hex');
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, role: 'employee', email: email || null });
    await query('UPDATE users SET real_name = $1 WHERE id = $2', [real_name || null, user.id]);
    res.json({ code: 200, message: '创建成功', data: { ...user, real_name: real_name || null, generated_password: password } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.put('/employees/:id', async (req, res) => {
  try {
    const { real_name, email, password } = req.body;
    const fields = []; const values = [req.params.id]; let idx = 2;
    if (real_name !== undefined) { fields.push(`real_name = $${idx++}`); values.push(real_name); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (password) { const hash = await bcrypt.hash(password, 10); fields.push(`password = $${idx++}`); values.push(hash); }
    if (fields.length === 0) return res.status(400).json({ code: 400, message: '无更新内容' });
    fields.push('updated_at = CURRENT_TIMESTAMP');
    const { rows: [u] } = await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $1 AND role = $2 RETURNING id, username, real_name, email, role, status, created_at, updated_at`, [...values, 'employee']);
    if (!u) return res.status(404).json({ code: 404, message: '员工不存在' });
    res.json({ code: 200, message: '更新成功', data: u });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.put('/employees/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { rowCount } = await query("UPDATE users SET status = $1 WHERE id = $2 AND role = 'employee'", [status, req.params.id]);
    if (rowCount === 0) return res.status(404).json({ code: 404, message: '员工不存在' });
    res.json({ code: 200, message: status === 'active' ? '已启用' : '已禁用' });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// ==================== 客户管理 ====================
router.get('/customers', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
    const search = (req.query.search || '').trim();
    const params = [];
    let where = `u.role = 'client'`;
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (u.username ILIKE $${params.length} OR COALESCE(u.real_name,'') ILIKE $${params.length} OR COALESCE(u.email,'') ILIKE $${params.length})`;
    }
    const offset = (page - 1) * pageSize;
    const [{ rows: [cnt] }, { rows }] = await Promise.all([
      query(`SELECT COUNT(*) FROM users u WHERE ${where}`, params),
      query(
        `SELECT u.id, u.username, u.real_name, u.email, u.status, u.created_at,
                (SELECT COUNT(*) FROM submissions WHERE user_id = u.id) AS total_submissions
         FROM users u WHERE ${where} ORDER BY u.id
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset]
      ),
    ]);
    res.json({ code: 200, data: { list: rows, total: parseInt(cnt.count), page, pageSize } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.get('/customers/:id', async (req, res) => {
  try {
    const { rows: [u] } = await query('SELECT id, username, real_name, email, status, created_at FROM users WHERE id = $1 AND role = $2', [req.params.id, 'client']);
    if (!u) return res.status(404).json({ code: 404, message: '客户不存在' });
    const { rows: subs } = await query('SELECT id, application_no, created_at, review_status, status FROM submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.params.id]);
    const wallet = await Finance.getWallet(req.params.id).catch(() => ({ balance: 0 }));
    const { rows: txs } = await query('SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.params.id]);
    res.json({ code: 200, data: { ...u, wallet_balance: parseFloat(wallet.balance), submissions: subs, transactions: txs } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.get('/customers/:id/submissions', async (req, res) => {
  try { const { rows } = await query("SELECT id, application_no, COALESCE(current_step,0) AS current_step, status, review_status, created_at FROM submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [req.params.id]); res.json({ code: 200, data: rows }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.get('/customers/:id/transactions', async (req, res) => {
  try { const { rows } = await query('SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.params.id]); res.json({ code: 200, data: rows }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.put('/customers/:id/status', async (req, res) => {
  try {
    const { rowCount } = await query("UPDATE users SET status = $1 WHERE id = $2 AND role = 'client'", [req.body.status, req.params.id]);
    if (rowCount === 0) return res.status(404).json({ code: 404, message: '客户不存在' });
    res.json({ code: 200, message: req.body.status === 'active' ? '已启用' : '已禁用' });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// ==================== 产品白名单 ====================
const whitelistCRUD = (path, table) => {
  router.get(path, async (req, res) => { try { const { rows } = await query(`SELECT * FROM ${table} ORDER BY id`); res.json({ code: 200, data: rows }); } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); } });
  router.post(path, async (req, res) => {
    try {
      const keys = Object.keys(req.body).filter(k => req.body[k] !== undefined);
      const vals = keys.map(k => req.body[k]);
      const { rows: [r] } = await query(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map((_, i) => '$' + (i + 1)).join(',')}) RETURNING *`, vals);
      res.json({ code: 200, message: '创建成功', data: r });
    } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
  });
  router.put(`${path}/:id`, async (req, res) => {
    try {
      const fields = []; const values = [req.params.id]; let idx = 2;
      Object.entries(req.body).forEach(([k, v]) => { if (v !== undefined) { fields.push(`${k} = $${idx++}`); values.push(v); } });
      if (fields.length === 0) return res.status(400).json({ code: 400, message: '无更新内容' });
      fields.push('updated_at = CURRENT_TIMESTAMP');
      const { rows: [r] } = await query(`UPDATE ${table} SET ${fields.join(', ')} WHERE id = $1 RETURNING *`, values);
      if (!r) return res.status(404).json({ code: 404, message: '记录不存在' });
      res.json({ code: 200, message: '更新成功', data: r });
    } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
  });
  router.delete(`${path}/:id`, async (req, res) => {
    try { await query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]); res.json({ code: 200, message: '删除成功' }); }
    catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
  });
};
whitelistCRUD('/product-whitelist', 'product_whitelist');
whitelistCRUD('/warehouses', 'warehouses');

// ==================== 资料模板 ====================
router.get('/doc-templates', async (req, res) => { try { const { rows } = await query('SELECT * FROM doc_templates ORDER BY cargo_type, sort_order'); res.json({ code: 200, data: rows }); } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); } });
whitelistCRUD('/doc-templates', 'doc_templates');

// ==================== 审核字段配置 ====================
router.get('/review-config', async (req, res) => { try { const { rows } = await query('SELECT * FROM review_config ORDER BY step_tab, id'); res.json({ code: 200, data: rows }); } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); } });
router.put('/review-config/:id', async (req, res) => {
  try {
    const { is_enabled } = req.body;
    const { rows: [r] } = await query('UPDATE review_config SET is_enabled = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [req.params.id, is_enabled]);
    if (!r) return res.status(404).json({ code: 404, message: '配置不存在' });
    res.json({ code: 200, message: '更新成功', data: r });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// ==================== 用户通用 ====================
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
    const search = (req.query.search || '').trim();
    const role = req.query.role || '';
    const data = await User.findAll({ page, pageSize, search, role });
    res.json({ code: 200, data });
  } catch (err) { console.error('[Admin] users error:', err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.post('/users', async (req, res) => {
  try {
    const { username, password, role, email } = req.body;
    if (!username || !password || !role) return res.status(400).json({ code: 400, message: '用户名、密码、角色为必填项' });
    if (!['client', 'employee', 'admin'].includes(role)) return res.status(400).json({ code: 400, message: '角色不合法' });
    const existing = await User.findByUsername(username);
    if (existing) return res.status(400).json({ code: 400, message: '用户名已存在' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, role, email });
    res.json({ code: 200, message: '创建成功', data: user });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.put('/users/:id', async (req, res) => {
  try {
    const { username, password, role, email, status } = req.body;
    const existing = await User.findById(req.params.id); if (!existing) return res.status(404).json({ code: 404, message: '用户不存在' });
    const fields = []; const values = [req.params.id]; let idx = 2;
    if (username !== undefined) { fields.push(`username = $${idx++}`); values.push(username); }
    if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }
    if (password) { const hash = await bcrypt.hash(password, 10); fields.push(`password = $${idx++}`); values.push(hash); }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    const result = await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $1 RETURNING id, username, role, email, status, created_at, updated_at`, values);
    res.json({ code: 200, message: '更新成功', data: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.delete('/users/:id', async (req, res) => {
  try { const r = await query('DELETE FROM users WHERE id = $1', [req.params.id]); if (r.rowCount === 0) return res.status(404).json({ code: 404, message: '用户不存在' }); res.json({ code: 200, message: '删除成功' }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// ==================== 货物追踪 ====================
router.get('/tracking', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * pageSize;
    const statusFilter = parseInt(req.query.status) || 0;
    const params = [];
    let where = `s.status = 'submitted' AND s.tracking_status >= 2 AND s.tracking_status < 11`;
    if (statusFilter >= 1 && statusFilter <= 11) where += ` AND s.tracking_status = ${statusFilter}`;
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (COALESCE(s.application_no,'') ILIKE $${params.length} OR u.username ILIKE $${params.length} OR COALESCE(sp.thai_name,'') ILIKE $${params.length} OR COALESCE(sp.english_name,'') ILIKE $${params.length} OR COALESCE(ccd.company_name,'') ILIKE $${params.length})`;
    }

    const { rows: [cnt] } = await query(`SELECT COUNT(DISTINCT s.id) FROM submissions s JOIN users u ON s.user_id = u.id LEFT JOIN submission_products sp ON sp.submission_id = s.id LEFT JOIN client_company_docs ccd ON ccd.user_id = s.user_id WHERE ${where}`, params);
    const allParams = [...params, pageSize, offset];
    const { rows } = await query(
      `SELECT DISTINCT ON (s.id) s.id, s.application_no, s.tracking_status, s.tracking_status_updated_at, s.review_status, s.updated_at, s.created_at,
              u.username AS client_name, COALESCE(sp.thai_name, sp.english_name, '未填写') AS product_name, COALESCE(sp.tariff_rate, '') AS tariff_rate,
              COALESCE(ccd.company_name, '') AS company_name,
              COALESCE((SELECT SUM(sc.amount) FROM submission_charges sc WHERE sc.submission_id = s.id AND sc.selected), 0) AS total_freight,
              scl.status AS charge_status, COALESCE(scl.total_amount, 0) AS charged_amount, s.pending_charge, COALESCE(s.pending_charge_amount, 0) AS pending_charge_amount
       FROM submissions s JOIN users u ON s.user_id = u.id LEFT JOIN submission_products sp ON sp.submission_id = s.id
       LEFT JOIN client_company_docs ccd ON ccd.user_id = s.user_id
       LEFT JOIN LATERAL (SELECT status, total_amount FROM submission_charge_logs WHERE submission_id = s.id ORDER BY id DESC LIMIT 1) scl ON true
       WHERE ${where} ORDER BY s.id, s.tracking_status_updated_at DESC NULLS LAST, s.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, allParams
    );
    res.json({ code: 200, data: { list: rows, total: parseInt(cnt.count), page, pageSize } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});


module.exports = router;
