import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api/client';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { PercentPicker } from '../components/PercentPicker';

const DIET_TAGS = ['吃得比较健康', '偶尔外卖', '基本都外卖', '忘了吃', '暴饮暴食', '基本按计划'];

export default function DietReviewScreen({ navigation }: any) {
  const { userId, currentWeek, activePlanId } = useAppStore();
  const [percent, setPercent] = useState(50);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSubmit = async () => {
    if (!userId || !activePlanId) return;
    setSubmitting(true);
    try {
      await api.submitDietReview({
        userId,
        weekNumber: currentWeek,
        planId: activePlanId,
        dietPercent: percent,
        dietNote: note.trim() || undefined,
        dietTags: tags.length > 0 ? tags : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Diet review failed:', err);
      Alert.alert('提交失败', getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.doneTitle}>饮食反馈已提交</Text>
          <Text style={styles.doneSubtitle}>
            会根据你的饮食情况调整下周的建议
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>返回</Text>
          </TouchableOpacity>
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
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>第{currentWeek}周饮食反馈</Text>
        <Text style={styles.subtitle}>回顾一下这周的饮食执行情况</Text>

        <Text style={styles.label}>饮食执行度</Text>
        <PercentPicker value={percent} onChange={setPercent} />

        <Text style={styles.label}>这周饮食关键词（可多选）</Text>
        <View style={styles.tagRow}>
          {DIET_TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, tags.includes(tag) && styles.tagActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>补充说明（选填）</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="比如：这周应酬比较多…"
          placeholderTextColor="#9CA3AF"
          maxLength={100}
          multiline
          value={note}
          onChangeText={setNote}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          disabled={submitting}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryBtnText}>{submitting ? '提交中…' : '提交饮食反馈'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  backText: { fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 8, marginTop: 16 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  tagActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  tagText: { fontSize: 13, color: '#374151' },
  tagTextActive: { color: '#4F46E5', fontWeight: '600' },
  noteInput: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, minHeight: 60,
    fontSize: 14, borderWidth: 1, borderColor: '#E5E7EB', color: '#111827', textAlignVertical: 'top',
  },
  doneContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  doneEmoji: { fontSize: 56, marginBottom: 16 },
  doneTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  doneSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  footer: { padding: 16 },
  primaryBtn: {
    paddingVertical: 14, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', marginTop: 24,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
