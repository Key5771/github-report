import type { Report } from './types'   // 값이 아니라 타입만 가져올 때 type 키워드를 붙임

const BASE_URL = 'http://localhost:3001'

// async 함수는 항상 Promise<T>를 반환.
export async function fetchReport(): Promise<Report> {
    const res = await fetch(`${BASE_URL}/report`)
    if (!res.ok) throw new Error(`서버 응답 오류: ${res.status}`)
    return res.json()
}