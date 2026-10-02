export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_KEY = 'task-board.refreshToken';

let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

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
  // localStorage.removeItem(REFRESH_KEY);
  notify();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
