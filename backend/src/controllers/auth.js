const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config');

const authController = {
  /**
   * POST /api/auth/login
   * 用户登录，验证用户名密码，返回 JWT token 和用户信息
   * 注意：登录失败也返回 HTTP 200，通过 code 区分成功/失败
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // 参数校验
      if (!username || !password) {
        return res.json({ code: 400, message: '请输入用户名和密码' });
      }

      // 查找用户
      const user = await User.findByUsername(username);
      if (!user) {
        return res.json({ code: 401, message: '用户名或密码错误' });
      }

      // 检查用户状态
      if (user.status === 'pending') {
        return res.json({ code: 403, message: '您的账号正在审核中，请耐心等待' });
      }
      if (user.status === 'rejected') {
        return res.json({ code: 403, message: '您的账号审核未通过，请联系客服' });
      }
      if (user.status === 'disabled') {
        return res.json({ code: 403, message: '您的账号已被禁用，请联系管理员' });
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.json({ code: 401, message: '密码错误' });
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
        data: { token, user: userWithoutPassword },
      });
    } catch (err) {
      console.error('[Auth] Login error:', err);
      const msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message;
      return res.json({ code: 500, message: msg });
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
        return res.json({ code: 404, message: '用户不存在' });
      }
      return res.json({ code: 200, message: 'ok', data: user });
    } catch (err) {
      console.error('[Auth] Me error:', err);
      const msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message;
      return res.json({ code: 500, message: msg });
    }
  },

  /**
   * POST /api/auth/register
   * 客户自助注册
   */
  async register(req, res) {
    try {
      const { username, password, email, real_name } = req.body;

      if (!username || !password) {
        return res.json({ code: 400, message: '用户名和密码为必填项' });
      }
      if (username.length < 3 || username.length > 50) {
        return res.json({ code: 400, message: '用户名长度需要3-50个字符' });
      }
      if (password.length < 6) {
        return res.json({ code: 400, message: '密码长度不能少于6位' });
      }

      const existing = await User.findByUsername(username);
      if (existing) {
        return res.json({ code: 400, message: '用户名已存在，请更换' });
      }

      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(password, 10);
      const user = await User.create({
        username,
        password: hash,
        role: 'client',
        email: email || null,
        real_name: real_name || null,
        status: 'pending',
      });

      // Notify all employees about new registration
      const { query } = require('../db');
      const emps = await query("SELECT id FROM users WHERE role IN ('employee','admin') AND status = 'active'");
      for (var i = 0; i < emps.rows.length; i++) {
        var notiTitle = '新客户注册待审核';
        var notiContent = '客户 ' + username + (real_name ? '（' + real_name + '）' : '') + ' 已注册，请尽快审核';
        await query(
          "INSERT INTO notifications (user_id, title, content, type) VALUES ($1, $2, $3, 'warning')",
          [emps.rows[i].id, notiTitle, notiContent]
        );
      }

      return res.json({
        code: 200,
        message: '注册成功，请等待管理员审核您的账号',
        data: { id: user.id, username: user.username, role: user.role, status: 'pending' },
      });
    } catch (err) {
      console.error('[Auth] Register error:', err);
      const msg = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message;
      return res.json({ code: 500, message: msg });
    }
  },

};

module.exports = authController;
