import { mockApi } from './mock';
import { Platform } from 'react-native';
import { WeeklyPlan } from '../types/plan';
import { UserProfile } from '../types/user';

const USE_MOCK = false;

const DEV_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'http://192.168.1.100:3000';

export const BASE_URL = __DEV__
  ? DEV_BASE_URL
  : 'https://your-production-api.com';

const REQUEST_TIMEOUT_MS = 15000;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP_${res.status}`);
    }
    return res.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('REQUEST_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

const realApi = {
  register: (password: string) =>
    request<{ userId: string; shortCode: string }>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  login: (shortCode: string, password: string) =>
    request<{ userId: string; shortCode: string }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ shortCode, password }),
    }),

  createAnonymousUser: () =>
    request<{ userId: string }>('/api/users/anonymous', { method: 'POST' }),

  updateProfile: (userId: string, data: Record<string, unknown>) =>
    request(`/api/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getUser: (userId: string) =>
    request<UserProfile>(`/api/users/${userId}`),

  generatePlan: (userId: string, weekNumber: number) =>
    request<{ draftId: string; plan: WeeklyPlan }>('/api/plans/generate', {
      method: 'POST',
      body: JSON.stringify({ userId, weekNumber }),
    }),

  regeneratePlan: (draftId: string, feedback: string) =>
    request<{ draftId: string; plan: WeeklyPlan }>(`/api/plans/drafts/${draftId}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),

  confirmPlan: (draftId: string) =>
    request<{ planId: string; plan: WeeklyPlan }>(`/api/plans/drafts/${draftId}/confirm`, {
      method: 'POST',
    }),

  getActivePlan: (userId: string) =>
    request<{ id: string; weekly_plan: WeeklyPlan; week_number: number }>(`/api/plans/active/${userId}`),

  startCheckIn: (userId: string, planId: string, date: string) =>
    request<{ checkInId: string }>('/api/checkins/start', {
      method: 'POST',
      body: JSON.stringify({ userId, planId, date }),
    }),

  completeCheckIn: (checkInId: string, data: { trainingPercent: number; note?: string; reason?: string }) =>
    request(`/api/checkins/${checkInId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitDietReview: (data: {
    userId: string; weekNumber: number; planId: string;
    dietPercent: number; dietNote?: string; dietTags?: string[];
  }) =>
    request('/api/diet/review', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const api = USE_MOCK ? mockApi : realApi;
