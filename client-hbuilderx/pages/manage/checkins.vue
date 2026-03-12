<template>
  <view class="checkin-manage-page">
    <view class="summary">
      <text class="summary-text">共 {{ checkins.length }} 人已签到</text>
    </view>

    <view v-if="checkins.length > 0" class="list">
      <view class="checkin-card" v-for="(c, index) in checkins" :key="index">
        <view class="user-row">
          <view class="user-avatar">{{ getUserName(c).charAt(0) }}</view>
          <view class="user-info">
            <text class="user-name">{{ getUserName(c) }}</text>
            <text class="user-sid" v-if="getUserSid(c)">学号: {{ getUserSid(c) }}</text>
          </view>
          <view class="checkin-time-box">
            <text class="checkin-time">{{ formatTime(c.checkInTime) }}</text>
            <text class="checkin-date">{{ formatDate(c.checkInTime) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty">
      <text class="empty-text">暂无签到记录</text>
    </view>
  </view>
</template>

<script>
import { checkinApi } from '../../api/index';

export default {
  data() {
    return {
      activityId: '',
      checkins: []
    };
  },
  onLoad(options) {
    if (options.activityId) {
      this.activityId = options.activityId;
    }
  },
  onShow() {
    if (this.activityId) this.loadCheckins();
  },
  methods: {
    async loadCheckins() {
      try {
        var res = await checkinApi.getList(this.activityId);
        this.checkins = res.data.checkIns || [];
      } catch(err) { console.error(err); }
    },
    getUserName(c) {
      if (c.user && c.user.nickname) return c.user.nickname;
      return '未知';
    },
    getUserSid(c) {
      if (c.user && c.user.studentId) return c.user.studentId;
      return '';
    },
    formatDate(d) {
      if (!d) return '';
      var dt = new Date(d);
      return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    },
    formatTime(d) {
      if (!d) return '';
      var dt = new Date(d);
      return String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0') + ':' + String(dt.getSeconds()).padStart(2, '0');
    }
  }
};
</script>

<style scoped>
.checkin-manage-page { min-height: 100vh; background: #f5f5f5; }
.summary { background: linear-gradient(135deg, #2196F3, #42A5F5); padding: 32rpx; }
.summary-text { font-size: 32rpx; font-weight: bold; color: #fff; }
.list { padding: 20rpx; }
.checkin-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.user-row { display: flex; align-items: center; }
.user-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: #4CAF50; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32rpx; font-weight: bold; flex-shrink: 0; margin-right: 20rpx; }
.user-info { flex: 1; }
.user-name { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.user-sid { font-size: 24rpx; color: #666; margin-top: 4rpx; display: block; }
.checkin-time-box { flex-shrink: 0; text-align: right; }
.checkin-time { font-size: 30rpx; font-weight: bold; color: #2196F3; display: block; }
.checkin-date { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }
.empty { padding: 100rpx 0; text-align: center; }
.empty-text { font-size: 28rpx; color: #999; }
</style>
