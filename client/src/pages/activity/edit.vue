<template>
  <view class="edit-page" v-if="form.title">
    <view class="form-section">
      <view class="form-group">
        <text class="label">活动标题</text>
        <input v-model="form.title" class="input" />
      </view>
      <view class="form-group">
        <text class="label">活动描述</text>
        <textarea v-model="form.description" class="textarea" />
      </view>
      <view class="form-group">
        <text class="label">活动地点</text>
        <input v-model="form.location" class="input" />
      </view>
      <view class="form-group">
        <text class="label">名额上限</text>
        <input v-model="form.maxParticipants" type="number" class="input" />
      </view>
      <view class="form-group">
        <text class="label">活动状态</text>
        <picker :value="statusIndex" :range="statusLabels" @change="onStatusChange">
          <view class="picker-value">{{ statusLabels[statusIndex] }}</view>
        </picker>
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
    </view>
    <button class="btn-submit" @click="handleSubmit">保存修改</button>
    <button class="btn-danger" @click="handleDelete">删除活动</button>
  </view>
</template>

<script>
import { activityApi } from '../../api/index';

export default {
  data() {
    return {
      activityId: '',
      form: { title: '', description: '', location: '', maxParticipants: 0, needApproval: false, coverImage: '', status: 'published' },
      statusList: ['draft', 'published', 'registration', 'ongoing', 'ended', 'cancelled'],
      statusLabels: ['草稿', '已发布', '报名中', '进行中', '已结束', '已取消'],
      statusIndex: 1
    };
  },
  onLoad(options) {
    if (options.id) {
      this.activityId = options.id;
      this.loadActivity(options.id);
    }
  },
  methods: {
    async loadActivity(id) {
      try {
        var res = await activityApi.getDetail(id);
        var a = res.data.activity;
        this.form = {
          title: a.title, description: a.description || '', location: a.location,
          maxParticipants: a.maxParticipants || 0, needApproval: a.needApproval || false,
          coverImage: a.coverImage || '', status: a.status
        };
        this.statusIndex = this.statusList.indexOf(a.status);
        if (this.statusIndex < 0) this.statusIndex = 1;
      } catch(err) { console.error(err); }
    },
    onStatusChange(e) {
      this.statusIndex = e.detail.value;
      this.form.status = this.statusList[this.statusIndex];
    },
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
      try {
        await activityApi.update(this.activityId, {
          title: this.form.title, description: this.form.description,
          location: this.form.location, maxParticipants: parseInt(this.form.maxParticipants) || 0,
          needApproval: this.form.needApproval, coverImage: this.form.coverImage,
          status: this.form.status
        });
        uni.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(function() { uni.navigateBack(); }, 1000);
      } catch(err) { console.error(err); }
    },
    handleDelete() {
      var self = this;
      uni.showModal({
        title: '确认删除',
        content: '删除后不可恢复，确定要删除此活动吗？',
        success: function(res) {
          if (res.confirm) {
            activityApi.remove(self.activityId).then(function() {
              uni.showToast({ title: '已删除', icon: 'success' });
              setTimeout(function() { uni.navigateBack(); }, 1000);
            });
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.edit-page { padding: 20rpx; padding-bottom: 120rpx; }
.form-section { background: #fff; border-radius: 16rpx; padding: 24rpx; }
.form-group { margin-bottom: 24rpx; }
.label { font-size: 28rpx; color: #333; font-weight: 500; margin-bottom: 12rpx; display: block; }
.input { width: 100%; height: 80rpx; background: #f5f5f5; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box; }
.textarea { width: 100%; height: 160rpx; background: #f5f5f5; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; box-sizing: border-box; }
.picker-value { height: 80rpx; line-height: 80rpx; background: #f5f5f5; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; color: #333; }
.cover-upload { width: 100%; height: 300rpx; background: #f5f5f5; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; border: 2rpx dashed #ddd; }
.cover-preview { width: 100%; height: 300rpx; border-radius: 16rpx; }
.upload-placeholder { font-size: 28rpx; color: #999; }
.btn-submit { margin-top: 40rpx; background: #4CAF50; color: #fff; border: none; border-radius: 12rpx; height: 88rpx; line-height: 88rpx; font-size: 32rpx; }
.btn-danger { margin-top: 20rpx; background: #fff; color: #f44336; border: 2rpx solid #f44336; border-radius: 12rpx; height: 88rpx; line-height: 88rpx; font-size: 32rpx; }
</style>
