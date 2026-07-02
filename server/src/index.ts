import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

const QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        contributionCalendar {
          totalContributions
        }
        commitContributionsByRepository(maxRepositories: 10) {
          repository { name }
          contributions { totalCount }
        }
      }
    }
  }
`

app.get('/report', async (c) => {
  const login = process.env.GITHUB_USER!
  const to = new Date()
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 지난 7일

  // 1. GitHub에서 가져오기
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { login, from: from.toISOString(), to: to.toISOString() },
    }),
  })
  const json = await res.json()
  const cc = json.data.user.contributionsCollection

  // 2. 가공 — 가장 활발했던 repo 찾기
  const repos = cc.commitContributionsByRepository
    .map((r: any) => ({ name: r.repository.name, commits: r.contributions.totalCount }))
    .sort((a: any, b: any) => b.commits - a.commits)

  // 3. 요약해서 응답
  return c.json({
    period: { from: from.toISOString(), to: to.toISOString() },
    totalContributions: cc.contributionCalendar.totalContributions,
    commits: cc.totalCommitContributions,
    pullRequests: cc.totalPullRequestContributions,
    reviews: cc.totalPullRequestReviewContributions,
    issues: cc.totalIssueContributions,
    topRepos: repos.slice(0, 3),
  })
})

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`✅ Server running on http://localhost:${info.port}`)
})