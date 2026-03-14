require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
const Activity = require('./models/Activity');
const Registration = require('./models/Registration');
const CheckIn = require('./models/CheckIn');
const Feedback = require('./models/Feedback');
const Notification = require('./models/Notification');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 已连接，开始初始化数据...\n');

    await User.deleteMany({});
    await Club.deleteMany({});
    await Activity.deleteMany({});
    await Registration.deleteMany({});
    await CheckIn.deleteMany({});
    await Feedback.deleteMany({});
    await Notification.deleteMany({});

    // ==================== 用户 ====================
    const admin = await User.create({
      username: 'admin', password: '123456', nickname: '系统管理员',
      role: 'admin', studentId: 'ADMIN001', phone: '13800000000'
    });

    const zhangsan = await User.create({
      username: 'zhangsan', password: '123456', nickname: '张三',
      role: 'club_admin', studentId: '2021001', phone: '13800000001'
    });

    const lisi = await User.create({
      username: 'lisi', password: '123456', nickname: '李四',
      role: 'club_admin', studentId: '2021002', phone: '13800000002'
    });

    const wangwu = await User.create({
      username: 'wangwu', password: '123456', nickname: '王五',
      role: 'club_admin', studentId: '2021003', phone: '13800000003'
    });

    const zhaoliu = await User.create({
      username: 'zhaoliu', password: '123456', nickname: '赵六',
      role: 'student', studentId: '2022001', phone: '13800000004'
    });

    const sunqi = await User.create({
      username: 'sunqi', password: '123456', nickname: '孙七',
      role: 'student', studentId: '2022002', phone: '13800000005'
    });

    const zhouba = await User.create({
      username: 'zhouba', password: '123456', nickname: '周八',
      role: 'student', studentId: '2023001', phone: '13800000006'
    });

    console.log('✅ 用户创建完成（7人）');

    // ==================== 社团（active） ====================
    const club1 = await Club.create({
      name: '计算机协会',
      description: '致力于推广计算机科学知识，组织编程竞赛、技术讲座和项目实践活动。拥有多年竞赛获奖历史。',
      category: '学术科技',
      foundedAt: new Date('2020-09-01'),
      president: zhangsan._id,
      members: [
        { user: zhangsan._id, role: 'president' },
        { user: lisi._id, role: 'vice_president' },
        { user: zhaoliu._id, role: 'member' },
        { user: sunqi._id, role: 'member' }
      ],
      memberCount: 4,
      status: 'active',
      announcement: '本周六下午有编程竞赛，欢迎参加！报名截止周五。',
      tags: ['编程', '算法', '技术', 'ACM']
    });

    const club2 = await Club.create({
      name: '摄影社',
      description: '记录校园美好瞬间，定期举办摄影展和外拍活动。欢迎零基础同学加入！',
      category: '文化艺术',
      foundedAt: new Date('2019-03-15'),
      president: lisi._id,
      members: [
        { user: lisi._id, role: 'president' },
        { user: wangwu._id, role: 'vice_president' },
        { user: zhouba._id, role: 'member' }
      ],
      memberCount: 3,
      status: 'active',
      announcement: '下周外拍活动报名中，地点：白云山',
      tags: ['摄影', '艺术', '创意', '风光']
    });

    const club3 = await Club.create({
      name: '篮球俱乐部',
      description: '热爱篮球的同学聚集地，每周训练两次，定期组织校内外比赛。',
      category: '体育运动',
      foundedAt: new Date('2018-09-01'),
      president: wangwu._id,
      members: [
        { user: wangwu._id, role: 'president' },
        { user: zhangsan._id, role: 'member' },
        { user: zhaoliu._id, role: 'member' },
        { user: sunqi._id, role: 'member' },
        { user: zhouba._id, role: 'member' }
      ],
      memberCount: 5,
      status: 'active',
      tags: ['篮球', '运动', '比赛', '健身']
    });

    const club4 = await Club.create({
      name: '志愿者协会',
      description: '组织各类志愿服务活动，服务社区，传递温暖。',
      category: '志愿公益',
      foundedAt: new Date('2021-03-05'),
      president: zhaoliu._id,
      members: [
        { user: zhaoliu._id, role: 'president' },
        { user: sunqi._id, role: 'member' },
        { user: zhouba._id, role: 'member' }
      ],
      memberCount: 3,
      status: 'active',
      tags: ['志愿', '公益', '社区服务']
    });

    // 待审核社团
    const club5 = await Club.create({
      name: '电竞社',
      description: '校园电竞爱好者聚集地，组织各类电竞赛事。',
      category: '其他',
      foundedAt: new Date(),
      president: sunqi._id,
      members: [{ user: sunqi._id, role: 'president' }],
      memberCount: 1,
      status: 'pending',
      tags: ['电竞', '游戏']
    });

    // 被拒绝的社团
    const club6 = await Club.create({
      name: '美食研究会',
      description: '探索校园周边美食',
      category: '其他',
      foundedAt: new Date(),
      president: zhouba._id,
      members: [{ user: zhouba._id, role: 'president' }],
      memberCount: 1,
      status: 'inactive',
      rejectReason: '社团定位与已有社团重叠，建议与生活服务部合并。',
      tags: ['美食']
    });

    console.log('✅ 社团创建完成（6个：4个活跃 + 1个待审核 + 1个被拒绝）');

    // ==================== 活动 ====================
    const now = new Date();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    // 活动1：报名中，不需审核，下周
    const act1 = await Activity.create({
      title: '2025年春季编程马拉松',
      description: '48小时编程马拉松，组队完成一个完整项目。奖品丰厚，欢迎所有年级同学参加！提供免费餐饮和休息区。',
      club: club1._id, organizer: zhangsan._id,
      startTime: new Date(now.getTime() + 7 * day),
      endTime: new Date(now.getTime() + 9 * day),
      location: '信息楼A301',
      maxParticipants: 50, currentParticipants: 3,
      status: 'published', needApproval: false,
      tags: ['编程', '比赛', '团队', '黑客松']
    });

    // 活动2：报名中，需审核，下月
    const act2 = await Activity.create({
      title: '校园风光摄影大赛',
      description: '用镜头记录最美校园，优秀作品将在校园画廊展出。设一二三等奖，获奖者颁发证书。',
      club: club2._id, organizer: lisi._id,
      startTime: new Date(now.getTime() + 30 * day),
      endTime: new Date(now.getTime() + 44 * day),
      location: '图书馆一楼展厅',
      maxParticipants: 100, currentParticipants: 1,
      status: 'published', needApproval: true,
      tags: ['摄影', '比赛', '展览', '校园']
    });

    // 活动3：报名中，不需审核，3天后
    const act3 = await Activity.create({
      title: '新生篮球友谊赛',
      description: '欢迎新同学加入篮球大家庭！轻松愉快的友谊赛，不论水平高低都可参加。现场提供饮用水。',
      club: club3._id, organizer: wangwu._id,
      startTime: new Date(now.getTime() + 3 * day),
      endTime: new Date(now.getTime() + 3 * day + 3 * hour),
      location: '体育馆篮球场',
      maxParticipants: 30, currentParticipants: 2,
      status: 'published', needApproval: false,
      tags: ['篮球', '友谊赛', '新生']
    });

    // 活动4：进行中（签到码已开启）
    const act4 = await Activity.create({
      title: 'Python入门工作坊',
      description: '零基础Python编程入门，手把手教学，带电脑即可参加。',
      club: club1._id, organizer: zhangsan._id,
      startTime: new Date(now.getTime() - 1 * hour),
      endTime: new Date(now.getTime() + 2 * hour),
      location: '信息楼B201',
      maxParticipants: 30, currentParticipants: 4,
      status: 'ongoing', needApproval: false,
      checkinCode: '888666', checkinCodeEnabled: true,
      tags: ['Python', '编程', '入门']
    });

    // 活动5：已结束（有签到和评价数据）
    const act5 = await Activity.create({
      title: '秋季摄影外拍活动',
      description: '社团组织的白云山外拍活动，感受秋天的美好。',
      club: club2._id, organizer: lisi._id,
      startTime: new Date(now.getTime() - 7 * day),
      endTime: new Date(now.getTime() - 7 * day + 8 * hour),
      location: '白云山风景区',
      maxParticipants: 20, currentParticipants: 3,
      status: 'ended', needApproval: false,
      tags: ['摄影', '外拍', '秋游']
    });

    // 活动6：已取消
    const act6 = await Activity.create({
      title: '（已取消）羽毛球联谊赛',
      description: '因场地维修，本次活动取消。',
      club: club3._id, organizer: wangwu._id,
      startTime: new Date(now.getTime() + 5 * day),
      endTime: new Date(now.getTime() + 5 * day + 3 * hour),
      location: '体育馆羽毛球场',
      maxParticipants: 16, currentParticipants: 0,
      status: 'cancelled', needApproval: false,
      tags: ['羽毛球']
    });

    // 活动7：志愿服务，名额已满
    const act7 = await Activity.create({
      title: '社区敬老院志愿服务',
      description: '前往阳光敬老院，陪伴老人聊天、整理环境。请穿运动鞋。',
      club: club4._id, organizer: zhaoliu._id,
      startTime: new Date(now.getTime() + 2 * day),
      endTime: new Date(now.getTime() + 2 * day + 4 * hour),
      location: '阳光敬老院（学校东门集合）',
      maxParticipants: 3, currentParticipants: 3,
      status: 'published', needApproval: false,
      tags: ['志愿', '敬老院', '公益']
    });

    console.log('✅ 活动创建完成（7个：3个报名中 + 1个进行中 + 1个已结束 + 1个已取消 + 1个已满）');

    // ==================== 报名 ====================
    // 活动1（编程马拉松）：3人已报名
    await Registration.create({ user: zhaoliu._id, activity: act1._id, status: 'approved' });
    await Registration.create({ user: sunqi._id, activity: act1._id, status: 'approved' });
    await Registration.create({ user: zhouba._id, activity: act1._id, status: 'approved' });

    // 活动2（摄影大赛，需审核）：1人通过，1人待审核，1人被拒
    await Registration.create({ user: zhaoliu._id, activity: act2._id, status: 'approved' });
    await Registration.create({ user: sunqi._id, activity: act2._id, status: 'pending' });
    await Registration.create({ user: zhouba._id, activity: act2._id, status: 'rejected', remark: '非摄影社成员' });

    // 活动3（篮球赛）：2人报名
    await Registration.create({ user: zhaoliu._id, activity: act3._id, status: 'approved' });
    await Registration.create({ user: zhouba._id, activity: act3._id, status: 'approved' });

    // 活动4（Python工作坊，进行中）：4人报名+签到
    await Registration.create({ user: zhaoliu._id, activity: act4._id, status: 'approved' });
    await Registration.create({ user: sunqi._id, activity: act4._id, status: 'approved' });
    await Registration.create({ user: zhouba._id, activity: act4._id, status: 'approved' });
    await Registration.create({ user: lisi._id, activity: act4._id, status: 'approved' });

    // 活动5（已结束摄影外拍）：3人报名
    await Registration.create({ user: wangwu._id, activity: act5._id, status: 'approved' });
    await Registration.create({ user: zhaoliu._id, activity: act5._id, status: 'approved' });
    await Registration.create({ user: zhouba._id, activity: act5._id, status: 'approved' });

    // 活动7（志愿服务，已满）
    await Registration.create({ user: sunqi._id, activity: act7._id, status: 'approved' });
    await Registration.create({ user: zhouba._id, activity: act7._id, status: 'approved' });
    await Registration.create({ user: lisi._id, activity: act7._id, status: 'approved' });

    console.log('✅ 报名记录创建完成（18条：含通过/待审核/拒绝）');

    // ==================== 签到 ====================
    // 活动4（进行中）：2人已签到，2人未签到
    await CheckIn.create({ user: zhaoliu._id, activity: act4._id, checkInTime: new Date(), location: { latitude: 23.13, longitude: 113.26 } });
    await CheckIn.create({ user: sunqi._id, activity: act4._id, checkInTime: new Date(), location: { latitude: 23.13, longitude: 113.26 } });

    // 活动5（已结束）：3人全部签到
    await CheckIn.create({ user: wangwu._id, activity: act5._id, checkInTime: new Date(now.getTime() - 7 * day + 1 * hour) });
    await CheckIn.create({ user: zhaoliu._id, activity: act5._id, checkInTime: new Date(now.getTime() - 7 * day + 1.5 * hour) });
    await CheckIn.create({ user: zhouba._id, activity: act5._id, checkInTime: new Date(now.getTime() - 7 * day + 2 * hour) });

    console.log('✅ 签到记录创建完成（5条）');

    // ==================== 评价 ====================
    // 活动5（已结束）：3人评价
    await Feedback.create({ user: wangwu._id, activity: act5._id, rating: 5, comment: '非常棒的外拍活动！风景很美，大家拍的照片都很好看。' });
    await Feedback.create({ user: zhaoliu._id, activity: act5._id, rating: 4, comment: '组织很好，就是时间有点赶，下次可以多留些时间。' });
    await Feedback.create({ user: zhouba._id, activity: act5._id, rating: 5, comment: '第一次参加外拍，学到了很多摄影技巧！' });

    console.log('✅ 评价记录创建完成（3条，平均分4.7）');

    // ==================== 通知 ====================
    // 模拟一些历史通知
    await Notification.create({
      user: sunqi._id, type: 'club_pending', title: '社团申请已提交',
      content: '你申请创建的社团「电竞社」已提交审核，请等待管理员处理。',
      relatedId: club5._id.toString(), read: true
    });
    await Notification.create({
      user: admin._id, type: 'club_pending', title: '新社团待审核',
      content: '孙七 申请创建社团「电竞社」，请前往审核。',
      relatedId: club5._id.toString(), read: false
    });
    await Notification.create({
      user: zhouba._id, type: 'club_rejected', title: '社团审核未通过',
      content: '你申请创建的社团「美食研究会」未通过审核。原因：社团定位与已有社团重叠，建议与生活服务部合并。',
      relatedId: club6._id.toString(), read: false
    });
    await Notification.create({
      user: zhangsan._id, type: 'member_joined', title: '新成员加入',
      content: '赵六 加入了社团「计算机协会」',
      relatedId: club1._id.toString(), read: true
    });
    await Notification.create({
      user: zhangsan._id, type: 'member_joined', title: '新成员加入',
      content: '孙七 加入了社团「计算机协会」',
      relatedId: club1._id.toString(), read: true
    });
    await Notification.create({
      user: zhaoliu._id, type: 'registration_approved', title: '报名成功',
      content: '你已成功报名活动「2025年春季编程马拉松」，记得准时参加！',
      relatedId: act1._id.toString(), read: true
    });
    await Notification.create({
      user: sunqi._id, type: 'registration_pending', title: '报名待审核',
      content: '你报名的活动「校园风光摄影大赛」正在等待组织者审核。',
      relatedId: act2._id.toString(), read: false
    });
    await Notification.create({
      user: lisi._id, type: 'registration_pending', title: '新报名待审核',
      content: '孙七 报名了活动「校园风光摄影大赛」，请前往审核。',
      relatedId: act2._id.toString(), read: false
    });

    console.log('✅ 通知记录创建完成（8条：含已读/未读）');

    // ==================== 汇总 ====================
    console.log('\n====================================');
    console.log('  种子数据初始化完成！');
    console.log('====================================');
    console.log('\n测试账号:');
    console.log('┌──────────┬──────────┬────────┬─────────────────────────────────┐');
    console.log('│ 角色     │ 用户名    │ 密码   │ 说明                            │');
    console.log('├──────────┼──────────┼────────┼─────────────────────────────────┤');
    console.log('│ 管理员   │ admin    │ 123456 │ 有1个待审核社团需要处理           │');
    console.log('│ 社团管理 │ zhangsan │ 123456 │ 计算机协会社长                    │');
    console.log('│ 社团管理 │ lisi     │ 123456 │ 摄影社社长，有待审核报名           │');
    console.log('│ 社团管理 │ wangwu   │ 123456 │ 篮球俱乐部社长                   │');
    console.log('│ 学生     │ zhaoliu  │ 123456 │ 已报名多个活动，志愿者协会社长     │');
    console.log('│ 学生     │ sunqi    │ 123456 │ 有待审核报名+待审核社团申请        │');
    console.log('│ 学生     │ zhouba   │ 123456 │ 有被拒社团，可体验重新申请/撤回    │');
    console.log('└──────────┴──────────┴────────┴─────────────────────────────────┘');
    console.log('\n数据概览:');
    console.log('  用户: 7人（1管理员 + 3社团管理员 + 3学生）');
    console.log('  社团: 6个（4活跃 + 1待审核 + 1被拒绝）');
    console.log('  活动: 7个（3报名中 + 1进行中 + 1已结束 + 1已取消 + 1已满）');
    console.log('  报名: 18条（含通过/待审核/拒绝）');
    console.log('  签到: 5条（进行中活动2条 + 已结束活动3条）');
    console.log('  评价: 3条（已结束活动，平均4.7分）');
    console.log('  通知: 8条（含已读/未读）');
    console.log('\n特殊场景:');
    console.log('  - admin 登录可看到1个待审核社团 + 消息中心有未读');
    console.log('  - lisi 登录可看到1个待审核报名需处理');
    console.log('  - sunqi 登录可看到待审核社团申请 + 待审核报名');
    console.log('  - zhouba 登录可看到被拒社团 → 可查看原因/重新申请/撤回');
    console.log('  - 活动4（Python工作坊）签到码已开启: 888666');
    console.log('  - 活动7（志愿服务）名额已满');

    await mongoose.disconnect();
  } catch (err) {
    console.error('种子数据初始化失败:', err);
    process.exit(1);
  }
};

seedData();
