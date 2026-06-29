const express = require('express');
const router = express.Router();
const controller = require('../controllers/clientProfile');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.use(auth);
router.use(role('client'));

// 文件上传（用于资料模块）
const upload = require('../middleware/upload');
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, message: '请选择文件' });
  const url = `/uploads/profile/${req.user.id}/${req.file.filename}`;
  return res.json({
    code: 200,
    message: '上传成功',
    data: {
      original_name: req.file.originalname,
      stored_path: req.file.path,
      url,
      mime_type: req.file.mimetype,
      size: req.file.size,
    },
  });
});

// 公司资料
router.get('/company-docs', controller.listCompanyDocs);
router.post('/company-docs', controller.createCompanyDoc);
router.put('/company-docs/:id', controller.updateCompanyDoc);
router.delete('/company-docs/:id', controller.deleteCompanyDoc);

// 报关授权
router.get('/customs-auths', controller.listCustomsAuths);
router.post('/customs-auths', controller.createCustomsAuth);
router.put('/customs-auths/:id', controller.updateCustomsAuth);
router.delete('/customs-auths/:id', controller.deleteCustomsAuth);

module.exports = router;
