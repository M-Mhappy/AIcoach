# AI 私教

一个面向健身小白的 AI 私教 MVP 项目，支持用户信息采集、AI 周计划生成、计划确认与重生成、每日训练打卡、每周饮食反馈，以及与 AI 教练对话调整计划。

## 当前能力

- 短 ID + 密码注册登录
- 7 步用户信息采集
- AI 生成一周训练与饮食计划
- 计划确认后再正式落库
- 基于用户反馈重生成计划
- 每日训练两阶段打卡
- 每周饮食反馈
- AI 教练流式对话
- 根据用户可用器材动态约束训练动作

## 技术栈

### 前端

- Expo
- React Native
- React Navigation
- Zustand
- AsyncStorage
- TypeScript

### 后端

- Node.js
- Express
- PostgreSQL / Supabase
- DeepSeek API
- bcryptjs
- TypeScript

## 项目结构

```text
mobile/   Expo 前端
server/   Express 后端
docs/     产品与技术文档
prd.md    项目 PRD
```

## 快速开始

### 1. 启动后端

```bash
cd server
npm install
cp .env.example .env
```

填写 `server/.env`：

```env
PORT=3000
DATABASE_URL=your_postgres_url
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

然后启动：

```bash
npm run dev
```

### 2. 初始化数据库

将 `server/src/schema.sql` 复制到 Supabase SQL Editor 执行。

### 3. 启动前端

```bash
cd mobile
npm install
npx expo start --web
```

说明：

- Web 开发默认请求 `http://localhost:3000`
- 真机调试时，需要把 `mobile/src/api/client.ts` 里的局域网 IP 改成你当前电脑地址

## 核心业务流

### 新用户

```text
注册 -> 信息采集 -> AI 生成计划 -> 用户确认/重生成 -> 进入主页
```

### 老用户

```text
登录 -> 恢复本地状态/拉取当前计划 -> 进入主页
```

### 每周闭环

```text
训练执行 -> 每日打卡 -> 每周饮食反馈 -> 生成下一周计划
```

## 文档

- 产品规格：`docs/mvp-首体验产品规格.md`
- 技术文档：`docs/技术文档.md`

## 当前状态

项目已完成 MVP 雏形，适合：

- 本地开发与演示
- 小范围自用 / 朋友试用
- 继续做产品化迭代

## 已知限制

- 暂未实现完整鉴权体系（当前为 MVP 简化方案）
- 下周计划生成的完整前端入口仍可继续补强
- 生产环境 API 地址仍需替换

