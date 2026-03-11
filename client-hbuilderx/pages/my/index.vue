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
      <view class="menu-item" @click="goClubList">
        <text class="menu-icon">🏫</text>
        <text class="menu-text">我的社团</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goActivityList">
        <text class="menu-icon">📅</text>
        <text class="menu-text">我的活动</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goClubList">
        <text class="menu-icon">📝</text>
        <text class="menu-text">报名记录</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @click="goClubList">
        <text class="menu-icon">✅</text>
        <text class="menu-text">签到记录</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item" @click="goClubList">
        <text class="menu-icon">⚙️</text>
        <text class="menu-text">设置</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" v-if="userInfo" @click="logout">
        <text class="menu-icon">🚪</text>
        <text class="menu-text" style="color: #f44336;">退出登录</text>
        <text class="menu-arrow">></text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: null
    };
  },
  onShow() {
    const str = uni.getStorageSync('userInfo');
    if (str) {
      try { this.userInfo = JSON.parse(str); } catch(e) {}
    } else {
      this.userInfo = null;
    }
  },
  methods: {
    roleText(role) {
      return { student: '学生', club_admin: '社团管理员', admin: '系统管理员' }[role] || '学生';
    },
    goLogin() {
      uni.navigateTo({ url: '/pages/login/index' });
    },
    goClubList() {
      uni.navigateTo({ url: '/pages/club/list' });
    },
    goActivityList() {
      uni.switchTab({ url: '/pages/activity/list' });
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
.menu-arrow { font-size: 28rpx; color: #ccc; }
</style>
