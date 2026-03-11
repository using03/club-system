<template>
  <view class="club-detail" v-if="club">
    <view class="header">
      <view class="club-avatar">{{ club.name.charAt(0) }}</view>
      <view class="header-info">
        <text class="club-name">{{ club.name }}</text>
        <text class="club-category">{{ club.category }} · {{ club.memberCount }}人</text>
        <text class="club-founded">成立于 {{ formatDate(club.foundedAt) }}</text>
      </view>
    </view>

    <view class="section" v-if="club.announcement">
      <text class="section-title">📢 公告</text>
      <text class="announcement">{{ club.announcement }}</text>
    </view>

    <view class="section">
      <text class="section-title">简介</text>
      <text class="desc">{{ club.description || '暂无简介' }}</text>
    </view>

    <view class="section">
      <text class="section-title">成员 ({{ club.members.length }})</text>
      <view class="member-list">
        <view class="member-item" v-for="m in club.members" :key="m.user?._id">
          <view class="member-avatar">{{ (m.user?.nickname || '?').charAt(0) }}</view>
          <text class="member-name">{{ m.user?.nickname || '未知' }}</text>
          <text class="member-role">{{ roleText(m.role) }}</text>
        </view>
      </view>
    </view>

    <view class="actions" v-if="!isMember">
      <button class="btn-join" @click="joinClub">加入社团</button>
    </view>
    <view class="actions" v-else-if="!isPresident">
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
      currentUserId: ''
    };
  },
  computed: {
    isMember() {
      if (!this.club || !this.currentUserId) return false;
      return this.club.members.some(m => m.user?._id === this.currentUserId);
    },
    isPresident() {
      if (!this.club || !this.currentUserId) return false;
      return this.club.president?._id === this.currentUserId || this.club.president === this.currentUserId;
    }
  },
  onLoad(options) {
    const userStr = uni.getStorageSync('userInfo');
    if (userStr) {
      try { this.currentUserId = JSON.parse(userStr)._id; } catch(e) {}
    }
    if (options.id) this.loadClub(options.id);
  },
  methods: {
    async loadClub(id) {
      try {
        const res = await clubApi.getDetail(id);
        this.club = res.data.club;
      } catch(err) { console.error(err); }
    },
    roleText(role) {
      return { president: '社长', vice_president: '副社长', member: '成员' }[role] || '成员';
    },
    formatDate(d) {
      return d ? new Date(d).toLocaleDateString('zh-CN') : '';
    },
    async joinClub() {
      try {
        await memberApi.join(this.club._id);
        uni.showToast({ title: '加入成功', icon: 'success' });
        this.loadClub(this.club._id);
      } catch(err) { console.error(err); }
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
.header-info { flex: 1; }
.club-name { font-size: 36rpx; font-weight: bold; display: block; }
.club-category { font-size: 24rpx; opacity: 0.9; margin-top: 8rpx; display: block; }
.club-founded { font-size: 22rpx; opacity: 0.8; margin-top: 4rpx; display: block; }
.section { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; display: block; }
.announcement { font-size: 28rpx; color: #E65100; background: #FFF3E0; padding: 16rpx; border-radius: 8rpx; display: block; }
.desc { font-size: 28rpx; color: #666; line-height: 1.6; display: block; }
.member-list { display: flex; flex-wrap: wrap; gap: 16rpx; }
.member-item { display: flex; align-items: center; background: #f5f5f5; border-radius: 8rpx; padding: 12rpx 16rpx; }
.member-avatar { width: 48rpx; height: 48rpx; border-radius: 50%; background: #4CAF50; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22rpx; margin-right: 8rpx; }
.member-name { font-size: 24rpx; color: #333; }
.member-role { font-size: 20rpx; color: #4CAF50; margin-left: 8rpx; }
.actions { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx; background: #fff; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.06); }
.btn-join { background: #4CAF50; color: #fff; border: none; border-radius: 12rpx; height: 88rpx; line-height: 88rpx; font-size: 32rpx; }
.btn-leave { background: #f44336; color: #fff; border: none; border-radius: 12rpx; height: 88rpx; line-height: 88rpx; font-size: 32rpx; }
</style>
