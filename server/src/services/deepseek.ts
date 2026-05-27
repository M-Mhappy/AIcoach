import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

function ensureArr(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}

interface UserProfile {
  gender?: string;
  height?: number;
  weight?: number;
  goal: string;
  available_days: number;
  available_minutes: number;
  environment: string;
  experience: string;
  diet_restrictions: unknown;
  equipment: unknown;
}

function formatEquipment(eq: unknown): string {
  const arr = ensureArr(eq);
  if (arr.length === 0) return '纯徒手（无任何器材）';
  return arr.join('、');
}

function buildPlanPrompt(profile: UserProfile, weekNumber: number, checkIns?: any[], dietReview?: any): string {
  const eqList = formatEquipment(profile.equipment);
  const bodyInfo = [
    profile.gender ? `性别：${profile.gender}` : '',
    profile.height ? `身高：${profile.height}cm` : '',
    profile.weight ? `体重：${profile.weight}kg` : '',
  ].filter(Boolean).join('，');

  let prompt = `你是资深私人教练和营养师。根据以下用户信息，生成第${weekNumber}周的健身和饮食计划。

用户信息：
${bodyInfo ? `- ${bodyInfo}\n` : ''}- 目标：${profile.goal}
- 每周训练天数：${profile.available_days}
- 每次时长：${profile.available_minutes}分钟
- 训练场景：${profile.environment}
- 运动基础：${profile.experience}
- 饮食忌口：${ensureArr(profile.diet_restrictions).join('、') || '无'}
- 可用器材：${eqList}

要求：
1. 训练日数量 = ${profile.available_days}天，其余为休息日
2. 单日动作数根据时长：20分钟→3项，30→4，45→5，60→6
3. 【重要】所有训练动作必须严格限制在用户可用器材范围内：${eqList}。如果用户只有哑铃，绝对不能安排杠铃、器械、绳索等动作；如果用户选了"纯徒手"，只能安排自重动作
4. 零基础用户禁止高难度自由重量组合，优先基础动作并标注替代方案
5. 饮食每天给2-3条原则 + 1-2条示例餐，符合忌口，食堂/外卖友好
6. 每条exercise必须可渲染为 "{name} {reps}*{sets}" 格式
7. 输出纯JSON，不要markdown代码块`;

  if (weekNumber > 1 && checkIns) {
    const completedOnes = checkIns.filter(c => c.training_percent !== null);
    const avg = completedOnes.length > 0
      ? completedOnes.reduce((s, c) => s + c.training_percent, 0) / completedOnes.length
      : 100;
    const low = completedOnes.filter(c => c.training_percent < 40).length;
    const notes = checkIns.filter(c => c.note).map(c => c.note);
    const reasons = checkIns.filter(c => c.reason).map(c => c.reason);

    prompt += `\n\n上周训练反馈：
- 平均训练完成度：${avg.toFixed(0)}%
- 低完成度天数（<40%）：${low}天
- 训练备注：${notes.join('；') || '无'}
- 低完成度原因：${reasons.join('；') || '无'}`;

    if (avg < 60 || low >= 3) {
      prompt += `\n⚠️ 上周完成度低，本周必须降低强度和复杂度。`;
    }
  }

  if (weekNumber > 1 && dietReview) {
    prompt += `\n\n上周饮食反馈：
- 饮食执行度：${dietReview.diet_percent}%
- 饮食备注：${dietReview.diet_note || '无'}
- 饮食标签：${ensureArr(dietReview.diet_tags).join('、') || '无'}`;

    if (dietReview.diet_percent < 50) {
      prompt += `\n⚠️ 上周饮食执行度低，本周饮食建议必须更简单（原则≤2条，示例更具体）。`;
    }
  }

  prompt += `\n\n输出JSON格式（严格遵守此schema）：
{
  "days": [
    {
      "dayOfWeek": 1,
      "isRestDay": false,
      "training": {
        "focus": "胸+三头",
        "exercises": [{"name": "哑铃卧推", "sets": 4, "reps": "12", "note": ""}],
        "estimatedMinutes": 30
      },
      "diet": {
        "principles": ["少油", "高蛋白"],
        "sampleMeals": ["午餐：鸡胸肉+糙米+西兰花"]
      }
    }
  ]
}`;

  return prompt;
}

export async function generatePlan(profile: UserProfile, weekNumber: number, checkIns?: any[], dietReview?: any) {
  const prompt = buildPlanPrompt(profile, weekNumber, checkIns, dietReview);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response');

      const plan = JSON.parse(content);
      if (!plan.days || !Array.isArray(plan.days)) throw new Error('Invalid plan structure');
      return plan;
    } catch (err) {
      console.error(`Plan generation attempt ${attempt + 1} failed:`, err);
      if (attempt === 2) return getDefaultPlan(profile);
    }
  }
}

export async function regeneratePlan(profile: UserProfile, previousPlan: any, feedbacks: string[]) {
  const eqList = formatEquipment(profile.equipment);
  const prompt = `你是资深私人教练和营养师。用户已对草稿计划提出修改意见，你必须据此调整新计划。

用户信息：
- 目标：${profile.goal}
- 每周训练天数：${profile.available_days}
- 训练场景：${profile.environment}
- 运动基础：${profile.experience}
- 可用器材：${eqList}

用户反馈（按时间序）：
${feedbacks.map((f, i) => `${i + 1}. ${f}`).join('\n')}

上一版计划摘要：${JSON.stringify(previousPlan).slice(0, 2000)}

要求：
1. 明确回应反馈中的每一点
2. 输出完整一周JSON，格式与之前一致
3. 不得因反馈报复性提高难度
4. 若反馈矛盾，取更可执行的折中方案
5. 【重要】所有动作严格限制在可用器材范围内：${eqList}
6. 输出纯JSON，不要markdown代码块`;

  try {
    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json() as any;
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error('Regeneration failed:', err);
    return previousPlan;
  }
}

export async function streamChat(
  profile: UserProfile,
  currentPlan: any,
  history: { role: string; content: string }[],
  message: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const eqList = formatEquipment(profile.equipment);
  const systemPrompt = `你是用户的AI私教。用户信息：目标${profile.goal}，场景${profile.environment}，基础${profile.experience}，可用器材：${eqList}。
${currentPlan ? `本周计划：${JSON.stringify(currentPlan).slice(0, 1500)}` : '暂无计划'}

规则：
1. 不指责、不制造焦虑（i人友好）
2. 根据反馈立即给出调整方案（替代动作/简化饮食）
3. 推荐替代动作时，必须在用户可用器材（${eqList}）范围内
4. 连续多天低完成度→主动建议降低目标
5. 回复简洁，带emoji，语气像靠谱的朋友`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10),
    { role: 'user', content: message },
  ];

  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.8,
      stream: true,
    }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      } catch {}
    }
  }

  return fullResponse;
}

function getDefaultPlan(profile: UserProfile) {
  const days = [];
  for (let i = 1; i <= 7; i++) {
    const isTraining = i <= profile.available_days;
    days.push({
      dayOfWeek: i,
      isRestDay: !isTraining,
      training: isTraining ? {
        focus: '全身基础',
        exercises: [
          { name: '深蹲', sets: 3, reps: '12', note: '' },
          { name: '俯卧撑', sets: 3, reps: '10', note: '可跪姿' },
          { name: '哑铃划船', sets: 3, reps: '12', note: '' },
        ],
        estimatedMinutes: 20,
      } : null,
      diet: {
        principles: ['少油少盐', '蛋白质优先'],
        sampleMeals: ['午餐：一荤两素，米饭适量'],
      },
    });
  }
  return { days };
}
