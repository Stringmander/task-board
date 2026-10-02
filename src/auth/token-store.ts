// Auth token storage (see docs/DECISIONS.md, 2026-10-02): access token in
// memory, refresh token in localStorage. A plain module rather than React state
// so the non-React fetch client can read tokens; AuthProvider subscribes on top
// of it for re-renders. Storage only. Network calls live in src/api.

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// Persistence contract: renaming this key silently logs out every existing
// session, since stored refresh tokens would no longer be found.
const REFRESH_KEY = 'task-board.refreshToken';

// Memory only, per tab. Lost on reload by design; app start exchanges the
// refresh token for a fresh pair instead.
let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

// Deliberately not cached in a variable: refresh tokens are single-use, and
// another tab may have rotated it. A cached copy could be one task-api has
// already deleted.
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function setTokens(tokens: Tokens | null): void {
  if (tokens) {
    accessToken = tokens.accessToken;
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    notify();
  } else {
    clearTokens();
  }
}

export function clearTokens(): void {
  accessToken = null;
  localStorage.removeItem(REFRESH_KEY);
  notify();
}

// Shape matches React's useSyncExternalStore(subscribe, getSnapshot): register
// a listener, get back its cleanup.
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
