# 校园社团活动管理系统 (Club System)

基于 **Uniapp + Node.js + Express + MongoDB** 的校园社团活动管理小程序。

## 功能模块

| 模块 | 功能 |
|------|------|
| 用户认证 | 注册、登录、个人信息管理 |
| 社团管理 | 社团创建、信息展示（成立时间、活动历史）、社团搜索 |
| 成员管理 | 加入社团（招新）、退出社团、成员角色管理 |
| 活动管理 | 活动发布、报名（支持名额限制、报名审核）、活动搜索 |
| 活动签到 | 参与成员签到打卡 |
| 活动评价 | 活动评分与评论反馈 |

## 技术栈

- **前端**: Uniapp (Vue 3) — 支持 H5 / 微信小程序
- **后端**: Node.js + Express.js
- **数据库**: MongoDB + Mongoose
- **认证**: JWT Token

## 项目结构

```
club-system/
├── server/          # 后端 Express 服务
│   ├── app.js       # 入口文件
│   ├── config/      # 配置（数据库连接）
│   ├── models/      # 数据模型
│   ├── routes/      # API 路由
│   ├── middleware/   # 中间件（认证）
│   ├── utils/       # 工具函数
│   └── seed.js      # 种子数据
├── client/          # 前端 Uniapp 项目
│   ├── src/
│   │   ├── pages/   # 页面
│   │   ├── api/     # API 封装
│   │   └── utils/   # 工具函数
│   └── vite.config.js
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm run install:all
```

### 2. 启动 MongoDB

```bash
mongod
```

### 3. 初始化种子数据

```bash
npm run seed
```

### 4. 启动开发服务器

```bash
# 后端 (端口 3000)
npm run dev:server

# 前端 H5 (端口 5173)
npm run dev:client
```

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 社团管理员 | zhangsan | 123456 |
| 学生 | lisi | 123456 |
| 学生 | wangwu | 123456 |

## API 接口

| 路径 | 说明 |
|------|------|
| `POST /api/auth/register` | 用户注册 |
| `POST /api/auth/login` | 用户登录 |
| `GET /api/clubs` | 获取社团列表 |
| `POST /api/clubs` | 创建社团 |
| `GET /api/clubs/:id` | 社团详情 |
| `POST /api/members/:clubId/join` | 加入社团 |
| `POST /api/members/:clubId/leave` | 退出社团 |
| `GET /api/activities` | 获取活动列表 |
| `POST /api/activities` | 创建活动 |
| `POST /api/activities/:id/register` | 活动报名 |
| `POST /api/checkin/:activityId` | 活动签到 |
| `POST /api/feedback/:activityId` | 活动评价 |
| `GET /api/health` | 健康检查 |
