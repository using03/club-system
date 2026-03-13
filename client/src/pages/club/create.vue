<template>
  <view class="create-page">
    <view class="form-section">
      <view class="form-group">
        <text class="label">社团名称 *</text>
        <input v-model="form.name" placeholder="请输入社团名称" class="input" />
      </view>
      <view class="form-group">
        <text class="label">社团分类</text>
        <picker :value="categoryIndex" :range="categories" @change="onCategoryChange">
          <view class="picker-value">{{ categories[categoryIndex] }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="label">社团简介</text>
        <textarea v-model="form.description" placeholder="请输入社团简介" class="textarea" />
      </view>
      <view class="form-group">
        <text class="label">社团Logo</text>
        <view class="logo-upload" @click="chooseLogo">
          <image v-if="form.logo" :src="getFullUrl(form.logo)" class="logo-preview" mode="aspectFill"></image>
          <text v-else class="upload-placeholder">+ 上传Logo</text>
        </view>
      </view>
      <view class="form-group">
        <text class="label">标签（逗号分隔）</text>
        <input v-model="tagsStr" placeholder="例如：编程,算法,技术" class="input" />
      </view>
    </view>
    <button class="btn-submit" @click="handleSubmit">申请创建</button>
  </view>
</template>

<script>
import { clubApi } from '../../api/index';

export default {
  data() {
    return {
      form: { name: '', description: '', category: '其他', logo: '', tags: [] },
      tagsStr: '',
      categories: ['学术科技', '文化艺术', '体育运动', '志愿公益', '创新创业', '其他'],
      categoryIndex: 5
    };
  },
  methods: {
    onCategoryChange(e) {
      this.categoryIndex = e.detail.value;
      this.form.category = this.categories[this.categoryIndex];
    },
    getFullUrl(path) {
      if (!path) return '';
      if (path.indexOf('http') === 0) return path;
      return 'http://127.0.0.1:3000' + path;
    },
    chooseLogo() {
      var self = this;
      uni.chooseImage({
        count: 1,
        success: function(res) {
          var token = uni.getStorageSync('token');
          uni.uploadFile({
            url: 'http://127.0.0.1:3000/api/upload',
            filePath: res.tempFilePaths[0],
            name: 'file',
            header: { 'Authorization': 'Bearer ' + token },
            success: function(uploadRes) {
              var data = JSON.parse(uploadRes.data);
              if (data.code === 0) {
                self.form.logo = data.data.url;
              }
            }
          });
        }
      });
    },
    async handleSubmit() {
      if (!this.form.name) {
        uni.showToast({ title: '请输入社团名称', icon: 'none' });
        return;
      }
      try {
        var submitData = {
          name: this.form.name,
          description: this.form.description,
          category: this.form.category,
          logo: this.form.logo
        };
        if (this.tagsStr) submitData.tags = this.tagsStr.split(',').map(function(t) { return t.trim(); });
        await clubApi.create(submitData);
        uni.showToast({ title: '申请已提交，等待审核', icon: 'none' });
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
.logo-upload { width: 160rpx; height: 160rpx; background: #f5f5f5; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; border: 2rpx dashed #ddd; }
.logo-preview { width: 160rpx; height: 160rpx; border-radius: 16rpx; }
.upload-placeholder { font-size: 24rpx; color: #999; }
.btn-submit { margin-top: 40rpx; background: #4CAF50; color: #fff; border: none; border-radius: 12rpx; height: 88rpx; line-height: 88rpx; font-size: 32rpx; }
</style>
