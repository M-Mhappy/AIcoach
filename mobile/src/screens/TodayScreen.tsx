import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api/client';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { DayPlan, Exercise } from '../types/plan';

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const ENCOURAGEMENTS = [
  '出发了就是胜利，加油 💪',
  '今天的你已经比昨天的沙发强了 🌟',
  '开始就是最难的一步，你已经迈出来了',
  '按自己的节奏来，不用赶',
  '今天练完又是充实的一天 🌱',
];

type CheckInState = 'not_started' | 'training' | 'completed';

export default function TodayScreen({ navigation }: any) {
  const { userId, activePlan, activePlanId, todayCheckInDone } = useAppStore();
  const [checkInState, setCheckInState] = useState<CheckInState>(todayCheckInDone ? 'completed' : 'not_started');
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [encouragement, setEncouragement] = useState('');
  const [dietExpanded, setDietExpanded] = useState(false);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const dateStr = `${DAY_NAMES[dayOfWeek]} · ${MONTH_NAMES[today.getMonth()]}${today.getDate()}日`;
  const isoDate = today.toISOString().split('T')[0];

  const todayPlan = activePlan?.days?.find(
    (d: DayPlan) => d.dayOfWeek === (dayOfWeek === 0 ? 7 : dayOfWeek)
  );

  const handleStart = async () => {
    if (!userId || !activePlanId) return;
    try {
      const { checkInId: id } = await api.startCheckIn(userId, activePlanId, isoDate);
      setCheckInId(id);
      setCheckInState('training');
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
    } catch (err) {
      console.error('Start check-in failed:', err);
      Alert.alert('开始失败', getFriendlyErrorMessage(err));
    }
  };

  const handleComplete = () => {
    if (!checkInId) return;
    navigation.navigate('CheckInComplete', { checkInId });
  };

  if (!todayPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.dateText}>{dateStr}</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>还没有训练计划</Text>
          <Text style={styles.placeholderSub}>完成信息采集后生成你的专属计划</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (todayPlan.isRestDay) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.dateText}>{dateStr}</Text>
        <View style={styles.restCard}>
          <Text style={styles.restEmoji}>🌿</Text>
          <Text style={styles.restTitle}>今天是休息日</Text>
          <Text style={styles.restSubtitle}>好好休息，明天继续加油</Text>
        </View>
        {todayPlan.diet && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>今日饮食</Text>
            {todayPlan.diet.principles?.map((p: string, i: number) => (
              <Text key={i} style={styles.dietPrinciple}>· {p}</Text>
            ))}
          </View>
        )}
      </SafeAreaView>
    );
  }

  const training = todayPlan.training;
  const diet = todayPlan.diet;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('本周')}>
            <Text style={styles.weekLink}>本周 ›</Text>
          </TouchableOpacity>
        </View>

        {checkInState === 'training' && encouragement ? (
          <View style={styles.encourageCard}>
            <Text style={styles.encourageText}>{encouragement}</Text>
          </View>
        ) : null}

        {checkInState === 'training' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>训练中…</Text>
          </View>
        )}

        {training && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              今日训练 · {training.focus} · 约{training.estimatedMinutes}分钟
            </Text>
            {training.exercises?.map((ex: Exercise, i: number) => (
              <Text key={i} style={styles.exerciseItem}>
                {ex.name} {ex.reps}*{ex.sets}
              </Text>
            ))}
            {training.exercises?.some((ex: Exercise) => ex.note) && (
              <View style={styles.noteSection}>
                {training.exercises.filter((ex: Exercise) => ex.note).map((ex: Exercise, i: number) => (
                  <Text key={i} style={styles.noteText}>💡 {ex.note}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {diet && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>今日饮食</Text>
            {diet.principles?.map((p: string, i: number) => (
              <Text key={i} style={styles.dietPrinciple}>· {p}</Text>
            ))}
            {diet.sampleMeals?.length > 0 && (
              <TouchableOpacity onPress={() => setDietExpanded(!dietExpanded)}>
                <Text style={styles.expandToggle}>
                  {dietExpanded ? '收起示例餐单 ▲' : '展开示例餐单 ▼'}
                </Text>
              </TouchableOpacity>
            )}
            {dietExpanded && diet.sampleMeals?.map((m: string, i: number) => (
              <Text key={i} style={styles.dietMeal}>{m}</Text>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {checkInState === 'not_started' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleStart}>
            <Text style={styles.primaryBtnText}>开始训练</Text>
          </TouchableOpacity>
        )}
        {checkInState === 'training' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleComplete}>
            <Text style={styles.primaryBtnText}>完成训练</Text>
          </TouchableOpacity>
        )}
        {checkInState === 'completed' && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>已完成 ✅</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('对话')}
        >
          <Text style={styles.secondaryBtnText}>找 AI 调整</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16, paddingBottom: 24 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  placeholderSub: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateText: { fontSize: 18, fontWeight: '700', color: '#111827' },
  weekLink: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  encourageCard: {
    backgroundColor: '#ECFDF5', borderRadius: 12, padding: 12, marginBottom: 12,
  },
  encourageText: { fontSize: 14, color: '#065F46', textAlign: 'center' },
  statusBadge: {
    alignSelf: 'flex-start', backgroundColor: '#FEF3C7', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8, marginBottom: 12,
  },
  statusText: { fontSize: 13, color: '#92400E', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  exerciseItem: { fontSize: 15, color: '#374151', lineHeight: 26 },
  noteSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 },
  noteText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  dietPrinciple: { fontSize: 14, color: '#374151', lineHeight: 24 },
  expandToggle: { fontSize: 13, color: '#4F46E5', marginTop: 8 },
  dietMeal: { fontSize: 13, color: '#374151', lineHeight: 22, marginTop: 4 },
  restCard: { alignItems: 'center', paddingVertical: 60 },
  restEmoji: { fontSize: 48 },
  restTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 16 },
  restSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  footer: { flexDirection: 'row', padding: 16, gap: 12 },
  primaryBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  completedBadge: {
    flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#ECFDF5', alignItems: 'center',
  },
  completedText: { fontSize: 16, fontWeight: '700', color: '#065F46' },
});
