const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Club = require('../models/Club');
const Activity = require('../models/Activity');
const Registration = require('../models/Registration');
const CheckIn = require('../models/CheckIn');
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

router.get('/my-clubs', auth, async (req, res) => {
  try {
    const clubs = await Club.find({ 'members.user': req.userId })
      .populate('president', 'nickname avatar')
      .sort({ createdAt: -1 });
    return success(res, { clubs, total: clubs.length });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/my-activities', auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.userId })
      .populate({
        path: 'activity',
        populate: { path: 'club', select: 'name logo' }
      })
      .sort({ createdAt: -1 });

    const myCheckins = await CheckIn.find({ user: req.userId }).select('activity');
    const checkedActivityIds = myCheckins.map(function(c) { return c.activity.toString(); });

    const activities = registrations
      .filter(function(r) { return r.activity; })
      .map(function(r) {
        return {
          _id: r.activity._id,
          title: r.activity.title,
          description: r.activity.description,
          location: r.activity.location,
          startTime: r.activity.startTime,
          endTime: r.activity.endTime,
          status: r.activity.status,
          club: r.activity.club,
          maxParticipants: r.activity.maxParticipants,
          currentParticipants: r.activity.currentParticipants,
          regStatus: r.status,
          regId: r._id,
          checkedIn: checkedActivityIds.indexOf(r.activity._id.toString()) >= 0
        };
      });

    activities.sort(function(a, b) {
      if (a.checkedIn === b.checkedIn) return 0;
      return a.checkedIn ? 1 : -1;
    });

    return success(res, { activities, total: activities.length });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/my-registrations', auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.userId })
      .populate({
        path: 'activity',
        select: 'title startTime endTime location status club',
        populate: { path: 'club', select: 'name' }
      })
      .sort({ createdAt: -1 });
    return success(res, { registrations, total: registrations.length });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/my-checkins', auth, async (req, res) => {
  try {
    const checkins = await CheckIn.find({ user: req.userId })
      .populate({
        path: 'activity',
        select: 'title startTime endTime location status club',
        populate: { path: 'club', select: 'name' }
      })
      .sort({ checkInTime: -1 });
    return success(res, { checkins, total: checkins.length });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
