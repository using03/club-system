<template>
  <view class="create-page">
    <view class="form-section">
      <view class="form-group">
        <text class="label">活动标题 *</text>
        <input v-model="form.title" placeholder="请输入活动标题" class="input" />
      </view>
      <view class="form-group">
        <text class="label">活动描述</text>
        <textarea v-model="form.description" placeholder="请输入活动描述" class="textarea" />
      </view>
      <view class="form-group">
        <text class="label">活动地点 *</text>
        <input v-model="form.location" placeholder="请输入活动地点" class="input" />
      </view>
      <view class="form-group">
        <text class="label">开始时间 *</text>
        <picker mode="date" :value="startDate" @change="onStartDateChange">
          <view class="picker-value">{{ startDate || '选择日期' }}</view>
        </picker>
        <picker mode="time" :value="startTime" @change="onStartTimeChange" style="margin-top:12rpx;">
          <view class="picker-value">{{ startTime || '选择时间' }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="label">结束时间 *</text>
        <picker mode="date" :value="endDate" @change="onEndDateChange">
          <view class="picker-value">{{ endDate || '选择日期' }}</view>
        </picker>
        <picker mode="time" :value="endTime" @change="onEndTimeChange" style="margin-top:12rpx;">
          <view class="picker-value">{{ endTime || '选择时间' }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="label">名额上限（0=不限）</text>
        <input v-model="form.maxParticipants" type="number" placeholder="0" class="input" />
      </view>
      <view class="form-group">
        <text class="label">是否需要报名审核</text>
        <switch :checked="form.needApproval" @change="form.needApproval = $event.detail.value" color="#4CAF50" />
      </view>
      <view class="form-group">
        <text class="label">封面图</text>
        <view class="cover-upload" @click="chooseCover">
          <image v-if="form.coverImage" :src="getFullUrl(form.coverImage)" class="cover-preview" mode="aspectFill"></image>
          <text v-else class="upload-placeholder">+ 上传封面</text>
        </view>
      </view>
      <view class="form-group">
        <text class="label">标签（逗号分隔）</text>
        <input v-model="tagsStr" placeholder="例如：比赛,运动" class="input" />
      </view>
    </view>
    <button class="btn-submit" @click="handleSubmit">发布活动</button>
  </view>
</template>

<script>
import { activityApi } from '../../api/index';

export default {
  data() {
    return {
      clubId: '',
      form: { title: '', description: '', location: '', maxParticipants: 0, needApproval: false, coverImage: '' },
      startDate: '', startTime: '', endDate: '', endTime: '',
      tagsStr: ''
    };
  },
  onLoad(options) {
    if (options.clubId) this.clubId = options.clubId;
  },
  methods: {
    onStartDateChange(e) { this.startDate = e.detail.value; },
    onStartTimeChange(e) { this.startTime = e.detail.value; },
    onEndDateChange(e) { this.endDate = e.detail.value; },
    onEndTimeChange(e) { this.endTime = e.detail.value; },
    getFullUrl(path) {
      if (!path) return '';
      if (path.indexOf('http') === 0) return path;
      return 'http://127.0.0.1:3000' + path;
    },
    chooseCover() {
      var self = this;
      uni.chooseImage({
        count: 1,
        success: function(res) {
          var token = uni.getStorageSync('token');
          uni.uploadFile({
            url: 'http://127.0.0.1:3000/api/upload',
            filePath: res.tempFilePaths[0], name: 'file',
            header: { 'Authorization': 'Bearer ' + token },
            success: function(uploadRes) {
              var data = JSON.parse(uploadRes.data);
              if (data.code === 0) self.form.coverImage = data.data.url;
            }
          });
        }
      });
    },
    async handleSubmit() {
      if (!this.form.title) { uni.showToast({ title: '请输入活动标题', icon: 'none' }); return; }
      if (!this.form.location) { uni.showToast({ title: '请输入活动地点', icon: 'none' }); return; }
      if (!this.startDate || !this.startTime) { uni.showToast({ title: '请选择开始时间', icon: 'none' }); return; }
      if (!this.endDate || !this.endTime) { uni.showToast({ title: '请选择结束时间', icon: 'none' }); return; }
      try {
        var submitData = {
          title: this.form.title,
          description: this.form.description,
          club: this.clubId,
          location: this.form.location,
          startTime: new Date(this.startDate + 'T' + this.startTime).toISOString(),
          endTime: new Date(this.endDate + 'T' + this.endTime).toISOString(),
          maxParticipants: parseInt(this.form.maxParticipants) || 0,
          needApproval: this.form.needApproval,
          coverImage: this.form.coverImage,
          status: 'published'
        };
        if (this.tagsStr) submitData.tags = this.tagsStr.split(',').map(function(t) { return t.trim(); });
        await activityApi.create(submitData);
        uni.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(function() { uni.navigateBack(); }, 1000);
      } catch(err) { console.error(err); }
    }
  }
};
</script>

<style scoped>
.create-page { padding: 20rpx; padding-bottom: 120rpx; }
.form-section { background: #fff; border-radius: 16rpx; padding: 24rpx; }
.form-group { margin-bottom: 24rpx; }
.label { font-size: 28rpx; color: #333; font-weight: 500; margin-bottom: 12rpx; display: block; }
.input { width: 100%; height: 80rpx; background: #f5f5f5; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box; }
.textarea { width: 100%; height: 200rpx; background: #f5f5f5; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; box-sizing: border-box; }
.picker-value { height: 80rpx; line-height: 80rpx; background: #f5f5f5; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; color: #333; }
.cover-upload { width: 100%; height: 300rpx; background: #f5f5f5; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; border: 2rpx dashed #ddd; }
.cover-preview { width: 100%; height: 300rpx; border-radius: 16rpx; }
.upload-placeholder { font-size: 28rpx; color: #999; }
.btn-submit { margin-top: 40rpx; background: #4CAF50; color: #fff; border: none; border-radius: 12rpx; height: 88rpx; line-height: 88rpx; font-size: 32rpx; }
</style>
