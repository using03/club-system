<template>
  <view class="my-page">
    <view class="profile-section" v-if="userInfo">
      <view class="avatar">{{ (userInfo.nickname || '?').charAt(0) }}</view>
      <view class="user-info">
        <text class="nickname">{{ userInfo.nickname }}</text>
        <text class="role">{{ roleText(userInfo.role) }}</text>
        <text class="student-id" v-if="userInfo.studentId">学号: {{ userInfo.studentId }}</text>
      </view>
    </view>
    <view class="profile-section" v-else>
      <view class="avatar">?</view>
      <view class="user-info">
        <text class="nickname" @click="goLogin">点击登录</text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item" @click="goNotifications">
        <text class="menu-icon">🔔</text>
        <text class="menu-text">消息中心</text>
        <text class="unread-badge" v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goMyClubs">
        <text class="menu-icon">🏫</text>
        <text class="menu-text">我的社团</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goMyActivities">
        <text class="menu-icon">📅</text>
        <text class="menu-text">我的活动</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goMyRegistrations">
        <text class="menu-icon">📝</text>
        <text class="menu-text">报名记录</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goMyCheckins">
        <text class="menu-icon">✅</text>
        <text class="menu-text">签到记录</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <view class="menu-section" v-if="userInfo && userInfo.role === 'admin'">
      <view class="menu-item" @click="goReviewClubs">
        <text class="menu-icon">🔍</text>
        <text class="menu-text">社团审核</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item" v-if="userInfo" @click="logout">
        <text class="menu-icon">🚪</text>
        <text class="menu-text" style="color: #f44336;">退出登录</text>
        <text class="menu-arrow">></text>
      </view>
    </view>
  </view>
</template>

<script>
import { notificationApi } from '../../api/index';

export default {
  data() {
    return {
      userInfo: null,
      unreadCount: 0
    };
  },
  onShow() {
    var str = uni.getStorageSync('userInfo');
    if (str) {
      try { this.userInfo = JSON.parse(str); } catch(e) {}
      this.loadUnread();
    } else {
      this.userInfo = null;
      this.unreadCount = 0;
    }
  },
  methods: {
    roleText(role) {
      var map = { student: '学生', club_admin: '社团管理员', admin: '系统管理员' };
      return map[role] || '学生';
    },
    checkLogin() {
      if (!this.userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        setTimeout(function() {
          uni.navigateTo({ url: '/pages/login/index' });
        }, 500);
        return false;
      }
      return true;
    },
    goLogin() {
      uni.navigateTo({ url: '/pages/login/index' });
    },
    async loadUnread() {
      try {
        var res = await notificationApi.getUnreadCount();
        this.unreadCount = res.data.count || 0;
      } catch(err) { this.unreadCount = 0; }
    },
    goNotifications() {
      if (this.checkLogin()) uni.navigateTo({ url: '/pages/my/notifications' });
    },
    goMyClubs() {
      if (this.checkLogin()) uni.navigateTo({ url: '/pages/my/clubs' });
    },
    goMyActivities() {
      if (this.checkLogin()) uni.navigateTo({ url: '/pages/my/activities' });
    },
    goMyRegistrations() {
      if (this.checkLogin()) uni.navigateTo({ url: '/pages/my/registrations' });
    },
    goMyCheckins() {
      if (this.checkLogin()) uni.navigateTo({ url: '/pages/my/checkins' });
    },
    goReviewClubs() {
      uni.navigateTo({ url: '/pages/manage/clubs' });
    },
    logout() {
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
      this.userInfo = null;
      uni.showToast({ title: '已退出登录', icon: 'success' });
    }
  }
};
</script>

<style scoped>
.my-page { min-height: 100vh; background: #f5f5f5; }
.profile-section { display: flex; align-items: center; padding: 40rpx; background: linear-gradient(135deg, #4CAF50, #66BB6A); color: #fff; }
.avatar { width: 120rpx; height: 120rpx; border-radius: 50%; background: rgba(255,255,255,0.3); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 48rpx; font-weight: bold; margin-right: 24rpx; flex-shrink: 0; }
.user-info { flex: 1; }
.nickname { font-size: 36rpx; font-weight: bold; display: block; }
.role { font-size: 24rpx; opacity: 0.9; margin-top: 8rpx; display: block; }
.student-id { font-size: 22rpx; opacity: 0.8; margin-top: 4rpx; display: block; }
.menu-section { margin: 20rpx; background: #fff; border-radius: 16rpx; overflow: hidden; }
.menu-item { display: flex; align-items: center; padding: 28rpx 24rpx; border-bottom: 1rpx solid #f5f5f5; }
.menu-item:last-child { border-bottom: none; }
.menu-icon { font-size: 36rpx; margin-right: 16rpx; }
.menu-text { flex: 1; font-size: 30rpx; color: #333; }
.unread-badge { background: #f44336; color: #fff; font-size: 20rpx; min-width: 32rpx; height: 32rpx; line-height: 32rpx; text-align: center; border-radius: 16rpx; padding: 0 8rpx; margin-right: 8rpx; }
.menu-arrow { font-size: 28rpx; color: #ccc; }
</style>
