const Notification = require('../models/Notification');

async function createNotification(userId, type, title, content, relatedId) {
  try {
    await Notification.create({
      user: userId,
      type: type,
      title: title,
      content: content || '',
      relatedId: relatedId || ''
    });
  } catch (err) {
    console.error('创建通知失败:', err.message);
  }
}

module.exports = { createNotification };
