<template>
  <view class="my-reg-page">
    <view v-if="registrations.length > 0" class="list">
      <view class="reg-card" v-for="(r, index) in registrations" :key="index" @click="goDetail(r)">
        <view class="card-left">
          <text class="status-dot" :class="r.status"></text>
        </view>
        <view class="card-body">
          <text class="act-title">{{ getActivityTitle(r) }}</text>
          <text class="act-info">{{ getActivityInfo(r) }}</text>
          <text class="reg-time">报名时间：{{ formatDate(r.createdAt) }}</text>
        </view>
        <view class="card-right">
          <text class="status-text" :class="r.status">{{ statusText(r.status) }}</text>
        </view>
      </view>
    </view>
    <view v-else class="empty">
      <text class="empty-icon">📝</text>
      <text class="empty-text">暂无报名记录</text>
    </view>
  </view>
</template>

<script>
import { authApi } from '../../api/index';

export default {
  data() {
    return {
      registrations: []
    };
  },
  onShow() {
    this.loadRegistrations();
  },
  methods: {
    async loadRegistrations() {
      try {
        var res = await authApi.getMyRegistrations();
        this.registrations = res.data.registrations || [];
      } catch(err) {
        console.error(err);
      }
    },
    getActivityTitle(r) {
      if (r.activity && r.activity.title) return r.activity.title;
      return '活动已删除';
    },
    getActivityInfo(r) {
      if (!r.activity) return '';
      var parts = [];
      if (r.activity.location) parts.push(r.activity.location);
      if (r.activity.club && r.activity.club.name) parts.push(r.activity.club.name);
      return parts.join(' · ');
    },
    statusText(s) {
      var map = { pending: '待审核', approved: '已通过', rejected: '已拒绝', cancelled: '已取消' };
      return map[s] || s;
    },
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleString('zh-CN');
    },
    goDetail(r) {
      if (r.activity && r.activity._id) {
        uni.navigateTo({ url: '/pages/activity/detail?id=' + r.activity._id });
      }
    }
  }
};
</script>

<style scoped>
.list { padding: 20rpx; }
.reg-card { display: flex; align-items: center; background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.card-left { margin-right: 16rpx; }
.status-dot { width: 16rpx; height: 16rpx; border-radius: 50%; display: block; }
.status-dot.approved { background: #4CAF50; }
.status-dot.pending { background: #ff9800; }
.status-dot.rejected { background: #f44336; }
.status-dot.cancelled { background: #999; }
.card-body { flex: 1; overflow: hidden; }
.act-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.act-info { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }
.reg-time { font-size: 22rpx; color: #bbb; margin-top: 6rpx; display: block; }
.card-right { flex-shrink: 0; margin-left: 16rpx; }
.status-text { font-size: 24rpx; }
.status-text.approved { color: #4CAF50; }
.status-text.pending { color: #ff9800; }
.status-text.rejected { color: #f44336; }
.status-text.cancelled { color: #999; }
.empty { display: flex; flex-direction: column; align-items: center; padding-top: 200rpx; }
.empty-icon { font-size: 100rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 20rpx; }
</style>
