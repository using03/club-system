<template>
  <view class="activity-detail" v-if="activity">
    <view class="header">
      <text class="title">{{ activity.title }}</text>
      <text class="status" :class="activity.status">{{ statusText(activity.status) }}</text>
    </view>

    <view class="info-section">
      <view class="info-item">
        <text class="label">📍 地点</text>
        <text class="value">{{ activity.location }}</text>
      </view>
      <view class="info-item">
        <text class="label">📅 开始</text>
        <text class="value">{{ formatDate(activity.startTime) }}</text>
      </view>
      <view class="info-item">
        <text class="label">📅 结束</text>
        <text class="value">{{ formatDate(activity.endTime) }}</text>
      </view>
      <view class="info-item">
        <text class="label">👥 人数</text>
        <text class="value">{{ activity.currentParticipants }}/{{ activity.maxParticipants || '不限' }}</text>
      </view>
      <view class="info-item" v-if="activity.club">
        <text class="label">🏫 社团</text>
        <text class="value link" @click="goClub(activity.club._id)">{{ activity.club.name }}</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">活动详情</text>
      <text class="desc">{{ activity.description }}</text>
    </view>

    <view class="section" v-if="registrations.length > 0">
      <text class="section-title">已报名 ({{ registrations.length }})</text>
      <view class="reg-list">
        <view class="reg-item" v-for="r in registrations" :key="r._id">
          <text class="reg-name">{{ r.user?.nickname || '未知' }}</text>
          <text class="reg-status" :class="r.status">{{ regStatusText(r.status) }}</text>
        </view>
      </view>
    </view>

    <view class="section" v-if="feedbacks.length > 0">
      <text class="section-title">活动评价 ({{ avgRating }}分)</text>
      <view class="feedback-list">
        <view class="feedback-item" v-for="f in feedbacks" :key="f._id">
          <view class="fb-header">
            <text class="fb-name">{{ f.user?.nickname || '匿名' }}</text>
            <text class="fb-rating">{{ '★'.repeat(f.rating) }}{{ '☆'.repeat(5-f.rating) }}</text>
          </view>
          <text class="fb-comment" v-if="f.comment">{{ f.comment }}</text>
        </view>
      </view>
    </view>

    <view class="bottom-actions">
      <button v-if="canRegister" class="btn-register" @click="registerActivity">立即报名</button>
      <button v-if="canCheckIn" class="btn-checkin" @click="checkIn">签到打卡</button>
      <button v-if="canFeedback" class="btn-feedback" @click="showFeedback = true">评价活动</button>
    </view>

    <view class="feedback-modal" v-if="showFeedback" @click.self="showFeedback = false">
      <view class="modal-content">
        <text class="modal-title">活动评价</text>
        <view class="star-rating">
          <text
            v-for="i in 5" :key="i"
            class="star" :class="{ active: i <= feedbackForm.rating }"
            @click="feedbackForm.rating = i"
          >★</text>
        </view>
        <textarea v-model="feedbackForm.comment" placeholder="请输入评价内容" class="comment-input" />
        <button class="btn-submit" @click="submitFeedback">提交评价</button>
      </view>
    </view>
  </view>
</template>

<script>
import { activityApi, checkinApi, feedbackApi } from '../../api/index';

export default {
  data() {
    return {
      activity: null,
      registrations: [],
      feedbacks: [],
      avgRating: 0,
      myRegistration: null,
      myCheckIn: false,
      showFeedback: false,
      feedbackForm: { rating: 5, comment: '' },
      currentUserId: ''
    };
  },
  computed: {
    canRegister() {
      return this.activity &&
        ['published', 'registration'].includes(this.activity.status) &&
        !this.myRegistration;
    },
    canCheckIn() {
      return this.activity &&
        ['published', 'registration', 'ongoing'].includes(this.activity.status) &&
        this.myRegistration?.status === 'approved' &&
        !this.myCheckIn;
    },
    canFeedback() {
      return this.activity && this.myCheckIn;
    }
  },
  onLoad(options) {
    const userStr = uni.getStorageSync('userInfo');
    if (userStr) {
      try { this.currentUserId = JSON.parse(userStr)._id; } catch(e) {}
    }
    if (options.id) this.loadDetail(options.id);
  },
  methods: {
    async loadDetail(id) {
      try {
        const res = await activityApi.getDetail(id);
        this.activity = res.data.activity;
        this.registrations = res.data.registrations || [];
        this.myRegistration = this.registrations.find(r => r.user?._id === this.currentUserId);

        if (this.currentUserId) {
          try {
            const checkRes = await checkinApi.getStatus(id);
            this.myCheckIn = checkRes.data.checkedIn;
          } catch(e) {}
        }

        try {
          const fbRes = await feedbackApi.getList(id);
          this.feedbacks = fbRes.data.feedbacks || [];
          this.avgRating = fbRes.data.avgRating || 0;
        } catch(e) {}
      } catch(err) { console.error(err); }
    },
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleString('zh-CN');
    },
    statusText(s) {
      return { draft: '草稿', published: '报名中', registration: '报名中', ongoing: '进行中', ended: '已结束', cancelled: '已取消' }[s] || s;
    },
    regStatusText(s) {
      return { pending: '待审核', approved: '已通过', rejected: '已拒绝', cancelled: '已取消' }[s] || s;
    },
    goClub(id) {
      uni.navigateTo({ url: `/pages/club/detail?id=${id}` });
    },
    async registerActivity() {
      try {
        await activityApi.register(this.activity._id, {});
        uni.showToast({ title: '报名成功', icon: 'success' });
        this.loadDetail(this.activity._id);
      } catch(err) { console.error(err); }
    },
    async checkIn() {
      try {
        await checkinApi.checkIn(this.activity._id, {});
        uni.showToast({ title: '签到成功', icon: 'success' });
        this.myCheckIn = true;
      } catch(err) { console.error(err); }
    },
    async submitFeedback() {
      try {
        await feedbackApi.submit(this.activity._id, this.feedbackForm);
        uni.showToast({ title: '评价成功', icon: 'success' });
        this.showFeedback = false;
        this.loadDetail(this.activity._id);
      } catch(err) { console.error(err); }
    }
  }
};
</script>

<style scoped>
.activity-detail { padding-bottom: 120rpx; }
.header { background: linear-gradient(135deg, #4CAF50, #66BB6A); padding: 32rpx; color: #fff; }
.title { font-size: 36rpx; font-weight: bold; display: block; }
.status { font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 20rpx; margin-top: 12rpx; display: inline-block; }
.status.published { background: rgba(255,255,255,0.3); }
.status.ongoing { background: rgba(255,255,255,0.3); }
.info-section { background: #fff; padding: 24rpx; margin: 20rpx; border-radius: 16rpx; }
.info-item { display: flex; justify-content: space-between; padding: 12rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.info-item:last-child { border-bottom: none; }
.label { font-size: 28rpx; color: #666; }
.value { font-size: 28rpx; color: #333; }
.value.link { color: #4CAF50; }
.section { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; display: block; }
.desc { font-size: 28rpx; color: #666; line-height: 1.8; display: block; }
.reg-list { display: flex; flex-wrap: wrap; gap: 12rpx; }
.reg-item { display: flex; align-items: center; gap: 8rpx; background: #f5f5f5; padding: 8rpx 16rpx; border-radius: 8rpx; }
.reg-name { font-size: 24rpx; color: #333; }
.reg-status { font-size: 20rpx; }
.reg-status.approved { color: #4CAF50; }
.reg-status.pending { color: #ff9800; }
.reg-status.rejected { color: #f44336; }
.feedback-list { }
.feedback-item { padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.fb-header { display: flex; justify-content: space-between; }
.fb-name { font-size: 26rpx; color: #333; }
.fb-rating { color: #ff9800; font-size: 24rpx; }
.fb-comment { font-size: 24rpx; color: #666; margin-top: 8rpx; display: block; }
.bottom-actions { position: fixed; bottom: 0; left: 0; right: 0; padding: 16rpx 20rpx; background: #fff; display: flex; gap: 16rpx; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.06); }
.btn-register { flex: 1; background: #4CAF50; color: #fff; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; }
.btn-checkin { flex: 1; background: #2196F3; color: #fff; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; }
.btn-feedback { flex: 1; background: #ff9800; color: #fff; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; }
.feedback-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-content { width: 80%; background: #fff; border-radius: 16rpx; padding: 32rpx; }
.modal-title { font-size: 32rpx; font-weight: bold; color: #333; display: block; text-align: center; margin-bottom: 24rpx; }
.star-rating { display: flex; justify-content: center; gap: 16rpx; margin-bottom: 24rpx; }
.star { font-size: 48rpx; color: #ddd; }
.star.active { color: #ff9800; }
.comment-input { width: 100%; height: 200rpx; background: #f5f5f5; border-radius: 12rpx; padding: 16rpx; font-size: 28rpx; box-sizing: border-box; }
.btn-submit { width: 100%; background: #4CAF50; color: #fff; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; margin-top: 24rpx; }
</style>
