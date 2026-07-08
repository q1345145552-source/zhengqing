const express = require('express');
const router = express.Router();
const controller = require('../controllers/employeeReview');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// 员工 + 管理员才能访问
router.use(auth);
router.use(role('employee', 'admin'));

const { query } = require('../db');

router.get('/stats', async (req, res) => {
  try {
    const [{ rows: [p] }, { rows: [t] }] = await Promise.all([
      query("SELECT COUNT(*) AS c FROM submissions WHERE status = 'submitted' AND (review_status = 'pending' OR review_status IS NULL)"),
      query("SELECT COUNT(*) AS c FROM submissions WHERE status = 'submitted' AND review_status = 'approved'"),
    ]);
    res.json({ code: 200, data: { pending: parseInt(p.c), to_register: parseInt(t.c) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

const EmployeeReview = require('../models/employeeReview');

router.get('/submissions', async (req, res) => {
  try {
    const filter = req.query.filter || 'pending';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * pageSize;

    const { query } = require('../db');
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
router.get('/submissions/:id', controller.detail);
router.put('/submissions/:id/review', controller.review);
// 审核表单自动保存（HS Code、关税税率、Form E、许可证）
router.put('/submissions/:id/review-form', controller.reviewForm);

router.put('/submissions/:id/next-register', controller.nextRegister);
router.put('/submissions/:id/advance-status', controller.advanceStatus);

// 审核记录
router.get('/review-history', async (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    const data = await EmployeeReview.getReviewHistory(req.user.id, filter);
    res.json({ code: 200, data });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 订单跟踪（旧接口，保持兼容）
router.get('/tracking', async (req, res) => {
  try {
    const data = await EmployeeReview.getTracking();
    res.json({ code: 200, data });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 货物追踪列表（审核通过后的申请，支持状态筛选+分页+搜索）
router.get('/tracking/list', async (req, res) => {
  try {
    const { query } = require('../db');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * pageSize;
    const statusFilter = parseInt(req.query.status) || 0;
    const params = [];
    let where = `s.review_status IN ('approved', 'registered') AND s.status = 'submitted' AND s.tracking_status >= 2 AND s.tracking_status < 9`;
    if (statusFilter >= 1 && statusFilter <= 9) where += ` AND s.tracking_status = ${statusFilter}`;
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
              scl.status AS charge_status, COALESCE(scl.total_amount, 0) AS charged_amount, s.pending_charge, COALESCE(s.pending_charge_amount, 0) AS pending_charge_amount, COALESCE(s.tracking_number,'') AS client_tracking_number
       FROM submissions s JOIN users u ON s.user_id = u.id LEFT JOIN submission_products sp ON sp.submission_id = s.id
       LEFT JOIN client_company_docs ccd ON ccd.user_id = s.user_id
       LEFT JOIN LATERAL (SELECT status, total_amount FROM submission_charge_logs WHERE submission_id = s.id ORDER BY id DESC LIMIT 1) scl ON true
       WHERE ${where} ORDER BY s.id, s.tracking_status_updated_at DESC NULLS LAST, s.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, allParams
    );
    res.json({ code: 200, data: { list: rows, total: parseInt(cnt.count), page, pageSize } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 时间线
router.get('/submissions/:id/timeline', async (req, res) => {
  try {
    const timeline = await EmployeeReview.getTimeline(req.params.id);
    res.json({ code: 200, data: timeline });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 导出汇总资料
router.get('/submissions/:id/export', async (req, res) => {
  try {
    const data = await EmployeeReview.exportData(req.params.id);
    if (!data) return res.status(404).json({ code: 404, message: '申请不存在' });
    res.json({ code: 200, data });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 待扣款列表
router.get('/pending-charges', async (req, res) => {
  try {
    const { query } = require('../db');
    const { rows } = await query(
      `SELECT s.id, s.application_no, s.pending_charge_amount, s.tracking_status,
              u.username AS client_name,
              COALESCE(w.balance, 0) AS client_balance
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN client_wallets w ON w.user_id = s.user_id
       WHERE s.pending_charge = true
       ORDER BY s.updated_at DESC`
    );
    res.json({ code: 200, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 确认扣款（员工手动重试）
router.post('/pending-charges/:id/retry', async (req, res) => {
  try {
    const Finance = require('../models/finance');
    const { query } = require('../db');
    const subId = req.params.id;
    const { rows: [sub] } = await query('SELECT * FROM submissions WHERE id = $1 AND pending_charge = true', [subId]);
    if (!sub) return res.status(404).json({ code: 404, message: '未找到待扣款申请' });

    try {
      await Finance.chargeSubmission(subId, req.user.id, req.user.username);
      await query('UPDATE submissions SET pending_charge = false, pending_charge_amount = NULL, arrived_at_warehouse = CURRENT_TIMESTAMP, tracking_status = 7, tracking_status_updated_at = CURRENT_TIMESTAMP WHERE id = $1', [subId]);

      const EmployeeReview = require('../models/employeeReview');
      await EmployeeReview.logReview(subId, req.user.id, 'advance_status', '状态推进: 已放行 → 已到泰国仓库（自动扣款）');

      const appNo = sub.application_no || `#${subId}`;
      await Finance.createNotification(sub.user_id, '扣款成功',
        `您的申请 ${appNo} 已扣款 ${parseFloat(sub.pending_charge_amount || 0).toLocaleString()} ฿，货物已到泰国仓库。`, 'success', 'submission', subId);

      res.json({ code: 200, message: '扣款成功，状态已推进到已到泰国仓库' });
    } catch (chargeErr) {
      res.status(400).json({ code: 400, message: chargeErr.message || '扣款失败，余额仍不足' });
    }
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

// 海关回传文件上传目录
const customsUploadDir = require('path').join(__dirname, '../../uploads/customs');
if (!require('fs').existsSync(customsUploadDir)) require('fs').mkdirSync(customsUploadDir, { recursive: true });
const customsUpload = require('multer')({
  dest: customsUploadDir,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf',
                     'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                     'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowed.indexOf(file.mimetype) >= 0) cb(null, true);
    else cb(new Error('不支持的文件类型: ' + file.mimetype), false);
  }
});
const _customsMw = customsUpload.single('file');

// 海关回传文件上传
router.post('/submissions/:id/customs-docs', (req, res, next) => {
  _customsMw(req, res, (err) => {
    if (err) return res.status(400).json({ code: 400, message: err.message });
    // 修复中文文件名乱码
    if (req.file) {
      try {
        const buf = Buffer.from(req.file.originalname, 'latin1');
        const restored = buf.toString('utf8');
        if (restored !== req.file.originalname && /[\u0080-\uffff]/.test(restored)) {
          req.file.originalname = restored;
        }
      } catch (e) {}
    }
    next();
  });
}, async (req, res) => {
  try {
    const { query } = require('../db');
    if (!req.file) return res.status(400).json({ code: 400, message: '请选择文件' });
    const file_type = req.body.file_type || 'other';
    const document_type_label = req.body.document_type_label || '';
    const ext = require('path').extname(req.file.originalname);
    const newName = Date.now() + '_' + Math.round(Math.random() * 1e9) + ext;
    const destPath = require('path').join(customsUploadDir, newName);
    require('fs').renameSync(req.file.path, destPath);
    const file_path = '/uploads/customs/' + newName;
    const { rows: [doc] } = await query(
      `INSERT INTO customs_documents (submission_id, file_name, file_path, file_type, document_type_label, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, req.file.originalname, file_path, file_type, document_type_label, req.user.id]
    );
    res.json({ code: 200, message: '上传成功', data: doc });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

router.get('/submissions/:id/customs-docs', async (req, res) => {
  try {
    const { query } = require('../db');
    const { rows } = await query('SELECT * FROM customs_documents WHERE submission_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json({ code: 200, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});

router.delete('/submissions/:id/customs-docs/:docId', async (req, res) => {
  try {
    const { query } = require('../db');
    await query('DELETE FROM customs_documents WHERE id = $1 AND submission_id = $2', [req.params.docId, req.params.id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message }); }
});


// 员工设置许可证类型
router.put('/submissions/:id/set-license-type', async (req, res) => {
  try {
    const { id } = req.params;
    const { license_type } = req.body;
    if (!['FDA','TISI','NBTC'].includes(license_type)) {
      return res.status(400).json({ code: 400, message: '无效的证件类型' });
    }
    const { query } = require('../db');
    await query('UPDATE submissions SET license_type = $2 WHERE id = $1', [id, license_type]);
    res.json({ code: 200, message: '已设置', data: { license_type } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: '服务器内部错误' }); }
});

// 员工上传许可证文件
router.post('/submissions/:id/upload-license', require('../middleware/upload').single('file'), async (req, res) => {
  try {
    const { query } = require('../db');
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ code: 400, message: '请选择文件' });
    const license_type = req.body.license_type;
    if (!license_type || !['FDA','TISI','NBTC'].includes(license_type)) return res.status(400).json({ code: 400, message: '无效的证件类型' });
    const url = '/uploads/' + id + '/' + (req.body.stage || '0') + '/' + req.file.filename;
    const { rows: [doc] } = await query(
      "INSERT INTO submission_license_docs (submission_id, license_type, file_name, file_path, url, uploaded_by) VALUES ($1,$2,$3,$4,$5,'员工') RETURNING *",
      [id, license_type, req.file.originalname, req.file.path, url]
    );
    res.json({ code: 200, message: '上传成功', data: doc });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: '服务器内部错误' }); }
});

// 员工查看所有许可证文件（客户+员工上传的）
router.get('/submissions/:id/license-docs', async (req, res) => {
  try {
    const { query } = require('../db');
    const { rows } = await query('SELECT * FROM submission_license_docs WHERE submission_id = $1 ORDER BY uploaded_at DESC', [req.params.id]);
    res.json({ code: 200, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: '服务器内部错误' }); }
});

// 批次号保存（独立接口，不依赖费用计算）
router.put('/submissions/:id/batch-number', async (req, res) => {
  try {
    const { batch_number } = req.body;
    const { query } = require('../db');
    await query('UPDATE submissions SET batch_number = $1 WHERE id = $2', [batch_number || null, req.params.id]);
    res.json({ code: 200, message: '批次号已保存', data: { batch_number: batch_number || null } });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: '服务器内部错误' }); }
});

// 扣款历史（员工查看所有）
router.get('/charge-history', async (req, res) => {
  try {
    const { query } = require('../db');
    const { rows } = await query(
      `SELECT wt.id, wt.user_id, u.username AS client_name, wt.submission_id,
              s.application_no, wt.amount, wt.type, wt.description, wt.created_at,
              wt.operated_by_name
       FROM wallet_transactions wt
       JOIN users u ON wt.user_id = u.id
       LEFT JOIN submissions s ON wt.submission_id = s.id
       WHERE wt.type = 'charge'
       ORDER BY wt.created_at DESC LIMIT 200`
    );
    res.json({ code: 200, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ code: 500, message: '服务器内部错误' }); }
});

module.exports = router;

