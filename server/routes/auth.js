const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

router.post('/register', [
  body('username').trim().isLength({ min: 2, max: 20 }).withMessage('用户名需要2-20个字符'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array()[0].msg);
    }

    const { username, password, nickname, phone, studentId } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return error(res, '用户名已存在');
    }

    const user = await User.create({
      username,
      password,
      nickname: nickname || username,
      phone: phone || '',
      studentId: studentId || ''
    });

    const token = generateToken(user._id);
    return success(res, { user, token }, '注册成功', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/login', [
  body('username').notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array()[0].msg);
    }

    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return error(res, '用户名或密码错误');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, '用户名或密码错误');
    }

    const token = generateToken(user._id);
    return success(res, { user, token }, '登录成功');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    return success(res, { user: req.user });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { nickname, phone, avatar, studentId } = req.body;
    const updates = {};
    if (nickname !== undefined) updates.nickname = nickname;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;
    if (studentId !== undefined) updates.studentId = studentId;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    return success(res, { user }, '更新成功');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
