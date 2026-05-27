import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_ID: 'user_id',
  SHORT_CODE: 'short_code',
  IS_ONBOARDED: 'is_onboarded',
  ACTIVE_PLAN: 'active_plan',
};

export async function persistUser(id: string, shortCode: string) {
  await AsyncStorage.multiSet([
    [KEYS.USER_ID, id],
    [KEYS.SHORT_CODE, shortCode],
  ]);
}

export async function getPersistedUserId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USER_ID);
}

export async function getPersistedShortCode(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.SHORT_CODE);
}

export async function persistOnboarded() {
  await AsyncStorage.setItem(KEYS.IS_ONBOARDED, 'true');
}

export async function getPersistedOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.IS_ONBOARDED)) === 'true';
}

export async function clearPersistedUser() {
  await AsyncStorage.multiRemove([
    KEYS.USER_ID, KEYS.SHORT_CODE, KEYS.IS_ONBOARDED,
    KEYS.ACTIVE_PLAN,
  ]);
}

export async function persistActivePlan(planId: string, plan: any) {
  await AsyncStorage.setItem(KEYS.ACTIVE_PLAN, JSON.stringify({ planId, plan }));
}

export async function getPersistedActivePlan(): Promise<{ planId: string; plan: any } | null> {
  const raw = await AsyncStorage.getItem(KEYS.ACTIVE_PLAN);
  return raw ? JSON.parse(raw) : null;
}
