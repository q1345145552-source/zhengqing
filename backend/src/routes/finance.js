const express = require('express');
const router = express.Router();
const Finance = require('../models/finance');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// ==================== 分页辅助 ====================
function paginate(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
  const search = (req.query.search || '').trim();
  const offset = (page - 1) * pageSize;
  return { page, pageSize, search, offset };
}

function searchClause(search, fields) {
  if (!search) return '';
  return ' AND (' + fields.map(f => `${f} ILIKE '%' || $search || '%'`).join(' OR ') + ')';
}

function paginatedResponse(rows, total, page, pageSize) {
  return { list: rows, total: parseInt(total), page, pageSize };
}

// 公告栏
router.get('/announcements', async (req, res) => {
  try {
    const { query } = require('../db');
    const { rows } = await query("SELECT * FROM announcements WHERE is_active = true ORDER BY created_at DESC LIMIT 5");
    res.json({ code: 200, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// ==================== 公开：价格查询 + 费用预估 + 仓库地址（无需登录） ====================
router.get('/warehouses', async (req, res) => {
  try {
    const { query } = require('../db');
    const route = req.query.route || null;
    let result;
    if (route) {
      // 先查路线专属仓库，没有则回退到通用仓库
      result = await query('SELECT * FROM warehouses WHERE route = $1 ORDER BY id LIMIT 1', [route]);
      if (!result.rows[0]) {
        result = await query('SELECT * FROM warehouses WHERE route IS NULL ORDER BY id LIMIT 1');
      }
    } else {
      result = await query('SELECT * FROM warehouses WHERE route IS NULL ORDER BY id LIMIT 1');
    }
    res.json({ code: 200, data: result.rows[0] || null });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

router.post('/client/estimate', async (req, res) => {
  try {
    const data = await Finance.calculateCharges(null, req.body);
    res.json({ code: 200, data });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.get('/client/prices', async (req, res) => {
  try {
    const allRules = await Finance.getPriceRules();
    const routes = [...new Set(allRules.filter(r => r.route).map(r => r.route))];
    const routeNames = { nanning_bangkok: '南宁→曼谷', guangzhou_bangkok: '广州/深圳→曼谷', yiwu_bangkok: '义乌→曼谷' };
    const routeTimes = { nanning_bangkok: '陆运 3-5天 散货', guangzhou_bangkok: '陆运 3-5天 散货', yiwu_bangkok: '陆运 4-7天 散货' };

    const transport = routes.map(route => ({
      route,
      name: routeNames[route] || route,
      time: routeTimes[route] || '',
      rules: allRules.filter(r => r.route === route).map(r => ({
        fee_type: r.fee_type, fee_name: r.fee_name, unit: r.unit, unit_price: parseFloat(r.unit_price),
      })),
    }));

    const services = allRules.filter(r => !r.route).map(r => ({
      fee_type: r.fee_type, fee_name: r.fee_name, unit: r.unit, unit_price: parseFloat(r.unit_price), description: r.description,
    }));

    res.json({ code: 200, data: { transport, services } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

router.use(auth);

// ==================== 通用：通知 ====================
router.get('/notifications', async (req, res) => {
  try { const data = await Finance.getNotifications(req.user.id); res.json({ code: 200, data }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.get('/notifications/unread-count', async (req, res) => {
  try { const count = await Finance.getUnreadCount(req.user.id); res.json({ code: 200, data: { count } }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.put('/notifications/:id/read', async (req, res) => {
  try { await Finance.markRead(req.params.id, req.user.id); res.json({ code: 200, message: 'ok' }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.put('/notifications/read-all', async (req, res) => {
  try { await Finance.markAllRead(req.user.id); res.json({ code: 200, message: 'ok' }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// ==================== 客户端 ====================
router.use('/client', role('client'));

// 货物追踪 - 状态列表（分页+搜索）
router.get('/client/tracking', async (req, res) => {
  try {
    const { query } = require('../db');
    const { page, pageSize, search, offset } = paginate(req);
    const baseWhere = `s.user_id = $1 AND s.status = 'submitted' AND s.tracking_status >= 2 AND s.tracking_status < 11`;
    const searchSQL = search ? ` AND (COALESCE(s.application_no,'') ILIKE $2 OR COALESCE(sp.thai_name,'') ILIKE $2 OR COALESCE(sp.english_name,'') ILIKE $2 OR COALESCE(ccd.company_name,'') ILIKE $2)` : '';
    const where = baseWhere + searchSQL;
    const params = search ? [req.user.id, `%${search}%`] : [req.user.id];

    const { rows: [cnt] } = await query(`SELECT COUNT(DISTINCT s.id) FROM submissions s LEFT JOIN submission_products sp ON sp.submission_id = s.id LEFT JOIN client_company_docs ccd ON ccd.user_id = s.user_id WHERE ${where}`, params);
    const { rows } = await query(
      `SELECT DISTINCT ON (s.id) s.id, s.application_no, s.tracking_status, s.tracking_status_updated_at, s.review_status, s.created_at, s.updated_at,
              COALESCE(sp.thai_name, sp.english_name, '未填写') AS product_name, COALESCE(sp.tariff_rate, '') AS tariff_rate,
              COALESCE(ccd.company_name, '') AS company_name,
              COALESCE((SELECT SUM(sc.amount) FROM submission_charges sc WHERE sc.submission_id = s.id AND sc.selected), 0) AS total_freight,
              scl.status AS charge_status, COALESCE(scl.total_amount, 0) AS charged_amount,
              s.pending_charge, COALESCE(s.pending_charge_amount, 0) AS pending_charge_amount
       FROM submissions s LEFT JOIN submission_products sp ON sp.submission_id = s.id LEFT JOIN client_company_docs ccd ON ccd.user_id = s.user_id
       LEFT JOIN LATERAL (SELECT status, total_amount FROM submission_charge_logs WHERE submission_id = s.id ORDER BY id DESC LIMIT 1) scl ON true
       WHERE ${where} ORDER BY s.id, s.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}`, params
    );
    res.json({ code: 200, data: paginatedResponse(rows, cnt.count, page, pageSize) });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 我的订单 - 已完成订单（分页+搜索）
router.get('/client/orders', async (req, res) => {
  try {
    const { query } = require('../db');
    const { page, pageSize, search, offset } = paginate(req);
    const baseWhere = `s.user_id = $1 AND s.status = 'submitted' AND s.tracking_status = 11`;
    const searchSQL = search ? ` AND (COALESCE(s.application_no,'') ILIKE $2 OR COALESCE(sp.thai_name,'') ILIKE $2 OR COALESCE(sp.english_name,'') ILIKE $2 OR COALESCE(ccd.company_name,'') ILIKE $2)` : '';
    const where = baseWhere + searchSQL;
    const params = search ? [req.user.id, `%${search}%`] : [req.user.id];

    const { rows: [cnt] } = await query(`SELECT COUNT(DISTINCT s.id) FROM submissions s LEFT JOIN submission_products sp ON sp.submission_id = s.id LEFT JOIN client_company_docs ccd ON ccd.user_id = s.user_id WHERE ${where}`, params);
    const { rows } = await query(
      `SELECT DISTINCT ON (s.id) s.id, s.application_no, s.tracking_status, s.tracking_status_updated_at, s.review_status, s.created_at, s.updated_at,
              COALESCE(sp.thai_name, sp.english_name, '未填写') AS product_name, COALESCE(sp.tariff_rate, '') AS tariff_rate,
              COALESCE(ccd.company_name, '') AS company_name,
              COALESCE((SELECT SUM(sc.amount) FROM submission_charges sc WHERE sc.submission_id = s.id AND sc.selected), 0) AS total_freight
       FROM submissions s LEFT JOIN submission_products sp ON sp.submission_id = s.id LEFT JOIN client_company_docs ccd ON ccd.user_id = s.user_id
       WHERE ${where} ORDER BY s.id, s.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}`, params
    );
    res.json({ code: 200, data: paginatedResponse(rows, cnt.count, page, pageSize) });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 客户端查看海关回传文件
router.get('/client/orders/:id/customs-docs', async (req, res) => {
  try {
    const { query } = require('../db');
    const { rows: [sub] } = await query('SELECT user_id FROM submissions WHERE id = $1', [req.params.id]);
    if (!sub || sub.user_id !== req.user.id) return res.status(403).json({ code: 403, message: '无权访问' });
    const { rows } = await query('SELECT * FROM customs_documents WHERE submission_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json({ code: 200, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 客户填写发货信息
router.put('/client/submissions/:id/shipping-info', async (req, res) => {
  try {
    const { query } = require('../db');
    const { tracking_company, tracking_number } = req.body;
    const subId = req.params.id;
    const { rows: [sub] } = await query('SELECT user_id FROM submissions WHERE id = $1', [subId]);
    if (!sub) return res.status(404).json({ code: 404, message: '申请不存在' });
    if (sub.user_id !== req.user.id) return res.status(403).json({ code: 403, message: '无权操作' });
    if (!tracking_company || !tracking_number) return res.status(400).json({ code: 400, message: '请填写快递公司和运单号' });
    await query('UPDATE submissions SET tracking_company=$1, tracking_number=$2, shipped_at=CURRENT_TIMESTAMP WHERE id=$3',
      [tracking_company, tracking_number, subId]);
    res.json({ code: 200, message: '发货信息已保存', data: { tracking_company, tracking_number, shipped_at: new Date().toISOString() } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 货物追踪 - 状态变更时间线
router.get('/client/tracking/:id/timeline', async (req, res) => {
  try {
    const { query } = require('../db');
    const { rows: [sub] } = await query(
      'SELECT id, user_id, tracking_status, created_at FROM submissions WHERE id = $1', [req.params.id]
    );
    if (!sub) return res.status(404).json({ code: 404, message: '申请不存在' });
    if (sub.user_id !== req.user.id) return res.status(403).json({ code: 403, message: '无权访问' });

    const { rows: logs } = await query(
      `SELECT action, comment, created_at FROM review_logs
       WHERE submission_id = $1 AND action IN ('approve','advance_status','arrived')
       ORDER BY created_at DESC`, [req.params.id]
    );

    const statusNames = {
      1:'待审核',2:'审核通过',3:'待付款',4:'已付款',5:'中国仓库收货',
      6:'运输中',7:'清关中',8:'已放行',9:'已到泰国仓库',10:'已派送',11:'已完成',
    };

    // 构建时间线
    const timeline = [];
    const currentStatus = sub.tracking_status || 1;

    // 倒序生成：从当前状态回到初始
    for (let s = currentStatus; s >= 2; s--) {
      const logEntry = logs.find(l => {
        if (s === 2) return l.action === 'approve';
        if (s === 7 && l.action === 'arrived') return true;
        return l.action === 'advance_status' && l.comment && l.comment.includes(`→ ${statusNames[s]}`);
      });
      timeline.push({
        time: logEntry ? logEntry.created_at : sub.created_at,
        title: statusNames[s],
        status: s,
        color: ['','#E6A23C','#67C23A','#E6A23C','#67C23A','#409EFF','#409EFF','#409EFF','#409EFF','#67C23A','#409EFF','#909399'][s],
      });
    }
    // 初始提交
    timeline.push({
      time: sub.created_at,
      title: '提交申请',
      status: 0,
      color: '#409EFF',
    });

    res.json({ code: 200, data: { tracking_status: currentStatus, timeline } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 货物追踪 - 完整详情
router.get('/client/tracking/:id/detail', async (req, res) => {
  try {
    const EmployeeReview = require('../models/employeeReview');
    const { query } = require('../db');
    const data = await EmployeeReview.exportData(req.params.id);
    if (!data) return res.status(404).json({ code: 404, message: '申请不存在' });

    // 校验所属用户
    const { rows: [sub] } = await query('SELECT user_id FROM submissions WHERE id = $1', [req.params.id]);
    if (!sub || sub.user_id !== req.user.id) return res.status(403).json({ code: 403, message: '无权访问' });

    res.json({ code: 200, data });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 客户端首页统计
router.get('/client/dashboard-stats', async (req, res) => {
  try {
    const { query } = require('../db');
    const userId = req.user.id;
    const [totalOrders, activeOrders, completedOrders, totalSpent, wallet] = await Promise.all([
      query('SELECT COUNT(*) AS c FROM submissions WHERE user_id = $1 AND status = $2', [userId, 'submitted']),
      query('SELECT COUNT(*) AS c FROM submissions WHERE user_id = $1 AND status = $2 AND tracking_status >= 2 AND tracking_status < 11', [userId, 'submitted']),
      query('SELECT COUNT(*) AS c FROM submissions WHERE user_id = $1 AND status = $2 AND tracking_status = 11', [userId, 'submitted']),
      query(`SELECT COALESCE(SUM(scl.total_amount),0) AS c FROM submission_charge_logs scl JOIN submissions s ON scl.submission_id=s.id WHERE s.user_id=$1 AND scl.status='charged'`, [userId]),
      query('SELECT COALESCE(balance,0) AS c FROM client_wallets WHERE user_id = $1', [userId])
    ]);
    res.json({ code: 200, data: {
      total_orders: parseInt(totalOrders.rows[0].c),
      active_orders: parseInt(activeOrders.rows[0].c),
      completed_orders: parseInt(completedOrders.rows[0].c),
      total_spent: parseFloat(totalSpent.rows[0].c),
      balance: parseFloat(wallet.rows[0]?.c || 0),
    }});
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

router.get('/client/wallet', async (req, res) => {
  try { const w = await Finance.getWallet(req.user.id); res.json({ code: 200, data: w }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.get('/client/transactions', async (req, res) => {
  try { const data = await Finance.getTransactions(req.user.id, parseInt(req.query.page) || 1); res.json({ code: 200, data }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
// 充值申请上传目录
var depositUploadDir = require('path').join(__dirname, '../../uploads/deposits');
var fs = require('fs');
if (!fs.existsSync(depositUploadDir)) fs.mkdirSync(depositUploadDir, { recursive: true });
var depositUpload = require('multer')({
  dest: depositUploadDir,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    var allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf'];
    if (allowed.indexOf(file.mimetype) >= 0) cb(null, true);
    else cb(new Error('不支持的文件类型: ' + file.mimetype), false);
  }
});

router.post('/client/deposit', depositUpload.single('slip'), async (req, res) => {
  try {
    var amount = req.body.amount;
    var description = req.body.description;
    if (!amount || amount <= 0) return res.json({ code: 400, message: '请输入有效金额' });
    // Save uploaded slip file
    var slipPath = null;
    if (req.file) {
      var ext = require('path').extname(req.file.originalname);
      var newName = Date.now() + '_' + Math.round(Math.random() * 1e9) + ext;
      var destPath = require('path').join(depositUploadDir, newName);
      fs.renameSync(req.file.path, destPath);
      slipPath = '/uploads/deposits/' + newName;
    }
    // 创建充值申请，等待员工审核
    var data = await Finance.createDepositRequest(req.user.id, parseFloat(amount), description || '在线充值', slipPath);
    res.json({ code: 200, message: '充值申请已提交，等待员工审核', data: data });
  } catch (err) { console.error(err); var msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message; res.status(500).json({ code: 500, message: msg }); }
});

// 客户端查看自己的充值申请列表
router.get('/client/deposit-requests', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const data = await Finance.getDepositRequests('all', page, pageSize, req.user.id);
    res.json({ code: 200, data: data });
  } catch (err) { console.error(err); const msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message; res.status(500).json({ code: 500, message: msg }); }
});
router.get('/client/submissions/:id/charges', async (req, res) => {
  try { const data = await Finance.getSubmissionCharges(req.params.id); res.json({ code: 200, data }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// ==================== 员工端 ====================
router.use('/employee', role('employee', 'admin'));

// 充值申请列表（员工审核用）
router.get('/employee/deposit-requests', async (req, res) => {
  try {
    const filter = req.query.filter || 'pending';
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const data = await Finance.getDepositRequests(filter, page, pageSize);
    res.json({ code: 200, data: data });
  } catch (err) { console.error(err); const msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message; res.status(500).json({ code: 500, message: msg }); }
});

// 审核充值申请（通过/拒绝）
router.put('/employee/deposit-requests/:id', async (req, res) => {
  try {
    const { action, comment } = req.body;
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.json({ code: 400, message: '请指定操作类型: approve 或 reject' });
    }
    const data = await Finance.reviewDepositRequest(req.params.id, action, req.user.id, comment);
    res.json({ code: 200, message: action === 'approve' ? '已通过，余额已到账' : '已拒绝', data: data });
  } catch (err) { console.error(err); const msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message; res.status(400).json({ code: 400, message: msg }); }
});

router.get('/employee/submissions/:id/charges', async (req, res) => {
  try { const data = await Finance.getSubmissionCharges(req.params.id); res.json({ code: 200, data }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.post('/employee/submissions/:id/calculate', async (req, res) => {
  try {
    const params = { ...req.body, _employee_id: req.user.id };
    const data = await Finance.calculateCharges(req.params.id, params);
    res.json({ code: 200, data });
  }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.put('/employee/submissions/:id/charges', async (req, res) => {
  try { const data = await Finance.updateCharges(req.params.id, req.body.charges || []); res.json({ code: 200, data }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.get('/employee/submissions/:id/check-balance', async (req, res) => {
  try { const data = await Finance.checkBalance(req.params.id); res.json({ code: 200, data }); }
  catch (err) { res.status(500).json({ code: 500, message: err.message }); }
});
// Fix 3: 标记货物到仓 + 自动扣款
router.put('/employee/submissions/:id/mark-arrived', async (req, res) => {
  try {
    const data = await Finance.markArrived(req.params.id, req.user.id, req.user.username);
    const { rows: [sub] } = await require('../db').query('SELECT user_id, application_no FROM submissions WHERE id = $1', [req.params.id]);
    if (sub) await Finance.createNotification(sub.user_id, '货物已到仓并扣款', `申请 ${sub.application_no} 货物已到达泰国仓库，已扣款 ฿${data.total_amount}`, 'info', 'submission', req.params.id);
    res.json({ code: 200, message: '已标记到仓并完成扣款', data });
  } catch (err) { res.status(400).json({ code: 400, message: err.message }); }
});
router.post('/employee/submissions/:id/charge', async (req, res) => {
  try {
    const data = await Finance.chargeSubmission(req.params.id, req.user.id, req.user.username);
    const { query } = require('../db');
    const { rows: [sub] } = await query('SELECT user_id, application_no FROM submissions WHERE id = $1', [req.params.id]);
    if (sub) await Finance.createNotification(sub.user_id, '扣费成功', `申请 ${sub.application_no} 已扣费 ฿${data.total_amount}`, 'info', 'submission', req.params.id);
    await query(`INSERT INTO review_logs (submission_id, employee_id, action, comment) VALUES ($1, $2, 'fee_update', $3)`,
      [req.params.id, req.user.id, `手动扣款: ${data.total_amount} ฿`]);
    res.json({ code: 200, message: '扣款成功', data });
  } catch (err) { res.status(400).json({ code: 400, message: err.message }); }
});
router.post('/employee/submissions/:id/refund', async (req, res) => {
  try {
    const data = await Finance.refundSubmission(req.params.id, req.user.id, req.user.username);
    const { query } = require('../db');
    await query(`INSERT INTO review_logs (submission_id, employee_id, action, comment) VALUES ($1, $2, 'fee_update', $3)`,
      [req.params.id, req.user.id, `退款: ${data.refunded_amount} ฿`]);
    res.json({ code: 200, message: '退款成功', data });
  } catch (err) { res.status(400).json({ code: 400, message: err.message }); }
});

// ==================== 管理员端 ====================
router.use('/admin', role('admin'));
router.get('/admin/price-rules', async (req, res) => {
  try { const rules = await Finance.getPriceRules(); res.json({ code: 200, data: rules }); }
  catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.put('/admin/price-rules/:id', async (req, res) => {
  try {
    const rule = await Finance.updatePriceRule(req.params.id, req.body, req.user.id, req.user.username);
    if (!rule) return res.status(404).json({ code: 404, message: '规则不存在' });
    res.json({ code: 200, message: '更新成功', data: rule });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.post('/admin/price-rules', async (req, res) => {
  try {
    const { query } = require('../db');
    const { fee_type, fee_name, unit, unit_price, description, route } = req.body;
    if (!fee_type || !fee_name) return res.status(400).json({ code: 400, message: 'fee_type 和 fee_name 为必填' });
    const { rows: [rule] } = await query(
      `INSERT INTO price_rules (fee_type, fee_name, unit, unit_price, description, route, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
      [fee_type, fee_name, unit || 'fixed', unit_price || 0, description || null, route || null]
    );
    res.json({ code: 200, message: '新增成功', data: rule });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.delete('/admin/price-rules/:id', async (req, res) => {
  try {
    const { query } = require('../db');
    const { rowCount } = await query('DELETE FROM price_rules WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ code: 404, message: '规则不存在' });
    res.json({ code: 200, message: '删除成功' });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});
router.post('/admin/deposit', async (req, res) => {
  try {
    const { user_id, amount, description } = req.body;
    if (!user_id || !amount) return res.status(400).json({ code: 400, message: '缺少参数' });
    const data = await Finance.deposit(user_id, parseFloat(amount), description, req.user.id, req.user.username);
    await Finance.createNotification(user_id, '充值到账', `管理员已为您充值 ฿${amount}，当前余额 ฿${data.balance}`, 'success', null, null);
    res.json({ code: 200, message: '充值成功', data });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

module.exports = router;
