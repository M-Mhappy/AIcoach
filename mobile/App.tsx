import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import { getPersistedUserId, getPersistedShortCode, getPersistedOnboarded, getPersistedActivePlan } from './src/utils/offlineCache';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PlanConfirmScreen from './src/screens/PlanConfirmScreen';
import CheckInCompleteScreen from './src/screens/CheckInCompleteScreen';
import DietReviewScreen from './src/screens/DietReviewScreen';
import TodayScreen from './src/screens/TodayScreen';
import WeekScreen from './src/screens/WeekScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { paddingBottom: 4, height: 56 },
      }}
    >
      <Tab.Screen name="今日" component={TodayScreen} />
      <Tab.Screen name="本周" component={WeekScreen} />
      <Tab.Screen name="对话" component={ChatScreen} />
      <Tab.Screen name="我的" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { userId, isOnboarded, activePlanId, setUser, setOnboarded, setActivePlan } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const id = await getPersistedUserId();
      const code = await getPersistedShortCode();
      if (id && code) {
        setUser(id, code);
      }
      const onboarded = await getPersistedOnboarded();
      if (onboarded) setOnboarded(true);
      const plan = await getPersistedActivePlan();
      if (plan) setActivePlan(plan.planId, plan.plan);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const initialRoute = !userId
    ? 'Auth'
    : !isOnboarded
      ? 'Onboarding'
      : !activePlanId
        ? 'PlanConfirm'
        : 'Main';

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="PlanConfirm" component={PlanConfirmScreen} />
        <Stack.Screen name="CheckInComplete" component={CheckInCompleteScreen} />
        <Stack.Screen name="DietReview" component={DietReviewScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
