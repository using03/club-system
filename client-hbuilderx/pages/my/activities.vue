<template>
  <view class="my-activities-page">
    <view v-if="activities.length > 0" class="list">
      <view class="activity-card" v-for="(act, index) in activities" :key="index" @click="goDetail(act._id)">
        <view class="card-header">
          <text class="activity-title">{{ act.title }}</text>
          <text class="reg-badge" :class="act.regStatus">{{ regStatusText(act.regStatus) }}</text>
        </view>
        <view class="card-meta">
          <text class="meta">{{ act.location }}</text>
          <text class="meta">{{ formatDate(act.startTime) }}</text>
          <text class="meta" v-if="act.club">{{ act.club.name }}</text>
        </view>
        <view class="card-footer">
          <text class="status-text">活动状态：{{ statusText(act.status) }}</text>
        </view>
      </view>
    </view>
    <view v-else class="empty">
      <text class="empty-icon">📅</text>
      <text class="empty-text">你还没有报名任何活动</text>
      <button class="btn-explore" @click="goExplore">去看看</button>
    </view>
  </view>
</template>

<script>
import { authApi } from '@/api/index';

export default {
  data() {
    return {
      activities: []
    };
  },
  onShow() {
    this.loadMyActivities();
  },
  methods: {
    async loadMyActivities() {
      try {
        var res = await authApi.getMyActivities();
        this.activities = res.data.activities || [];
      } catch(err) {
        console.error(err);
      }
    },
    regStatusText(s) {
      var map = { pending: '待审核', approved: '已通过', rejected: '已拒绝', cancelled: '已取消' };
      return map[s] || s;
    },
    statusText(s) {
      var map = { draft: '草稿', published: '报名中', registration: '报名中', ongoing: '进行中', ended: '已结束', cancelled: '已取消' };
      return map[s] || s;
    },
    formatDate(d) {
      if (!d) return '';
      var dt = new Date(d);
      return (dt.getMonth() + 1) + '月' + dt.getDate() + '日 ' + dt.getHours() + ':' + String(dt.getMinutes()).padStart(2, '0');
    },
    goDetail(id) {
      uni.navigateTo({ url: '/pages/activity/detail?id=' + id });
    },
    goExplore() {
      uni.switchTab({ url: '/pages/activity/list' });
    }
  }
};
</script>

<style scoped>
.list { padding: 20rpx; }
.activity-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.activity-title { font-size: 30rpx; font-weight: bold; color: #333; flex: 1; }
.reg-badge { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 20rpx; flex-shrink: 0; margin-left: 12rpx; }
.reg-badge.approved { background: #E8F5E9; color: #4CAF50; }
.reg-badge.pending { background: #FFF3E0; color: #ff9800; }
.reg-badge.rejected { background: #FFEBEE; color: #f44336; }
.card-meta { margin-top: 12rpx; display: flex; flex-wrap: wrap; }
.meta { font-size: 22rpx; color: #999; margin-right: 16rpx; }
.card-footer { margin-top: 12rpx; }
.status-text { font-size: 22rpx; color: #666; }
.empty { display: flex; flex-direction: column; align-items: center; padding-top: 200rpx; }
.empty-icon { font-size: 100rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 20rpx; }
.btn-explore { margin-top: 40rpx; background: #4CAF50; color: #fff; border: none; border-radius: 40rpx; padding: 0 60rpx; height: 72rpx; line-height: 72rpx; font-size: 28rpx; }
</style>
