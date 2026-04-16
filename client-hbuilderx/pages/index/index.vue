<template>
  <view class="home-page">
    <view class="header">
      <text class="header-title">🎓 校园社团活动</text>
      <text class="header-sub">发现精彩社团，参与丰富活动</text>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">热门社团</text>
        <text class="section-more" @click="goClubList">更多 ></text>
      </view>
      <scroll-view scroll-x class="club-scroll">
        <view class="club-card" v-for="club in clubs" :key="club._id" @click="goClubDetail(club._id)">
          <view class="club-avatar-wrap">
            <image v-if="club.logo" :src="getLogoUrl(club.logo)" class="club-logo" mode="aspectFill"></image>
            <view v-else class="club-avatar">{{ club.name.charAt(0) }}</view>
          </view>
          <text class="club-name">{{ club.name }}</text>
          <text class="club-category">{{ club.category }}</text>
          <text class="club-members">{{ club.memberCount }}人</text>
        </view>
        <view v-if="clubs.length === 0" class="empty-text">暂无社团数据</view>
      </scroll-view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">最新活动</text>
        <text class="section-more" @click="goActivityList">更多 ></text>
      </view>
      <view class="activity-list">
        <view class="activity-card" v-for="act in activities" :key="act._id" @click="goActivityDetail(act._id)">
          <view class="activity-info">
            <text class="activity-title">{{ act.title }}</text>
            <view class="activity-meta">
              <text class="meta-item">📍 {{ act.location }}</text>
              <text class="meta-item">📅 {{ formatDate(act.startTime) }}</text>
            </view>
            <view class="activity-tags">
              <text class="tag" v-if="act.club">{{ act.club.name }}</text>
              <text class="tag status" :class="act.status">{{ statusText(act.status) }}</text>
              <text class="tag" v-if="act.maxParticipants">限{{ act.maxParticipants }}人</text>
              <text class="tag act-tag" v-for="(t, i) in (act.tags || [])" :key="i">{{ t }}</text>
            </view>
          </view>
        </view>
        <view v-if="activities.length === 0" class="empty-text">暂无活动数据</view>
      </view>
    </view>
  </view>
</template>

<script>
import { clubApi, activityApi } from '../../api/index';

export default {
  data() {
    return {
      clubs: [],
      activities: []
    };
  },
  onShow() {
    this.loadData();
  },
  methods: {
    async loadData() {
      try {
        const [clubRes, actRes] = await Promise.all([
          clubApi.getList({ limit: 6 }),
          activityApi.getList({ limit: 5, status: 'published' })
        ]);
        this.clubs = clubRes.data.clubs || [];
        this.activities = actRes.data.activities || [];
      } catch (err) {
        console.error('加载数据失败:', err);
      }
    },
    getLogoUrl(path) {
      if (!path) return '';
      if (path.indexOf('http') === 0) return path;
      return 'http://127.0.0.1:3000' + path;
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    },
    statusText(status) {
      const map = { draft: '草稿', published: '报名中', registration: '报名中', ongoing: '进行中', ended: '已结束', cancelled: '已取消' };
      return map[status] || status;
    },
    goClubList() {
      uni.navigateTo({ url: '/pages/club/list' });
    },
    goClubDetail(id) {
      uni.navigateTo({ url: `/pages/club/detail?id=${id}` });
    },
    goActivityList() {
      uni.switchTab({ url: '/pages/activity/list' });
    },
    goActivityDetail(id) {
      uni.navigateTo({ url: `/pages/activity/detail?id=${id}` });
    }
  }
};
</script>

<style scoped>
.home-page { padding-bottom: 40rpx; }
.header {
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  padding: 40rpx;
  color: #fff;
}
.header-title { font-size: 40rpx; font-weight: bold; display: block; }
.header-sub { font-size: 24rpx; opacity: 0.9; margin-top: 8rpx; display: block; }
.section { margin: 24rpx 20rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; }
.section-more { font-size: 24rpx; color: #4CAF50; }
.club-scroll { white-space: nowrap; }
.club-card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 200rpx;
  height: 260rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 16rpx;
  margin-right: 16rpx;
  vertical-align: top;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08);
}
.club-avatar-wrap { width: 80rpx; height: 80rpx; margin-bottom: 12rpx; flex-shrink: 0; }
.club-avatar {
  width: 80rpx; height: 80rpx; border-radius: 50%;
  background: #4CAF50; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; font-weight: bold;
}
.club-logo { width: 80rpx; height: 80rpx; border-radius: 50%; display: block; object-fit: cover; }
.club-name { font-size: 26rpx; color: #333; font-weight: 500; }
.club-category { font-size: 20rpx; color: #999; margin-top: 4rpx; }
.club-members { font-size: 20rpx; color: #4CAF50; margin-top: 4rpx; }
.activity-card {
  background: #fff; border-radius: 16rpx;
  padding: 24rpx; margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.activity-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.activity-meta { margin-top: 12rpx; }
.meta-item { font-size: 24rpx; color: #666; margin-right: 24rpx; }
.activity-tags { margin-top: 12rpx; display: flex; flex-wrap: wrap; gap: 8rpx; }
.tag {
  font-size: 20rpx; color: #4CAF50; background: #E8F5E9;
  padding: 4rpx 16rpx; border-radius: 20rpx;
}
.tag.status.published { background: #E3F2FD; color: #1976D2; }
.tag.status.ongoing { background: #FFF3E0; color: #E65100; }
.tag.status.ended { background: #f5f5f5; color: #999; }
.tag.act-tag { background: #FFF3E0; color: #E65100; }
.empty-text { text-align: center; color: #999; font-size: 28rpx; padding: 40rpx 0; }
</style>
