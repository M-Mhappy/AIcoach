import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { persistUser, persistOnboarded, persistActivePlan } from '../utils/offlineCache';
import { getFriendlyErrorMessage } from '../utils/errorMessage';

type Mode = 'register' | 'login';

export default function AuthScreen({ navigation }: any) {
  const [mode, setMode] = useState<Mode>('register');
  const [shortCode, setShortCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredCode, setRegisteredCode] = useState<string | null>(null);

  const { setUser, setOnboarded, setActivePlan, setCurrentWeek } = useAppStore();

  const handleRegister = async () => {
    if (password.length < 4) {
      Alert.alert('密码太短', '密码至少 4 位');
      return;
    }
    setLoading(true);
    try {
      const result = await api.register(password);
      await persistUser(result.userId, result.shortCode);
      setUser(result.userId, result.shortCode);
      setRegisteredCode(result.shortCode);
    } catch (err) {
      Alert.alert('注册失败', getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!shortCode.trim() || !password) {
      Alert.alert('请填写完整', '需要输入 ID 和密码');
      return;
    }
    setLoading(true);
    try {
      const result = await api.login(shortCode.trim(), password);
      await persistUser(result.userId, result.shortCode);
      setUser(result.userId, result.shortCode);

      const user = await api.getUser(result.userId);
      if (user.goal) {
        setOnboarded(true);
        await persistOnboarded();
        try {
          const plan = await api.getActivePlan(result.userId);
          if (plan?.id) {
            setActivePlan(plan.id, plan.weekly_plan);
            if (plan.week_number) setCurrentWeek(plan.week_number);
            await persistActivePlan(plan.id, plan.weekly_plan);
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
            return;
          }
        } catch {}
        navigation.reset({ index: 0, routes: [{ name: 'PlanConfirm' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      }
    } catch (err) {
      Alert.alert('登录失败', getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  if (registeredCode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successCard}>
          <Text style={styles.successEmoji}>&#x2705;</Text>
          <Text style={styles.successTitle}>注册成功</Text>
          <Text style={styles.successHint}>请牢记你的登录 ID：</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{registeredCode}</Text>
          </View>
          <Text style={styles.successNote}>下次登录时使用此 ID + 你设置的密码</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
            <Text style={styles.primaryBtnText}>开始使用</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.appName}>AI 私教</Text>
          <Text style={styles.subtitle}>
            {mode === 'register' ? '创建新账号' : '登录已有账号'}
          </Text>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === 'register' && styles.tabActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>注册</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>登录</Text>
            </TouchableOpacity>
          </View>

          {mode === 'login' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>你的 ID</Text>
              <TextInput
                style={styles.input}
                placeholder="例如 A3K9P2"
                autoCapitalize="characters"
                value={shortCode}
                onChangeText={setShortCode}
                maxLength={6}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>密码</Text>
            <TextInput
              style={styles.input}
              placeholder="至少 4 位"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {mode === 'register' ? (
            <View>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>注册</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.hint}>系统会自动为你生成一个短 ID 作为登录凭据</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>登录</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 24, paddingTop: 60 },
  appName: { fontSize: 32, fontWeight: '800', color: '#4F46E5', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  tabRow: { flexDirection: 'row', marginBottom: 24, backgroundColor: '#E5E7EB', borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#4F46E5' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
  hint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 12 },

  successCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successEmoji: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  successHint: { fontSize: 15, color: '#6B7280', marginBottom: 12 },
  codeBox: {
    backgroundColor: '#EEF2FF', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 16,
    marginBottom: 12, borderWidth: 2, borderColor: '#4F46E5', borderStyle: 'dashed',
  },
  codeText: { fontSize: 36, fontWeight: '800', color: '#4F46E5', letterSpacing: 6 },
  successNote: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
});
