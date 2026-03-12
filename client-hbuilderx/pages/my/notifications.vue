<template>
  <view class="notifications-page">
    <view class="top-actions" v-if="notifications.length > 0 && unread > 0">
      <text class="unread-count">{{ unread }} 条未读</text>
      <text class="btn-read-all" @click="markAllRead">全部已读</text>
    </view>

    <view v-if="notifications.length > 0" class="list">
      <view class="noti-card" :class="{ unread: !n.read }" v-for="(n, index) in notifications" :key="index" @click="handleClick(n)">
        <view class="noti-icon" :class="n.type">{{ getIcon(n.type) }}</view>
        <view class="noti-body">
          <text class="noti-title">{{ n.title }}</text>
          <text class="noti-content">{{ n.content }}</text>
          <text class="noti-time">{{ formatTime(n.createdAt) }}</text>
        </view>
        <view class="noti-dot" v-if="!n.read"></view>
      </view>
    </view>

    <view v-else class="empty">
      <text class="empty-icon">🔔</text>
      <text class="empty-text">暂无消息</text>
    </view>
  </view>
</template>

<script>
import { notificationApi } from '../../api/index';

export default {
  data() {
    return {
      notifications: [],
      unread: 0
    };
  },
  onShow() {
    this.loadNotifications();
  },
  methods: {
    async loadNotifications() {
      try {
        var res = await notificationApi.getList({ limit: 50 });
        this.notifications = res.data.notifications || [];
        this.unread = res.data.unread || 0;
      } catch(err) { console.error(err); }
    },
    getIcon(type) {
      var map = {
        club_approved: '✅', club_rejected: '❌',
        registration_approved: '✅', registration_rejected: '❌',
        member_joined: '👤', activity_reminder: '⏰'
      };
      return map[type] || '📢';
    },
    formatTime(d) {
      if (!d) return '';
      var dt = new Date(d);
      var now = new Date();
      var diff = now.getTime() - dt.getTime();
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
      return (dt.getMonth() + 1) + '月' + dt.getDate() + '日';
    },
    async handleClick(n) {
      if (!n.read) {
        await notificationApi.markRead(n._id);
        n.read = true;
        this.unread = Math.max(0, this.unread - 1);
      }
      if (n.relatedId) {
        if (n.type === 'club_approved' || n.type === 'club_rejected') {
          if (n.type === 'club_approved') {
            uni.navigateTo({ url: '/pages/club/detail?id=' + n.relatedId });
          }
        } else if (n.type === 'registration_approved' || n.type === 'registration_rejected' || n.type === 'activity_reminder') {
          uni.navigateTo({ url: '/pages/activity/detail?id=' + n.relatedId });
        } else if (n.type === 'member_joined') {
          uni.navigateTo({ url: '/pages/club/detail?id=' + n.relatedId });
        }
      }
    },
    async markAllRead() {
      try {
        await notificationApi.markAllRead();
        this.notifications.forEach(function(n) { n.read = true; });
        this.unread = 0;
        uni.showToast({ title: '全部已读', icon: 'success' });
      } catch(err) { console.error(err); }
    }
  }
};
</script>

<style scoped>
.notifications-page { min-height: 100vh; background: #f5f5f5; }
.top-actions { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 24rpx; background: #fff; border-bottom: 1rpx solid #eee; }
.unread-count { font-size: 26rpx; color: #f44336; font-weight: bold; }
.btn-read-all { font-size: 26rpx; color: #2196F3; }
.list { padding: 12rpx 20rpx; }
.noti-card { display: flex; align-items: flex-start; background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 12rpx; position: relative; }
.noti-card.unread { background: #F3F8FF; }
.noti-icon { width: 64rpx; height: 64rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28rpx; flex-shrink: 0; margin-right: 16rpx; background: #f5f5f5; }
.noti-icon.club_approved, .noti-icon.registration_approved { background: #E8F5E9; }
.noti-icon.club_rejected, .noti-icon.registration_rejected { background: #FFEBEE; }
.noti-icon.member_joined { background: #E3F2FD; }
.noti-body { flex: 1; overflow: hidden; }
.noti-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.noti-content { font-size: 24rpx; color: #666; margin-top: 6rpx; display: block; }
.noti-time { font-size: 22rpx; color: #bbb; margin-top: 8rpx; display: block; }
.noti-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #f44336; position: absolute; top: 28rpx; right: 24rpx; }
.empty { display: flex; flex-direction: column; align-items: center; padding-top: 200rpx; }
.empty-icon { font-size: 100rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 20rpx; }
</style>
