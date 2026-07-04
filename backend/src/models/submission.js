const { query } = require('../db');

/**
 * 资料提交数据模型
 * 包含主表 + 5 个阶段表 + 文件表的 CRUD
 */

const Submission = {
  // ========== 主表：提交记录 ==========

  /**
   * 创建新的提交流程
   */
  async create(userId) {
    const result = await query(
      `INSERT INTO submissions (user_id, current_step, status)
       VALUES ($1, 1, 'draft')
       RETURNING *`,
      [userId]
    );
    return result.rows[0];
  },

  /**
   * 获取某用户当前进行中的提交（draft 状态）
   */
  async findCurrentByUser(userId) {
    const result = await query(
      `SELECT * FROM submissions
       WHERE user_id = $1 AND status = 'draft'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  /**
   * 按 ID 获取提交主记录
   */
  async findById(id) {
    const result = await query('SELECT * FROM submissions WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * 更新当前步骤
   */
  async updateStep(id, step) {
    const result = await query(
      `UPDATE submissions SET current_step = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, step]
    );
    return result.rows[0];
  },

  /**
   * 更新提交状态（并生成申请编号）
   */
  async updateStatus(id, status) {
    // 正式提交时自动生成申请编号（使用数据库序列 + 行锁防并发）
    if (status === 'submitted') {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      await query('BEGIN');
      try {
        // 行锁：锁定该行防止并发提交时同一用户重复生成编号
        await query('SELECT id FROM submissions WHERE id = $1 FOR UPDATE', [id]);
        const { rows } = await query(
          `SELECT COUNT(*) + 1 AS seq FROM submissions
           WHERE application_no LIKE $1`, ['ZQ' + today + '%']
        );
        const seq = String(rows[0].seq).padStart(3, '0');
        const appNo = `ZQ${today}${seq}`;

        const result = await query(
          `UPDATE submissions SET status = $2, application_no = $3, review_status = 'pending', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 RETURNING *`,
          [id, status, appNo]
        );
        await query('COMMIT');
        return result.rows[0];
      } catch (err) {
        await query('ROLLBACK');
        throw err;
      }
    }

    const result = await query(
      `UPDATE submissions SET status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return result.rows[0];
  },

  // ========== 阶段1：产品信息 ==========

  async saveStep1(submissionId, data) {
    const result = await query(
      `INSERT INTO submission_products (submission_id, product_images, thai_name, english_name)
       VALUES ($1, $2::jsonb, $3, $4)
       ON CONFLICT (submission_id) DO UPDATE SET
         product_images = COALESCE($2::jsonb, submission_products.product_images),
         thai_name = COALESCE($3, submission_products.thai_name),
         english_name = COALESCE($4, submission_products.english_name),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [submissionId, JSON.stringify(data.product_images || []), data.thai_name || null, data.english_name || null]
    );
    return result.rows[0];
  },

  // ========== 阶段2：公司资料 ==========

  async saveStep2(submissionId, data) {
    const result = await query(
      `INSERT INTO submission_company_docs (
         submission_id, dbd_file, pp20_file, company_stamp_file,
         director_passport_file, thai_address
       ) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (submission_id) DO UPDATE SET
         dbd_file = COALESCE($2, submission_company_docs.dbd_file),
         pp20_file = COALESCE($3, submission_company_docs.pp20_file),
         company_stamp_file = COALESCE($4, submission_company_docs.company_stamp_file),
         director_passport_file = COALESCE($5, submission_company_docs.director_passport_file),
         thai_address = COALESCE($6, submission_company_docs.thai_address),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [submissionId, data.dbd_file || null, data.pp20_file || null, data.company_stamp_file || null, data.director_passport_file || null, data.thai_address || null]
    );
    return result.rows[0];
  },

  // ========== 阶段3：报关授权 ==========

  async saveStep3(submissionId, data) {
    const result = await query(
      `INSERT INTO submission_customs_auth (
         submission_id, handler_type, power_of_attorney_file,
         pp20_signed_file, dbd_signed_file, has_director_passport_original
       ) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (submission_id) DO UPDATE SET
         handler_type = COALESCE($2, submission_customs_auth.handler_type),
         power_of_attorney_file = COALESCE($3, submission_customs_auth.power_of_attorney_file),
         pp20_signed_file = COALESCE($4, submission_customs_auth.pp20_signed_file),
         dbd_signed_file = COALESCE($5, submission_customs_auth.dbd_signed_file),
         has_director_passport_original = COALESCE($6, submission_customs_auth.has_director_passport_original),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [submissionId, data.handler_type || 'director', data.power_of_attorney_file || null, data.pp20_signed_file || null, data.dbd_signed_file || null, data.has_director_passport_original || false]
    );
    return result.rows[0];
  },

  // ========== 阶段4：退税 ==========

  async saveStep4(submissionId, data) {
    const result = await query(
      `INSERT INTO submission_tax_rebate (
         submission_id, need_rebate, customs_company_name,
         logistics_contact, logistics_code, invoice_file, packing_list_file
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (submission_id) DO UPDATE SET
         need_rebate = COALESCE($2, submission_tax_rebate.need_rebate),
         customs_company_name = COALESCE($3, submission_tax_rebate.customs_company_name),
         logistics_contact = COALESCE($4, submission_tax_rebate.logistics_contact),
         logistics_code = COALESCE($5, submission_tax_rebate.logistics_code),
         invoice_file = COALESCE($6, submission_tax_rebate.invoice_file),
         packing_list_file = COALESCE($7, submission_tax_rebate.packing_list_file),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [submissionId, data.need_rebate || false, data.customs_company_name || null, data.logistics_contact || null, data.logistics_code || null, data.invoice_file || null, data.packing_list_file || null]
    );
    return result.rows[0];
  },

  // ========== 阶段5：发货 ==========

  async saveStep5(submissionId, data) {
    const result = await query(
      `INSERT INTO submission_shipments (
         submission_id, confirmed, tracking_number,
         route, volume, weight, domestic_logistics,
         need_form_e, need_china_customs, need_thai_customs,
         pallet_count, wooden_box_cbm
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (submission_id) DO UPDATE SET
         confirmed = COALESCE($2, submission_shipments.confirmed),
         tracking_number = COALESCE($3, submission_shipments.tracking_number),
         route = COALESCE($4, submission_shipments.route),
         volume = COALESCE($5, submission_shipments.volume),
         weight = COALESCE($6, submission_shipments.weight),
         domestic_logistics = COALESCE($7, submission_shipments.domestic_logistics),
         need_form_e = COALESCE($8, submission_shipments.need_form_e),
         need_china_customs = COALESCE($9, submission_shipments.need_china_customs),
         need_thai_customs = COALESCE($10, submission_shipments.need_thai_customs),
         pallet_count = COALESCE($11, submission_shipments.pallet_count),
         wooden_box_cbm = COALESCE($12, submission_shipments.wooden_box_cbm),
         shipped_at = CASE WHEN EXCLUDED.confirmed = true AND submission_shipments.shipped_at IS NULL THEN CURRENT_TIMESTAMP ELSE submission_shipments.shipped_at END,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        submissionId,
        data.confirmed || false,
        data.tracking_number || null,
        data.route || null,
        data.volume || null,
        data.weight || null,
        data.domestic_logistics || null,
        data.need_form_e || false,
        data.need_china_customs || false,
        data.need_thai_customs || false,
        data.pallet_count || 0,
        data.wooden_box_cbm || 0,
      ]
    );
    return result.rows[0];
  },

  // ========== 文件上传记录 ==========

  async saveFile(submissionId, stage, fileInfo) {
    const result = await query(
      `INSERT INTO submission_files (submission_id, stage, original_name, stored_path, url, mime_type, size)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [submissionId, stage, fileInfo.original_name, fileInfo.stored_path, fileInfo.url || null, fileInfo.mime_type, fileInfo.size]
    );
    return result.rows[0];
  },

  /**
   * 获取某用户的提交列表（支持分页+搜索）
   */
  async findByUser(userId, { page = 1, pageSize = 10, search = '' } = {}) {
    const params = [userId];
    let where = 'user_id = $1';

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (COALESCE(application_no,'') ILIKE $${params.length})`;
    }

    const offset = (page - 1) * pageSize;

    const [{ rows: [cnt] }, { rows }] = await Promise.all([
      query(`SELECT COUNT(*) FROM submissions WHERE ${where}`, params),
      query(
        `SELECT id, application_no, current_step, status, review_status, review_comment,
                next_account, next_register_status, tracking_status, created_at, updated_at
         FROM submissions WHERE ${where}
         ORDER BY updated_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset]
      ),
    ]);

    return { list: rows, total: parseInt(cnt.count), page, pageSize };
  },

  /**
   * 重新提交（退回后）
   */
  async resubmit(id, userId) {
    const result = await query(
      `UPDATE submissions SET status = 'draft', review_status = 'pending', review_comment = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  },

  // ========== 获取完整提交数据（含所有阶段 + 文件） ==========

  async getFullSubmission(id) {
    const submission = await query('SELECT * FROM submissions WHERE id = $1', [id]);
    if (!submission.rows[0]) return null;

    const [step1, step2, step3, step4, step5, files, license_docs] = await Promise.all([
      query('SELECT * FROM submission_products WHERE submission_id = $1', [id]),
      query('SELECT * FROM submission_company_docs WHERE submission_id = $1', [id]),
      query('SELECT * FROM submission_customs_auth WHERE submission_id = $1', [id]),
      query('SELECT * FROM submission_tax_rebate WHERE submission_id = $1', [id]),
      query('SELECT * FROM submission_shipments WHERE submission_id = $1', [id]),
      query('SELECT * FROM submission_files WHERE submission_id = $1 ORDER BY stage, id', [id]),
      query('SELECT * FROM submission_license_docs WHERE submission_id = $1 ORDER BY uploaded_at DESC', [id]),
    ]);

    return {
      ...submission.rows[0],
      step1: step1.rows[0] || null,
      step2: step2.rows[0] || null,
      step3: step3.rows[0] || null,
      step4: step4.rows[0] || null,
      step5: step5.rows[0] || null,
      files: files.rows,
      license_docs: license_docs.rows,
    };
  },
};

module.exports = Submission;
