// Transport layer: every request to task-api goes through apiFetch. Knows URLs,
// headers and tokens; knows nothing about React or caching (endpoint functions
// and TanStack Query hooks sit on top). Refresh-on-401 will live here too.

import { getAccessToken } from '@/auth/token-store';
import { API_BASE_URL } from '@/lib/config';

// Mirrors fetch's signature and contract: resolves with the raw Response for
// any HTTP status, rejecting only on network failure. Callers check res.ok.
//
// `async` is deliberate despite there being no await: `new Headers()` throws
// synchronously on an invalid header name, and async turns that into a
// rejection, so callers (and TanStack Query) see a single failure channel.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
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
