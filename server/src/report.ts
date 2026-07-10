// 증감 방향을 세 가지로만 제한하는 타입
export type Trend = 'up' | 'down' | 'same'

export function getTrend(delta: number): Trend {
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'same'
}

// 일별 데이터를 받아 "오늘부터 며칠 연속 커밋했나" 계산
export function calculateStreak(weeks: { contributionDays: { date: string; contributionCount: number }[] }[]): number {
  // 1. 오늘 날짜를 KST 기준 문자열로 (예: "2026-07-06")
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: 'Asia/Seoul' })
  
  // 모든 날을 펼쳐서 날짜순 정렬
  const days = weeks
    .flatMap((w) => w.contributionDays)
    .filter((d) => d.date <= today)   // 미레칸 제거
    .sort((a, b) => a.date.localeCompare(b.date))
  
  let streak = 0
  // 최근 날짜부터 거꾸로 훑기
  for (let i = days.length - 1; i >= 0; i--) {
    const isToday = days[i].date === today

    if (days[i].contributionCount > 0) {
      streak++
    } else if (isToday) {
      continue // 오늘 아직 커밋 안 했어도 스트릭은 안 깨진 걸로 (어제까지 셈)
    } else {
      break // 커밋 없는 날 나오면 스트릭 종료
    }
  }
  return streak
}