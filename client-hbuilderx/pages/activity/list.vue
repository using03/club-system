<template>
  <view class="activity-list-page">
    <view class="search-bar">
      <input v-model="keyword" placeholder="搜索活动" class="search-input" @confirm="loadActivities" />
    </view>
    <view class="status-bar">
      <text
        v-for="s in statusList" :key="s.value"
        :class="['status-item', selectedStatus === s.value ? 'active' : '']"
        @click="selectStatus(s.value)"
      >{{ s.label }}</text>
    </view>
    <view class="list">
      <view class="activity-card" v-for="act in activities" :key="act._id" @click="goDetail(act._id)">
        <view class="card-header">
          <text class="activity-title">{{ act.title }}</text>
          <text class="status-badge" :class="act.status">{{ statusText(act.status) }}</text>
        </view>
        <text class="activity-desc">{{ act.description }}</text>
        <view class="card-meta">
          <text class="meta">📍 {{ act.location }}</text>
          <text class="meta">📅 {{ formatDate(act.startTime) }}</text>
          <text class="meta" v-if="act.club">🏫 {{ act.club.name }}</text>
        </view>
        <view class="card-tags" v-if="act.tags && act.tags.length > 0">
          <text class="act-tag" v-for="(t, i) in act.tags" :key="i">{{ t }}</text>
        </view>
        <view class="card-footer">
          <text class="participants">
            {{ act.currentParticipants }}/{{ act.maxParticipants || '不限' }} 人报名
          </text>
          <text class="approval" v-if="act.needApproval">需审核</text>
        </view>
      </view>
      <view v-if="activities.length === 0" class="empty">暂无活动</view>
    </view>
  </view>
</template>

<script>
import { activityApi } from '../../api/index';

export default {
  data() {
    return {
      activities: [],
      keyword: '',
      selectedStatus: '',
      statusList: [
        { label: '全部', value: '' },
        { label: '报名中', value: 'published' },
        { label: '进行中', value: 'ongoing' },
        { label: '已结束', value: 'ended' }
      ]
    };
  },
  onShow() {
    this.loadActivities();
  },
  methods: {
    async loadActivities() {
      try {
        const params = { limit: 20 };
        if (this.keyword) params.keyword = this.keyword;
        if (this.selectedStatus) params.status = this.selectedStatus;
        const res = await activityApi.getList(params);
        this.activities = res.data.activities || [];
      } catch(err) { console.error(err); }
    },
    selectStatus(s) {
      this.selectedStatus = s;
      this.loadActivities();
    },
    statusText(status) {
      return { draft: '草稿', published: '报名中', registration: '报名中', ongoing: '进行中', ended: '已结束', cancelled: '已取消' }[status] || status;
    },
    formatDate(d) {
      if (!d) return '';
      const dt = new Date(d);
      return `${dt.getMonth()+1}月${dt.getDate()}日 ${dt.getHours()}:${String(dt.getMinutes()).padStart(2,'0')}`;
    },
    goDetail(id) {
      uni.navigateTo({ url: `/pages/activity/detail?id=${id}` });
    }
  }
};
</script>

<style scoped>
.search-bar { padding: 16rpx 20rpx; background: #fff; }
.search-input { background: #f5f5f5; border-radius: 36rpx; height: 72rpx; padding: 0 24rpx; font-size: 28rpx; }
.status-bar { display: flex; padding: 16rpx 20rpx; background: #fff; gap: 12rpx; border-bottom: 1rpx solid #eee; }
.status-item { font-size: 24rpx; color: #666; padding: 8rpx 24rpx; border-radius: 24rpx; background: #f5f5f5; }
.status-item.active { background: #4CAF50; color: #fff; }
.list { padding: 20rpx; }
.activity-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.activity-title { font-size: 30rpx; font-weight: bold; color: #333; flex: 1; }
.status-badge { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 20rpx; flex-shrink: 0; }
.status-badge.published { background: #E3F2FD; color: #1976D2; }
.status-badge.ongoing { background: #FFF3E0; color: #E65100; }
.status-badge.ended { background: #f5f5f5; color: #999; }
.activity-desc { font-size: 26rpx; color: #666; margin-top: 12rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-meta { margin-top: 12rpx; display: flex; flex-wrap: wrap; gap: 12rpx; }
.meta { font-size: 22rpx; color: #999; }
.card-tags { margin-top: 10rpx; display: flex; flex-wrap: wrap; }
.act-tag { font-size: 20rpx; color: #E65100; background: #FFF3E0; padding: 4rpx 16rpx; border-radius: 20rpx; margin: 0 8rpx 8rpx 0; }
.card-footer { margin-top: 12rpx; display: flex; justify-content: space-between; align-items: center; }
.participants { font-size: 24rpx; color: #4CAF50; }
.approval { font-size: 20rpx; color: #ff9800; background: #FFF3E0; padding: 4rpx 12rpx; border-radius: 8rpx; }
.empty { text-align: center; color: #999; padding: 60rpx; }
</style>
