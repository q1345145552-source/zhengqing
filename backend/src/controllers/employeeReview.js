const EmployeeReview = require('../models/employeeReview');
const Finance = require('../models/finance');

const employeeReviewController = {
  /**
   * GET /api/employee/submissions?filter=pending|processed
   */
  async list(req, res) {
    try {
      const filter = req.query.filter || 'pending';
      const list = await EmployeeReview.list(filter);
      return res.json({ code: 200, message: 'ok', data: list });
    } catch (err) {
      console.error('[EmployeeReview] list error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * GET /api/employee/submissions/:id
   */
  async detail(req, res) {
    try {
      const data = await EmployeeReview.detail(req.params.id);
      if (!data) return res.status(404).json({ code: 404, message: '提交不存在' });
      return res.json({ code: 200, message: 'ok', data });
    } catch (err) {
      console.error('[EmployeeReview] detail error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * PUT /api/employee/submissions/:id/review
   * Body: { action: 'approve'|'reject', comment, hs_code, tax_rate, need_form_e, need_license }
   */
  async review(req, res) {
    try {
      const { action, comment } = req.body;
      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ code: 400, message: 'action 必须为 approve 或 reject' });
      }
      if (action === 'reject' && !comment) {
        return res.status(400).json({ code: 400, message: '退回时必须填写原因' });
      }

      // Fix 4: 审核通过前仅检查余额，不扣钱
      if (action === 'approve') {
        const check = await Finance.checkBalance(req.params.id).catch(() => null);
        if (check && !check.sufficient) {
          return res.status(400).json({
            code: 400,
            message: `客户余额不足，当前余额 ฿${check.balance}，应收 ฿${check.total_amount}，请通知客户充值后再审核`,
            data: check,
          });
        }
      }

      const result = await EmployeeReview.review(req.params.id, req.body);
      await EmployeeReview.logReview(req.params.id, req.user.id, action, comment || null);

      // 审核通过时自动设置 tracking_status = 2
      if (action === 'approve') {
        const { query } = require('../db');
        await query(
          'UPDATE submissions SET tracking_status = 2, tracking_status_updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [req.params.id]
        );
      }

      // Fix 2: 发送通知给客户
      const { rows: [sub] } = await require('../db').query('SELECT user_id, application_no FROM submissions WHERE id = $1', [req.params.id]);
      if (sub) {
        const appNo = sub.application_no || `#${req.params.id}`;
        if (action === 'approve') {
          await Finance.createNotification(sub.user_id, '申请审核通过', `您的申请 ${appNo} 已审核通过，等待货物到仓后扣款`, 'success', 'submission', req.params.id);
        } else {
          await Finance.createNotification(sub.user_id, '申请已退回', `您的申请 ${appNo} 已被退回，退回原因: ${comment || '未填写'}`, 'error', 'submission', req.params.id);
        }
      }

      const msg = action === 'approve' ? '审核通过' : '已退回客户补件';
      return res.json({ code: 200, message: msg, data: result });
    } catch (err) {
      console.error('[EmployeeReview] review error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * PUT /api/employee/submissions/:id/next-register
   * Body: { next_account, register_status, notes }
   */
  async nextRegister(req, res) {
    try {
      const { next_account, register_status, notes } = req.body;
      if (!next_account) {
        return res.status(400).json({ code: 400, message: '请填写 Next 注册账号' });
      }
      const result = await EmployeeReview.nextRegister(req.params.id, req.body);
      await EmployeeReview.logReview(req.params.id, req.user.id, 'register', notes || null);
      // Fix 2: 通知客户
      const { rows: [sub] } = await require('../db').query('SELECT user_id, application_no FROM submissions WHERE id = $1', [req.params.id]);
      if (sub) {
        await Finance.createNotification(sub.user_id, 'Next 注册完成', `您的申请 ${sub.application_no || '#' + req.params.id} Next 注册已完成`, 'success', 'submission', req.params.id);
      }
      return res.json({ code: 200, message: '注册结果已保存', data: result });
    } catch (err) {
      console.error('[EmployeeReview] nextRegister error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * PUT /api/employee/submissions/:id/advance-status
   * 推进订单状态到下一步（只能按顺序推进，不能跳转）
   * 状态 7（已到泰国仓库）时触发自动扣款
   */
  async advanceStatus(req, res) {
    const { query } = require('../db');
    try {
      const subId = req.params.id;
      const { rows: [sub] } = await query('SELECT tracking_status, review_status FROM submissions WHERE id = $1', [subId]);

      if (!sub) return res.status(404).json({ code: 404, message: '申请不存在' });
      if (sub.review_status !== 'approved' && sub.review_status !== 'registered') {
        return res.status(400).json({ code: 400, message: '仅审核通过后的申请可以推进状态' });
      }

      const currentStatus = sub.tracking_status || 1;
      if (currentStatus >= 11) {
        return res.status(400).json({ code: 400, message: '已经是最终状态，无法继续推进' });
      }

      const nextStatus = currentStatus + 1;

      // 状态 7（已到泰国仓库）：触发自动扣款
      if (nextStatus === 7) {
        try {
          await Finance.chargeSubmission(subId, req.user.id, req.user.username);
          // 扣款成功：清除 pending 标记
          await query('UPDATE submissions SET pending_charge = false, pending_charge_amount = NULL WHERE id = $1', [subId]);
        } catch (chargeErr) {
          // 扣款失败：设置 pending_charge 标记，通知客户
          const { rows: [check] } = await query(
            `SELECT s.user_id, s.application_no, COALESCE((SELECT SUM(sc.amount) FROM submission_charges sc WHERE sc.submission_id = s.id AND sc.selected), 0) AS total_amount,
                    COALESCE((SELECT balance FROM client_wallets WHERE user_id = s.user_id), 0) AS balance
             FROM submissions s WHERE s.id = $1`, [subId]
          );
          const totalAmount = parseFloat(check?.total_amount || 0);
          const balance = parseFloat(check?.balance || 0);
          await query('UPDATE submissions SET pending_charge = true, pending_charge_amount = $2 WHERE id = $1', [subId, totalAmount]);
          if (check?.user_id) {
            const appNo = check.application_no || `#${subId}`;
            await Finance.createNotification(check.user_id, '扣款失败，请充值',
              `您的申请 ${appNo} 扣款失败。应付 ${totalAmount.toLocaleString()} ฿，当前余额 ${balance.toLocaleString()} ฿，请充值后系统将自动扣款。`, 'error', 'submission', subId);
          }
          return res.status(400).json({
            code: 400,
            message: `扣款失败：应付 ${totalAmount.toLocaleString()} ฿，余额 ${balance.toLocaleString()} ฿。已通知客户充值，充值后将自动重试。`,
          });
        }
      }

      // 推进状态
      await query(
        'UPDATE submissions SET tracking_status = $2, tracking_status_updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [subId, nextStatus]
      );

      // 记录日志
      const statusNames = {
        1: '待审核', 2: '审核通过', 3: '中国仓库收货',
        4: '运输中', 5: '清关中', 6: '已放行', 7: '已到泰国仓库', 8: '已派送', 9: '已完成',
      };
      await EmployeeReview.logReview(subId, req.user.id, 'advance_status',
        `状态推进: ${statusNames[currentStatus] || currentStatus} → ${statusNames[nextStatus] || nextStatus}`);

      // 通知客户
      const { rows: [subInfo] } = await query('SELECT user_id, application_no FROM submissions WHERE id = $1', [subId]);
      if (subInfo) {
        const appNo = subInfo.application_no || `#${subId}`;
        await Finance.createNotification(subInfo.user_id, '订单状态更新',
          `您的申请 ${appNo} 状态已更新为: ${statusNames[nextStatus]}`, 'info', 'submission', subId);
      }

      return res.json({
        code: 200,
        message: `状态已推进: ${statusNames[currentStatus]} → ${statusNames[nextStatus]}`,
        data: { tracking_status: nextStatus, status_name: statusNames[nextStatus] },
      });
    } catch (err) {
      console.error('[EmployeeReview] advanceStatus error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },
};

module.exports = employeeReviewController;
