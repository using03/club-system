const express = require('express');
const Notification = require('../models/Notification');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 20;

    var notifications = await Notification.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    var total = await Notification.countDocuments({ user: req.userId });
    var unread = await Notification.countDocuments({ user: req.userId, read: false });

    return success(res, { notifications: notifications, total: total, unread: unread });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    var count = await Notification.countDocuments({ user: req.userId, read: false });
    return success(res, { count: count });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { read: true }
    );
    return success(res, null, '已读');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.userId, read: false },
      { read: true }
    );
    return success(res, null, '全部已读');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
