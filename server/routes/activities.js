const express = require('express');
const { body, validationResult } = require('express-validator');
const Activity = require('../models/Activity');
const Club = require('../models/Club');
const Registration = require('../models/Registration');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, club, keyword } = req.query;
    const query = {};

    if (status) query.status = status;
    if (club) query.club = club;
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    const activities = await Activity.find(query)
      .populate('club', 'name logo')
      .populate('organizer', 'nickname avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Activity.countDocuments(query);

    return success(res, { activities, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('club', 'name logo description')
      .populate('organizer', 'nickname avatar');

    if (!activity) return error(res, '活动不存在', 404);

    const registrations = await Registration.find({ activity: req.params.id })
      .populate('user', 'nickname avatar');

    return success(res, { activity, registrations });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('活动标题不能为空'),
  body('club').notEmpty().withMessage('所属社团不能为空'),
  body('startTime').notEmpty().withMessage('开始时间不能为空'),
  body('endTime').notEmpty().withMessage('结束时间不能为空'),
  body('location').trim().notEmpty().withMessage('活动地点不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array()[0].msg);
    }

    const club = await Club.findById(req.body.club);
    if (!club) return error(res, '社团不存在', 404);

    const isMember = club.members.some(
      m => m.user.toString() === req.userId.toString() &&
        ['president', 'vice_president'].includes(m.role)
    );
    if (!isMember && req.user.role !== 'admin') {
      return error(res, '只有社团管理层可以发布活动', 403);
    }

    const activity = await Activity.create({
      ...req.body,
      organizer: req.userId,
      status: req.body.status || 'published'
    });

    return success(res, { activity }, '活动创建成功', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return error(res, '活动不存在', 404);

    if (activity.organizer.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return error(res, '无权修改该活动', 403);
    }

    const updated = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('club', 'name logo')
      .populate('organizer', 'nickname avatar');

    return success(res, { activity: updated }, '活动更新成功');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return error(res, '活动不存在', 404);

    if (activity.organizer.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return error(res, '无权删除该活动', 403);
    }

    await Activity.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ activity: req.params.id });

    return success(res, null, '活动已删除');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/:id/register', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return error(res, '活动不存在', 404);

    if (!['published', 'registration'].includes(activity.status)) {
      return error(res, '当前活动不在报名阶段');
    }

    if (activity.maxParticipants > 0 && activity.currentParticipants >= activity.maxParticipants) {
      return error(res, '报名人数已满');
    }

    const existing = await Registration.findOne({ user: req.userId, activity: req.params.id });
    if (existing) return error(res, '您已报名该活动');

    const registration = await Registration.create({
      user: req.userId,
      activity: req.params.id,
      status: activity.needApproval ? 'pending' : 'approved',
      remark: req.body.remark || ''
    });

    if (!activity.needApproval) {
      activity.currentParticipants += 1;
      await activity.save();
      await createNotification(req.userId, 'registration_approved', '报名成功', '你已成功报名活动「' + activity.title + '」，记得准时参加！', activity._id.toString());
    }

    return success(res, { registration }, activity.needApproval ? '报名申请已提交，等待审核' : '报名成功', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.put('/:activityId/registrations/:regId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return error(res, '无效的审核状态');
    }

    const activity = await Activity.findById(req.params.activityId);
    if (!activity) return error(res, '活动不存在', 404);

    if (activity.organizer.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return error(res, '无权审核报名', 403);
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.regId,
      { status },
      { new: true }
    ).populate('user', 'nickname avatar');

    if (status === 'approved') {
      activity.currentParticipants += 1;
      await activity.save();
      await createNotification(registration.user._id || registration.user, 'registration_approved', '报名已通过', '你报名的活动「' + activity.title + '」已通过审核，记得准时参加！', activity._id.toString());
    } else {
      await createNotification(registration.user._id || registration.user, 'registration_rejected', '报名未通过', '你报名的活动「' + activity.title + '」未通过审核。', activity._id.toString());
    }

    return success(res, { registration }, '审核完成');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post('/:id/checkin-code', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return error(res, '活动不存在', 404);

    if (activity.organizer.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return error(res, '无权操作', 403);
    }

    activity.checkinCode = generateCode();
    activity.checkinCodeEnabled = true;
    await activity.save();

    return success(res, { checkinCode: activity.checkinCode }, '签到码已生成');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/:id/checkin-code/stop', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return error(res, '活动不存在', 404);

    if (activity.organizer.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return error(res, '无权操作', 403);
    }

    activity.status = 'ended';
    activity.checkinCode = '';
    await activity.save();

    return success(res, null, '签到已结束，活动已标记为已结束');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
