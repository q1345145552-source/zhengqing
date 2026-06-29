/**
 * 角色权限中间件工厂函数
 * @param  {...string} allowedRoles - 允许访问的角色列表
 * @returns {Function} Express 中间件
 *
 * 用法示例：
 *   router.get('/admin/users', auth, role('admin'), handler);
 *   router.get('/tasks', auth, role('employee', 'admin'), handler);
 */
const role = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '请先登录',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: `权限不足，您的角色 [${req.user.role}] 无法访问该资源`,
      });
    }

    next();
  };
};

module.exports = role;
