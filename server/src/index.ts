import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { fetchContributions } from './github.js'  // ts는 컴파일 되면 js가 된다. 따라서 js로 입력.
import { calculateStreak, getTrend } from './report.js'

const app = new Hono()

app.get('/report', async (c) => {
  const login = process.env.GITHUB_USER!
  const to = new Date()
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 지난 7일
  const prevFrom = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 지난 14일
  const streakFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 지난 1년

  // 1. GitHub에서 가져오기
  const user = await fetchContributions({
    login,
    from: from.toISOString(),
    to: to.toISOString(),
    streakFrom: streakFrom.toISOString(),
    prevFrom: prevFrom.toISOString(),
  })

  // 2. 가공 — 가장 활발했던 repo 찾기
  const cc = user.weekly
  const commitDelta = cc.totalCommitContributions - user.lastweek.totalCommitContributions
  const currentStreak = calculateStreak(user.streak.contributionCalendar.weeks)

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