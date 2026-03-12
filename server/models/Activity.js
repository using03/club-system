const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '活动标题不能为空'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: [true, '开始时间不能为空']
  },
  endTime: {
    type: Date,
    required: [true, '结束时间不能为空']
  },
  location: {
    type: String,
    required: [true, '活动地点不能为空']
  },
  maxParticipants: {
    type: Number,
    default: 0
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  images: [{
    type: String
  }],
  coverImage: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'registration', 'ongoing', 'ended', 'cancelled'],
    default: 'draft'
  },
  needApproval: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  checkinCode: {
    type: String,
    default: ''
  },
  checkinCodeEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);
