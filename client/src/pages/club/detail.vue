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
      <view class="member-list">
        <view class="member-item" v-for="(m, index) in club.members" :key="index">
          <view class="member-avatar">{{ getMemberName(m).charAt(0) }}</view>
          <text class="member-name">{{ getMemberName(m) }}</text>
          <text class="member-role">{{ roleText(m.role) }}</text>
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
      <button class="btn-edit" @click="editClub">编辑社团</button>
      <button class="btn-manage" @click="createActivity">发布活动</button>
    </view>
    <view class="actions" v-else>
      <button class="btn-leave" @click="leaveClub">退出社团</button>
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
      currentUserId: ''
    };
  },
  computed: {
    isMember() {
      if (!this.club || !this.currentUserId) return false;
      return this.club.members.some(function(m) {
        return m.user && m.user._id === this.currentUserId;
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
      try {
        await memberApi.join(this.club._id);
        uni.showToast({ title: '加入成功', icon: 'success' });
        this.loadClub(this.club._id);
      } catch(err) { console.error(err); }
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
.member-list { display: flex; flex-wrap: wrap; }
.member-item { display: flex; align-items: center; background: #f5f5f5; border-radius: 8rpx; padding: 12rpx 16rpx; margin: 0 16rpx 16rpx 0; }
.member-avatar { width: 48rpx; height: 48rpx; border-radius: 50%; background: #4CAF50; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22rpx; margin-right: 8rpx; }
.member-name { font-size: 24rpx; color: #333; }
.member-role { font-size: 20rpx; color: #4CAF50; margin-left: 8rpx; }
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
</style>
