import { StyleSheet, Text, View } from 'react-native'
import type { Trend } from '../types'

type StatProps = {
    label: string
    value: number
    delta?: number
    trend?: Trend
}

// export default function -> import Stat from './components/Stat'  default: 중괄호 없음, 이름 자유
// export function -> import { Stat } from './components/Stat'  named: 중괄호 필요, 이름 정확히
// 작은 재사용 컴포넌트 (SwiftUI의 서브 View처럼)
export default function Stat({ label, value, delta, trend }: StatProps) {
    return (
        <View style={styles.stat}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            {delta !== undefined && trend && trend !== 'same' && (
                <Text style={[styles.delta, trend === 'up' ? styles.deltaUp : styles.deltaDown]}>
                    {trend === 'up' ? '🔼' : '🔽'} {delta > 0 ? `+${delta}` : delta}
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
  stat: {
    flex: 1, backgroundColor: '#f2f2f7', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  delta: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  deltaUp: { color: '#22c55e' },
  deltaDown: { color: '#ef4444' },
})