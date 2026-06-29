const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config');

const authController = {
  /**
   * POST /api/auth/login
   * 用户登录，验证用户名密码，返回 JWT token 和用户信息
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // 参数校验
      if (!username || !password) {
        return res.status(400).json({
          code: 400,
          message: '请输入用户名和密码',
        });
      }

      // 查找用户
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误',
        });
      }

      // 检查用户状态
      if (user.status === 'disabled') {
        return res.status(403).json({
          code: 403,
          message: '您的账号已被禁用，请联系管理员',
        });
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误',
        });
      }

      // 生成 JWT token
      const tokenPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
      };
      const token = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      // 返回用户信息（不包含密码）
      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        code: 200,
        message: '登录成功',
        data: {
          token,
          user: userWithoutPassword,
        },
      });
    } catch (err) {
      console.error('[Auth] Login error:', err);
      return res.status(500).json({
        code: 500,
        message: '服务器内部错误',
      });
    }
  },

  /**
   * GET /api/auth/me
   * 获取当前登录用户信息
   */
  async me(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在',
        });
      }

      return res.json({
        code: 200,
        message: 'ok',
        data: user,
      });
    } catch (err) {
      console.error('[Auth] Me error:', err);
      return res.status(500).json({
        code: 500,
        message: '服务器内部错误',
      });
    }
  },
};

module.exports = authController;
