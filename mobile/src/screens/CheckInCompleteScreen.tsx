import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { getFriendlyErrorMessage } from '../utils/errorMessage';
import { PercentPicker } from '../components/PercentPicker';

const REASON_TAGS = ['加班没时间', '身体不舒服', '没有器材', '状态不好', '其他'];

const PRAISE_TEXTS: Record<string, string> = {
  perfect: '满分打卡！今天训练全部到位，执行力拉满 ✅',
  good: '今天训练完成得很好，继续保持这个节奏 🌟',
};

const INQUIRY_TEXTS: Record<string, string> = {
  partial: '今天训练没全部完成，是遇到什么情况了吗？方便的话说一下，我帮你调整。',
  zero: '今天没来得及练也没关系，休息也是计划的一部分。有什么原因的话可以说一下。',
};

type Phase = 'input' | 'feedback';

export default function CheckInCompleteScreen({ route, navigation }: any) {
  const { checkInId } = route.params;
  const { setTodayCheckInDone } = useAppStore();
  const [phase, setPhase] = useState<Phase>('input');
  const [percent, setPercent] = useState(50);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.completeCheckIn(checkInId, {
        trainingPercent: percent,
        note: note.trim() || undefined,
        reason: reason.trim() || undefined,
      });
      setTodayCheckInDone(true);
      setPhase('feedback');
    } catch (err) {
      console.error('Complete check-in failed:', err);
      Alert.alert('提交失败', getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const goHome = () => {
    navigation.navigate('Main', { screen: '今日' });
  };

  const goChat = () => {
    navigation.navigate('Main', { screen: '对话' });
  };

  if (phase === 'feedback') {
    const isGood = percent >= 80;
    const feedbackText = isGood
      ? (percent === 100 ? PRAISE_TEXTS.perfect : PRAISE_TEXTS.good)
      : (percent === 0 ? INQUIRY_TEXTS.zero : INQUIRY_TEXTS.partial);

    const confirmText = isGood
      ? '已记下今天的训练情况，会用来帮你调整后续计划。'
      : '已记下，后续会根据你的实际情况做调整。';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackEmoji}>{isGood ? '🎉' : '🌱'}</Text>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
          {!isGood && !reason && (
            <Text style={styles.skipNote}>没问题，节奏是慢慢找到的，明天我们继续 🌱</Text>
          )}
          {!isGood && reason && (
            <Text style={styles.skipNote}>收到了，后面会根据你的实际情况来调整，别有压力 🌱</Text>
          )}
          <Text style={styles.confirmSentence}>{confirmText}</Text>
          <View style={styles.feedbackButtons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={goHome}>
              <Text style={styles.primaryBtnText}>返回首页</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={goChat}>
              <Text style={styles.secondaryBtnText}>和 AI 聊聊今天</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inputContent}>
        <Text style={styles.title}>训练完成度</Text>

        <PercentPicker value={percent} onChange={setPercent} />

        <Text style={styles.noteLabel}>训练备注（选填）</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="有什么想说的…"
          placeholderTextColor="#9CA3AF"
          maxLength={50}
          value={note}
          onChangeText={setNote}
        />

        {percent < 80 && (
          <>
            <Text style={styles.noteLabel}>原因（选填，帮助调整计划）</Text>
            <View style={styles.tagRow}>
              {REASON_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, reason === tag && styles.tagActive]}
                  onPress={() => setReason(reason === tag ? '' : tag)}
                >
                  <Text style={[styles.tagText, reason === tag && styles.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          disabled={submitting}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryBtnText}>
            {submitting ? '提交中…' : '提交'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  inputContent: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 24 },
  noteLabel: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 8, marginTop: 8 },
  noteInput: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14,
    borderWidth: 1, borderColor: '#E5E7EB', color: '#111827', marginBottom: 16,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  tagActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  tagText: { fontSize: 13, color: '#374151' },
  tagTextActive: { color: '#4F46E5', fontWeight: '600' },
  feedbackContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  feedbackEmoji: { fontSize: 56, marginBottom: 16 },
  feedbackText: { fontSize: 18, fontWeight: '600', color: '#111827', textAlign: 'center', lineHeight: 26 },
  skipNote: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 12 },
  confirmSentence: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 16 },
  feedbackButtons: { marginTop: 32, width: '100%', gap: 12 },
  footer: { padding: 16 },
  primaryBtn: { paddingVertical: 14, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryBtn: { paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
});
