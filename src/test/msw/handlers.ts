import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '@/lib/config'

export const handlers = [
  http.get(`${API_BASE_URL}/health`, () => HttpResponse.json({ status: 'ok' })),
]
