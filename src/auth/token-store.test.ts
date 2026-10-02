import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTokens, getAccessToken, getRefreshToken, setTokens, subscribe } from './token-store';

// Hardcoded on purpose: the storage key is a persistence contract. Renaming it
// would silently log out every existing user, so a change should break a test.
const REFRESH_KEY = 'task-board.refreshToken';

const tokens = { accessToken: 'access-1', refreshToken: 'refresh-1' };

describe('token-store', () => {
  // Module state survives between tests; reset it so each test starts empty.
  beforeEach(() => {
    clearTokens();
    localStorage.clear();
  });

  describe('setTokens', () => {
    it('keeps the access token in memory and the refresh token in localStorage', () => {
      setTokens(tokens);

      expect(getAccessToken()).toBe('access-1');
      expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh-1');
      expect(getRefreshToken()).toBe('refresh-1');
    });

    it('with null, clears both tokens', () => {
      setTokens(tokens);
      setTokens(null);

      expect(getAccessToken()).toBeNull();
      expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('removes both tokens', () => {
      setTokens(tokens);
      clearTokens();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('reads through to localStorage, so a rotation by another tab is seen', () => {
      setTokens(tokens);
      // Simulates another tab rotating the token behind this module's back.
      localStorage.setItem(REFRESH_KEY, 'refresh-from-other-tab');

      expect(getRefreshToken()).toBe('refresh-from-other-tab');
    });
  });

  describe('subscribe', () => {
    it('notifies exactly once per setTokens and per clearTokens', () => {
      const listener = vi.fn();
      subscribe(listener);

      setTokens(tokens);
      expect(listener).toHaveBeenCalledTimes(1);

      clearTokens();
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('notifies exactly once for setTokens(null)', () => {
      const listener = vi.fn();
      subscribe(listener);

      setTokens(null);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('stops notifying after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);

      unsubscribe();
      setTokens(tokens);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
