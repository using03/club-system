<template>
  <view class="my-checkins-page">
    <view v-if="checkins.length > 0" class="list">
      <view class="checkin-card" v-for="(c, index) in checkins" :key="index" @click="goDetail(c)">
        <view class="card-icon">✅</view>
        <view class="card-body">
          <text class="act-title">{{ getActivityTitle(c) }}</text>
          <text class="act-info">{{ getActivityInfo(c) }}</text>
          <text class="checkin-time">签到时间：{{ formatDate(c.checkInTime) }}</text>
        </view>
      </view>
    </view>
    <view v-else class="empty">
      <text class="empty-icon">✅</text>
      <text class="empty-text">暂无签到记录</text>
    </view>
  </view>
</template>

<script>
import { authApi } from '../../api/index';

export default {
  data() {
    return {
      checkins: []
    };
  },
  onShow() {
    this.loadCheckins();
  },
  methods: {
    async loadCheckins() {
      try {
        var res = await authApi.getMyCheckins();
        this.checkins = res.data.checkins || [];
      } catch(err) {
        console.error(err);
      }
    },
    getActivityTitle(c) {
      if (c.activity && c.activity.title) return c.activity.title;
      return '活动已删除';
    },
    getActivityInfo(c) {
      if (!c.activity) return '';
      var parts = [];
      if (c.activity.location) parts.push(c.activity.location);
      if (c.activity.club && c.activity.club.name) parts.push(c.activity.club.name);
      return parts.join(' · ');
    },
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleString('zh-CN');
    },
    goDetail(c) {
      if (c.activity && c.activity._id) {
        uni.navigateTo({ url: '/pages/activity/detail?id=' + c.activity._id });
      }
    }
  }
};
</script>

<style scoped>
.list { padding: 20rpx; }
.checkin-card { display: flex; align-items: center; background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.card-icon { font-size: 40rpx; margin-right: 16rpx; flex-shrink: 0; }
.card-body { flex: 1; overflow: hidden; }
.act-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.act-info { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }
.checkin-time { font-size: 22rpx; color: #4CAF50; margin-top: 6rpx; display: block; }
.empty { display: flex; flex-direction: column; align-items: center; padding-top: 200rpx; }
.empty-icon { font-size: 100rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 20rpx; }
</style>
