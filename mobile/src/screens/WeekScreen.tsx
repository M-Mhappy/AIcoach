import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { DayPlan } from '../types/plan';
import { DAY_NAMES } from '../constants/profile';

export default function WeekScreen() {
  const { activePlan, currentWeek } = useAppStore();

  if (!activePlan?.days) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>本周计划</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>还没有计划</Text>
          <Text style={styles.placeholderSub}>完成信息采集后生成你的第一个周计划</Text>
        </View>
      </SafeAreaView>
    );
  }

  const days = activePlan.days;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>第{currentWeek}周计划</Text>

        {days.map((day: DayPlan, i: number) => (
          <View key={i} style={styles.dayRow}>
            <View style={styles.dayLabel}>
              <Text style={styles.dayName}>{DAY_NAMES[day.dayOfWeek - 1]}</Text>
            </View>
            <View style={styles.dayContent}>
              {day.isRestDay ? (
                <Text style={styles.restText}>休息 🌿</Text>
              ) : day.training ? (
                <>
                  <Text style={styles.focusText}>{day.training.focus}</Text>
                  <Text style={styles.detailText}>
                    {day.training.exercises?.length || 0} 个动作 · 约{day.training.estimatedMinutes}分钟
                  </Text>
                </>
              ) : (
                <Text style={styles.restText}>—</Text>
              )}
            </View>
          </View>
        ))}

        {activePlan && (
          <View style={styles.dietOverview}>
            <Text style={styles.sectionTitle}>本周饮食概览</Text>
            {days.filter((d: DayPlan) => d.diet?.principles?.length).slice(0, 1).map((d: DayPlan, i: number) => (
              <View key={i}>
                {d.diet.principles.map((p: string, j: number) => (
                  <Text key={j} style={styles.dietItem}>· {p}</Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 16 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  placeholderText: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  placeholderSub: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  dayRow: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 14,
    marginBottom: 8, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  dayLabel: { width: 48 },
  dayName: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  dayContent: { flex: 1 },
  restText: { fontSize: 14, color: '#9CA3AF' },
  focusText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  detailText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  dietOverview: {
    marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  dietItem: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
