const express = require('express');
const CheckIn = require('../models/CheckIn');
const Activity = require('../models/Activity');
const Registration = require('../models/Registration');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/:activityId', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.activityId);
    if (!activity) return error(res, '活动不存在', 404);

    if (!['ongoing', 'published', 'registration'].includes(activity.status)) {
      return error(res, '当前活动不在签到阶段');
    }

    const registration = await Registration.findOne({
      user: req.userId,
      activity: req.params.activityId,
      status: 'approved'
    });
    if (!registration) {
      return error(res, '您未报名该活动或报名未通过');
    }

    const existing = await CheckIn.findOne({ user: req.userId, activity: req.params.activityId });
    if (existing) return error(res, '您已签到');

    const checkIn = await CheckIn.create({
      user: req.userId,
      activity: req.params.activityId,
      location: req.body.location || {}
    });

    return success(res, { checkIn }, '签到成功', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/:activityId', async (req, res) => {
  try {
    const checkIns = await CheckIn.find({ activity: req.params.activityId })
      .populate('user', 'nickname avatar studentId')
      .sort({ checkInTime: -1 });

    return success(res, { checkIns, total: checkIns.length });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/:activityId/status', auth, async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({
      user: req.userId,
      activity: req.params.activityId
    });

    return success(res, { checkedIn: !!checkIn, checkIn });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
