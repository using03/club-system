const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/response');
const { isBlacklisted } = require('../utils/tokenBlacklist');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return error(res, '请先登录', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (isBlacklisted(decoded.id, decoded.iat)) {
      return error(res, '权限已变更，请重新登录', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return error(res, '用户不存在', 401);
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (err) {
    return error(res, '认证失败，请重新登录', 401);
  }
};

const adminAuth = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return error(res, '需要管理员权限', 403);
  }
  next();
};

const clubAdminAuth = async (req, res, next) => {
  if (!['admin', 'club_admin'].includes(req.user.role)) {
    return error(res, '需要社团管理员权限', 403);
  }
  next();
};

module.exports = { auth, adminAuth, clubAdminAuth };
