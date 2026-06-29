const Submission = require('../models/submission');

const submissionController = {
  /**
   * POST /api/submissions
   * 创建新的提交流程（首次进入时）
   */
  async create(req, res) {
    try {
      // 检查是否有进行中的提交
      const existing = await Submission.findCurrentByUser(req.user.id);
      if (existing) {
        const full = await Submission.getFullSubmission(existing.id);
        return res.json({ code: 200, message: '已有进行中的提交', data: full });
      }
      const submission = await Submission.create(req.user.id);
      return res.json({ code: 200, message: '创建成功', data: { ...submission, step1: null, step2: null, step3: null, step4: null, step5: null, files: [] } });
    } catch (err) {
      console.error('[Submission] Create error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * GET /api/submissions/current
   * 获取当前客户进行中的提交
   */
  async current(req, res) {
    try {
      const submission = await Submission.findCurrentByUser(req.user.id);
      if (!submission) {
        return res.json({ code: 200, message: 'ok', data: null });
      }
      const full = await Submission.getFullSubmission(submission.id);
      return res.json({ code: 200, message: 'ok', data: full });
    } catch (err) {
      console.error('[Submission] Current error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * GET /api/submissions/:id
   * 获取提交完整数据
   */
  async show(req, res) {
    try {
      const full = await Submission.getFullSubmission(req.params.id);
      if (!full) {
        return res.status(404).json({ code: 404, message: '提交不存在' });
      }
      // 权限检查：只能查看自己的提交
      if (full.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ code: 403, message: '无权查看该提交' });
      }
      return res.json({ code: 200, message: 'ok', data: full });
    } catch (err) {
      console.error('[Submission] Show error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * PUT /api/submissions/:id/step/:step
   * 保存指定步骤数据
   */
  async saveStep(req, res) {
    try {
      const { id, step } = req.params;
      const stepNum = parseInt(step);
      const data = req.body;

      // 验证提交存在且属于当前用户
      const submission = await Submission.findById(id);
      if (!submission) {
        return res.status(404).json({ code: 404, message: '提交不存在' });
      }
      if (submission.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ code: 403, message: '无权修改该提交' });
      }

      let result;
      switch (stepNum) {
        case 1:
          result = await Submission.saveStep1(id, data);
          break;
        case 2:
          result = await Submission.saveStep2(id, data);
          break;
        case 3:
          result = await Submission.saveStep3(id, data);
          break;
        case 4:
          result = await Submission.saveStep4(id, data);
          break;
        case 5:
          result = await Submission.saveStep5(id, data);
          break;
        default:
          return res.status(400).json({ code: 400, message: '无效的步骤编号' });
      }

      // 如果当前步骤大于记录中的步骤，更新进度
      if (stepNum >= submission.current_step) {
        await Submission.updateStep(id, stepNum);
      }

      return res.json({ code: 200, message: '保存成功', data: result });
    } catch (err) {
      console.error('[Submission] SaveStep error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * POST /api/submissions/:id/upload
   * 上传文件
   */
  async upload(req, res) {
    try {
      const { id } = req.params;
      const stage = parseInt(req.body.stage) || 1;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ code: 400, message: '请选择要上传的文件' });
      }

      // 验证提交存在且属于当前用户
      const submission = await Submission.findById(id);
      if (!submission) {
        return res.status(404).json({ code: 404, message: '提交不存在' });
      }
      if (submission.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ code: 403, message: '无权上传' });
      }

      // 构造可访问的相对 URL 路径
      const url = `/uploads/${id}/${stage}/${file.filename}`;

      const fileInfo = {
        original_name: file.originalname,
        stored_path: file.path,
        url: url,
        mime_type: file.mimetype,
        size: file.size,
      };

      const saved = await Submission.saveFile(id, stage, fileInfo);

      return res.json({
        code: 200,
        message: '上传成功',
        data: { ...saved, url },
      });
    } catch (err) {
      console.error('[Submission] Upload error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * POST /api/submissions/:id/submit
   * 提交最终
   */
  async submit(req, res) {
    try {
      const { id } = req.params;
      const submission = await Submission.findById(id);
      if (!submission) {
        return res.status(404).json({ code: 404, message: '提交不存在' });
      }
      if (submission.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ code: 403, message: '无权操作' });
      }

      await Submission.updateStatus(id, 'submitted');
      await Submission.updateStep(id, 5);

      return res.json({ code: 200, message: '提交成功！我们会尽快处理您的资料' });
    } catch (err) {
      console.error('[Submission] Submit error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * GET /api/submissions
   * 客户获取自己的提交列表（含审核状态）
   */
  async list(req, res) {
    try {
      const list = await Submission.findByUser(req.user.id);
      return res.json({ code: 200, message: 'ok', data: list });
    } catch (err) {
      console.error('[Submission] List error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * PUT /api/submissions/:id/resubmit
   * 退回后重新提交
   */
  async resubmit(req, res) {
    try {
      const sub = await Submission.resubmit(req.params.id, req.user.id);
      if (!sub) return res.status(404).json({ code: 404, message: '提交不存在或无权操作' });
      return res.json({ code: 200, message: '已重新提交，等待审核', data: sub });
    } catch (err) {
      console.error('[Submission] Resubmit error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },
};

module.exports = submissionController;
