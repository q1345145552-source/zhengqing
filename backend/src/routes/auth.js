const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const auth = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// 登录/注册限流：同一IP每分钟最多5次请求，防暴力破解
const authLimiter = rateLimiter({ windowMs: 60000, max: 5, message: '请求过于频繁，请1分钟后再试' });

// POST /api/auth/register - 客户注册
router.post('/register', authLimiter, authController.register);

// POST /api/auth/login - 用户登录
router.post('/login', authLimiter, authController.login);

// GET /api/auth/me - 获取当前用户信息（需认证）
router.get('/me', auth, authController.me);

module.exports = router;
