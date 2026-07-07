import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

const QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!, $streakFrom: DateTime!, , $prevFrom: DateTime!) {
    user(login: $login) {
      weekly: contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        contributionCalendar { totalContributions }
        commitContributionsByRepository(maxRepositories: 10) {
          repository { name }
          contributions { totalCount }
        }
      }
      lastweek: contributionsCollection(from: $prevFrom, to: $from) {
        totalCommitContributions
        contributionCalendar { totalContributions }
      }
      streak: contributionsCollection(from: $streakFrom, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays { date contributionCount }
          }
        }
      }
    }
  }
`

// 증감 방향을 세 가지로만 제한하는 타입
type Trend = 'up' | 'down' | 'same'

function getTrend(delta: number): Trend {
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'same'
}

// 일별 데이터를 받아 "오늘부터 며칠 연속 커밋했나" 계산
function calculateStreak(weeks: { contributionDays: { date: string; contributionCount: number }[] }[]): number {
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

app.get('/report', async (c) => {
  const login = process.env.GITHUB_USER!
  const to = new Date()
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 지난 7일
  const prevFrom = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 지난 14일
  const streakFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 지난 1년

  // 1. GitHub에서 가져오기
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { 
        login, 
        from: from.toISOString(), 
        to: to.toISOString(), 
        streakFrom: streakFrom.toISOString(),
        prevFrom: prevFrom.toISOString(),
      },
    }),
  })
  const json = await res.json()

  const user = json.data.user
  const cc = user.weekly
  const commitDelta = cc.totalCommitContributions - user.lastweek.totalCommitContributions
  const currentStreak = calculateStreak(user.streak.contributionCalendar.weeks)

  // 2. 가공 — 가장 활발했던 repo 찾기
  const repos = cc.commitContributionsByRepository
    .map((r: any) => ({ name: r.repository.name, commits: r.contributions.totalCount }))
    .sort((a: any, b: any) => b.commits - a.commits)

  // 3. 요약해서 응답
  return c.json({
    period: { from: from.toISOString(), to: to.toISOString() },
    totalContributions: cc.contributionCalendar.totalContributions,
    currentStreak,
    commits: cc.totalCommitContributions,
    pullRequests: cc.totalPullRequestContributions,
    reviews: cc.totalPullRequestReviewContributions,
    issues: cc.totalIssueContributions,
    topRepos: repos.slice(0, 3),
    weekOverWeek: {
      commitDelta,
      trend: getTrend(commitDelta),
      lastWeekCommits: user.lastweek.totalCommitContributions,
    }
  })
})

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`✅ Server running on http://localhost:${info.port}`)
})