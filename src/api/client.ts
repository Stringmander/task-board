// Transport layer: every request to task-api goes through apiFetch. Knows URLs,
// headers and tokens; knows nothing about React or caching (endpoint functions
// and TanStack Query hooks sit on top). Also owns refresh-on-401.

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/auth/token-store';
import { API_BASE_URL } from '@/lib/config';
import type { paths } from './schema';

async function send(path: string, init: RequestInit): Promise<Response> {
  // Copy into a Headers object rather than spreading: init.headers may be an
  // object, an array of pairs or a Headers instance, and `{ ...init, headers: {...} }`
  // would replace the caller's headers instead of merging with them.
  const headers = new Headers(init.headers);

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}

type RefreshResponse =
  paths['/auth/refresh']['post']['responses'][200]['content']['application/json'];

// POST /auth/refresh. Store the new pair on success; clear tokens on failure.
// Uses plain fetch, not apiFetch: no Bearer header belongs on this call, and
// it must never trigger its own refresh. A network failure rejects without
// clearing tokens, since an unreachable server doesn't mean the session is dead.
async function requestNewTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return false;
  }

  const payload: RefreshResponse = await res.json();
  setTokens({ accessToken: payload.accessToken, refreshToken: payload.refreshToken });
  return true;
}

let refreshPromise: Promise<boolean> | null = null;

// Return the in-flight refresh if there is one; otherwise start one.
// Sharing is required, not an optimisation: refresh tokens are single-use, so a
// second concurrent refresh would present an already-rotated token, get a 401,
// and log the user out.
function refreshOnce(): Promise<boolean> {
  refreshPromise ??= requestNewTokens().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

// No stream bodies: a 401 retry resends init.body, and a stream can only be read once.
type ApiInit = Omit<RequestInit, 'body'> & {
  body?: Exclude<BodyInit, ReadableStream>;
};

// Mirrors fetch's signature and contract: resolves with the raw Response for
// any HTTP status, rejecting only on network failure. Callers check res.ok.
// A 401 triggers at most one shared refresh and one retry.
export async function apiFetch(path: string, init: ApiInit = {}): Promise<Response> {
  const res = await send(path, init);

  if (res.status !== 401) return res;
  if (path.startsWith('/auth/')) return res; // here a 401 means bad credentials, not expiry

  const refreshed = await refreshOnce();
  if (!refreshed) return res;
  return send(path, init);
}
