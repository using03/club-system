require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
const Activity = require('./models/Activity');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 已连接，开始初始化数据...');

    await User.deleteMany({});
    await Club.deleteMany({});
    await Activity.deleteMany({});

    const admin = await User.create({
      username: 'admin',
      password: '123456',
      nickname: '系统管理员',
      role: 'admin',
      studentId: 'ADMIN001'
    });

    const user1 = await User.create({
      username: 'zhangsan',
      password: '123456',
      nickname: '张三',
      role: 'club_admin',
      studentId: '2021001',
      phone: '13800000001'
    });

    const user2 = await User.create({
      username: 'lisi',
      password: '123456',
      nickname: '李四',
      role: 'student',
      studentId: '2021002',
      phone: '13800000002'
    });

    const user3 = await User.create({
      username: 'wangwu',
      password: '123456',
      nickname: '王五',
      role: 'student',
      studentId: '2021003',
      phone: '13800000003'
    });

    const club1 = await Club.create({
      name: '计算机协会',
      description: '致力于推广计算机科学知识，组织编程竞赛、技术讲座和项目实践活动。',
      category: '学术科技',
      foundedAt: new Date('2020-09-01'),
      president: user1._id,
      members: [
        { user: user1._id, role: 'president' },
        { user: user2._id, role: 'member' }
      ],
      memberCount: 2,
      announcement: '本周六下午有编程竞赛，欢迎参加！',
      tags: ['编程', '算法', '技术']
    });

    const club2 = await Club.create({
      name: '摄影社',
      description: '记录校园美好瞬间，定期举办摄影展和外拍活动。',
      category: '文化艺术',
      foundedAt: new Date('2019-03-15'),
      president: user2._id,
      members: [
        { user: user2._id, role: 'president' },
        { user: user3._id, role: 'member' }
      ],
      memberCount: 2,
      tags: ['摄影', '艺术', '创意']
    });

    const club3 = await Club.create({
      name: '篮球俱乐部',
      description: '热爱篮球的同学聚集地，定期训练和比赛。',
      category: '体育运动',
      foundedAt: new Date('2018-09-01'),
      president: user3._id,
      members: [
        { user: user3._id, role: 'president' },
        { user: user1._id, role: 'member' }
      ],
      memberCount: 2,
      tags: ['篮球', '运动', '比赛']
    });

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await Activity.create({
      title: '2025年春季编程马拉松',
      description: '48小时编程马拉松，组队完成一个完整项目。奖品丰厚，欢迎所有年级同学参加！',
      club: club1._id,
      organizer: user1._id,
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 48 * 60 * 60 * 1000),
      location: '信息楼A301',
      maxParticipants: 50,
      currentParticipants: 0,
      status: 'published',
      needApproval: false,
      tags: ['编程', '比赛', '团队']
    });

    await Activity.create({
      title: '校园风光摄影大赛',
      description: '用镜头记录最美校园，优秀作品将在校园画廊展出。',
      club: club2._id,
      organizer: user2._id,
      startTime: nextMonth,
      endTime: new Date(nextMonth.getTime() + 14 * 24 * 60 * 60 * 1000),
      location: '图书馆一楼展厅',
      maxParticipants: 100,
      currentParticipants: 0,
      status: 'published',
      needApproval: true,
      tags: ['摄影', '比赛', '展览']
    });

    await Activity.create({
      title: '新生篮球友谊赛',
      description: '欢迎新同学加入篮球大家庭！轻松愉快的友谊赛，不论水平高低都可参加。',
      club: club3._id,
      organizer: user3._id,
      startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: '体育馆篮球场',
      maxParticipants: 30,
      currentParticipants: 0,
      status: 'published',
      needApproval: false,
      tags: ['篮球', '友谊赛', '新生']
    });

    console.log('种子数据初始化完成！');
    console.log('测试账号:');
    console.log('  管理员: admin / 123456');
    console.log('  社团管理员: zhangsan / 123456');
    console.log('  普通学生: lisi / 123456, wangwu / 123456');

    await mongoose.disconnect();
  } catch (err) {
    console.error('种子数据初始化失败:', err);
    process.exit(1);
  }
};

seedData();
