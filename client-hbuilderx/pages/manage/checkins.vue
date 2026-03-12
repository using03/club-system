<template>
  <view class="checkin-manage-page">
    <view class="code-section">
      <view class="code-header">
        <text class="code-title">签到码</text>
        <switch :checked="codeEnabled" @change="toggleCode" color="#2196F3" />
      </view>
      <view v-if="codeEnabled" class="code-display">
        <text class="code-number">{{ checkinCode }}</text>
        <text class="code-hint">参与者需输入此签到码才能完成签到</text>
        <button class="btn-refresh-code" @click="refreshCode">刷新签到码</button>
      </view>
      <view v-else class="code-off">
        <text class="code-off-text">签到码已关闭，参与者可直接签到</text>
      </view>
    </view>

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
import { checkinApi, activityApi } from '../../api/index';

export default {
  data() {
    return {
      activityId: '',
      checkins: [],
      checkinCode: '',
      codeEnabled: false
    };
  },
  onLoad(options) {
    if (options.activityId) {
      this.activityId = options.activityId;
    }
  },
  onShow() {
    if (this.activityId) {
      this.loadCheckins();
      this.loadActivity();
    }
  },
  methods: {
    async loadActivity() {
      try {
        var res = await activityApi.getDetail(this.activityId);
        var act = res.data.activity;
        this.codeEnabled = act.checkinCodeEnabled || false;
        this.checkinCode = act.checkinCode || '';
      } catch(err) { console.error(err); }
    },
    async loadCheckins() {
      try {
        var res = await checkinApi.getList(this.activityId);
        this.checkins = res.data.checkIns || [];
      } catch(err) { console.error(err); }
    },
    async toggleCode(e) {
      var enabled = e.detail.value;
      try {
        if (enabled) {
          var res = await activityApi.generateCheckinCode(this.activityId);
          this.checkinCode = res.data.checkinCode;
          this.codeEnabled = true;
          uni.showToast({ title: '签到码已开启', icon: 'success' });
        } else {
          await activityApi.disableCheckinCode(this.activityId);
          this.codeEnabled = false;
          this.checkinCode = '';
          uni.showToast({ title: '签到码已关闭', icon: 'success' });
        }
      } catch(err) { console.error(err); }
    },
    async refreshCode() {
      try {
        var res = await activityApi.generateCheckinCode(this.activityId);
        this.checkinCode = res.data.checkinCode;
        uni.showToast({ title: '签到码已刷新', icon: 'success' });
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
.code-section { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; }
.code-header { display: flex; justify-content: space-between; align-items: center; }
.code-title { font-size: 30rpx; font-weight: bold; color: #333; }
.code-display { margin-top: 24rpx; text-align: center; }
.code-number { font-size: 80rpx; font-weight: bold; color: #2196F3; letter-spacing: 16rpx; display: block; padding: 24rpx 0; background: #E3F2FD; border-radius: 16rpx; }
.code-hint { font-size: 24rpx; color: #666; margin-top: 16rpx; display: block; }
.btn-refresh-code { margin-top: 20rpx; background: #E3F2FD; color: #1976D2; border: none; border-radius: 8rpx; height: 64rpx; line-height: 64rpx; font-size: 26rpx; }
.code-off { margin-top: 16rpx; }
.code-off-text { font-size: 26rpx; color: #999; }
.summary { background: linear-gradient(135deg, #2196F3, #42A5F5); padding: 24rpx 32rpx; margin-top: 4rpx; }
.summary-text { font-size: 28rpx; font-weight: bold; color: #fff; }
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
