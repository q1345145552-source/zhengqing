const { query } = require('../db');

/**
 * 客户个人资料模型
 * 包含公司资料 (company_docs) 和报关授权 (customs_auths)
 */

const ClientProfile = {
  // ========== 公司资料 CRUD ==========

  async getCompanyDocs(userId) {
    const result = await query(
      `SELECT * FROM client_company_docs
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getCompanyDocById(id, userId) {
    const result = await query(
      'SELECT * FROM client_company_docs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async createCompanyDoc(userId, data) {
    const result = await query(
      `INSERT INTO client_company_docs (
         user_id, company_name, thai_address, tax_id,
         dbd_file, pp20_file, company_stamp_file,
         director_passport_file, legal_rep_info
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        data.company_name || null,
        data.thai_address || null,
        data.tax_id || null,
        JSON.stringify(data.dbd_file || {}),
        JSON.stringify(data.pp20_file || {}),
        JSON.stringify(data.company_stamp_file || {}),
        JSON.stringify(data.director_passport_file || {}),
        JSON.stringify(data.legal_rep_info || {}),
      ]
    );
    return result.rows[0];
  },

  async updateCompanyDoc(id, userId, data) {
    const fields = [];
    const values = [id, userId];
    let paramIdx = 3;

    const setIf = (key, val) => {
      if (val !== undefined) {
        fields.push(`${key} = $${paramIdx++}`);
        values.push(typeof val === 'object' ? JSON.stringify(val) : val);
      }
    };

    setIf('company_name', data.company_name);
    setIf('thai_address', data.thai_address);
    setIf('tax_id', data.tax_id);
    setIf('dbd_file', data.dbd_file);
    setIf('pp20_file', data.pp20_file);
    setIf('company_stamp_file', data.company_stamp_file);
    setIf('director_passport_file', data.director_passport_file);
    setIf('legal_rep_info', data.legal_rep_info);

    if (fields.length === 0) return null;

    fields.push('updated_at = CURRENT_TIMESTAMP');

    const result = await query(
      `UPDATE client_company_docs SET ${fields.join(', ')}
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async deleteCompanyDoc(id, userId) {
    const result = await query(
      'DELETE FROM client_company_docs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rowCount > 0;
  },

  // ========== 报关授权 CRUD ==========

  async getCustomsAuths(userId) {
    const result = await query(
      `SELECT * FROM client_customs_auths
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getCustomsAuthById(id, userId) {
    const result = await query(
      'SELECT * FROM client_customs_auths WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async createCustomsAuth(userId, data) {
    const result = await query(
      `INSERT INTO client_customs_auths (
         user_id, auth_type, account_number, password,
         power_of_attorney_file, pp20_signed_file, dbd_signed_file, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        data.auth_type || 'director',
        data.account_number || null,
        data.password || null,
        JSON.stringify(data.power_of_attorney_file || {}),
        JSON.stringify(data.pp20_signed_file || {}),
        JSON.stringify(data.dbd_signed_file || {}),
        data.notes || null,
      ]
    );
    return result.rows[0];
  },

  async updateCustomsAuth(id, userId, data) {
    const fields = [];
    const values = [id, userId];
    let paramIdx = 3;

    const setIf = (key, val) => {
      if (val !== undefined) {
        fields.push(`${key} = $${paramIdx++}`);
        values.push(typeof val === 'object' ? JSON.stringify(val) : val);
      }
    };

    setIf('auth_type', data.auth_type);
    setIf('account_number', data.account_number);
    setIf('password', data.password);
    setIf('power_of_attorney_file', data.power_of_attorney_file);
    setIf('pp20_signed_file', data.pp20_signed_file);
    setIf('dbd_signed_file', data.dbd_signed_file);
    setIf('notes', data.notes);

    if (fields.length === 0) return null;

    fields.push('updated_at = CURRENT_TIMESTAMP');

    const result = await query(
      `UPDATE client_customs_auths SET ${fields.join(', ')}
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async deleteCustomsAuth(id, userId) {
    const result = await query(
      'DELETE FROM client_customs_auths WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rowCount > 0;
  },
};

module.exports = ClientProfile;
