const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
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
  checkInTime: {
    type: Date,
    default: Date.now
  },
  location: {
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

checkInSchema.index({ user: 1, activity: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);
