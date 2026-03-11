const express = require('express');
const Club = require('../models/Club');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');

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

    member.role = req.body.role || 'member';
    await club.save();

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

    return success(res, null, '成员已移除');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
