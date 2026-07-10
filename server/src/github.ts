// export가 없다는건 Swift의 private과 같다. 
// 외부에서 import 불가
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

// export가 있다는건 외부에서 import 가능하다는 뜻. Swift의 public/internal과 같다.
// Github GraphQL API 호출(순수하게 '가져오기'만)
export async function fetchContributions(variables: {
    login: string
    from: string
    to: string
    streakFrom: string
    prevFrom: string
}) {
    const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: QUERY, variables }),
    })
    
    const json = await res.json()
    return json.data.user
}