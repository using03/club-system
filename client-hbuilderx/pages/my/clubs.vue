<template>
  <view class="my-clubs-page">
    <view v-if="clubs.length > 0" class="list">
      <view class="club-item" v-for="(club, index) in clubs" :key="index" @click="goDetail(club)">
        <image v-if="club.logo" :src="getLogoUrl(club.logo)" class="club-logo" mode="aspectFill" style="width:96rpx;height:96rpx;border-radius:50%;"></image>
        <view v-else class="club-avatar" :class="club.status">{{ club.name.charAt(0) }}</view>
        <view class="club-info">
          <view class="name-row">
            <text class="club-name">{{ club.name }}</text>
            <text class="status-badge pending" v-if="club.status === 'pending'">审核中</text>
            <text class="status-badge rejected" v-if="club.status === 'inactive'">已拒绝</text>
          </view>
          <text class="club-desc">{{ club.description || '暂无简介' }}</text>
          <view class="club-meta">
            <text class="meta">{{ club.category }}</text>
            <text class="meta">{{ club.memberCount }}人</text>
            <text class="meta">{{ getMyRole(club) }}</text>
          </view>
        </view>
      </view>
    </view>
    <view v-else class="empty">
      <text class="empty-icon">🏫</text>
      <text class="empty-text">你还没有加入任何社团</text>
      <button class="btn-explore" @click="goExplore">去看看</button>
    </view>
    <view class="reject-modal" v-if="showPendingInfo && selectedClub" @click="showPendingInfo = false">
      <view class="modal-content" @click.stop="">
        <text class="modal-title" style="color:#ff9800;">社团审核中</text>
        <text class="reject-club-name">{{ selectedClub.name }}</text>
        <text class="pending-hint">你的社团正在等待管理员审核，请耐心等待。</text>
        <button class="btn-withdraw" @click="withdrawClub">取消申请</button>
        <button class="btn-close" @click="showPendingInfo = false">关闭</button>
      </view>
    </view>

    <view class="reject-modal" v-if="showRejectInfo && selectedClub" @click="closeRejectInfo">
      <view class="modal-content" @click.stop="">
        <text class="modal-title">社团审核未通过</text>
        <text class="reject-club-name">{{ selectedClub.name }}</text>
        <view class="reject-reason-box">
          <text class="reject-label">拒绝原因：</text>
          <text class="reject-reason">{{ selectedClub.rejectReason || '未提供原因' }}</text>
        </view>
        <button class="btn-resubmit" @click="resubmitClub">修改并重新提交</button>
        <button class="btn-withdraw" @click="withdrawClub">取消申请</button>
        <button class="btn-close" @click="closeRejectInfo">关闭</button>
      </view>
    </view>
  </view>
</template>

<script>
import { authApi, clubApi } from '../../api/index';

export default {
  data() {
    return {
      clubs: [],
      currentUserId: '',
      showRejectInfo: false,
      showPendingInfo: false,
      selectedClub: null
    };
  },
  onShow() {
    var userStr = uni.getStorageSync('userInfo');
    if (userStr) {
      try { this.currentUserId = JSON.parse(userStr)._id; } catch(e) {}
    }
    this.loadMyClubs();
  },
  methods: {
    async loadMyClubs() {
      try {
        var res = await authApi.getMyClubs();
        this.clubs = res.data.clubs || [];
      } catch(err) { console.error(err); }
    },
    getLogoUrl(path) {
      if (!path) return '';
      if (path.indexOf('http') === 0) return path;
      return 'http://127.0.0.1:3000' + path;
    },
    getMyRole(club) {
      if (!club.members) return '成员';
      for (var i = 0; i < club.members.length; i++) {
        var m = club.members[i];
        var uid = (m.user && m.user._id) ? m.user._id : m.user;
        if (uid === this.currentUserId) {
          var map = { president: '社长', vice_president: '副社长', member: '成员' };
          return map[m.role] || '成员';
        }
      }
      return '成员';
    },
    goDetail(club) {
      if (club.status === 'inactive') {
        this.selectedClub = club;
        this.showRejectInfo = true;
        return;
      }
      if (club.status === 'pending') {
        this.selectedClub = club;
        this.showPendingInfo = true;
        return;
      }
      uni.navigateTo({ url: '/pages/club/detail?id=' + club._id });
    },
    closeRejectInfo() {
      this.showRejectInfo = false;
    },
    withdrawClub() {
      var self = this;
      uni.showModal({
        title: '取消申请',
        content: '取消后该社团申请将被删除，不可恢复。确定吗？',
        success: function(res) {
          if (res.confirm) {
            clubApi.withdraw(self.selectedClub._id).then(function() {
              uni.showToast({ title: '申请已撤回', icon: 'success' });
              self.showRejectInfo = false;
              self.showPendingInfo = false;
              self.loadMyClubs();
            });
          }
        }
      });
    },
    resubmitClub() {
      this.showRejectInfo = false;
      uni.navigateTo({ url: '/pages/club/reapply?id=' + this.selectedClub._id });
    },
    goExplore() {
      uni.navigateTo({ url: '/pages/club/list' });
    }
  }
};
</script>

<style scoped>
.list { padding: 20rpx; }
.club-item { display: flex; background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.club-avatar { width: 96rpx; height: 96rpx; border-radius: 50%; background: #4CAF50; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 36rpx; font-weight: bold; flex-shrink: 0; margin-right: 20rpx; }
.club-avatar.pending { background: #ff9800; }
.club-avatar.inactive { background: #999; }
.club-logo { width: 96rpx; height: 96rpx; border-radius: 50%; flex-shrink: 0; margin-right: 20rpx; }
.club-info { flex: 1; overflow: hidden; }
.name-row { display: flex; align-items: center; }
.club-name { font-size: 30rpx; font-weight: bold; color: #333; }
.status-badge { font-size: 20rpx; padding: 2rpx 14rpx; border-radius: 12rpx; margin-left: 12rpx; flex-shrink: 0; }
.status-badge.pending { background: #FFF3E0; color: #E65100; }
.status-badge.rejected { background: #FFEBEE; color: #f44336; }
.club-desc { font-size: 24rpx; color: #666; margin-top: 8rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.club-meta { margin-top: 8rpx; display: flex; }
.meta { font-size: 22rpx; color: #999; margin-right: 16rpx; }
.empty { display: flex; flex-direction: column; align-items: center; padding-top: 200rpx; }
.empty-icon { font-size: 100rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 20rpx; }
.btn-explore { margin-top: 40rpx; background: #4CAF50; color: #fff; border: none; border-radius: 40rpx; padding: 0 60rpx; height: 72rpx; line-height: 72rpx; font-size: 28rpx; }
.reject-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-content { width: 80%; background: #fff; border-radius: 16rpx; padding: 32rpx; }
.modal-title { font-size: 32rpx; font-weight: bold; color: #f44336; display: block; margin-bottom: 16rpx; }
.reject-club-name { font-size: 28rpx; color: #333; font-weight: bold; display: block; margin-bottom: 16rpx; }
.reject-reason-box { background: #FFF3E0; border-radius: 12rpx; padding: 20rpx; margin-bottom: 24rpx; }
.reject-label { font-size: 24rpx; color: #999; display: block; margin-bottom: 8rpx; }
.reject-reason { font-size: 28rpx; color: #E65100; display: block; line-height: 1.6; }
.btn-resubmit { width: 100%; background: #4CAF50; color: #fff; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; }
.btn-withdraw { width: 100%; background: #fff; color: #f44336; border: 2rpx solid #f44336; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; margin-top: 12rpx; }
.pending-hint { font-size: 28rpx; color: #666; display: block; margin-bottom: 24rpx; line-height: 1.6; }
.btn-close { width: 100%; background: #f5f5f5; color: #666; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; margin-top: 12rpx; }
</style>
