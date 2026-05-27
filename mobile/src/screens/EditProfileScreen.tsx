import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api/client';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { GENDERS, GOALS, DAYS, MINUTES, ENVIRONMENTS, EXPERIENCES, DIET_OPTIONS, EQUIPMENT_GROUPS } from '../constants/profile';
import { ProfileFormData } from '../types/user';
import { Chip } from '../components/Chip';

export default function EditProfileScreen({ navigation }: any) {
  const { userId } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProfileFormData>({
    gender: '', height: '', weight: '',
    goal: '', availableDays: 3, availableMinutes: 30,
    environment: '', experience: '', dietRestrictions: [], equipment: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const user = await api.getUser(userId!);
        setData({
          gender: user.gender || '',
          height: user.height ? String(user.height) : '',
          weight: user.weight ? String(user.weight) : '',
          goal: user.goal || '',
          availableDays: user.available_days || 3,
          availableMinutes: user.available_minutes || 30,
          environment: user.environment || '',
          experience: user.experience || '',
          dietRestrictions: user.diet_restrictions || [],
          equipment: user.equipment || [],
        });
      } catch (err) {
        Alert.alert('加载失败', getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile(userId!, {
        ...data,
        height: data.height ? parseFloat(data.height) : undefined,
        weight: data.weight ? parseFloat(data.weight) : undefined,
      });
      Alert.alert('已保存', '个人信息已更新，下次生成计划时将使用新数据');
      navigation.goBack();
    } catch (err) {
      Alert.alert('保存失败', getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(v => v !== item) : [...arr, item];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>修改个人信息</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.sectionTitle}>基本信息</Text>
        <Text style={styles.label}>性别</Text>
        <View style={styles.chipRow}>
          {GENDERS.map(g => (
            <Chip key={g} label={g} selected={data.gender === g}
              onPress={() => setData({ ...data, gender: g })} />
          ))}
        </View>
        <Text style={styles.label}>身高 cm</Text>
        <TextInput style={styles.input} keyboardType="numeric" placeholder="例如 175"
          value={data.height} onChangeText={v => setData({ ...data, height: v.replace(/[^0-9.]/g, '') })} maxLength={6} />
        <Text style={styles.label}>体重 kg</Text>
        <TextInput style={styles.input} keyboardType="numeric" placeholder="例如 70"
          value={data.weight} onChangeText={v => setData({ ...data, weight: v.replace(/[^0-9.]/g, '') })} maxLength={6} />

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>训练偏好</Text>
        <Text style={styles.label}>主要目标</Text>
        <View style={styles.chipRow}>
          {GOALS.map(g => (
            <Chip key={g} label={g} selected={data.goal === g}
              onPress={() => setData({ ...data, goal: g })} />
          ))}
        </View>
        <Text style={styles.label}>每周训练天数</Text>
        <View style={styles.chipRow}>
          {DAYS.map(d => (
            <Chip key={d} label={`${d}天`} selected={data.availableDays === d}
              onPress={() => setData({ ...data, availableDays: d })} />
          ))}
        </View>
        <Text style={styles.label}>每次时长</Text>
        <View style={styles.chipRow}>
          {MINUTES.map(m => (
            <Chip key={m} label={`${m}分钟`} selected={data.availableMinutes === m}
              onPress={() => setData({ ...data, availableMinutes: m })} />
          ))}
        </View>
        <Text style={styles.label}>训练场景</Text>
        <View style={styles.chipRow}>
          {ENVIRONMENTS.map(e => (
            <Chip key={e} label={e} selected={data.environment === e}
              onPress={() => setData({ ...data, environment: e })} />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>可用器材</Text>
        <Text style={styles.eqHint}>修改后下次生成计划将使用新器材配置</Text>
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

        <Text style={styles.label}>运动基础</Text>
        <View style={styles.chipRow}>
          {EXPERIENCES.map(e => (
            <Chip key={e} label={e} selected={data.experience === e}
              onPress={() => setData({ ...data, experience: e })} />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>饮食</Text>
        <Text style={styles.label}>饮食忌口</Text>
        <View style={styles.chipRow}>
          {DIET_OPTIONS.map(d => (
            <Chip key={d} label={d} selected={data.dietRestrictions.includes(d)}
              onPress={() => setData({ ...data, dietRestrictions: toggleArrayItem(data.dietRestrictions, d) })} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabledBtn]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>保存修改</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backText: { fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { flex: 1, paddingHorizontal: 16 },
  contentInner: { paddingBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#111827',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eqHint: { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  eqGroup: { marginBottom: 14 },
  eqGroupLabel: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', marginBottom: 8 },
  footer: { padding: 16 },
  saveBtn: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
});
