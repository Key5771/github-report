import { useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native'

// SwiftUI의 struct 처럼, 받아올 데이터 모양을 타입으로 정의
type Report = {
  totalContributions: number,
  currentStreak: number,
  commits: number,
  pullRequests: number,
  reviews: number,
  topRepos: { name: string; commits: number }[]
}

export default function Index() {
  // @State 3개: 데이터 / 로딩중 / 에러
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // fetch 로직을 재사용 가능한 함수로 분리
  const loadReport = async () => {
    try {
      const res = await fetch('http://localhost:3001/report')
      const data = await res.json()
      setReport(data)
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }

  // 당겨서 새로고침: 당김 인디케이터만 돌리며 fetch
  const onRefresh = async () => {
    setRefreshing(true)
    await loadReport()
    setRefreshing(false)
  }

  // 화면 처음 뜰 때 1번 실행 (SwiftUI의 .task {} 느낌)
  useEffect(() => {
    loadReport().finally(() => setLoading(false))
  }, [])

  // 상태에 따라 다른 화면 (if/else로 분기)
  if (loading) {
    return(
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>에러: {error}</Text>
      </View>
    )
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>📊 이번 주 GitHub 활동</Text>

      <View style={styles.streakCard}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakValue}>{report!.currentStreak}일</Text>
        <Text style={styles.streakLabel}>연속 커밋</Text>
      </View>

      <View style={styles.row}>
        <Stat label="총 기여" value={report!.totalContributions} />
        <Stat label="커밋" value={report!.commits} />
        <Stat label="PR" value={report!.pullRequests} />
      </View>

      <Text style={styles.section}>가장 활발했던 repo</Text>
      {report!.topRepos.map((repo) => (
        <View key={repo.name} style={styles.repoRow}>
          <Text style={styles.repoName}>{repo.name}</Text>
          <Text style={styles.repoCommits}>{repo.commits} commits</Text>
        </View>
      ))}
    </ScrollView>
  )
}

// 작은 재사용 컴포넌트 (SwiftUI의 서브 View처럼)
function Stat({ label, value}: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: 'red', padding: 20 },
  container: { padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  stat: {
    flex: 1, backgroundColor: '#f2f2f7', borderRadius: 12, 
    padding: 16, alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  section: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  repoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  repoName: { fontSize: 16 },
  repoCommits: { fontSize: 14, color: '#888' },
  streakCard: {
    backgroundColor: '#fff5eb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  streakEmoji: { fontSize: 32 },
  streakValue: { fontSize: 32, fontWeight: 'bold', color: '#ff6b35', marginTop: 4 },
  streakLabel: { fontSize: 14, color: '#666', marginTop: 4 },
})