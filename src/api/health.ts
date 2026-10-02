import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/config';
import type { paths } from './schema';

type HealthResponse = paths['/health']['get']['responses'][200]['content']['application/json'];

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error(`GET /health failed: ${res.status}`);
  return res.json();
}

export function useHealth() {
  return useQuery({ queryKey: ['health'], queryFn: fetchHealth });
}
