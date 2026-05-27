import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api/client';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { persistActivePlan } from '../utils/offlineCache';
import { DayPlan, Exercise } from '../types/plan';
import { DAY_NAMES } from '../constants/profile';

export default function PlanConfirmScreen({ navigation }: any) {
  const { draftId, draftPlan, setDraft, setActivePlan, setCurrentWeek } = useAppStore();
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  if (!draftPlan || !draftId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>计划数据丢失，请重新开始</Text>
      </SafeAreaView>
    );
  }

  const handleRegenerate = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      const { draftId: newId, plan } = await api.regeneratePlan(draftId, feedback.trim());
      setDraft(newId, plan);
      setFeedback('');
    } catch (err) {
      console.error('Regenerate failed:', err);
      Alert.alert('重生成失败', getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { planId, plan } = await api.confirmPlan(draftId);
      setActivePlan(planId, plan);
      setCurrentWeek(1);
      await persistActivePlan(planId, plan);
      navigation.replace('Main');
    } catch (err) {
      console.error('Confirm failed:', err);
      Alert.alert('确认失败', getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const days = draftPlan.days || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>
        <Text style={styles.title}>你的专属周计划</Text>
        <Text style={styles.subtitle}>浏览完整 7 天安排，满意就开始！</Text>

        {days.map((day: DayPlan, i: number) => (
          <View key={i} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{DAY_NAMES[day.dayOfWeek - 1] || `第${day.dayOfWeek}天`}</Text>
              {day.isRestDay && <Text style={styles.restBadge}>休息日</Text>}
              {!day.isRestDay && day.training && (
                <Text style={styles.focusBadge}>{day.training.focus}</Text>
              )}
            </View>

            {!day.isRestDay && day.training && (
              <View style={styles.exerciseList}>
                {day.training.exercises.map((ex: Exercise, j: number) => (
                  <Text key={j} style={styles.exerciseItem}>
                    {ex.name}  {ex.reps}×{ex.sets}
                    {ex.note ? `  (${ex.note})` : ''}
                  </Text>
                ))}
                <Text style={styles.estTime}>约 {day.training.estimatedMinutes} 分钟</Text>
              </View>
            )}

            {day.diet && (
              <View style={styles.dietSection}>
                {day.diet.principles?.map((p: string, k: number) => (
                  <Text key={k} style={styles.dietPrinciple}>· {p}</Text>
                ))}
                {day.diet.sampleMeals?.map((m: string, k: number) => (
                  <Text key={k} style={styles.dietMeal}>{m}</Text>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackLabel}>有不满意的地方？告诉我：</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="比如：想多练腿、不想做俯卧撑…"
            placeholderTextColor="#9CA3AF"
            multiline
            value={feedback}
            onChangeText={setFeedback}
          />
          <TouchableOpacity
            style={[styles.regenBtn, !feedback.trim() && styles.btnDisabled]}
            disabled={!feedback.trim() || loading}
            onPress={handleRegenerate}
          >
            {loading ? (
              <ActivityIndicator color="#4F46E5" />
            ) : (
              <Text style={styles.regenBtnText}>根据反馈重新生成</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          disabled={loading}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmBtnText}>满意，开始执行！</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center', marginTop: 100 },
  dayCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dayName: { fontSize: 16, fontWeight: '700', color: '#111827', marginRight: 8 },
  restBadge: {
    fontSize: 12, color: '#10B981', backgroundColor: '#ECFDF5',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
  },
  focusBadge: {
    fontSize: 12, color: '#4F46E5', backgroundColor: '#EEF2FF',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
  },
  exerciseList: { marginBottom: 8 },
  exerciseItem: { fontSize: 14, color: '#374151', lineHeight: 22 },
  estTime: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  dietSection: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 },
  dietPrinciple: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  dietMeal: { fontSize: 13, color: '#374151', lineHeight: 20, marginTop: 2 },
  feedbackSection: { marginTop: 8, marginBottom: 16 },
  feedbackLabel: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  feedbackInput: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, minHeight: 80,
    fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB', textAlignVertical: 'top',
  },
  regenBtn: {
    marginTop: 12, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#EEF2FF', alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  regenBtnText: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  footer: { padding: 16 },
  confirmBtn: { paddingVertical: 16, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center' },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
