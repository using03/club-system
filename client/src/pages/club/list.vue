<template>
  <view class="club-list-page">
    <view class="top-bar">
      <view class="search-bar-inner">
        <input v-model="keyword" placeholder="搜索社团" class="search-input" @confirm="loadClubs" />
      </view>
      <button class="btn-create-club" @click="goCreateClub">+ 创建</button>
    </view>
    <view class="category-bar">
      <text
        v-for="cat in categories" :key="cat"
        :class="['cat-item', selectedCategory === cat ? 'active' : '']"
        @click="selectCategory(cat)"
      >{{ cat }}</text>
    </view>
    <view class="list">
      <view class="club-item" v-for="club in clubs" :key="club._id" @click="goDetail(club._id)">
        <image v-if="club.logo" :src="getLogoUrl(club.logo)" class="club-logo" mode="aspectFill"></image>
        <view v-else class="club-avatar">{{ club.name.charAt(0) }}</view>
        <view class="club-info">
          <text class="club-name">{{ club.name }}</text>
          <text class="club-desc">{{ club.description || '暂无简介' }}</text>
          <view class="club-meta">
            <text class="meta">{{ club.category }}</text>
            <text class="meta">{{ club.memberCount }}人</text>
            <text class="meta">成立于 {{ formatDate(club.foundedAt) }}</text>
          </view>
          <view class="club-tags" v-if="club.tags && club.tags.length > 0">
            <text class="club-tag" v-for="(t, i) in club.tags" :key="i">{{ t }}</text>
          </view>
        </view>
      </view>
      <view v-if="clubs.length === 0" class="empty">暂无社团</view>
    </view>
  </view>
</template>

<script>
import { clubApi } from '../../api/index';

export default {
  data() {
    return {
      clubs: [],
      keyword: '',
      selectedCategory: '全部',
      categories: ['全部', '学术科技', '文化艺术', '体育运动', '志愿公益', '创新创业', '其他']
    };
  },
  onLoad() {
    this.loadClubs();
  },
  methods: {
    async loadClubs() {
      try {
        const params = { limit: 20 };
        if (this.keyword) params.keyword = this.keyword;
        if (this.selectedCategory !== '全部') params.category = this.selectedCategory;
        const res = await clubApi.getList(params);
        this.clubs = res.data.clubs || [];
      } catch (err) {
        console.error(err);
      }
    },
    selectCategory(cat) {
      this.selectedCategory = cat;
      this.loadClubs();
    },
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleDateString('zh-CN');
    },
    getLogoUrl(path) {
      if (!path) return '';
      if (path.indexOf('http') === 0) return path;
      return 'http://127.0.0.1:3000' + path;
    },
    goDetail(id) {
      uni.navigateTo({ url: '/pages/club/detail?id=' + id });
    },
    goCreateClub() {
      var token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      uni.navigateTo({ url: '/pages/club/create' });
    }
  }
};
</script>

<style scoped>
.top-bar { display: flex; align-items: center; padding: 16rpx 20rpx; background: #fff; }
.search-bar-inner { flex: 1; }
.search-input { background: #f5f5f5; border-radius: 36rpx; height: 72rpx; padding: 0 24rpx; font-size: 28rpx; }
.btn-create-club { flex-shrink: 0; margin-left: 16rpx; background: #4CAF50; color: #fff; border: none; border-radius: 36rpx; font-size: 26rpx; padding: 0 24rpx; height: 72rpx; line-height: 72rpx; }
.category-bar { display: flex; padding: 16rpx 20rpx; background: #fff; overflow-x: auto; white-space: nowrap; gap: 12rpx; border-bottom: 1rpx solid #eee; }
.cat-item { font-size: 24rpx; color: #666; padding: 8rpx 24rpx; border-radius: 24rpx; background: #f5f5f5; flex-shrink: 0; }
.cat-item.active { background: #4CAF50; color: #fff; }
.list { padding: 20rpx; }
.club-item { display: flex; background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.club-avatar { width: 96rpx; height: 96rpx; border-radius: 50%; background: #4CAF50; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 36rpx; font-weight: bold; flex-shrink: 0; margin-right: 20rpx; }
.club-logo { width: 96rpx !important; height: 96rpx !important; border-radius: 50%; flex-shrink: 0; margin-right: 20rpx; }
.club-info { flex: 1; }
.club-name { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.club-desc { font-size: 24rpx; color: #666; margin-top: 8rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.club-meta { margin-top: 8rpx; display: flex; gap: 16rpx; }
.meta { font-size: 22rpx; color: #999; }
.club-tags { margin-top: 8rpx; display: flex; flex-wrap: wrap; }
.club-tag { font-size: 20rpx; color: #4CAF50; background: #E8F5E9; padding: 4rpx 16rpx; border-radius: 20rpx; margin: 0 8rpx 4rpx 0; }
.empty { text-align: center; color: #999; padding: 60rpx; }
</style>
