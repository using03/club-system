const express = require('express');
const Club = require('../models/Club');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');
const { addToBlacklist } = require('../utils/tokenBlacklist');

const router = express.Router();

router.post('/:clubId/join', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return error(res, '社团不存在', 404);

    const isMember = club.members.some(m => m.user.toString() === req.userId.toString());
    if (isMember) return error(res, '您已是该社团成员');

    club.members.push({ user: req.userId, role: 'member' });
    club.memberCount = club.members.length;
    await club.save();

    await createNotification(club.president, 'member_joined', '新成员加入', req.user.nickname + ' 加入了社团「' + club.name + '」', club._id.toString());

    return success(res, { club }, '加入社团成功');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/:clubId/leave', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return error(res, '社团不存在', 404);

    if (club.president.toString() === req.userId.toString()) {
      return error(res, '社长不能退出社团，请先转让社长');
    }

    const memberIndex = club.members.findIndex(m => m.user.toString() === req.userId.toString());
    if (memberIndex === -1) return error(res, '您不是该社团成员');

    club.members.splice(memberIndex, 1);
    club.memberCount = club.members.length;
    await club.save();

    await createNotification(club.president, 'member_left', '成员退出社团', req.user.nickname + ' 退出了社团「' + club.name + '」', club._id.toString());

    return success(res, null, '退出社团成功');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/:clubId/members', async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId)
      .populate('members.user', 'nickname avatar studentId phone');

    if (!club) return error(res, '社团不存在', 404);
    return success(res, { members: club.members, total: club.memberCount });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.put('/:clubId/members/:userId/role', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return error(res, '社团不存在', 404);

    if (club.president.toString() !== req.userId.toString()) {
      return error(res, '只有社长才能修改成员角色', 403);
    }

    const member = club.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return error(res, '该用户不是社团成员');

    var newRole = req.body.role || 'member';
    member.role = newRole;
    await club.save();

    var roleLabel = newRole === 'vice_president' ? '副社长' : '普通成员';
    await createNotification(req.params.userId, 'member_joined', '角色变更', '你在社团「' + club.name + '」中的角色已变更为' + roleLabel + '。', club._id.toString());
    addToBlacklist(req.params.userId);

    return success(res, { member }, '角色更新成功');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.delete('/:clubId/members/:userId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return error(res, '社团不存在', 404);

    if (club.president.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return error(res, '无权移除成员', 403);
    }

    const memberIndex = club.members.findIndex(m => m.user.toString() === req.params.userId);
    if (memberIndex === -1) return error(res, '该用户不是社团成员');

    club.members.splice(memberIndex, 1);
    club.memberCount = club.members.length;
    await club.save();

    await createNotification(req.params.userId, 'member_left', '你已被移出社团', '你已被移出社团「' + club.name + '」。', club._id.toString());
    addToBlacklist(req.params.userId);

    return success(res, null, '成员已移除');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.put('/:clubId/transfer', auth, async (req, res) => {
  try {
    var club = await Club.findById(req.params.clubId);
    if (!club) return error(res, '社团不存在', 404);

    if (club.president.toString() !== req.userId.toString()) {
      return error(res, '只有社长可以转让', 403);
    }

    var newPresidentId = req.body.userId;
    if (!newPresidentId) return error(res, '请选择新社长');
    if (newPresidentId === req.userId.toString()) return error(res, '不能转让给自己');

    var newPresident = club.members.find(function(m) {
      return m.user.toString() === newPresidentId;
    });
    if (!newPresident) return error(res, '该用户不是社团成员');

    var oldPresident = club.members.find(function(m) {
      return m.user.toString() === req.userId.toString();
    });

    newPresident.role = 'president';
    if (oldPresident) oldPresident.role = 'member';
    club.president = newPresidentId;
    await club.save();

    var User = require('../models/User');
    var newUser = await User.findById(newPresidentId);
    if (newUser && newUser.role === 'student') {
      newUser.role = 'club_admin';
      await newUser.save();
    }

    await createNotification(newPresidentId, 'member_joined', '你已成为社长', req.user.nickname + ' 将社团「' + club.name + '」的社长转让给了你。', club._id.toString());

    for (var i = 0; i < club.members.length; i++) {
      var mid = club.members[i].user.toString();
      if (mid !== req.userId.toString() && mid !== newPresidentId) {
        await createNotification(mid, 'member_joined', '社长变更', '社团「' + club.name + '」的社长已由 ' + req.user.nickname + ' 转让给 ' + (newUser ? newUser.nickname : '新社长'), club._id.toString());
      }
    }

    addToBlacklist(req.userId);
    addToBlacklist(newPresidentId);

    return success(res, { club: club }, '社长已转让');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
