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

      if (!username || !password) {
        return res.status(400).json({ code: 400, message: '请输入用户名和密码' });
      }

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({ code: 401, message: '用户名或密码错误' });
      }

      if (user.status === 'pending') {
        return res.status(403).json({ code: 403, message: '您的账号正在审核中，请耐心等待' });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({ code: 403, message: '您的账号审核未通过，请联系客服' });
      }
      if (user.status === 'disabled') {
        return res.status(403).json({ code: 403, message: '您的账号已被禁用，请联系管理员' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ code: 401, message: '密码错误' });
      }

      const tokenPayload = { id: user.id, username: user.username, role: user.role };
      const secret = config.jwt.secret;
      if (!secret) {
        console.error('[Auth] JWT_SECRET not configured!');
        return res.status(500).json({ code: 500, message: '服务器配置错误' });
      }
      const token = jwt.sign(tokenPayload, secret, { expiresIn: config.jwt.expiresIn });

      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({
        code: 200, message: '登录成功',
        data: { token, user: userWithoutPassword },
      });
    } catch (err) {
      console.error('[Auth] Login error:', err);
      const msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message;
      return res.status(500).json({ code: 500, message: msg });
    }
  },

  /**
   * GET /api/auth/me
   */
  async me(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      return res.status(200).json({ code: 200, message: 'ok', data: user });
    } catch (err) {
      console.error('[Auth] Me error:', err);
      const msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message;
      return res.status(500).json({ code: 500, message: msg });
    }
  },

  /**
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { username, password, email, real_name } = req.body;

      if (!username || !password) {
        return res.status(400).json({ code: 400, message: '用户名和密码为必填项' });
      }
      if (username.length < 3 || username.length > 50) {
        return res.status(400).json({ code: 400, message: '用户名长度需要3-50个字符' });
      }
      if (password.length < 6) {
        return res.status(400).json({ code: 400, message: '密码长度不能少于6位' });
      }

      const existing = await User.findByUsername(username);
      if (existing) {
        return res.status(400).json({ code: 400, message: '用户名已存在，请更换' });
      }

      const hash = await bcrypt.hash(password, 10);
      const user = await User.create({
        username, password: hash, role: 'client',
        email: email || null, real_name: real_name || null, status: 'pending',
      });

      // Notify all employees about new registration
      const { query } = require('../db');
      const emps = await query("SELECT id FROM users WHERE role IN ('employee','admin') AND status = 'active'");
      for (let i = 0; i < emps.rows.length; i++) {
        await query(
          "INSERT INTO notifications (user_id, title, content, type) VALUES ($1, $2, $3, 'warning')",
          [emps.rows[i].id, '新客户注册待审核',
           '客户 ' + username + (real_name ? '（' + real_name + '）' : '') + ' 已注册，请尽快审核']
        );
      }

      return res.status(200).json({
        code: 200, message: '注册成功，请等待管理员审核您的账号',
        data: { id: user.id, username: user.username, role: user.role, status: 'pending' },
      });
    } catch (err) {
      console.error('[Auth] Register error:', err);
      const msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message;
      return res.status(500).json({ code: 500, message: msg });
    }
  },
};

module.exports = authController;
