<template>
  <view class="review-clubs-page">
    <view v-if="clubs.length > 0" class="list">
      <view class="club-card" v-for="(club, index) in clubs" :key="index">
        <view class="club-row">
          <view class="club-avatar">{{ club.name.charAt(0) }}</view>
          <view class="club-info">
            <text class="club-name">{{ club.name }}</text>
            <text class="club-cat">{{ club.category }}</text>
            <text class="club-desc">{{ club.description || '暂无简介' }}</text>
            <text class="club-applicant" v-if="club.president">申请人: {{ club.president.nickname || '未知' }}</text>
          </view>
        </view>
        <view class="action-row">
          <button class="btn-approve" @click="handleApprove(club._id)">通过</button>
          <button class="btn-reject" @click="openReject(club._id)">拒绝</button>
        </view>
      </view>
    </view>
    <view v-else class="empty">
      <text class="empty-text">暂无待审核的社团</text>
    </view>

    <view class="reject-modal" v-if="showReject" @click="showReject = false">
      <view class="modal-content" @click.stop="">
        <text class="modal-title">拒绝原因</text>
        <textarea v-model="rejectReason" placeholder="请输入拒绝原因（必填）" class="reason-input" />
        <button class="btn-confirm-reject" @click="confirmReject">确认拒绝</button>
        <button class="btn-cancel" @click="showReject = false">取消</button>
      </view>
    </view>
  </view>
</template>

<script>
import { clubApi } from '../../api/index';

export default {
  data() {
    return {
      clubs: [],
      showReject: false,
      rejectClubId: '',
      rejectReason: ''
    };
  },
  onShow() {
    this.loadPending();
  },
  methods: {
    async loadPending() {
      try {
        var res = await clubApi.getPending();
        this.clubs = res.data.clubs || [];
      } catch(err) { console.error(err); }
    },
    async handleApprove(id) {
      try {
        await clubApi.approve(id);
        uni.showToast({ title: '已通过', icon: 'success' });
        this.loadPending();
      } catch(err) { console.error(err); }
    },
    openReject(id) {
      this.rejectClubId = id;
      this.rejectReason = '';
      this.showReject = true;
    },
    async confirmReject() {
      if (!this.rejectReason.trim()) {
        uni.showToast({ title: '请填写拒绝原因', icon: 'none' });
        return;
      }
      try {
        await clubApi.reject(this.rejectClubId, { reason: this.rejectReason });
        uni.showToast({ title: '已拒绝', icon: 'success' });
        this.showReject = false;
        this.loadPending();
      } catch(err) { console.error(err); }
    }
  }
};
</script>

<style scoped>
.review-clubs-page { min-height: 100vh; background: #f5f5f5; padding: 20rpx; }
.club-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.club-row { display: flex; align-items: flex-start; }
.club-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: #ff9800; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32rpx; font-weight: bold; flex-shrink: 0; margin-right: 20rpx; }
.club-info { flex: 1; }
.club-name { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.club-cat { font-size: 24rpx; color: #4CAF50; margin-top: 4rpx; display: block; }
.club-desc { font-size: 24rpx; color: #666; margin-top: 6rpx; display: block; }
.club-applicant { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }
.action-row { display: flex; margin-top: 20rpx; padding-top: 16rpx; border-top: 1rpx solid #f5f5f5; }
.action-row button { flex: 1; height: 72rpx; line-height: 72rpx; font-size: 28rpx; border: none; border-radius: 8rpx; margin: 0 8rpx; }
.btn-approve { background: #4CAF50; color: #fff; }
.btn-reject { background: #f5f5f5; color: #f44336; }
.empty { padding: 100rpx 0; text-align: center; }
.empty-text { font-size: 28rpx; color: #999; }
.reject-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-content { width: 80%; background: #fff; border-radius: 16rpx; padding: 32rpx; }
.modal-title { font-size: 32rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.reason-input { width: 100%; height: 200rpx; background: #f5f5f5; border-radius: 12rpx; padding: 16rpx; font-size: 28rpx; box-sizing: border-box; }
.btn-confirm-reject { width: 100%; background: #f44336; color: #fff; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; margin-top: 20rpx; }
.btn-cancel { width: 100%; background: #f5f5f5; color: #666; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; margin-top: 12rpx; }
</style>
