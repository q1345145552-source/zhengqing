const ClientProfile = require('../models/clientProfile');

/**
 * 客户端个人资料控制器
 */
const clientProfileController = {
  // ===== 公司资料 =====

  async listCompanyDocs(req, res) {
    try {
      const docs = await ClientProfile.getCompanyDocs(req.user.id);
      return res.json({ code: 200, message: 'ok', data: docs });
    } catch (err) {
      console.error('[Profile] listCompanyDocs error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async createCompanyDoc(req, res) {
    try {
      const doc = await ClientProfile.createCompanyDoc(req.user.id, req.body);
      return res.json({ code: 200, message: '保存成功', data: doc });
    } catch (err) {
      console.error('[Profile] createCompanyDoc error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async updateCompanyDoc(req, res) {
    try {
      const doc = await ClientProfile.updateCompanyDoc(req.params.id, req.user.id, req.body);
      if (!doc) return res.status(404).json({ code: 404, message: '资料不存在' });
      return res.json({ code: 200, message: '更新成功', data: doc });
    } catch (err) {
      console.error('[Profile] updateCompanyDoc error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async deleteCompanyDoc(req, res) {
    try {
      const deleted = await ClientProfile.deleteCompanyDoc(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ code: 404, message: '资料不存在' });
      return res.json({ code: 200, message: '删除成功' });
    } catch (err) {
      console.error('[Profile] deleteCompanyDoc error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  // ===== 报关授权 =====

  async listCustomsAuths(req, res) {
    try {
      const auths = await ClientProfile.getCustomsAuths(req.user.id);
      return res.json({ code: 200, message: 'ok', data: auths });
    } catch (err) {
      console.error('[Profile] listCustomsAuths error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async createCustomsAuth(req, res) {
    try {
      const auth = await ClientProfile.createCustomsAuth(req.user.id, req.body);
      return res.json({ code: 200, message: '保存成功', data: auth });
    } catch (err) {
      console.error('[Profile] createCustomsAuth error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async updateCustomsAuth(req, res) {
    try {
      const auth = await ClientProfile.updateCustomsAuth(req.params.id, req.user.id, req.body);
      if (!auth) return res.status(404).json({ code: 404, message: '资料不存在' });
      return res.json({ code: 200, message: '更新成功', data: auth });
    } catch (err) {
      console.error('[Profile] updateCustomsAuth error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async deleteCustomsAuth(req, res) {
    try {
      const deleted = await ClientProfile.deleteCustomsAuth(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ code: 404, message: '资料不存在' });
      return res.json({ code: 200, message: '删除成功' });
    } catch (err) {
      console.error('[Profile] deleteCustomsAuth error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },
};

module.exports = clientProfileController;
