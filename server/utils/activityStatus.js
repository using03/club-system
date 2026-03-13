const Activity = require('../models/Activity');

async function autoUpdateActivityStatus(activityId) {
  try {
    var activity = activityId;
    if (typeof activityId === 'string') {
      activity = await Activity.findById(activityId);
    }
    if (!activity) return null;

    var now = new Date();
    var changed = false;

    if (activity.status === 'cancelled' || activity.status === 'draft') {
      return activity;
    }

    if ((activity.status === 'published' || activity.status === 'registration') && activity.startTime && now >= activity.startTime) {
      if (activity.endTime && now >= activity.endTime) {
        activity.status = 'ended';
      } else {
        activity.status = 'ongoing';
      }
      changed = true;
    }

    if (activity.status === 'ongoing' && activity.endTime && now >= activity.endTime) {
      activity.status = 'ended';
      changed = true;
    }

    if (changed) {
      await activity.save();
    }

    return activity;
  } catch (err) {
    console.error('自动更新活动状态失败:', err.message);
    return null;
  }
}

async function autoUpdateAllActivities() {
  try {
    var now = new Date();

    await Activity.updateMany(
      { status: { $in: ['published', 'registration'] }, startTime: { $lte: now }, endTime: { $gt: now } },
      { $set: { status: 'ongoing' } }
    );

    await Activity.updateMany(
      { status: { $in: ['published', 'registration', 'ongoing'] }, endTime: { $lte: now } },
      { $set: { status: 'ended' } }
    );
  } catch (err) {
    console.error('批量更新活动状态失败:', err.message);
  }
}

module.exports = { autoUpdateActivityStatus, autoUpdateAllActivities };
