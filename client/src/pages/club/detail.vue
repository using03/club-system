<template>
  <view class="club-detail" v-if="club">
    <view class="header">
      <view class="club-avatar" v-if="!club.logo">{{ club.name.charAt(0) }}</view>
      <image class="club-logo" v-else :src="getImageUrl(club.logo)" mode="aspectFill"></image>
      <view class="header-info">
        <text class="club-name">{{ club.name }}</text>
        <text class="club-category">{{ club.category }} · {{ club.memberCount }}人</text>
        <text class="club-founded">成立于 {{ formatDate(club.foundedAt) }}</text>
      </view>
    </view>

    <view class="section" v-if="club.announcement">
      <text class="section-title">公告</text>
      <text class="announcement">{{ club.announcement }}</text>
    </view>

    <view class="section">
      <text class="section-title">简介</text>
      <text class="desc">{{ club.description || '暂无简介' }}</text>
      <view class="tags-row" v-if="club.tags && club.tags.length > 0">
        <text class="tag" v-for="(t, i) in club.tags" :key="i">{{ t }}</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">成员 ({{ club.members.length }})</text>
      <view class="member-list-v2">
        <view class="member-card" v-for="(m, index) in club.members" :key="index" @click="toggleMemberAction(index)">
          <view class="member-main">
            <view class="member-avatar-v2" :class="m.role">{{ getMemberName(m).charAt(0) }}</view>
            <text class="member-name-v2">{{ getMemberName(m) }}</text>
            <text class="member-role-v2" :class="m.role">{{ roleText(m.role) }}</text>
          </view>
          <view class="member-expand" v-if="isPresident && expandedMember === index && getMemberId(m) !== currentUserId">
            <button class="expand-btn promote" v-if="m.role === 'member'" @click.stop="setRole(m, 'vice_president')">设为副社长</button>
            <button class="expand-btn demote" v-if="m.role === 'vice_president'" @click.stop="setRole(m, 'member')">取消副社长</button>
            <button class="expand-btn remove" @click.stop="removeMember(m)">移除成员</button>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">活动历史 ({{ clubActivities.length }})</text>
      <view v-if="clubActivities.length > 0" class="activity-history">
        <view class="history-item" v-for="(act, index) in clubActivities" :key="index" @click="goActivity(act._id)">
          <view class="history-left">
            <text class="history-title">{{ act.title }}</text>
            <text class="history-info">{{ act.location }} · {{ formatDate(act.startTime) }}</text>
          </view>
          <view class="history-right">
            <text class="history-status" :class="act.status">{{ statusText(act.status) }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-history">
        <text class="empty-text">暂无活动记录</text>
      </view>
    </view>

    <view class="actions" v-if="!isMember">
      <button class="btn-join" @click="joinClub">加入社团</button>
    </view>
    <view class="actions actions-row" v-else-if="isPresident">
      <button class="btn-edit" @click="editClub">编辑</button>
      <button class="btn-manage" @click="createActivity">发布活动</button>
      <button class="btn-transfer" @click="showTransferModal = true">转让社长</button>
    </view>
    <view class="actions actions-row" v-else-if="isVicePresident">
      <button class="btn-manage" @click="createActivity">发布活动</button>
      <button class="btn-leave" @click="leaveClub">退出社团</button>
    </view>
    <view class="actions" v-else>
      <button class="btn-leave" @click="leaveClub">退出社团</button>
    </view>

    <view class="transfer-modal" v-if="showTransferModal" @click="showTransferModal = false">
      <view class="modal-content" @click.stop="">
        <text class="modal-title">转让社长</text>
        <text class="modal-hint">选择一位成员作为新社长，转让后你将变为普通成员。</text>
        <view class="transfer-list">
          <view class="transfer-item" v-for="(m, i) in transferableMembers" :key="i" @click="confirmTransfer(m)">
            <view class="t-avatar">{{ getTransferName(m).charAt(0) }}</view>
            <text class="t-name">{{ getTransferName(m) }}</text>
            <text class="t-role">{{ roleText(m.role) }}</text>
          </view>
        </view>
        <button class="btn-cancel-modal" @click="showTransferModal = false">取消</button>
      </view>
    </view>
  </view>
</template>

<script>
import { clubApi, memberApi } from '../../api/index';

export default {
  data() {
    return {
      club: null,
      clubActivities: [],
      currentUserId: '',
      showTransferModal: false,
      expandedMember: -1
    };
  },
  computed: {
    isMember() {
      if (!this.club || !this.currentUserId) return false;
      return this.club.members.some(function(m) {
        return m.user && m.user._id === this.currentUserId;
      }.bind(this));
    },
    transferableMembers() {
      if (!this.club || !this.club.members) return [];
      var self = this;
      return this.club.members.filter(function(m) {
        var uid = (m.user && m.user._id) ? m.user._id : m.user;
        return uid !== self.currentUserId;
      });
    },
    isVicePresident() {
      if (!this.club || !this.currentUserId) return false;
      return this.club.members.some(function(m) {
        var uid = (m.user && m.user._id) ? m.user._id : m.user;
        return uid === this.currentUserId && m.role === 'vice_president';
      }.bind(this));
    },
    isPresident() {
      if (!this.club || !this.currentUserId) return false;
      var p = this.club.president;
      if (p && p._id) return p._id === this.currentUserId;
      return p === this.currentUserId;
    }
  },
  onLoad(options) {
    var userStr = uni.getStorageSync('userInfo');
    if (userStr) {
      try { this.currentUserId = JSON.parse(userStr)._id; } catch(e) {}
    }
    if (options.id) {
      this.loadClub(options.id);
      this.loadActivities(options.id);
    }
  },
  methods: {
    getImageUrl(path) {
      if (!path) return '';
      if (path.indexOf('http') === 0) return path;
      return 'http://127.0.0.1:3000' + path;
    },
    toggleMemberAction(index) {
      if (!this.isPresident) return;
      this.expandedMember = this.expandedMember === index ? -1 : index;
    },
    removeMember(m) {
      var self = this;
      var uid = self.getMemberId(m);
      var name = self.getMemberName(m);
      uni.showModal({
        title: '移除成员',
        content: '确定将「' + name + '」从社团中移除吗？',
        success: function(res) {
          if (res.confirm) {
            memberApi.remove(self.club._id, uid).then(function() {
              uni.showToast({ title: '已移除', icon: 'success' });
              self.expandedMember = -1;
              self.loadClub(self.club._id);
            });
          }
        }
      });
    },
    getMemberId(m) {
      return (m.user && m.user._id) ? m.user._id : m.user;
    },
    setRole(m, newRole) {
      var self = this;
      var uid = self.getMemberId(m);
      var name = self.getMemberName(m);
      var roleLabel = newRole === 'vice_president' ? '副社长' : '普通成员';
      uni.showModal({
        title: '修改角色',
        content: '确定将「' + name + '」设为' + roleLabel + '吗？',
        success: function(res) {
          if (res.confirm) {
            memberApi.updateRole(self.club._id, uid, { role: newRole }).then(function() {
              uni.showToast({ title: '已修改', icon: 'success' });
              self.loadClub(self.club._id);
            });
          }
        }
      });
    },
    getMemberName(m) {
      if (m.user && m.user.nickname) return m.user.nickname;
      return '未知';
    },
    async loadClub(id) {
      try {
        var res = await clubApi.getDetail(id);
        this.club = res.data.club;
      } catch(err) { console.error(err); }
    },
    async loadActivities(clubId) {
      try {
        var res = await clubApi.getActivities(clubId);
        this.clubActivities = res.data.activities || [];
      } catch(err) { console.error(err); }
    },
    roleText(role) {
      var map = { president: '社长', vice_president: '副社长', member: '成员' };
      return map[role] || '成员';
    },
    statusText(s) {
      var map = { draft: '草稿', published: '报名中', registration: '报名中', ongoing: '进行中', ended: '已结束', cancelled: '已取消' };
      return map[s] || s;
    },
    formatDate(d) {
      return d ? new Date(d).toLocaleDateString('zh-CN') : '';
    },
    goActivity(id) {
      uni.navigateTo({ url: '/pages/activity/detail?id=' + id });
    },
    async joinClub() {
      if (!this.currentUserId) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        setTimeout(function() { uni.navigateTo({ url: '/pages/login/index' }); }, 500);
        return;
      }
      try {
        await memberApi.join(this.club._id);
        uni.showToast({ title: '加入成功', icon: 'success' });
        this.loadClub(this.club._id);
      } catch(err) { console.error(err); }
    },
    getTransferName(m) {
      if (m.user && m.user.nickname) return m.user.nickname;
      return '未知';
    },
    confirmTransfer(m) {
      var self = this;
      var uid = (m.user && m.user._id) ? m.user._id : m.user;
      var name = self.getTransferName(m);
      uni.showModal({
        title: '确认转让',
        content: '确定将社长转让给「' + name + '」吗？转让后你将变为普通成员。',
        success: function(res) {
          if (res.confirm) {
            memberApi.transfer(self.club._id, { userId: uid }).then(function() {
              uni.showToast({ title: '已转让', icon: 'success' });
              self.showTransferModal = false;
              self.loadClub(self.club._id);
            });
          }
        }
      });
    },
    editClub() {
      uni.navigateTo({ url: '/pages/club/edit?id=' + this.club._id });
    },
    createActivity() {
      uni.navigateTo({ url: '/pages/activity/create?clubId=' + this.club._id });
    },
    async leaveClub() {
      try {
        await memberApi.leave(this.club._id);
        uni.showToast({ title: '已退出', icon: 'success' });
        this.loadClub(this.club._id);
      } catch(err) { console.error(err); }
    }
  }
};
</script>

<style scoped>
.club-detail { padding-bottom: 120rpx; }
.header { display: flex; align-items: center; padding: 32rpx; background: linear-gradient(135deg, #4CAF50, #66BB6A); color: #fff; }
.club-avatar { width: 120rpx; height: 120rpx; border-radius: 50%; background: rgba(255,255,255,0.3); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 48rpx; font-weight: bold; margin-right: 24rpx; flex-shrink: 0; }
.club-logo { width: 120rpx; height: 120rpx; border-radius: 50%; margin-right: 24rpx; flex-shrink: 0; }
.header-info { flex: 1; }
.club-name { font-size: 36rpx; font-weight: bold; display: block; }
.club-category { font-size: 24rpx; opacity: 0.9; margin-top: 8rpx; display: block; }
.club-founded { font-size: 22rpx; opacity: 0.8; margin-top: 4rpx; display: block; }
.section { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; display: block; }
.announcement { font-size: 28rpx; color: #E65100; background: #FFF3E0; padding: 16rpx; border-radius: 8rpx; display: block; }
.desc { font-size: 28rpx; color: #666; line-height: 1.6; display: block; }
.tags-row { margin-top: 16rpx; display: flex; flex-wrap: wrap; }
.tag { font-size: 22rpx; color: #4CAF50; background: #E8F5E9; padding: 6rpx 20rpx; border-radius: 20rpx; margin: 0 12rpx 12rpx 0; }
.member-list-v2 { }
.member-card { border-bottom: 1rpx solid #f0f0f0; }
.member-card:last-child { border-bottom: none; }
.member-main { display: flex; align-items: center; padding: 20rpx 0; }
.member-avatar-v2 { width: 64rpx; height: 64rpx; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26rpx; font-weight: bold; margin-right: 16rpx; flex-shrink: 0; background: #4CAF50; }
.member-avatar-v2.president { background: #FF9800; }
.member-avatar-v2.vice_president { background: #2196F3; }
.member-avatar-v2.member { background: #4CAF50; }
.member-name-v2 { font-size: 28rpx; color: #333; flex: 1; }
.member-role-v2 { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 16rpx; flex-shrink: 0; }
.member-role-v2.president { background: #FFF3E0; color: #E65100; }
.member-role-v2.vice_president { background: #E3F2FD; color: #1976D2; }
.member-role-v2.member { background: #f5f5f5; color: #999; }
.member-expand { display: flex; padding: 0 0 16rpx 80rpx; }
.member-expand button { flex: 1; height: 60rpx; line-height: 60rpx; font-size: 24rpx; border: none; border-radius: 8rpx; margin: 0 6rpx; }
.expand-btn.promote { background: #E3F2FD; color: #1976D2; }
.expand-btn.demote { background: #FFF3E0; color: #E65100; }
.expand-btn.remove { background: #FFEBEE; color: #f44336; }
.activity-history { }
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.history-item:last-child { border-bottom: none; }
.history-left { flex: 1; overflow: hidden; }
.history-title { font-size: 28rpx; color: #333; font-weight: 500; display: block; }
.history-info { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }
.history-right { flex-shrink: 0; margin-left: 16rpx; }
.history-status { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 20rpx; }
.history-status.published { background: #E3F2FD; color: #1976D2; }
.history-status.ongoing { background: #FFF3E0; color: #E65100; }
.history-status.ended { background: #f5f5f5; color: #999; }
.empty-history { padding: 20rpx 0; }
.empty-text { font-size: 26rpx; color: #ccc; text-align: center; display: block; }
.actions { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx; background: #fff; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.06); }
.btn-join { background: #4CAF50; color: #fff; border: none; border-radius: 12rpx; height: 88rpx; line-height: 88rpx; font-size: 32rpx; }
.btn-leave { background: #f44336; color: #fff; border: none; border-radius: 12rpx; height: 88rpx; line-height: 88rpx; font-size: 32rpx; }
.actions-row { display: flex; }
.actions-row button { flex: 1; margin: 0 8rpx; height: 88rpx; line-height: 88rpx; font-size: 30rpx; border: none; border-radius: 12rpx; }
.btn-edit { background: #2196F3; color: #fff; }
.btn-manage { background: #4CAF50; color: #fff; }
.btn-transfer { background: #ff9800; color: #fff; }
.transfer-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-content { width: 85%; max-height: 70vh; background: #fff; border-radius: 16rpx; padding: 32rpx; overflow-y: auto; }
.modal-title { font-size: 32rpx; font-weight: bold; color: #333; display: block; margin-bottom: 12rpx; }
.modal-hint { font-size: 26rpx; color: #666; display: block; margin-bottom: 24rpx; }
.transfer-list { }
.transfer-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.t-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: #4CAF50; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26rpx; font-weight: bold; margin-right: 16rpx; flex-shrink: 0; }
.t-name { flex: 1; font-size: 28rpx; color: #333; }
.t-role { font-size: 22rpx; color: #999; }
.btn-cancel-modal { width: 100%; background: #f5f5f5; color: #666; border: none; border-radius: 12rpx; height: 72rpx; line-height: 72rpx; font-size: 28rpx; margin-top: 20rpx; }
</style>
