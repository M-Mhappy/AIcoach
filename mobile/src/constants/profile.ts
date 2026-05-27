export const GENDERS = ['男', '女'] as const;
export const GOALS = ['减脂', '增肌', '塑形', '保持健康'] as const;
export const DAYS = [2, 3, 4, 5, 6] as const;
export const MINUTES = [20, 30, 45, 60] as const;
export const ENVIRONMENTS = ['家庭', '健身房', '宿舍或户外'] as const;
export const EXPERIENCES = ['零基础', '有点基础', '练过一段时间'] as const;
export const DIET_OPTIONS = ['素食', '不吃猪肉', '乳糖不耐', '海鲜过敏', '无特殊要求'] as const;

export const EQUIPMENT_GROUPS = [
  {
    label: '徒手 / 小件',
    items: ['纯徒手', '瑜伽垫', '弹力带', '跳绳'],
  },
  {
    label: '自由重量',
    items: ['哑铃', '杠铃', '壶铃'],
  },
  {
    label: '健身房器械',
    items: ['固定器械（龙门架/推胸机等）', '引体向上杆', '绳索/滑轮', '史密斯机'],
  },
  {
    label: '有氧设备',
    items: ['跑步机', '椭圆机/划船机', '动感单车'],
  },
] as const;

export const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
