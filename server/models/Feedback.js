const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  rating: {
    type: Number,
    required: [true, '评分不能为空'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

feedbackSchema.index({ user: 1, activity: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
