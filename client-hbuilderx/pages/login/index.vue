<template>
  <view class="login-page">
    <view class="logo-section">
      <view class="logo-icon">🎓</view>
      <text class="app-title">校园社团活动管理</text>
      <text class="app-subtitle">Campus Club System</text>
    </view>

    <view class="form-section">
      <view class="tab-bar">
        <text :class="['tab-item', isLogin ? 'active' : '']" @click="isLogin = true">登录</text>
        <text :class="['tab-item', !isLogin ? 'active' : '']" @click="isLogin = false">注册</text>
      </view>

      <view class="form-group">
        <input v-model="form.username" placeholder="请输入用户名" class="input" />
      </view>
      <view class="form-group">
        <input v-model="form.password" type="password" placeholder="请输入密码" class="input" />
      </view>
      <view v-if="!isLogin" class="form-group">
        <input v-model="form.nickname" placeholder="请输入昵称" class="input" />
      </view>
      <view v-if="!isLogin" class="form-group">
        <input v-model="form.studentId" placeholder="请输入学号" class="input" />
      </view>

      <button class="submit-btn" @click="handleSubmit">{{ isLogin ? '登 录' : '注 册' }}</button>
    </view>
  </view>
</template>

<script>
import { authApi } from '@/api/index';

export default {
  data() {
    return {
      isLogin: true,
      form: {
        username: '',
        password: '',
        nickname: '',
        studentId: ''
      }
    };
  },
  methods: {
    async handleSubmit() {
      if (!this.form.username || !this.form.password) {
        uni.showToast({ title: '请填写用户名和密码', icon: 'none' });
        return;
      }
      try {
        let res;
        if (this.isLogin) {
          res = await authApi.login({
            username: this.form.username,
            password: this.form.password
          });
        } else {
          res = await authApi.register(this.form);
        }
        uni.setStorageSync('token', res.data.token);
        uni.setStorageSync('userInfo', JSON.stringify(res.data.user));
        uni.showToast({ title: this.isLogin ? '登录成功' : '注册成功', icon: 'success' });
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' });
        }, 500);
      } catch (err) {
        console.error(err);
      }
    }
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #4CAF50, #81C784);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}
.logo-icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}
.app-title {
  font-size: 44rpx;
  font-weight: bold;
  color: #ffffff;
}
.app-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}
.form-section {
  width: 85%;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}
.tab-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
}
.tab-item {
  font-size: 32rpx;
  color: #999999;
  padding: 10rpx 40rpx;
  border-bottom: 4rpx solid transparent;
}
.tab-item.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;
  font-weight: bold;
}
.form-group {
  margin-bottom: 24rpx;
}
.input {
  width: 100%;
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}
.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #4CAF50;
  color: #ffffff;
  font-size: 32rpx;
  border-radius: 12rpx;
  margin-top: 20rpx;
  border: none;
}
</style>
