const { query } = require('../db');

const EmployeeReview = {
  /**
   * 获取提交列表（员工端）
   * @param {string} filter - 'pending' | 'processed'
   */
  async list(filter = 'all') {
    let where;
    if (filter === 'pending') {
      where = `s.status = 'submitted' AND (s.review_status = 'pending' OR s.review_status = 'approved')`;
    } else if (filter === 'all') {
      where = `s.status = 'submitted'`;
    } else {
      where = `s.status = 'submitted' AND s.review_status IN ('approved', 'registered', 'rejected')`;
    }

    const result = await query(
      `SELECT
         s.id, s.user_id, s.current_step, s.status, s.review_status,
         s.review_comment, s.next_account, s.next_register_status,
         s.application_no, s.tracking_status, s.tracking_status_updated_at,
         s.created_at, s.updated_at,
         u.username AS client_name,
         COALESCE(sp.thai_name, sp.english_name, '未填写') AS product_name
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN submission_products sp ON sp.submission_id = s.id
       WHERE ${where}
       ORDER BY s.updated_at DESC`,
    );
    return result.rows;
  },

  /**
   * 获取单个提交的完整详情（含所有 5 步数据 + 文件 + 用户信息）
   */
  async detail(submissionId) {
    const [sub, step1, step2, step3, step4, step5, files, license_docs, user] = await Promise.all([
      query(`SELECT s.*, u.username AS client_name, u.email AS client_email
             FROM submissions s JOIN users u ON s.user_id = u.id WHERE s.id = $1`, [submissionId]),
      query('SELECT * FROM submission_products WHERE submission_id = $1', [submissionId]),
      query('SELECT * FROM submission_company_docs WHERE submission_id = $1', [submissionId]),
      query('SELECT * FROM submission_customs_auth WHERE submission_id = $1', [submissionId]),
      query('SELECT * FROM submission_tax_rebate WHERE submission_id = $1', [submissionId]),
      query('SELECT * FROM submission_shipments WHERE submission_id = $1', [submissionId]),
      query('SELECT * FROM submission_files WHERE submission_id = $1 ORDER BY stage, id', [submissionId]),
      query('SELECT * FROM submission_license_docs WHERE submission_id = $1 ORDER BY uploaded_at DESC', [submissionId]),
    ]);

    if (!sub.rows[0]) return null;

    return {
      ...sub.rows[0],
      step1: step1.rows[0] || null,
      step2: step2.rows[0] || null,
      step3: step3.rows[0] || null,
      step4: step4.rows[0] || null,
      step5: step5.rows[0] || null,
      files: files.rows,
      license_docs: license_docs.rows,
    };
  },

  /**
   * 审核操作（通过/退回）
   */
  async review(submissionId, { action, comment, hs_code, tax_rate, need_form_e, need_license }) {
    // 更新 submissions 审核状态
    const reviewStatus = action === 'approve' ? 'approved' : 'rejected';

    await query(
      `UPDATE submissions SET
         review_status = $2,
         review_comment = $3,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [submissionId, reviewStatus, comment || null]
    );

    // 更新产品确认信息（员工填写）
    if (hs_code !== undefined || tax_rate !== undefined || need_form_e !== undefined || need_license !== undefined) {
      const fields = [];
      const values = [submissionId];
      let idx = 2;
      if (hs_code !== undefined) { fields.push(`hs_code = $${idx++}`); values.push(hs_code); }
      if (tax_rate !== undefined) { fields.push(`tariff_rate = $${idx++}`); values.push(tax_rate); }
      if (need_form_e !== undefined) { fields.push(`form_e_eligible = $${idx++}`); values.push(need_form_e); }
      if (need_license !== undefined) { fields.push(`license_required = $${idx++}`); values.push(need_license); }
      if (fields.length > 0) {
        fields.push('updated_at = CURRENT_TIMESTAMP');
        await query(
          `UPDATE submission_products SET ${fields.join(', ')} WHERE submission_id = $1`,
          values
        );
      }
    }

    return { review_status: reviewStatus, comment };
  },

  /**
   * 录入 Next 注册结果
   */
  async nextRegister(submissionId, { next_account, register_status, notes }) {
    await query(
      `UPDATE submissions SET
         next_account = $2,
         next_register_status = $3,
         review_comment = COALESCE(NULLIF($4::text, ''), review_comment),
         review_status = 'registered',
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [submissionId, next_account || null, register_status || null, notes || null]
    );
    return { next_account, register_status };
  },

  // ========== 审核日志 ==========

  /**
   * 记录审核操作
   */
  async logReview(submissionId, employeeId, action, comment) {
    await query(
      `INSERT INTO review_logs (submission_id, employee_id, action, comment)
       VALUES ($1, $2, $3, $4)`,
      [submissionId, employeeId, action, comment || null]
    );
  },

  /**
   * 获取审核记录（员工自己的操作记录）
   */
  async getReviewHistory(employeeId, filter = 'all') {
    let where = `rl.employee_id = $1`;
    const values = [employeeId];
    if (filter !== 'all') {
      where += ` AND rl.action = $2`;
      values.push(filter);
    }
    const result = await query(
      `SELECT rl.*, s.application_no,
              u.username AS client_name,
              COALESCE(sp.thai_name, sp.english_name, '未填写') AS product_name
       FROM review_logs rl
       JOIN submissions s ON rl.submission_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN submission_products sp ON sp.submission_id = s.id
       WHERE ${where}
       ORDER BY rl.created_at DESC`,
      values
    );
    return result.rows;
  },

  /**
   * 获取已注册的申请（订单跟踪）
   */
  async getTracking() {
    const result = await query(
      `SELECT s.*, u.username AS client_name,
              COALESCE(sp.thai_name, sp.english_name, '未填写') AS product_name,
              (SELECT created_at FROM review_logs WHERE submission_id = s.id AND action = 'approve' ORDER BY created_at DESC LIMIT 1) AS approved_at
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN submission_products sp ON sp.submission_id = s.id
       WHERE s.review_status = 'registered'
       ORDER BY s.updated_at DESC`
    );
    return result.rows;
  },

  /**
   * 获取申请的时间线
   */
  async getTimeline(submissionId) {
    const [sub, logs] = await Promise.all([
      query('SELECT created_at, updated_at, review_status, next_register_status FROM submissions WHERE id = $1', [submissionId]),
      query('SELECT rl.*, u.username FROM review_logs rl JOIN users u ON rl.employee_id = u.id WHERE rl.submission_id = $1 ORDER BY rl.created_at ASC', [submissionId]),
    ]);
    if (!sub.rows[0]) return [];

    const timeline = [];
    const s = sub.rows[0];
    timeline.push({ time: s.created_at, title: '客户提交资料', icon: 'Document', color: '#409EFF' });

    for (const log of logs.rows) {
      if (log.action === 'approve') {
        timeline.push({ time: log.created_at, title: `审核通过 (操作人: ${log.username})`, icon: 'CircleCheckFilled', color: '#67C23A' });
      } else if (log.action === 'reject') {
        timeline.push({ time: log.created_at, title: `退回: ${log.comment || ''} (操作人: ${log.username})`, icon: 'CircleCloseFilled', color: '#F56C6C' });
      } else if (log.action === 'register') {
        timeline.push({ time: log.created_at, title: `Next 注册完成 (操作人: ${log.username})`, icon: 'Connection', color: '#909399' });
      }
    }

    return timeline;
  },

  /**
   * 导出汇总：全量资料 + 费用 + 时间线 + Next注册信息
   */
  async exportData(submissionId) {
    const [sub, step1, step2, step3, step4, step5, files, license_docs2, charges, chargeLog, walletTx, logs] = await Promise.all([
      query(`SELECT s.*, u.username AS client_name, u.email AS client_email
             FROM submissions s JOIN users u ON s.user_id = u.id WHERE s.id = $1`, [submissionId]),
      query('SELECT * FROM submission_products WHERE submission_id = $1', [submissionId]),
      query('SELECT * FROM submission_company_docs WHERE submission_id = $1', [submissionId]),
      query('SELECT * FROM submission_customs_auth WHERE submission_id = $1', [submissionId]),
      query('SELECT * FROM submission_tax_rebate WHERE submission_id = $1', [submissionId]),
      query('SELECT * FROM submission_shipments WHERE submission_id = $1', [submissionId]),
      query('SELECT * FROM submission_files WHERE submission_id = $1 ORDER BY stage, id', [submissionId]),
      query('SELECT * FROM submission_license_docs WHERE submission_id = $1 ORDER BY uploaded_at DESC', [submissionId]),
      query('SELECT * FROM submission_charges WHERE submission_id = $1 ORDER BY is_optional, id', [submissionId]),
      query('SELECT * FROM submission_charge_logs WHERE submission_id = $1 ORDER BY id DESC LIMIT 1', [submissionId]),
      query("SELECT * FROM wallet_transactions WHERE submission_id = $1 AND type = 'charge' ORDER BY id DESC LIMIT 1", [submissionId]),
      query('SELECT rl.*, u.username AS operator_name FROM review_logs rl JOIN users u ON rl.employee_id = u.id WHERE rl.submission_id = $1 ORDER BY rl.created_at ASC', [submissionId]),
    ]);

    if (!sub.rows[0]) return null;
    const s = sub.rows[0];

    // 审核时间（approve 操作的时间）
    const approvedLog = logs.rows.find(l => l.action === 'approve');
    // Next注册时间（register 操作的时间）
    const registerLog = logs.rows.find(l => l.action === 'register');

    // 物流公司中文名
    const logisticsNames = {
      bluewhite: 'BlueWhite 蓝白物流',
      flash: 'Flash Express',
      kerry: 'Kerry Express',
      nim: 'Nim Express',
      nss: 'NSS 曼谷自提',
      lalamove: 'Lalamove 包车派送',
    };

    // 费用分类
    const freightCbm = charges.rows.find(c => c.fee_type === 'freight_cbm');
    const freightKg = charges.rows.find(c => c.fee_type === 'freight_kg');
    const freightMaxNote = charges.rows.find(c => c.fee_type === 'freight_max_note');
    const domesticFreight = charges.rows.find(c => c.fee_type === 'domestic_freight');
    const storageCharge = charges.rows.find(c => c.fee_type === 'storage');
    const serviceCharges = charges.rows.filter(c => c.is_optional);
    const customsDuty = parseFloat(s.customs_duty_amount) || 0;
    const subtotalAmount = charges.rows.filter(c => c.selected).reduce((sum, c) => sum + parseFloat(c.amount), 0) + customsDuty;
    const grandTotalAmount = Math.round(subtotalAmount * 1.07);

    return {
      // 基本信息
      id: s.id,
      application_no: s.application_no,
      client_name: s.client_name,
      client_email: s.client_email,
      tracking_status: s.tracking_status,
      tracking_status_updated_at: s.tracking_status_updated_at,
      created_at: s.created_at,
      review_at: approvedLog ? approvedLog.created_at : null,
      review_status: s.review_status,
      review_comment: s.review_comment,
      arrived_at_warehouse: s.arrived_at_warehouse,
      batch_number: s.batch_number || null,
      customs_duty_amount: parseFloat(s.customs_duty_amount) || 0,
      international_route: s.international_route || null,
      tracking_company: s.tracking_company || null,
      tracking_number: s.tracking_number || null,
      shipped_at: s.shipped_at || null,

      // 第一区：产品信息
      step1: step1.rows[0] || null,

      // 第二区：公司资料
      step2: step2.rows[0] || null,

      // 第三区：报关授权
      step3: step3.rows[0] || null,

      // 第四区：退税信息
      step4: step4.rows[0] || null,

      // 第五区：发货信息
      step5: step5.rows[0] || null,

      // 第六区：费用信息
      finance: {
        freight_cbm: freightCbm || null,
        freight_kg: freightKg || null,
        freight_max_note: freightMaxNote ? freightMaxNote.fee_name : '',
        domestic_freight: domesticFreight || null,
        domestic_logistics_name: logisticsNames[s.domestic_logistics] || (s.domestic_logistics || '未选择'),
        storage: storageCharge || null,
        storage_days: s.storage_days || 0,
        services: serviceCharges,
        subtotal_amount: Math.round(subtotalAmount * 100) / 100,
        total_amount: Math.round(grandTotalAmount * 100) / 100,
        charge_log: chargeLog.rows[0] || null,
        charge_balance_before: walletTx.rows[0] ? parseFloat(walletTx.rows[0].amount) + parseFloat(walletTx.rows[0].balance_after) : null,
        charge_balance_after: walletTx.rows[0] ? parseFloat(walletTx.rows[0].balance_after) : null,
      },

      // 第七区：Next注册信息
      next: {
        next_account: s.next_account || null,
        next_register_status: s.next_register_status || null,
        registered_at: registerLog ? registerLog.created_at : null,
      },

      // 许可证信息
      license_type: s.license_type || null,
      license_docs: license_docs2.rows,

      // 文件列表
      files: files.rows,

      // 时间线
      timeline: logs.rows.map(l => ({
        time: l.created_at,
        action: l.action,
        comment: l.comment,
        operator: l.operator_name,
      })),
    };
  },
};

module.exports = EmployeeReview;
