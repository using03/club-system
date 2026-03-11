const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Activity = require('../models/Activity');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/:activityId', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array()[0].msg);
    }

    const activity = await Activity.findById(req.params.activityId);
    if (!activity) return error(res, '活动不存在', 404);

    const existing = await Feedback.findOne({ user: req.userId, activity: req.params.activityId });
    if (existing) return error(res, '您已评价该活动');

    const feedback = await Feedback.create({
      user: req.userId,
      activity: req.params.activityId,
      rating: req.body.rating,
      comment: req.body.comment || ''
    });

    return success(res, { feedback }, '评价成功', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/:activityId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const feedbacks = await Feedback.find({ activity: req.params.activityId })
      .populate('user', 'nickname avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Feedback.countDocuments({ activity: req.params.activityId });

    const avgResult = await Feedback.aggregate([
      { $match: { activity: require('mongoose').Types.ObjectId.createFromHexString(req.params.activityId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = avgResult.length > 0 ? Math.round(avgResult[0].avgRating * 10) / 10 : 0;

    return success(res, { feedbacks, total, avgRating });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
