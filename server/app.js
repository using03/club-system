require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const memberRoutes = require('./routes/members');
const activityRoutes = require('./routes/activities');
const checkinRoutes = require('./routes/checkin');
const feedbackRoutes = require('./routes/feedback');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: '服务运行正常', data: { timestamp: new Date().toISOString() } });
});

app.use((req, res) => {
  res.status(404).json({ code: -1, message: '接口不存在', data: null });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ code: -1, message: '服务器内部错误', data: null });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器已启动: http://localhost:${PORT}`);
    console.log(`API 文档: http://localhost:${PORT}/api/health`);
  });
});

module.exports = app;
