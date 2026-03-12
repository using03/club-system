<template>
  <view class="review-page">
    <view class="tab-bar">
      <text :class="['tab', currentTab === 'pending' ? 'active' : '']" @click="currentTab = 'pending'">待审核 ({{ pendingList.length }})</text>
      <text :class="['tab', currentTab === 'approved' ? 'active' : '']" @click="currentTab = 'approved'">已通过 ({{ approvedList.length }})</text>
      <text :class="['tab', currentTab === 'rejected' ? 'active' : '']" @click="currentTab = 'rejected'">已拒绝 ({{ rejectedList.length }})</text>
    </view>

    <view class="list" v-if="currentList.length > 0">
      <view class="reg-card" v-for="(r, index) in currentList" :key="index">
        <view class="user-row">
          <view class="user-avatar">{{ getUserName(r).charAt(0) }}</view>
          <view class="user-info">
            <text class="user-name">{{ getUserName(r) }}</text>
            <text class="user-detail" v-if="getUserStudentId(r)">学号: {{ getUserStudentId(r) }}</text>
            <text class="reg-time">报名时间: {{ formatDate(r.createdAt) }}</text>
            <text class="reg-remark" v-if="r.remark">备注: {{ r.remark }}</text>
          </view>
        </view>
        <view class="action-row" v-if="r.status === 'pending'">
          <button class="btn-approve" @click="handleReview(r._id, 'approved')">通过</button>
          <button class="btn-reject" @click="handleReview(r._id, 'rejected')">拒绝</button>
        </view>
        <view class="status-row" v-else>
          <text class="status-badge" :class="r.status">{{ statusText(r.status) }}</text>
        </view>
      </view>
    </view>
    <view v-else class="empty">
      <text class="empty-text">暂无{{ tabLabel }}的报名</text>
    </view>
  </view>
</template>

<script>
import { activityApi } from '../../api/index';

export default {
  data() {
    return {
      activityId: '',
      registrations: [],
      currentTab: 'pending'
    };
  },
  computed: {
    pendingList() { return this.registrations.filter(function(r) { return r.status === 'pending'; }); },
    approvedList() { return this.registrations.filter(function(r) { return r.status === 'approved'; }); },
    rejectedList() { return this.registrations.filter(function(r) { return r.status === 'rejected'; }); },
    currentList() {
      if (this.currentTab === 'pending') return this.pendingList;
      if (this.currentTab === 'approved') return this.approvedList;
      return this.rejectedList;
    },
    tabLabel() {
      var map = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };
      return map[this.currentTab] || '';
    }
  },
  onLoad(options) {
    if (options.activityId) {
      this.activityId = options.activityId;
    }
  },
  onShow() {
    if (this.activityId) this.loadRegistrations();
  },
  methods: {
    async loadRegistrations() {
      try {
        var res = await activityApi.getDetail(this.activityId);
        this.registrations = res.data.registrations || [];
      } catch(err) { console.error(err); }
    },
    getUserName(r) {
      if (r.user && r.user.nickname) return r.user.nickname;
      return '未知用户';
    },
    getUserStudentId(r) {
      if (r.user && r.user.studentId) return r.user.studentId;
      return '';
    },
    statusText(s) {
      var map = { pending: '待审核', approved: '已通过', rejected: '已拒绝', cancelled: '已取消' };
      return map[s] || s;
    },
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleString('zh-CN');
    },
    async handleReview(regId, status) {
      try {
        await activityApi.reviewRegistration(this.activityId, regId, { status: status });
        uni.showToast({ title: status === 'approved' ? '已通过' : '已拒绝', icon: 'success' });
        this.loadRegistrations();
      } catch(err) { console.error(err); }
    }
  }
};
</script>

<style scoped>
.review-page { min-height: 100vh; background: #f5f5f5; }
.tab-bar { display: flex; background: #fff; border-bottom: 1rpx solid #eee; }
.tab { flex: 1; text-align: center; padding: 24rpx 0; font-size: 28rpx; color: #666; }
.tab.active { color: #4CAF50; border-bottom: 4rpx solid #4CAF50; font-weight: bold; }
.list { padding: 20rpx; }
.reg-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.user-row { display: flex; align-items: flex-start; }
.user-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: #4CAF50; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32rpx; font-weight: bold; flex-shrink: 0; margin-right: 20rpx; }
.user-info { flex: 1; }
.user-name { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.user-detail { font-size: 24rpx; color: #666; margin-top: 6rpx; display: block; }
.reg-time { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }
.reg-remark { font-size: 24rpx; color: #ff9800; margin-top: 6rpx; display: block; }
.action-row { display: flex; margin-top: 20rpx; padding-top: 16rpx; border-top: 1rpx solid #f5f5f5; }
.action-row button { flex: 1; height: 72rpx; line-height: 72rpx; font-size: 28rpx; border: none; border-radius: 8rpx; margin: 0 8rpx; }
.btn-approve { background: #4CAF50; color: #fff; }
.btn-reject { background: #f5f5f5; color: #f44336; }
.status-row { margin-top: 16rpx; padding-top: 12rpx; border-top: 1rpx solid #f5f5f5; }
.status-badge { font-size: 24rpx; padding: 4rpx 20rpx; border-radius: 20rpx; }
.status-badge.approved { background: #E8F5E9; color: #4CAF50; }
.status-badge.rejected { background: #FFEBEE; color: #f44336; }
.empty { padding: 100rpx 0; text-align: center; }
.empty-text { font-size: 28rpx; color: #999; }
</style>
