<template>
  <view class="edit-page" v-if="form.name">
    <view class="form-section">
      <view class="form-group">
        <text class="label">社团名称</text>
        <input v-model="form.name" placeholder="社团名称" class="input" />
      </view>
      <view class="form-group">
        <text class="label">社团分类</text>
        <picker :value="categoryIndex" :range="categories" @change="onCategoryChange">
          <view class="picker-value">{{ categories[categoryIndex] }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="label">社团简介</text>
        <textarea v-model="form.description" placeholder="社团简介" class="textarea" />
      </view>
      <view class="form-group">
        <text class="label">社团公告</text>
        <textarea v-model="form.announcement" placeholder="发布社团公告" class="textarea" />
      </view>
      <view class="form-group">
        <text class="label">社团Logo</text>
        <view class="logo-area">
          <view class="logo-upload" @click="chooseLogo">
            <image v-if="form.logo" :src="getFullUrl(form.logo)" class="logo-preview" mode="aspectFill"></image>
            <text v-else class="upload-placeholder">+ 上传Logo</text>
          </view>
          <view v-if="form.logo" class="logo-actions">
            <text class="logo-action-btn change" @click="chooseLogo">更换</text>
            <text class="logo-action-btn delete" @click="removeLogo">删除</text>
          </view>
        </view>
      </view>
      <view class="form-group">
        <text class="label">标签（逗号分隔）</text>
        <input v-model="tagsStr" placeholder="例如：编程,算法" class="input" />
      </view>
      <view class="form-group">
        <text class="label">社团状态</text>
        <picker :value="statusIndex" :range="statusLabels" @change="onStatusChange">
          <view class="picker-value">{{ statusLabels[statusIndex] }}</view>
        </picker>
      </view>
    </view>
    <button class="btn-submit" @click="handleSubmit">{{ isResubmit ? '重新提交审核' : '保存修改' }}</button>
  </view>
</template>

<script>
import { clubApi } from '../../api/index';

export default {
  data() {
    return {
      clubId: '',
      isResubmit: false,
      form: { name: '', description: '', category: '其他', announcement: '', logo: '', tags: [], status: 'active' },
      tagsStr: '',
      categories: ['学术科技', '文化艺术', '体育运动', '志愿公益', '创新创业', '其他'],
      categoryIndex: 5,
      statusList: ['active', 'inactive', 'pending'],
      statusLabels: ['活跃', '停用', '待审核'],
      statusIndex: 0
    };
  },
  onLoad(options) {
    if (options.id) {
      this.clubId = options.id;
      this.isResubmit = options.resubmit === '1';
      this.loadClub(options.id);
    }
  },
  methods: {
    async loadClub(id) {
      try {
        var res = await clubApi.getDetail(id);
        var c = res.data.club;
        this.form = {
          name: c.name || '', description: c.description || '',
          category: c.category || '其他', announcement: c.announcement || '',
          logo: c.logo || '', tags: c.tags || [], status: c.status || 'active'
        };
        this.tagsStr = (c.tags || []).join(',');
        this.categoryIndex = this.categories.indexOf(c.category);
        if (this.categoryIndex < 0) this.categoryIndex = 5;
        this.statusIndex = this.statusList.indexOf(c.status);
        if (this.statusIndex < 0) this.statusIndex = 0;
      } catch(err) { console.error(err); }
    },
    onCategoryChange(e) {
      this.categoryIndex = e.detail.value;
      this.form.category = this.categories[this.categoryIndex];
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
    removeLogo() {
      this.form.logo = '';
    },
    chooseLogo() {
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
              if (data.code === 0) self.form.logo = data.data.url;
            }
          });
        }
      });
    },
    async handleSubmit() {
      try {
        var submitData = {
          name: this.form.name, description: this.form.description,
          category: this.form.category, announcement: this.form.announcement,
          logo: this.form.logo, status: this.isResubmit ? 'pending' : this.form.status
        };
        if (this.tagsStr) submitData.tags = this.tagsStr.split(',').map(function(t) { return t.trim(); });
        await clubApi.update(this.clubId, submitData);
        var msg = this.isResubmit ? '已重新提交审核' : '保存成功';
        uni.showToast({ title: msg, icon: 'success' });
        setTimeout(function() { uni.navigateBack(); }, 1000);
      } catch(err) { console.error(err); }
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
.logo-area { display: flex; align-items: flex-end; }
.logo-upload { width: 160rpx; height: 160rpx; background: #f5f5f5; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; border: 2rpx dashed #ddd; }
.logo-preview { width: 160rpx; height: 160rpx; border-radius: 16rpx; }
.upload-placeholder { font-size: 24rpx; color: #999; }
.logo-actions { margin-left: 20rpx; display: flex; flex-direction: column; }
.logo-action-btn { font-size: 24rpx; padding: 8rpx 24rpx; border-radius: 8rpx; margin-bottom: 12rpx; text-align: center; }
.logo-action-btn.change { background: #E3F2FD; color: #1976D2; }
.logo-action-btn.delete { background: #FFEBEE; color: #f44336; }
.btn-submit { margin-top: 40rpx; background: #4CAF50; color: #fff; border: none; border-radius: 12rpx; height: 88rpx; line-height: 88rpx; font-size: 32rpx; }
</style>
