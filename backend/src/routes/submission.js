const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/upload');

// 所有接口都需要登录 + 客户角色
router.use(auth);
router.use(role('client'));

const { query } = require('../db');

// GET /api/submissions/stats - 客户端统计
router.get('/stats', async (req, res) => {
  try {
    const [{ rows: [s] }, { rows: [p] }, { rows: [a] }, { rows: [r] }] = await Promise.all([
      query('SELECT COUNT(*) AS c FROM submissions WHERE user_id = $1 AND status = $2', [req.user.id, 'submitted']),
      query('SELECT COUNT(*) AS c FROM submissions WHERE user_id = $1 AND status = $2 AND (review_status = $3 OR review_status IS NULL)', [req.user.id, 'submitted', 'pending']),
      query("SELECT COUNT(*) AS c FROM submissions WHERE user_id = $1 AND status = 'submitted' AND review_status IN ('approved','registered')", [req.user.id]),
      query('SELECT COUNT(*) AS c FROM submissions WHERE user_id = $1 AND review_status = $2', [req.user.id, 'rejected']),
    ]);
    res.json({ code: 200, data: { total: parseInt(s.c), pending: parseInt(p.c), approved: parseInt(a.c), rejected: parseInt(r.c) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/submissions - 创建新提交
router.post('/', submissionController.create);

// GET /api/submissions - 获取当前用户的提交列表
router.get('/', submissionController.list);

// GET /api/submissions/current - 获取当前用户的进行中提交
router.get('/current', submissionController.current);

// GET /api/submissions/:id - 获取提交详情
router.get('/:id', submissionController.show);

// PUT /api/submissions/:id/step/:step - 保存步骤数据
router.put('/:id/step/:step', submissionController.saveStep);

// POST /api/submissions/:id/upload - 上传文件
router.post('/:id/upload', upload.single('file'), submissionController.upload);

// POST /api/submissions/:id/submit - 最终提交
router.post('/:id/submit', submissionController.submit);

// PUT /api/submissions/:id/resubmit - 退回后重新提交
router.put('/:id/resubmit', submissionController.resubmit);

// DELETE /api/submissions/:id - 放弃草稿
router.delete('/:id', submissionController.destroy);

module.exports = router;
