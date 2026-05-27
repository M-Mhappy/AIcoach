import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PercentPickerProps {
  value: number;
  onChange: (v: number) => void;
}

const STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export function PercentPicker({ value, onChange }: PercentPickerProps) {
  return (
    <>
      <View style={styles.percentRow}>
        <Text style={styles.percentValue}>{value}%</Text>
      </View>
      <View style={styles.sliderTrack}>
        {STEPS.map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.sliderDot, value === v && styles.sliderDotActive]}
            onPress={() => onChange(v)}
          >
            <Text style={[styles.sliderLabel, value === v && styles.sliderLabelActive]}>
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  percentRow: { alignItems: 'center', marginBottom: 12 },
  percentValue: { fontSize: 44, fontWeight: '700', color: '#4F46E5' },
  sliderTrack: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sliderDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
  },
  sliderDotActive: { backgroundColor: '#4F46E5' },
  sliderLabel: { fontSize: 10, color: '#6B7280' },
  sliderLabelActive: { color: '#fff', fontWeight: '700' },
});
