## 结论：推荐移动端（React Native）

对于 **i人健身小白**，健身场景天然是**移动优先**：
- 在健身房看动作、组数、重量 → 手机
- 在厨房/食堂记录饮食 → 手机
- 睡前沙发上打卡复盘 → 手机
- PC 端对健身是反场景的。

React Native（推荐用 **Expo**）完全正确，一套代码覆盖 iOS/Android，社区成熟，适合快速验证 MVP。

---

# AI 私人健身教练 — MVP 开发文档

> **首体验与反馈闭环**的详细产品规格见：[docs/mvp-首体验产品规格.md](docs/mvp-首体验产品规格.md)（信息采集、**计划确认与写入**、今日任务卡、打卡规则、周计划迭代）。

## 1. 产品定位
**一句话**：为内向健身新手打造的"无压力 AI 私教"，通过持续对话和完成度反馈，动态调整计划，降低坚持门槛。

## 2. MVP 功能边界（只做这 6 件事）

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P0 | **信息采集向导** | 最小必要信息（约 5 步）：目标、每周天数/每次时长、训练场景、运动基础、饮食忌口（可选）；不采集敏感/身份类信息；详见产品规格文档 |
| P0 | **AI 生成周计划** | 生成结构化周计划；**用户确认后才写入**；不满意可填反馈重新生成再确认（详见产品规格 §5） |
| P0 | **每日训练打卡** | 开始打卡（鼓励提示）+ 结束打卡（填训练完成度）；≥80% 表扬，<80% 温和询问；已开始未结束默认 100%（产品规格 §3） |
| P0 | **每周饮食反馈** | 本周训练结束后、生成下周计划前，填写整周饮食执行度与反馈；作为下周饮食建议必要输入（产品规格 §3A） |
| P0 | **AI 对话调整** | 核心差异化！用户可随时说"今天健身房没有龙门架""昨天加班没练""食堂太油"，AI 实时调整后续计划 |
| P1 | **计划历史与趋势** | 简单图表展示近几周完成率趋势，给用户正反馈 |
| P2 | **器材文字说明** | 纯文本/静态图片介绍常见器材用法（替代视频，MVP 够用）|

**MVP 明确不做**（放 V1.5）：
- 拍照识别器材
- 视频教学库
- 社交/分享/排行榜
- 身体数据曲线追踪（体重体脂变化图表）

## 3. 目标用户画像
- **阿宅型小白**：办了卡不敢去自由力量区，害怕被围观，不懂器械怎么用
- **核心痛点**：网上的计划太通用、跟不上变化；请私教太贵且社恐；需要"被安排得明明白白"但又不想和人说话
- **使用场景**：练前看计划 1min → 练中偶尔瞄手机 → 练后 30s 打卡 → 周末和 AI 聊几句调整下周

## 4. 技术架构

```
┌─────────────────────────────────────┐
│         React Native (Expo)         │
│   TypeScript + React Navigation     │
│   Zustand（状态管理）                │
│   react-native-gifted-chat（对话UI）│
└─────────────┬───────────────────────┘
              │ HTTPS
┌─────────────▼───────────────────────┐
│      Node.js + Express 轻量后端      │
│   - 用户/计划/打卡数据接口            │
│   - 对话历史存储                     │
│   - DeepSeek API 代理+Prompt 封装   │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│      DeepSeek V4 Pro API            │
│   （通过后端代理调用，前端不直连）     │
└─────────────────────────────────────┘
```

**数据库**：PostgreSQL。表简单：
- `users`（基础信息）
- `plan_drafts`（待确认周计划草稿 + 用户反馈历史）
- `plans`（用户确认后的正式周计划，JSON 存储结构化内容）
- `training_check_ins`（每日训练打卡，开始+结束）
- `weekly_diet_reviews`（每周饮食反馈，生成下周前填写）
- `chat_messages`（对话历史）

**已确认技术决策**：
- **游客策略**：服务端匿名账号（`isAnonymous: true`），注册时绑定手机号
- **离线**：缓存今日任务卡到本地
- **AI 对话**：streaming 输出；计划生成非 streaming

## 5. 核心数据模型（简化）

```typescript
// 用户档案（MVP 最小必要信息，见 docs/mvp-首体验产品规格.md）
interface UserProfile {
  id: string;
  goal: '减脂' | '增肌' | '塑形' | '保持健康';
  availableDays: number; // 1-7
  availableMinutes: 20 | 30 | 45 | 60;
  environment: '家庭' | '健身房' | '宿舍或户外';
  experience: '零基础' | '有点基础' | '练过一段时间';
  dietRestrictions: string[]; // 可为空
  equipment?: string[]; // 家庭/宿舍场景可选
  isAnonymous: boolean;
  phone?: string;
  // 可选补充（非 onboarding 必填）：height, weight, bodyFat, gender
}

// 周计划草稿（AI 生成，确认前）
interface PlanDraft {
  id: string;
  userId: string;
  weekNumber: number;
  revisionNumber: number;
  status: 'pending_confirmation' | 'superseded';
  weeklyPlan: WeeklyPlan;
  userFeedbacks: string[];
}

// 周计划（用户确认后写入）
interface WeeklyPlan {
  id: string;
  userId: string;
  weekNumber: number;
  status: 'confirmed';
  draftId: string;
  confirmedAt: string;
  validFrom: string;
  validTo: string;
  days: DayPlan[];
}

interface DayPlan {
  dayOfWeek: number;
  training: {
    focus: string; // "胸+三头"
    exercises: { name: string; sets: number; reps: string; note?: string }[];
    estimatedMinutes: number;
  };
  // 每日展示建议（今日卡饮食要点），反馈粒度为每周（见 WeeklyDietReview）
  diet: {
    caloriesTarget: number;
    principles: string[]; // ["少油", "高蛋白"]
    sampleMeals: string[];
  };
}

// 每日训练打卡（开始 + 结束）
interface TrainingCheckIn {
  id: string;
  planId: string;
  date: string;
  startedAt?: string;        // 开始打卡时间戳
  completedAt?: string;      // 结束打卡时间戳
  trainingPercent: number;   // 0-100
  note?: string;             // 训练备注
  reason?: string;           // <80% 时询问的原因（可选）
  source: 'manual' | 'auto_started';
}

// 每周饮食反馈（本周结束、生成下周前填写）
interface WeeklyDietReview {
  id: string;
  userId: string;
  weekNumber: number;
  planId: string;
  dietPercent: number;        // 0-100，本周整体饮食执行度
  dietNote?: string;          // 饮食备注
  dietTags?: string[];        // 快捷标签
  createdAt: string;
}
```

## 6. 核心用户流程

```
首次打开（游客，无需先登录）
  ↓
引导页（3页：AI定制 / 灵活调整 / 无压力打卡）
  ↓
信息录入（5步最小必要信息，约1分钟）
  ↓
「专属计划生成中」→ 生成第一周计划（草稿，未写入）
  ↓
计划确认页：展示完整 7 天计划详情 → [确认] 写入并进入首页 / [还想改改] → 反馈 → 重新生成 → 再次确认（不限次）
  ↓
首页：今日任务卡（仅展示已确认计划；动作格式如「哑铃飞鸟 12*4」+ 饮食要点）
  ↓
[准备开练] → 开始打卡：鼓励提示 → [练完后] → 结束打卡：填训练完成度 → 鼓励收录（已开始未结束 → 默认100%）
  ↓
[本周训练全部结束后] → 每周饮食反馈：填写本周饮食执行度+反馈 → 鼓励收录
  ↓
[遇到问题] → AI 对话：优先调整当天，必要时联动本周剩余
  ↓
每周日（或手动）：先完成饮食反馈 → 生成下周训练计划+饮食建议草稿 → 确认页 → 确认后写入生效
```

## 7. AI Prompt 策略（关键）

MVP 需要 **3 个核心 Prompt**：

**Prompt A：计划生成器**
```
你是资深私人教练和营养师。根据以下用户信息，生成下一周的健身和饮食计划。
要求：
1. 必须结合用户的完成度历史（如果上周完成度<60%，降低强度和复杂度）
2. 考虑用户的实际环境（家庭/健身房）和可用器材
3. 饮食计划要符合忌口，并且简单易执行（食堂/外卖友好）
4. 输出必须为结构化 JSON，包含每天的动作、组数、饮食原则
5. 第 2 周+额外约束：必须传入 weeklyDietPercent、manualCheckInRate、lowTrainingDays；若 lowTrainingDays >= 3 则降低复杂度，若 weeklyDietPercent < 50% 则简化饮食建议，若连续两周 manualCheckInRate < 50% 则以养成习惯为主
```

**Prompt A-Revise：计划确认后按反馈重生成**
```
用户已对草稿计划提出修改意见。结合 userFeedbacks 与上一版计划摘要，生成新的一周 JSON。
必须落实反馈中的合理诉求；输出格式与 Prompt A 一致；不得报复性提高难度。
```

**Prompt B：实时调整助手**
```
你是用户的 AI 私教。用户会告诉你实际执行中的困难。
规则：
1. 不指责、不制造焦虑（i人友好）
2. 根据用户的反馈，立即给出调整后的方案（替代动作/简化饮食）
3. 如果用户连续多天低完成度，主动建议降低目标，先培养习惯
4. 回复简洁，带emoji，语气像靠谱的朋友
```

## 8. UI/UX 风格方向
- **清新简洁**：白底+薄荷绿/淡蓝色主色，圆角卡片，大量留白
- **低压力设计**：没有红色的"未完成"警告，用柔和的灰色表示未打卡
- **对话式交互**：AI 调整页面像聊天，不是表单
- **4 Tab 导航**：首页（今日任务卡）/ 本周（7 天列表）/ AI 对话 / 我的（设置、账号）

## 9. 开发任务拆分

| 阶段 | 任务 | 产出 |
|------|------|------|
| **Phase 1** | Expo 项目（TS + 4 Tab 导航）+ Express 后端 + PG schema + DeepSeek 代理 | 可运行骨架 |
| **Phase 2** | 5 步 Onboarding + 计划生成/确认/重生成 | 首体验可跑通 |
| **Phase 3** | 今日任务卡 + 训练打卡（开始/结束）+ 休息日 + 离线缓存 | 每日闭环可用 |
| **Phase 4** | AI 对话（Streaming）+ 每周饮食反馈 | 调整+饮食闭环 |
| **Phase 5** | 周迭代逻辑 + 本周 Tab + 我的 Tab + App 内提示 + 联调 | MVP 可体验 |

## 10. 风险与建议

1. **DeepSeek API 成本**：计划生成+对话调整调用频次高，建议后端做**对话摘要**（只传最近 5 轮+用户档案+本周计划，不要传全量历史）。
2. **计划格式不稳定**：LLM 输出 JSON 可能出错，后端必须做 **JSON 校验+失败重试+容错降级**（出错时返回默认计划，不卡死）。

