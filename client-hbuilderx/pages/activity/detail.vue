<template>
  <view class="activity-detail" v-if="activity">
    <image class="cover-image" v-if="activity.coverImage" :src="getImageUrl(activity.coverImage)" mode="aspectFill"></image>
    <view class="header">
      <text class="title">{{ activity.title }}</text>
      <text class="status-tag">{{ statusText(activity.status) }}</text>
    </view>

    <view class="info-section">
      <view class="info-item">
        <text class="label">地点</text>
        <text class="value">{{ activity.location }}</text>
      </view>
      <view class="info-item">
        <text class="label">开始</text>
        <text class="value">{{ formatDate(activity.startTime) }}</text>
      </view>
      <view class="info-item">
        <text class="label">结束</text>
        <text class="value">{{ formatDate(activity.endTime) }}</text>
      </view>
      <view class="info-item">
        <text class="label">人数</text>
        <text class="value">{{ activity.currentParticipants }}/{{ activity.maxParticipants || '不限' }}</text>
      </view>
      <view class="info-item" v-if="activity.club">
        <text class="label">社团</text>
        <text class="value link" @click="goClub(activity.club._id)">{{ activity.club.name }}</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">活动详情</text>
      <text class="desc">{{ activity.description }}</text>
      <view class="tags-row" v-if="activity.tags && activity.tags.length > 0">
        <text class="tag" v-for="(t, i) in activity.tags" :key="i">{{ t }}</text>
      </view>
      <view class="image-gallery" v-if="activity.images && activity.images.length > 0">
        <view class="gallery-item" v-for="(img, index) in activity.images" :key="index">
          <image :src="getImageUrl(img)" mode="aspectFill" class="gallery-image" @click="previewImage(index)"></image>
          <text v-if="isOrganizer" class="img-delete" @click="removeImage(index)">✕</text>
        </view>
      </view>
      <view v-if="isOrganizer" class="upload-section">
        <button class="btn-upload" @click="chooseAndUploadImages">上传活动图片</button>
        <text class="upload-hint">支持 jpg/png/gif，最多9张</text>
      </view>
    </view>

    <view class="section" v-if="registrations.length > 0">
      <text class="section-title">已报名 ({{ registrations.length }})</text>
      <view class="reg-list">
        <view class="reg-item" v-for="(r, index) in registrations" :key="index">
          <text class="reg-name">{{ getRegUserName(r) }}</text>
          <text class="reg-status" :class="r.status">{{ regStatusText(r.status) }}</text>
        </view>
      </view>
    </view>

    <view class="section" v-if="feedbacks.length > 0">
      <text class="section-title">活动评价 ({{ avgRating }}分)</text>
      <view class="feedback-list">
        <view class="feedback-item" v-for="(f, index) in feedbacks" :key="index">
          <view class="fb-header">
            <text class="fb-name">{{ getFbUserName(f) }}</text>
            <text class="fb-rating">{{ getStars(f.rating) }}</text>
          </view>
          <text class="fb-comment" v-if="f.comment">{{ f.comment }}</text>
        </view>
      </view>
    </view>

    <view class="bottom-actions">
      <button v-if="canRegister" class="btn-register" @click="registerActivity">立即报名</button>
      <button v-if="canCheckIn" class="btn-checkin" @click="checkIn">签到打卡</button>
      <button v-if="canFeedback" class="btn-feedback" @click="openFeedback">评价活动</button>
      <button v-if="isOrganizer" class="btn-edit-act" @click="editActivity">编辑</button>
      <button v-if="isOrganizer && hasPendingRegs" class="btn-review" @click="goReviewRegs">审核报名</button>
    </view>

    <view class="feedback-modal" v-if="showFeedback" @click="closeFeedbackMaybe">
      <view class="modal-content" @click.stop="">
        <view class="modal-header">
          <text class="modal-title">活动评价</text>
          <text class="modal-close" @click="closeFeedback">✕</text>
        </view>
        <view class="star-rating">
          <text
            v-for="i in 5" :key="i"
            class="star" :class="{ active: i <= feedbackForm.rating }"
            @click="setRating(i)"
          >★</text>
        </view>
        <textarea v-model="feedbackForm.comment" placeholder="请输入评价内容" class="comment-input" />
        <button class="btn-submit" @click="submitFeedback">提交评价</button>
        <button class="btn-cancel" @click="closeFeedback">取消</button>
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
      if (!this.activity) return false;
      var s = this.activity.status;
      return (s === 'published' || s === 'registration') && !this.myRegistration;
    },
    canCheckIn() {
      if (!this.activity) return false;
      var s = this.activity.status;
      var validStatus = (s === 'published' || s === 'registration' || s === 'ongoing');
      var approved = this.myRegistration && this.myRegistration.status === 'approved';
      return validStatus && approved && !this.myCheckIn;
    },
    canFeedback() {
      return this.activity && this.myCheckIn;
    },
    isOrganizer() {
      if (!this.activity || !this.currentUserId) return false;
      var org = this.activity.organizer;
      if (org && org._id) return org._id === this.currentUserId;
      return org === this.currentUserId;
    },
    hasPendingRegs() {
      for (var i = 0; i < this.registrations.length; i++) {
        if (this.registrations[i].status === 'pending') return true;
      }
      return false;
    }
  },
  onLoad(options) {
    var userStr = uni.getStorageSync('userInfo');
    if (userStr) {
      try { this.currentUserId = JSON.parse(userStr)._id; } catch(e) {}
    }
    if (options.id) this.loadDetail(options.id);
  },
  methods: {
    getImageUrl(path) {
      if (!path) return '';
      if (path.indexOf('http') === 0) return path;
      return 'http://127.0.0.1:3000' + path;
    },
    previewImage(index) {
      var self = this;
      var urls = (self.activity.images || []).map(function(img) {
        return self.getImageUrl(img);
      });
      uni.previewImage({ urls: urls, current: index });
    },
    getRegUserName(r) {
      if (r.user && r.user.nickname) return r.user.nickname;
      return '未知';
    },
    getFbUserName(f) {
      if (f.user && f.user.nickname) return f.user.nickname;
      return '匿名';
    },
    getStars(rating) {
      var s = '';
      for (var i = 0; i < 5; i++) {
        s += i < rating ? '★' : '☆';
      }
      return s;
    },
    setRating(i) {
      this.feedbackForm.rating = i;
    },
    openFeedback() {
      this.showFeedback = true;
    },
    closeFeedback() {
      this.showFeedback = false;
    },
    closeFeedbackMaybe(e) {
      this.showFeedback = false;
    },
    async loadDetail(id) {
      try {
        var res = await activityApi.getDetail(id);
        this.activity = res.data.activity;
        this.registrations = res.data.registrations || [];

        var self = this;
        this.myRegistration = null;
        for (var i = 0; i < this.registrations.length; i++) {
          var r = this.registrations[i];
          if (r.user && r.user._id === self.currentUserId) {
            self.myRegistration = r;
            break;
          }
        }

        if (this.currentUserId) {
          try {
            var checkRes = await checkinApi.getStatus(id);
            this.myCheckIn = checkRes.data.checkedIn;
          } catch(e) {}
        }

        try {
          var fbRes = await feedbackApi.getList(id);
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
      var map = { draft: '草稿', published: '报名中', registration: '报名中', ongoing: '进行中', ended: '已结束', cancelled: '已取消' };
      return map[s] || s;
    },
    regStatusText(s) {
      var map = { pending: '待审核', approved: '已通过', rejected: '已拒绝', cancelled: '已取消' };
      return map[s] || s;
    },
    goClub(id) {
      uni.navigateTo({ url: '/pages/club/detail?id=' + id });
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
    editActivity() {
      uni.navigateTo({ url: '/pages/activity/edit?id=' + this.activity._id });
    },
    goReviewRegs() {
      uni.navigateTo({ url: '/pages/manage/review?activityId=' + this.activity._id });
    },
    removeImage(index) {
      var self = this;
      uni.showModal({
        title: '删除图片',
        content: '确定要删除这张图片吗？',
        success: function(res) {
          if (res.confirm) {
            var newImages = self.activity.images.slice();
            newImages.splice(index, 1);
            activityApi.update(self.activity._id, { images: newImages }).then(function() {
              uni.showToast({ title: '已删除', icon: 'success' });
              self.loadDetail(self.activity._id);
            });
          }
        }
      });
    },
    chooseAndUploadImages() {
      var self = this;
      uni.chooseImage({
        count: 9,
        success: function(res) {
          var files = res.tempFilePaths;
          var uploaded = 0;
          var newImages = self.activity.images ? self.activity.images.slice() : [];
          var token = uni.getStorageSync('token');
          for (var i = 0; i < files.length; i++) {
            uni.uploadFile({
              url: 'http://127.0.0.1:3000/api/upload',
              filePath: files[i],
              name: 'file',
              header: { 'Authorization': 'Bearer ' + token },
              success: function(uploadRes) {
                var data = JSON.parse(uploadRes.data);
                if (data.code === 0) {
                  newImages.push(data.data.url);
                }
                uploaded++;
                if (uploaded === files.length) {
                  activityApi.update(self.activity._id, { images: newImages }).then(function() {
                    uni.showToast({ title: '上传成功', icon: 'success' });
                    self.loadDetail(self.activity._id);
                  });
                }
              },
              fail: function() {
                uploaded++;
              }
            });
          }
        }
      });
    },
    async submitFeedback() {
      try {
        await feedbackApi.submit(this.activity._id, this.feedbackForm);
        uni.showToast({ title: '评价成功', icon: 'success' });
        this.showFeedback = false;
        this.loadDetail(this.activity._id);
      } catch(err) {
        this.showFeedback = false;
        console.error(err);
      }
    }
  }
};
</script>

<style scoped>
.activity-detail { padding-bottom: 120rpx; }
.cover-image { width: 100%; height: 360rpx; display: block; }
.header { background: linear-gradient(135deg, #4CAF50, #66BB6A); padding: 32rpx; color: #fff; }
.title { font-size: 36rpx; font-weight: bold; display: block; }
.status-tag { font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 20rpx; margin-top: 12rpx; display: inline-block; background: rgba(255,255,255,0.3); }
.info-section { background: #fff; padding: 24rpx; margin: 20rpx; border-radius: 16rpx; }
.info-item { display: flex; justify-content: space-between; padding: 12rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.info-item:last-child { border-bottom: none; }
.label { font-size: 28rpx; color: #666; }
.value { font-size: 28rpx; color: #333; }
.value.link { color: #4CAF50; }
.section { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; display: block; }
.desc { font-size: 28rpx; color: #666; line-height: 1.8; display: block; }
.tags-row { margin-top: 16rpx; display: flex; flex-wrap: wrap; }
.tag { font-size: 22rpx; color: #4CAF50; background: #E8F5E9; padding: 6rpx 20rpx; border-radius: 20rpx; margin: 0 12rpx 12rpx 0; }
.image-gallery { margin-top: 20rpx; display: flex; flex-wrap: wrap; }
.gallery-item { width: 31%; margin: 0 1% 12rpx 1%; position: relative; }
.gallery-image { width: 100%; height: 200rpx; border-radius: 8rpx; }
.img-delete { position: absolute; top: -10rpx; right: -10rpx; width: 40rpx; height: 40rpx; line-height: 40rpx; text-align: center; background: rgba(0,0,0,0.6); color: #fff; font-size: 24rpx; border-radius: 50%; }
.upload-section { margin-top: 20rpx; }
.btn-upload { background: #E8F5E9; color: #4CAF50; border: 2rpx dashed #4CAF50; border-radius: 12rpx; height: 72rpx; line-height: 72rpx; font-size: 28rpx; }
.upload-hint { font-size: 22rpx; color: #999; display: block; text-align: center; margin-top: 8rpx; }
.reg-list { display: flex; flex-wrap: wrap; }
.reg-item { display: flex; align-items: center; background: #f5f5f5; padding: 8rpx 16rpx; border-radius: 8rpx; margin: 0 12rpx 12rpx 0; }
.reg-name { font-size: 24rpx; color: #333; margin-right: 8rpx; }
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
.bottom-actions { position: fixed; bottom: 0; left: 0; right: 0; padding: 16rpx 20rpx; background: #fff; display: flex; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.06); }
.bottom-actions button { flex: 1; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; margin: 0 8rpx; }
.btn-register { background: #4CAF50; color: #fff; }
.btn-checkin { background: #2196F3; color: #fff; }
.btn-feedback { background: #ff9800; color: #fff; }
.feedback-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-content { width: 80%; background: #fff; border-radius: 16rpx; padding: 32rpx; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.modal-title { font-size: 32rpx; font-weight: bold; color: #333; }
.modal-close { font-size: 36rpx; color: #999; padding: 0 10rpx; }
.star-rating { display: flex; justify-content: center; margin-bottom: 24rpx; }
.star { font-size: 48rpx; color: #ddd; padding: 0 8rpx; }
.star.active { color: #ff9800; }
.comment-input { width: 100%; height: 200rpx; background: #f5f5f5; border-radius: 12rpx; padding: 16rpx; font-size: 28rpx; box-sizing: border-box; }
.btn-edit-act { background: #2196F3; color: #fff; }
.btn-review { background: #ff9800; color: #fff; }
.btn-submit { width: 100%; background: #4CAF50; color: #fff; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; margin-top: 24rpx; }
.btn-cancel { width: 100%; background: #f5f5f5; color: #666; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; margin-top: 16rpx; }
</style>
