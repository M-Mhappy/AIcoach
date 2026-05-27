import { create } from 'zustand';
import { WeeklyPlan } from '../types/plan';

interface AppState {
  userId: string | null;
  shortCode: string | null;
  isOnboarded: boolean;
  currentWeek: number;
  activePlanId: string | null;
  activePlan: WeeklyPlan | null;
  draftId: string | null;
  draftPlan: WeeklyPlan | null;
  todayCheckInDone: boolean;

  setUser: (userId: string, shortCode: string) => void;
  setOnboarded: (v: boolean) => void;
  setCurrentWeek: (w: number) => void;
  setActivePlan: (planId: string, plan: WeeklyPlan) => void;
  setDraft: (draftId: string | null, plan: WeeklyPlan | null) => void;
  setTodayCheckInDone: (v: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  userId: null,
  shortCode: null,
  isOnboarded: false,
  currentWeek: 1,
  activePlanId: null,
  activePlan: null,
  draftId: null,
  draftPlan: null,
  todayCheckInDone: false,

  setUser: (userId, shortCode) => set({ userId, shortCode }),
  setOnboarded: (v) => set({ isOnboarded: v }),
  setCurrentWeek: (w) => set({ currentWeek: w }),
  setActivePlan: (planId, plan) => set({ activePlanId: planId, activePlan: plan, draftId: null, draftPlan: null }),
  setDraft: (draftId, plan) => set({ draftId, draftPlan: plan }),
  setTodayCheckInDone: (v) => set({ todayCheckInDone: v }),
  reset: () => set({ userId: null, shortCode: null, isOnboarded: false, currentWeek: 1, activePlanId: null, activePlan: null, draftId: null, draftPlan: null, todayCheckInDone: false }),
}));
