const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * JWT 认证中间件
 * 从请求头 Authorization 提取 Bearer token，验证后将用户信息附加到 req.user
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未登录或 Token 缺失，请先登录',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'Token 已过期，请重新登录',
      });
    }
    return res.status(401).json({
      code: 401,
      message: 'Token 无效，请重新登录',
    });
  }
};

module.exports = auth;
