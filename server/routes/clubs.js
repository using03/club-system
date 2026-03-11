const express = require('express');
const { body, validationResult } = require('express-validator');
const Club = require('../models/Club');
const Activity = require('../models/Activity');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, keyword } = req.query;
    const query = { status: 'active' };

    if (category) query.category = category;
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    const clubs = await Club.find(query)
      .populate('president', 'nickname avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Club.countDocuments(query);

    return success(res, { clubs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('president', 'nickname avatar')
      .populate('members.user', 'nickname avatar studentId');

    if (!club) return error(res, '社团不存在', 404);
    return success(res, { club });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('社团名称不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array()[0].msg);
    }

    const { name, description, category, logo, foundedAt, tags } = req.body;

    const existing = await Club.findOne({ name });
    if (existing) return error(res, '社团名称已存在');

    const club = await Club.create({
      name,
      description: description || '',
      category: category || '其他',
      logo: logo || '',
      foundedAt: foundedAt || Date.now(),
      tags: tags || [],
      president: req.userId,
      members: [{ user: req.userId, role: 'president' }],
      memberCount: 1
    });

    req.user.role = 'club_admin';
    await req.user.save();

    return success(res, { club }, '社团创建成功', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return error(res, '社团不存在', 404);

    if (club.president.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return error(res, '无权修改该社团', 403);
    }

    const { name, description, category, logo, announcement, tags, status } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (logo !== undefined) updates.logo = logo;
    if (announcement !== undefined) updates.announcement = announcement;
    if (tags !== undefined) updates.tags = tags;
    if (status !== undefined) updates.status = status;

    const updated = await Club.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('president', 'nickname avatar');

    return success(res, { club: updated }, '更新成功');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/:id/activities', async (req, res) => {
  try {
    var activities = await Activity.find({ club: req.params.id })
      .populate('organizer', 'nickname avatar')
      .sort({ startTime: -1 });
    return success(res, { activities: activities, total: activities.length });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
