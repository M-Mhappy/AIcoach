import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api/client';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { persistOnboarded } from '../utils/offlineCache';
import { GENDERS, GOALS, DAYS, MINUTES, ENVIRONMENTS, EXPERIENCES, DIET_OPTIONS, EQUIPMENT_GROUPS } from '../constants/profile';
import { ProfileFormData } from '../types/user';
import { Chip } from '../components/Chip';

const TOTAL_STEPS = 7;

export default function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfileFormData>({
    gender: '', height: '', weight: '',
    goal: '', availableDays: 3, availableMinutes: 30,
    environment: '', experience: '', dietRestrictions: [], equipment: [],
  });

  const { userId, setUser, setOnboarded, setDraft } = useAppStore();

  const canNext = () => {
    switch (step) {
      case 1: return !!data.gender;
      case 2: return !!data.goal;
      case 3: return data.availableDays > 0 && data.availableMinutes > 0;
      case 4: return !!data.environment;
      case 5: return data.equipment.length > 0;
      case 6: return !!data.experience;
      case 7: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let uid = userId;
      if (!uid) {
        const { userId: newId } = await api.createAnonymousUser();
        uid = newId;
        setUser(newId, '');
      }
      await api.updateProfile(uid!, {
        ...data,
        height: data.height ? parseFloat(data.height) : undefined,
        weight: data.weight ? parseFloat(data.weight) : undefined,
      });
      const { draftId, plan } = await api.generatePlan(uid!, 1);
      setDraft(draftId, plan);
      setOnboarded(true);
      await persistOnboarded();
      navigation.replace('PlanConfirm');
    } catch (err) {
      console.error('Onboarding submit failed:', err);
      Alert.alert('提交失败', getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(v => v !== item) : [...arr, item];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingTitle}>专属计划生成中</Text>
        <Text style={styles.loadingSubtitle}>正在按你的时间和场景定制本周计划…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>Step {step}/{TOTAL_STEPS}</Text>
        <Text style={styles.hint}>约 1 分钟，不用填太多</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {step === 1 && (
          <>
            <Text style={styles.question}>基本信息</Text>
            <Text style={styles.subLabel}>性别</Text>
            <View style={styles.chipRow}>
              {GENDERS.map(g => (
                <Chip key={g} label={g} selected={data.gender === g}
                  onPress={() => setData({ ...data, gender: g })} />
              ))}
            </View>
            <Text style={[styles.subLabel, { marginTop: 20 }]}>身高 cm（选填）</Text>
            <TextInput style={styles.input} placeholder="例如 175" keyboardType="numeric"
              value={data.height} onChangeText={v => setData({ ...data, height: v.replace(/[^0-9.]/g, '') })} maxLength={6} />
            <Text style={[styles.subLabel, { marginTop: 16 }]}>体重 kg（选填）</Text>
            <TextInput style={styles.input} placeholder="例如 70" keyboardType="numeric"
              value={data.weight} onChangeText={v => setData({ ...data, weight: v.replace(/[^0-9.]/g, '') })} maxLength={6} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.question}>你的主要目标</Text>
            {GOALS.map(g => (
              <Chip key={g} label={g} selected={data.goal === g}
                onPress={() => setData({ ...data, goal: g })} />
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.question}>每周能练几天</Text>
            <View style={styles.chipRow}>
              {DAYS.map(d => (
                <Chip key={d} label={`${d}天`} selected={data.availableDays === d}
                  onPress={() => setData({ ...data, availableDays: d })} />
              ))}
            </View>
            <Text style={[styles.question, { marginTop: 24 }]}>每次大约多久</Text>
            <View style={styles.chipRow}>
              {MINUTES.map(m => (
                <Chip key={m} label={`${m}分钟`} selected={data.availableMinutes === m}
                  onPress={() => setData({ ...data, availableMinutes: m })} />
              ))}
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.question}>主要训练场景</Text>
            {ENVIRONMENTS.map(e => (
              <Chip key={e} label={e} selected={data.environment === e}
                onPress={() => setData({ ...data, environment: e })} />
            ))}
          </>
        )}

        {step === 5 && (
          <>
            <Text style={styles.question}>你有哪些器材？</Text>
            <Text style={styles.subLabel}>多选，AI 会只用你勾选的器材来安排动作</Text>
            {EQUIPMENT_GROUPS.map(group => (
              <View key={group.label} style={styles.eqGroup}>
                <Text style={styles.eqGroupLabel}>{group.label}</Text>
                <View style={styles.chipRow}>
                  {group.items.map(eq => (
                    <Chip key={eq} label={eq} selected={data.equipment.includes(eq)}
                      onPress={() => setData({ ...data, equipment: toggleArrayItem(data.equipment, eq) })} />
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        {step === 6 && (
          <>
            <Text style={styles.question}>你的运动基础</Text>
            {EXPERIENCES.map(e => (
              <Chip key={e} label={e} selected={data.experience === e}
                onPress={() => setData({ ...data, experience: e })} />
            ))}
          </>
        )}

        {step === 7 && (
          <>
            <Text style={styles.question}>饮食忌口（可多选，也可跳过）</Text>
            {DIET_OPTIONS.map(d => (
              <Chip key={d} label={d} selected={data.dietRestrictions.includes(d)}
                onPress={() => setData({ ...data, dietRestrictions: toggleArrayItem(data.dietRestrictions, d) })} />
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.backBtnText}>上一步</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canNext() && styles.btnDisabled]}
          disabled={!canNext()}
          onPress={() => step < TOTAL_STEPS ? setStep(step + 1) : handleSubmit()}
        >
          <Text style={styles.nextBtnText}>
            {step < TOTAL_STEPS ? '下一步' : '生成我的专属计划'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  loadingTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 24 },
  loadingSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepLabel: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  hint: { fontSize: 12, color: '#9CA3AF' },
  content: { flex: 1, paddingHorizontal: 16 },
  contentInner: { paddingBottom: 24 },
  question: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  subLabel: { fontSize: 14, color: '#6B7280', marginBottom: 10 },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#111827',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eqGroup: { marginBottom: 16 },
  eqGroupLabel: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase' },
  footer: { flexDirection: 'row', padding: 16, gap: 12 },
  backBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  backBtnText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  nextBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
