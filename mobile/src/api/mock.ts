const MOCK_PLAN = {
  days: [
    {
      dayOfWeek: 1,
      isRestDay: false,
      training: {
        focus: '胸+三头',
        exercises: [
          { name: '俯卧撑', sets: 3, reps: '12', note: '可跪姿降低难度' },
          { name: '哑铃卧推', sets: 4, reps: '10', note: '' },
          { name: '哑铃飞鸟', sets: 3, reps: '12', note: '' },
          { name: '绳索下压', sets: 3, reps: '15', note: '无绳索可用弹力带' },
        ],
        estimatedMinutes: 35,
      },
      diet: {
        principles: ['午餐少油，蛋白优先', '晚餐七分饱'],
        sampleMeals: ['午餐：鸡胸肉+糙米+西兰花', '晚餐：酸奶+全麦面包+水煮蛋'],
      },
    },
    {
      dayOfWeek: 2,
      isRestDay: true,
      training: null,
      diet: {
        principles: ['多喝水', '适量补充蛋白质'],
        sampleMeals: ['加餐：一根香蕉+一把坚果'],
      },
    },
    {
      dayOfWeek: 3,
      isRestDay: false,
      training: {
        focus: '背+二头',
        exercises: [
          { name: '哑铃划船', sets: 4, reps: '12', note: '' },
          { name: '高位下拉', sets: 4, reps: '10', note: '' },
          { name: '哑铃弯举', sets: 3, reps: '12', note: '' },
        ],
        estimatedMinutes: 30,
      },
      diet: {
        principles: ['高蛋白优先', '少喝含糖饮料'],
        sampleMeals: ['午餐：牛肉+土豆+蔬菜沙拉'],
      },
    },
    {
      dayOfWeek: 4,
      isRestDay: true,
      training: null,
      diet: {
        principles: ['清淡饮食', '多吃蔬菜'],
        sampleMeals: [],
      },
    },
    {
      dayOfWeek: 5,
      isRestDay: false,
      training: {
        focus: '腿+核心',
        exercises: [
          { name: '深蹲', sets: 4, reps: '12', note: '' },
          { name: '箭步蹲', sets: 3, reps: '10', note: '每侧' },
          { name: '平板支撑', sets: 3, reps: '45秒', note: '' },
          { name: '卷腹', sets: 3, reps: '15', note: '' },
        ],
        estimatedMinutes: 35,
      },
      diet: {
        principles: ['训练后及时补充碳水', '蛋白质摄入充足'],
        sampleMeals: ['训练后：香蕉+蛋白粉', '午餐：鸡腿饭+一份蔬菜'],
      },
    },
    {
      dayOfWeek: 6,
      isRestDay: true,
      training: null,
      diet: {
        principles: ['正常饮食即可'],
        sampleMeals: [],
      },
    },
    {
      dayOfWeek: 7,
      isRestDay: true,
      training: null,
      diet: {
        principles: ['适当放松，不暴饮暴食'],
        sampleMeals: [],
      },
    },
  ],
};

let mockUserId = 'mock-user-001';
let mockDraftId = 'mock-draft-001';
let mockPlanId = 'mock-plan-001';
let mockCheckInId = 'mock-checkin-001';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const mockApi = {
  register: async (_password: string) => {
    await delay(300);
    return { userId: mockUserId, shortCode: 'ABC123' };
  },

  login: async (_shortCode: string, _password: string) => {
    await delay(300);
    return { userId: mockUserId, shortCode: 'ABC123' };
  },

  createAnonymousUser: async () => {
    await delay(300);
    return { userId: mockUserId };
  },

  updateProfile: async (_userId: string, _data: any) => {
    await delay(200);
    return { success: true };
  },

  getUser: async (_userId: string) => {
    await delay(200);
    return { id: mockUserId, is_anonymous: true, goal: '减脂' };
  },

  generatePlan: async (_userId: string, _weekNumber: number) => {
    await delay(1500);
    return { draftId: mockDraftId, plan: MOCK_PLAN };
  },

  regeneratePlan: async (_draftId: string, _feedback: string) => {
    await delay(1500);
    mockDraftId = 'mock-draft-' + Date.now();
    return { draftId: mockDraftId, plan: MOCK_PLAN };
  },

  confirmPlan: async (_draftId: string) => {
    await delay(500);
    return { planId: mockPlanId, plan: MOCK_PLAN };
  },

  getActivePlan: async (_userId: string) => {
    await delay(300);
    return { id: mockPlanId, weekly_plan: MOCK_PLAN };
  },

  startCheckIn: async (_userId: string, _planId: string, _date: string) => {
    await delay(300);
    mockCheckInId = 'mock-checkin-' + Date.now();
    return { checkInId: mockCheckInId };
  },

  completeCheckIn: async (_checkInId: string, _data: any) => {
    await delay(300);
    return { success: true };
  },

  submitDietReview: async (_data: any) => {
    await delay(300);
    return { reviewId: 'mock-review-001' };
  },
};
