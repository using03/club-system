const express = require('express');
const { body, validationResult } = require('express-validator');
const Club = require('../models/Club');
const Activity = require('../models/Activity');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

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

router.get('/admin/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return error(res, '需要管理员权限', 403);
    }
    var clubs = await Club.find({ status: 'pending' })
      .populate('president', 'nickname avatar studentId')
      .sort({ createdAt: -1 });
    return success(res, { clubs: clubs, total: clubs.length });
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
      foundedAt: Date.now(),
      tags: tags || [],
      president: req.userId,
      members: [{ user: req.userId, role: 'president' }],
      memberCount: 1,
      status: 'pending'
    });

    var User = require('../models/User');
    var admins = await User.find({ role: 'admin' }).select('_id');
    for (var i = 0; i < admins.length; i++) {
      await createNotification(admins[i]._id, 'club_pending', '新社团待审核', req.user.nickname + ' 申请创建社团「' + name + '」，请前往审核。', club._id.toString());
    }

    return success(res, { club }, '社团创建申请已提交，等待管理员审核', 201);
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
    if (req.body.rejectReason !== undefined) updates.rejectReason = req.body.rejectReason;

    var oldStatus = club.status;
    const updated = await Club.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('president', 'nickname avatar');

    if (oldStatus === 'inactive' && updates.status === 'pending') {
      var User = require('../models/User');
      var admins = await User.find({ role: 'admin' }).select('_id');
      for (var i = 0; i < admins.length; i++) {
        await createNotification(admins[i]._id, 'club_pending', '社团重新提交审核', '社团「' + updated.name + '」修改后重新提交了审核申请。', updated._id.toString());
      }
    }

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

router.put('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return error(res, '需要管理员权限', 403);
    }
    var club = await Club.findById(req.params.id);
    if (!club) return error(res, '社团不存在', 404);

    club.status = 'active';
    await club.save();

    var president = await require('../models/User').findById(club.president);
    if (president && president.role === 'student') {
      president.role = 'club_admin';
      await president.save();
    }

    await createNotification(club.president, 'club_approved', '社团审核通过', '你申请创建的社团「' + club.name + '」已通过审核，现在可以开始运营了！', club._id.toString());

    return success(res, { club: club }, '社团审核通过');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.put('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return error(res, '需要管理员权限', 403);
    }
    var reason = (req.body.reason || '').trim();
    if (!reason) {
      return error(res, '请填写拒绝原因');
    }
    var club = await Club.findById(req.params.id);
    if (!club) return error(res, '社团不存在', 404);

    club.status = 'inactive';
    club.rejectReason = reason;
    await club.save();

    await createNotification(club.president, 'club_rejected', '社团审核未通过', '你申请创建的社团「' + club.name + '」未通过审核。原因：' + reason, club._id.toString());

    return success(res, null, '社团已拒绝');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.delete('/:id/withdraw', auth, async (req, res) => {
  try {
    var club = await Club.findById(req.params.id);
    if (!club) return error(res, '社团不存在', 404);

    if (club.president.toString() !== req.userId.toString()) {
      return error(res, '只有申请人可以取消申请', 403);
    }
    if (club.status === 'active') {
      return error(res, '已通过审核的社团不能取消申请', 400);
    }

    var clubName = club.name;
    await Club.findByIdAndDelete(req.params.id);
    await Activity.deleteMany({ club: req.params.id });

    var User = require('../models/User');
    var admins = await User.find({ role: 'admin' }).select('_id');
    for (var i = 0; i < admins.length; i++) {
      await createNotification(admins[i]._id, 'club_withdrawn', '社团申请已撤回', req.user.nickname + ' 撤回了社团「' + clubName + '」的创建申请。', '');
    }

    return success(res, null, '申请已撤回');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
