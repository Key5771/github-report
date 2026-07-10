
export type Trend = 'up' | 'down' | 'same'

// SwiftUI의 struct 처럼, 받아올 데이터 모양을 타입으로 정의
export type Report = {
  totalContributions: number,
  currentStreak: number,
  commits: number,
  pullRequests: number,
  reviews: number,
  issues: number,
  topRepos: { name: string; commits: number }[]
  weekOverWeek: {
    commitDelta: number
    trend: 'up' | 'down' | 'same'
    lastWeekCommits: number
  }
}