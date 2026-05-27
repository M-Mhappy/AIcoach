export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  note?: string;
}

export interface Training {
  focus: string;
  exercises: Exercise[];
  estimatedMinutes: number;
}

export interface Diet {
  principles: string[];
  sampleMeals: string[];
}

export interface DayPlan {
  dayOfWeek: number;
  isRestDay: boolean;
  training: Training | null;
  diet: Diet | null;
}

export interface WeeklyPlan {
  days: DayPlan[];
}
