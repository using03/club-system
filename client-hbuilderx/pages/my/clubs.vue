<template>
  <view class="my-clubs-page">
    <view v-if="clubs.length > 0" class="list">
      <view class="club-item" v-for="(club, index) in clubs" :key="index" @click="goDetail(club)">
        <image v-if="club.logo" :src="getLogoUrl(club.logo)" class="club-logo" mode="aspectFill"></image>
        <view v-else class="club-avatar" :class="club.status">{{ club.name.charAt(0) }}</view>
        <view class="club-info">
          <view class="name-row">
            <text class="club-name">{{ club.name }}</text>
            <text class="status-badge pending" v-if="club.status === 'pending'">审核中</text>
            <text class="status-badge rejected" v-if="club.status === 'inactive'">已拒绝</text>
          </view>
          <text class="club-desc">{{ club.description || '暂无简介' }}</text>
          <view class="club-meta">
            <text class="meta">{{ club.category }}</text>
            <text class="meta">{{ club.memberCount }}人</text>
            <text class="meta">{{ getMyRole(club) }}</text>
          </view>
        </view>
      </view>
    </view>
    <view v-else class="empty">
      <text class="empty-icon">🏫</text>
      <text class="empty-text">你还没有加入任何社团</text>
      <button class="btn-explore" @click="goExplore">去看看</button>
    </view>
  </view>
</template>

<script>
import { authApi } from '../../api/index';

export default {
  data() {
    return {
      clubs: [],
      currentUserId: ''
    };
  },
  onShow() {
    var userStr = uni.getStorageSync('userInfo');
    if (userStr) {
      try { this.currentUserId = JSON.parse(userStr)._id; } catch(e) {}
    }
    this.loadMyClubs();
  },
  methods: {
    async loadMyClubs() {
      try {
        var res = await authApi.getMyClubs();
        this.clubs = res.data.clubs || [];
      } catch(err) { console.error(err); }
    },
    getLogoUrl(path) {
      if (!path) return '';
      if (path.indexOf('http') === 0) return path;
      return 'http://127.0.0.1:3000' + path;
    },
    getMyRole(club) {
      if (!club.members) return '成员';
      for (var i = 0; i < club.members.length; i++) {
        var m = club.members[i];
        var uid = (m.user && m.user._id) ? m.user._id : m.user;
        if (uid === this.currentUserId) {
          var map = { president: '社长', vice_president: '副社长', member: '成员' };
          return map[m.role] || '成员';
        }
      }
      return '成员';
    },
    goDetail(club) {
      if (club.status === 'inactive') {
        uni.showToast({ title: '该社团未通过审核', icon: 'none' });
        return;
      }
      uni.navigateTo({ url: '/pages/club/detail?id=' + club._id });
    },
    goExplore() {
      uni.navigateTo({ url: '/pages/club/list' });
    }
  }
};
</script>

<style scoped>
.list { padding: 20rpx; }
.club-item { display: flex; background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.club-avatar { width: 96rpx; height: 96rpx; border-radius: 50%; background: #4CAF50; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 36rpx; font-weight: bold; flex-shrink: 0; margin-right: 20rpx; }
.club-avatar.pending { background: #ff9800; }
.club-avatar.inactive { background: #999; }
.club-logo { width: 96rpx; height: 96rpx; border-radius: 50%; flex-shrink: 0; margin-right: 20rpx; }
.club-info { flex: 1; overflow: hidden; }
.name-row { display: flex; align-items: center; }
.club-name { font-size: 30rpx; font-weight: bold; color: #333; }
.status-badge { font-size: 20rpx; padding: 2rpx 14rpx; border-radius: 12rpx; margin-left: 12rpx; flex-shrink: 0; }
.status-badge.pending { background: #FFF3E0; color: #E65100; }
.status-badge.rejected { background: #FFEBEE; color: #f44336; }
.club-desc { font-size: 24rpx; color: #666; margin-top: 8rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.club-meta { margin-top: 8rpx; display: flex; }
.meta { font-size: 22rpx; color: #999; margin-right: 16rpx; }
.empty { display: flex; flex-direction: column; align-items: center; padding-top: 200rpx; }
.empty-icon { font-size: 100rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 20rpx; }
.btn-explore { margin-top: 40rpx; background: #4CAF50; color: #fff; border: none; border-radius: 40rpx; padding: 0 60rpx; height: 72rpx; line-height: 72rpx; font-size: 28rpx; }
</style>
