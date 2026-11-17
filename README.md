# Github-Report

GitHub GraphQL API로 지난 7일간의 내 GitHub 활동을 모아 주간 리포트로 보여주는 프로젝트입니다.
Hono 기반 API 서버가 데이터를 가져와 가공하고, Expo(React Native) 앱이 그 결과를 화면에 보여줍니다.

## 주요 기능

- **주간 활동 요약**: 지난 7일간의 총 기여 수, 커밋, PR, 리뷰, 이슈 수
- **연속 커밋 스트릭** 🔥: 최근 1년 기여 캘린더를 기준으로 며칠 연속 기여했는지 계산 (KST 기준, 오늘 아직 기여가 없어도 어제까지 이어졌다면 스트릭 유지)
- **지난 주 대비 비교**: 이번 주와 지난 주 커밋 수 차이와 증감(🔼/🔽) 표시
- **가장 활발했던 repo**: 커밋 수 기준 상위 3개 저장소
- **당겨서 새로고침**: 앱에서 Pull to Refresh로 최신 데이터 다시 불러오기

## 구조

```
github-report/
├── server/          # Hono API 서버 (GitHub GraphQL → 리포트 JSON)
│   └── src/index.ts
└── app/             # Expo Router 기반 React Native 앱
    └── src/app/
        ├── _layout.tsx
        └── index.tsx    # 주간 리포트 화면
```

```
[ Expo App ] --GET /report--> [ Hono Server :3001 ] --GraphQL--> [ GitHub API ]
```

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| Server | Node.js, TypeScript, [Hono](https://hono.dev), `@hono/node-server`, `tsx`, `dotenv` |
| App | [Expo](https://expo.dev) SDK 57, Expo Router, React Native 0.86, React 19, TypeScript |
| Data | GitHub GraphQL API (`contributionsCollection`) |

## 시작하기

### 사전 준비

- Node.js (LTS 권장)
- GitHub Personal Access Token (`read:user` 권한)
- 앱 실행 시 iOS 시뮬레이터 / Android 에뮬레이터 / Expo Go 중 하나

### 1. 서버 실행

```bash
cd server
npm install
```

`server/.env` 파일을 만들고 아래 값을 채웁니다.

```env
GITHUB_USER=your-github-username
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxx
```

> `.env`는 `.gitignore`에 포함되어 있어 커밋되지 않습니다. 토큰이 저장소에 올라가지 않도록 주의하세요.

```bash
npm run dev
# ✅ Server running on http://localhost:3001
```

### 2. 앱 실행

```bash
cd app
npm install
npm start          # 또는 npm run ios / npm run android / npm run web
```

앱은 `http://localhost:3001/report`로 요청을 보냅니다.
iOS 시뮬레이터나 웹에서는 그대로 동작하지만, Android 에뮬레이터나 실제 기기에서는 `localhost`가 기기 자신을 가리키므로
`app/src/app/index.tsx`의 주소를 PC의 IP(Android 에뮬레이터는 `10.0.2.2`)로 바꿔야 합니다.

## API

### `GET /report`

지난 7일간의 활동 리포트를 반환합니다.

```json
{
  "period": { "from": "2026-11-10T00:00:00.000Z", "to": "2026-11-17T00:00:00.000Z" },
  "totalContributions": 42,
  "currentStreak": 5,
  "commits": 30,
  "pullRequests": 4,
  "reviews": 2,
  "issues": 1,
  "topRepos": [
    { "name": "github-report", "commits": 18 },
    { "name": "another-repo", "commits": 8 },
    { "name": "side-project", "commits": 4 }
  ],
  "weekOverWeek": {
    "commitDelta": 6,
    "trend": "up",
    "lastWeekCommits": 24
  }
}
```

| 필드 | 설명 |
| --- | --- |
| `period` | 집계 기간 (지금으로부터 7일 전 ~ 지금) |
| `totalContributions` | 기간 내 전체 기여 수 |
| `currentStreak` | 연속 기여 일수 |
| `commits` / `pullRequests` / `reviews` / `issues` | 항목별 기여 수 |
| `topRepos` | 커밋 수 상위 3개 저장소 |
| `weekOverWeek.commitDelta` | 이번 주 커밋 수 − 지난 주 커밋 수 |
| `weekOverWeek.trend` | `up` / `down` / `same` |
| `weekOverWeek.lastWeekCommits` | 지난 주(8~14일 전) 커밋 수 |
