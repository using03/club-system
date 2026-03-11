const http = require('http');

const BASE = 'http://127.0.0.1:3000';
const results = [];
let passed = 0, failed = 0;
const tokens = {};
const ids = {};

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function uploadFile(path, token) {
  return new Promise((resolve, reject) => {
    const boundary = '----TestBoundary' + Date.now();
    const fileContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
      fileContent,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname, port: url.port, path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Authorization': 'Bearer ' + token
      }
    };
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', reject);
    r.write(body);
    r.end();
  });
}

async function test(id, name, fn) {
  try {
    await fn();
    results.push({ id, name, status: 'PASS' });
    passed++;
  } catch(e) {
    results.push({ id, name, status: 'FAIL', error: e.message });
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function run() {
  console.log('====================================');
  console.log('  校园社团活动管理系统 — 接口测试');
  console.log('====================================\n');

  // ======================== 4.1 用户认证模块 ========================
  console.log('--- 4.1 用户认证模块 ---');

  await test('TC-01', '[U-01] 注册 - 正常注册', async () => {
    const r = await req('POST', '/api/auth/register', { username: 'testuser1', password: '123456', nickname: '测试用户1', studentId: 'S001' });
    assert(r.body.code === 0, '注册失败: ' + r.body.message);
    assert(r.body.data.token, '未返回token');
    assert(r.body.data.user.username === 'testuser1', '用户名不匹配');
    assert(r.body.data.user.role === 'student', '默认角色应为student');
    tokens.testuser1 = r.body.data.token;
    ids.testuser1 = r.body.data.user._id;
  });

  await test('TC-02', '[U-01] 注册 - 用户名重复', async () => {
    const r = await req('POST', '/api/auth/register', { username: 'testuser1', password: '123456' });
    assert(r.body.code === -1, '应拒绝重复用户名');
  });

  await test('TC-03', '[U-02] 注册 - 密码少于6位', async () => {
    const r = await req('POST', '/api/auth/register', { username: 'short', password: '123' });
    assert(r.body.code === -1, '应拒绝短密码');
  });

  await test('TC-04', '[U-01] 注册 - 用户名少于2字符', async () => {
    const r = await req('POST', '/api/auth/register', { username: 'a', password: '123456' });
    assert(r.body.code === -1, '应拒绝短用户名');
  });

  await test('TC-05', '登录 - 正确凭证', async () => {
    const r = await req('POST', '/api/auth/login', { username: 'zhangsan', password: '123456' });
    assert(r.body.code === 0, '登录失败');
    assert(r.body.data.token, '未返回token');
    tokens.zhangsan = r.body.data.token;
    ids.zhangsan = r.body.data.user._id;
  });

  await test('TC-06', '登录 - 密码错误', async () => {
    const r = await req('POST', '/api/auth/login', { username: 'zhangsan', password: 'wrong' });
    assert(r.body.code === -1, '应拒绝错误密码');
  });

  await test('TC-07', '登录 - 用户不存在', async () => {
    const r = await req('POST', '/api/auth/login', { username: 'noexist', password: '123456' });
    assert(r.body.code === -1, '应提示用户不存在');
  });

  await test('TC-08', '[U-05] 获取个人资料 - 已认证', async () => {
    const r = await req('GET', '/api/auth/profile', null, tokens.zhangsan);
    assert(r.body.code === 0, '获取失败');
    assert(!r.body.data.user.password, '不应返回密码字段');
  });

  await test('TC-09', '获取个人资料 - 未认证', async () => {
    const r = await req('GET', '/api/auth/profile');
    assert(r.status === 401, '应返回401');
  });

  await test('TC-10', '修改个人资料', async () => {
    const r = await req('PUT', '/api/auth/profile', { nickname: '张三改名', phone: '13900000000' }, tokens.zhangsan);
    assert(r.body.code === 0, '修改失败');
    assert(r.body.data.user.nickname === '张三改名', '昵称未更新');
  });

  // 登录其他用户
  let r = await req('POST', '/api/auth/login', { username: 'admin', password: '123456' });
  tokens.admin = r.body.data.token; ids.admin = r.body.data.user._id;
  r = await req('POST', '/api/auth/login', { username: 'lisi', password: '123456' });
  tokens.lisi = r.body.data.token; ids.lisi = r.body.data.user._id;
  r = await req('POST', '/api/auth/login', { username: 'wangwu', password: '123456' });
  tokens.wangwu = r.body.data.token; ids.wangwu = r.body.data.user._id;

  // ======================== 4.2 社团管理模块 ========================
  console.log('\n--- 4.2 社团管理模块 ---');

  await test('TC-11', '[C-02] 社团列表 - 仅活跃社团', async () => {
    const r = await req('GET', '/api/clubs');
    assert(r.body.code === 0, '查询失败');
    assert(r.body.data.clubs.length >= 3, '种子数据应有3个社团');
    r.body.data.clubs.forEach(c => assert(c.status === 'active', '应仅返回active'));
    ids.club1 = r.body.data.clubs.find(c => c.name === '计算机协会')._id;
    ids.club2 = r.body.data.clubs.find(c => c.name === '摄影社')._id;
    ids.club3 = r.body.data.clubs.find(c => c.name === '篮球俱乐部')._id;
  });

  await test('TC-12', '社团列表 - 分类筛选', async () => {
    const r = await req('GET', '/api/clubs?category=学术科技');
    assert(r.body.code === 0);
    assert(r.body.data.clubs.every(c => c.category === '学术科技'), '分类筛选不正确');
  });

  await test('TC-13', '社团列表 - 关键词搜索', async () => {
    const r = await req('GET', '/api/clubs?keyword=计算机');
    assert(r.body.code === 0);
    assert(r.body.data.clubs.length >= 1, '应搜到计算机协会');
  });

  await test('TC-14', '社团详情 - 含成员信息', async () => {
    const r = await req('GET', '/api/clubs/' + ids.club1);
    assert(r.body.code === 0);
    assert(r.body.data.club.members.length >= 1, '应有成员');
    assert(r.body.data.club.foundedAt, '应有成立时间');
  });

  await test('TC-15', '[C-03] 创建社团 - 创建者成为社长', async () => {
    const r = await req('POST', '/api/clubs', {
      name: '测试社团', description: '测试', category: '其他'
    }, tokens.testuser1);
    assert(r.body.code === 0, '创建失败: ' + r.body.message);
    ids.testClub = r.body.data.club._id;
    assert(r.body.data.club.president.toString() === ids.testuser1, '社长应为创建者');
    const profile = await req('GET', '/api/auth/profile', null, tokens.testuser1);
    assert(profile.body.data.user.role === 'club_admin', '角色应升级为club_admin');
  });

  await test('TC-16', '[C-01] 创建社团 - 名称重复', async () => {
    const r = await req('POST', '/api/clubs', { name: '测试社团' }, tokens.testuser1);
    assert(r.body.code === -1, '应拒绝重复社团名');
  });

  await test('TC-17', '编辑社团 - 社长可编辑', async () => {
    const r = await req('PUT', '/api/clubs/' + ids.testClub, { announcement: '测试公告' }, tokens.testuser1);
    assert(r.body.code === 0, '编辑失败');
  });

  await test('TC-18', '编辑社团 - 非社长不可编辑', async () => {
    const r = await req('PUT', '/api/clubs/' + ids.testClub, { announcement: '非法修改' }, tokens.lisi);
    assert(r.body.code === -1, '应拒绝非社长编辑');
  });

  await test('TC-19', '社团活动历史', async () => {
    const r = await req('GET', '/api/clubs/' + ids.club1 + '/activities');
    assert(r.body.code === 0, '查询失败');
    assert(Array.isArray(r.body.data.activities), '应返回活动数组');
  });

  // ======================== 4.3 成员管理模块 ========================
  console.log('\n--- 4.3 成员管理模块 ---');

  await test('TC-20', '[C-04] 加入社团', async () => {
    const r = await req('POST', '/api/members/' + ids.testClub + '/join', null, tokens.lisi);
    assert(r.body.code === 0, '加入失败: ' + r.body.message);
  });

  await test('TC-21', '[C-05] 加入社团 - 重复加入', async () => {
    const r = await req('POST', '/api/members/' + ids.testClub + '/join', null, tokens.lisi);
    assert(r.body.code === -1, '应拒绝重复加入');
  });

  await test('TC-22', '退出社团 - 普通成员可退出', async () => {
    await req('POST', '/api/members/' + ids.testClub + '/join', null, tokens.wangwu);
    const r = await req('POST', '/api/members/' + ids.testClub + '/leave', null, tokens.wangwu);
    assert(r.body.code === 0, '退出失败');
  });

  await test('TC-23', '[C-06] 退出社团 - 社长不可退出', async () => {
    const r = await req('POST', '/api/members/' + ids.testClub + '/leave', null, tokens.testuser1);
    assert(r.body.code === -1, '应拒绝社长退出');
  });

  await test('TC-24', '查看成员列表', async () => {
    const r = await req('GET', '/api/members/' + ids.testClub + '/members');
    assert(r.body.code === 0);
    assert(r.body.data.members.length >= 2, '应至少有2个成员');
  });

  await test('TC-25', '修改成员角色 - 社长操作', async () => {
    const r = await req('PUT', '/api/members/' + ids.testClub + '/members/' + ids.lisi + '/role', { role: 'vice_president' }, tokens.testuser1);
    assert(r.body.code === 0, '修改失败');
  });

  await test('TC-26', '修改成员角色 - 非社长不可操作', async () => {
    const r = await req('PUT', '/api/members/' + ids.testClub + '/members/' + ids.lisi + '/role', { role: 'member' }, tokens.lisi);
    assert(r.body.code === -1, '应拒绝非社长操作');
  });

  await test('TC-27', '移除成员 - 社长操作', async () => {
    await req('POST', '/api/members/' + ids.testClub + '/join', null, tokens.wangwu);
    const r = await req('DELETE', '/api/members/' + ids.testClub + '/members/' + ids.wangwu, null, tokens.testuser1);
    assert(r.body.code === 0, '移除失败');
  });

  // ======================== 4.4 活动管理模块 ========================
  console.log('\n--- 4.4 活动管理模块 ---');

  // 获取种子活动ID
  const actListR = await req('GET', '/api/activities');
  ids.act_no_approval = actListR.body.data.activities.find(a => a.title.includes('编程'))._id;
  ids.act_need_approval = actListR.body.data.activities.find(a => a.title.includes('摄影'))._id;
  ids.act_basketball = actListR.body.data.activities.find(a => a.title.includes('篮球'))._id;

  await test('TC-28', '活动列表', async () => {
    const r = await req('GET', '/api/activities');
    assert(r.body.code === 0);
    assert(r.body.data.activities.length >= 3, '种子应有3个活动');
  });

  await test('TC-29', '活动列表 - 状态筛选', async () => {
    const r = await req('GET', '/api/activities?status=published');
    assert(r.body.code === 0);
    assert(r.body.data.activities.every(a => a.status === 'published'), '状态筛选不正确');
  });

  await test('TC-30', '活动详情', async () => {
    const r = await req('GET', '/api/activities/' + ids.act_no_approval);
    assert(r.body.code === 0);
    assert(r.body.data.activity.title, '应有标题');
    assert(r.body.data.activity.location, '应有地点');
  });

  await test('TC-31', '[A-01] 创建活动 - 社长/副社长可创建', async () => {
    const r = await req('POST', '/api/activities', {
      title: '测试活动', club: ids.testClub,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 172800000).toISOString(),
      location: '测试地点', maxParticipants: 5, needApproval: false
    }, tokens.testuser1);
    assert(r.body.code === 0, '创建失败: ' + r.body.message);
    ids.testActivity = r.body.data.activity._id;
  });

  await test('TC-31b', '[A-01] 创建活动 - 副社长可创建', async () => {
    const r = await req('POST', '/api/activities', {
      title: '副社长测试活动', club: ids.testClub,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 172800000).toISOString(),
      location: '测试地点B'
    }, tokens.lisi);
    assert(r.body.code === 0, '副社长应可创建活动: ' + r.body.message);
    if (r.body.code === 0) ids.testActivity2 = r.body.data.activity._id;
  });

  await test('TC-32', '创建活动 - 普通成员不可创建', async () => {
    const r = await req('POST', '/api/activities', {
      title: '非法活动', club: ids.club1,
      startTime: new Date().toISOString(), endTime: new Date().toISOString(),
      location: '某地'
    }, tokens.testuser1);
    assert(r.body.code === -1, '应拒绝普通成员创建');
  });

  await test('TC-33', '编辑活动 - 组织者可编辑', async () => {
    const r = await req('PUT', '/api/activities/' + ids.testActivity, { title: '测试活动-修改' }, tokens.testuser1);
    assert(r.body.code === 0, '编辑失败');
  });

  await test('TC-34', '[A-04] 删除活动 - 同步删除报名', async () => {
    const createR = await req('POST', '/api/activities', {
      title: '待删除活动', club: ids.testClub,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 172800000).toISOString(),
      location: '临时地点'
    }, tokens.testuser1);
    const delId = createR.body.data.activity._id;
    const r = await req('DELETE', '/api/activities/' + delId, null, tokens.testuser1);
    assert(r.body.code === 0, '删除失败');
  });

  // ======================== 4.5 活动报名模块 ========================
  console.log('\n--- 4.5 活动报名模块 ---');

  await test('TC-35', '[R-04] 报名 - 自动通过(needApproval=false)', async () => {
    const r = await req('POST', '/api/activities/' + ids.act_basketball + '/register', {}, tokens.testuser1);
    assert(r.body.code === 0, '报名失败: ' + r.body.message);
    assert(r.body.data.registration.status === 'approved', '应自动通过');
    ids.reg_basketball = r.body.data.registration._id;
  });

  await test('TC-36', '[R-05] 报名 - 需审核(needApproval=true)', async () => {
    const r = await req('POST', '/api/activities/' + ids.act_need_approval + '/register', {}, tokens.testuser1);
    assert(r.body.code === 0, '报名失败: ' + r.body.message);
    assert(r.body.data.registration.status === 'pending', '应为pending状态');
    ids.reg_photo = r.body.data.registration._id;
  });

  await test('TC-37', '[R-01] 报名 - 重复报名', async () => {
    const r = await req('POST', '/api/activities/' + ids.act_basketball + '/register', {}, tokens.testuser1);
    assert(r.body.code === -1, '应拒绝重复报名');
  });

  await test('TC-38', '[R-03] 报名 - 名额已满', async () => {
    // 创建名额为1的活动
    const act = await req('POST', '/api/activities', {
      title: '限1人活动', club: ids.testClub,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 172800000).toISOString(),
      location: '小教室', maxParticipants: 1, needApproval: false
    }, tokens.testuser1);
    const actId = act.body.data.activity._id;
    await req('POST', '/api/activities/' + actId + '/register', {}, tokens.lisi);
    const r = await req('POST', '/api/activities/' + actId + '/register', {}, tokens.wangwu);
    assert(r.body.code === -1, '应拒绝超额报名');
  });

  await test('TC-39', '[R-06] 审核报名 - 通过', async () => {
    const r = await req('PUT', '/api/activities/' + ids.act_need_approval + '/registrations/' + ids.reg_photo, { status: 'approved' }, tokens.lisi);
    assert(r.body.code === 0, '审核失败: ' + r.body.message);
  });

  await test('TC-40', '审核报名 - 拒绝', async () => {
    await req('POST', '/api/activities/' + ids.act_need_approval + '/register', {}, tokens.wangwu);
    const detail = await req('GET', '/api/activities/' + ids.act_need_approval);
    const wangwuReg = detail.body.data.registrations.find(r2 => {
      return r2.user && r2.user._id === ids.wangwu;
    });
    if (wangwuReg) {
      const r = await req('PUT', '/api/activities/' + ids.act_need_approval + '/registrations/' + wangwuReg._id, { status: 'rejected' }, tokens.lisi);
      assert(r.body.code === 0, '拒绝失败');
    } else {
      assert(false, '未找到wangwu的报名记录');
    }
  });

  // ======================== 4.6 签到打卡模块 ========================
  console.log('\n--- 4.6 签到打卡模块 ---');

  await test('TC-41', '[K-02] 签到 - 已通过报名可签到', async () => {
    const r = await req('POST', '/api/checkin/' + ids.act_basketball, { location: { latitude: 23.1, longitude: 113.2 } }, tokens.testuser1);
    assert(r.body.code === 0, '签到失败: ' + r.body.message);
  });

  await test('TC-42', '签到 - 未报名不可签到', async () => {
    const r = await req('POST', '/api/checkin/' + ids.act_basketball, {}, tokens.lisi);
    assert(r.body.code === -1, '应拒绝未报名用户签到');
  });

  await test('TC-43', '[K-01] 签到 - 重复签到', async () => {
    const r = await req('POST', '/api/checkin/' + ids.act_basketball, {}, tokens.testuser1);
    assert(r.body.code === -1, '应拒绝重复签到');
  });

  await test('TC-44', '签到列表', async () => {
    const r = await req('GET', '/api/checkin/' + ids.act_basketball);
    assert(r.body.code === 0);
    assert(r.body.data.checkIns.length >= 1, '应有签到记录');
  });

  await test('TC-45', '签到状态', async () => {
    const r = await req('GET', '/api/checkin/' + ids.act_basketball + '/status', null, tokens.testuser1);
    assert(r.body.code === 0);
    assert(r.body.data.checkedIn === true, '应显示已签到');
  });

  // ======================== 4.7 活动评价模块 ========================
  console.log('\n--- 4.7 活动评价模块 ---');

  await test('TC-46', '提交评价', async () => {
    const r = await req('POST', '/api/feedback/' + ids.act_basketball, { rating: 5, comment: '活动非常棒！' }, tokens.testuser1);
    assert(r.body.code === 0, '评价失败: ' + r.body.message);
  });

  await test('TC-47', '[F-01] 评价 - 重复评价', async () => {
    const r = await req('POST', '/api/feedback/' + ids.act_basketball, { rating: 3, comment: '再评一次' }, tokens.testuser1);
    assert(r.body.code === -1, '应拒绝重复评价');
  });

  await test('TC-48', '[F-02] 评价 - 无效评分', async () => {
    const r = await req('POST', '/api/feedback/' + ids.act_no_approval, { rating: 10, comment: '超标' }, tokens.testuser1);
    assert(r.body.code === -1, '应拒绝无效评分');
  });

  await test('TC-49', '[F-03] 评价列表 - 含平均分', async () => {
    const r = await req('GET', '/api/feedback/' + ids.act_basketball);
    assert(r.body.code === 0);
    assert(r.body.data.avgRating !== undefined, '应返回平均分');
    assert(r.body.data.feedbacks.length >= 1, '应有评价记录');
  });

  // ======================== 4.8 图片存储模块 ========================
  console.log('\n--- 4.8 图片存储模块 ---');

  await test('TC-50', '上传图片 - 已认证', async () => {
    const r = await uploadFile('/api/upload', tokens.testuser1);
    assert(r.body.code === 0, '上传失败: ' + JSON.stringify(r.body));
    assert(r.body.data.url, '应返回图片URL');
  });

  await test('TC-51', '上传图片 - 未认证', async () => {
    const r = await uploadFile('/api/upload', '');
    assert(r.body.code === -1 || r.status === 401, '应拒绝未认证上传');
  });

  // ======================== 系统接口 ========================
  console.log('\n--- 系统接口 ---');

  await test('TC-52', '健康检查', async () => {
    const r = await req('GET', '/api/health');
    assert(r.body.code === 0);
    assert(r.body.data.timestamp, '应返回时间戳');
  });

  // ======================== 用户专属数据接口 ========================
  console.log('\n--- 用户专属数据接口 ---');

  await test('TC-53', '我的社团', async () => {
    const r = await req('GET', '/api/auth/my-clubs', null, tokens.zhangsan);
    assert(r.body.code === 0);
    assert(r.body.data.clubs.length >= 1, 'zhangsan应至少在1个社团');
  });

  await test('TC-54', '我的活动', async () => {
    const r = await req('GET', '/api/auth/my-activities', null, tokens.testuser1);
    assert(r.body.code === 0);
    assert(r.body.data.activities.length >= 1, '已报名应有活动');
  });

  await test('TC-55', '我的报名记录', async () => {
    const r = await req('GET', '/api/auth/my-registrations', null, tokens.testuser1);
    assert(r.body.code === 0);
    assert(r.body.data.registrations.length >= 1, '应有报名记录');
  });

  await test('TC-56', '我的签到记录', async () => {
    const r = await req('GET', '/api/auth/my-checkins', null, tokens.testuser1);
    assert(r.body.code === 0);
    assert(r.body.data.checkins.length >= 1, '应有签到记录');
  });

  // ======================== 输出结果 ========================
  console.log('\n====================================');
  console.log('  测试结果汇总');
  console.log('====================================');
  console.log(`  总计: ${results.length}  通过: ${passed}  失败: ${failed}`);
  console.log('====================================\n');

  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.id} ${r.name}${r.error ? ' → ' + r.error : ''}`);
  });

  if (failed > 0) {
    console.log('\n--- 失败用例详情 ---');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`\n❌ ${r.id}: ${r.name}`);
      console.log(`   错误: ${r.error}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('测试执行异常:', e); process.exit(1); });
