const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  remark: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

registrationSchema.index({ user: 1, activity: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
