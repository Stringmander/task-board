import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/auth/token-store';
import { API_BASE_URL } from '@/lib/config';
import { server } from '@/test/msw/server';
import { apiFetch } from './client';

// Registers a one-off handler and returns a getter for the request it received,
// so each test can assert on exactly what apiFetch sent over the wire.
function captureRequest(method: 'get' | 'post', path: string, status = 200) {
  let captured: Request | undefined;
  server.use(
    http[method](`${API_BASE_URL}${path}`, ({ request }) => {
      captured = request;
      return HttpResponse.json({ ok: true }, { status });
    }),
  );
  return () => {
    if (!captured) throw new Error(`No ${method.toUpperCase()} ${path} reached the server`);
    return captured;
  };
}

describe('apiFetch', () => {
  beforeEach(() => {
    clearTokens();
  });

  it('prefixes the path with API_BASE_URL', async () => {
    const request = captureRequest('get', '/users/me');

    await apiFetch('/users/me');

    expect(request().url).toBe(`${API_BASE_URL}/users/me`);
  });

  it('attaches the access token as a Bearer Authorization header', async () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    const request = captureRequest('get', '/users/me');

    await apiFetch('/users/me');

    expect(request().headers.get('Authorization')).toBe('Bearer access-1');
  });

  it('omits the Authorization header when there is no access token', async () => {
    const request = captureRequest('get', '/users/me');

    await apiFetch('/users/me');

    expect(request().headers.has('Authorization')).toBe(false);
  });

  it("keeps the caller's method, body and headers alongside Authorization", async () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    const request = captureRequest('post', '/projects', 201);

    await apiFetch('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Inbox' }),
    });

    const sent = request();
    expect(sent.method).toBe('POST');
    expect(sent.headers.get('Content-Type')).toBe('application/json');
    expect(sent.headers.get('Authorization')).toBe('Bearer access-1');
    expect(await sent.json()).toEqual({ name: 'Inbox' });
  });

  it('returns non-2xx responses instead of throwing', async () => {
    captureRequest('get', '/users/me', 401);

    const res = await apiFetch('/users/me');

    expect(res.status).toBe(401);
  });
});

// A stand-in for task-api's auth: access tokens are only valid once issued by
// a refresh, and refresh tokens are single-use (each refresh rotates to a new
// one). Overlapping refreshes therefore fail exactly as they would for real.
function mockAuthServer() {
  let generation = 1;
  let validRefresh = 'refresh-1';
  let validAccess: string | null = null; // access-1 starts out expired
  let refreshCalls = 0;

  server.use(
    http.post(`${API_BASE_URL}/auth/refresh`, async ({ request }) => {
      refreshCalls++;
      const { refreshToken } = (await request.json()) as { refreshToken: string };
      await delay(20); // keep the refresh in flight long enough for requests to overlap
      if (refreshToken !== validRefresh) {
        return HttpResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
      }
      generation++;
      validRefresh = `refresh-${generation}`;
      validAccess = `access-${generation}`;
      return HttpResponse.json({ accessToken: validAccess, refreshToken: validRefresh });
    }),
    http.get(`${API_BASE_URL}/users/me`, ({ request }) =>
      request.headers.get('Authorization') === `Bearer ${validAccess}`
        ? HttpResponse.json({ id: 1 })
        : HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    ),
  );

  return { refreshCalls: () => refreshCalls };
}

describe('apiFetch refresh on 401', () => {
  beforeEach(() => {
    clearTokens();
  });

  it('refreshes, stores the new pair, and retries with the new access token', async () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    const auth = mockAuthServer();

    const res = await apiFetch('/users/me');

    expect(res.status).toBe(200);
    expect(auth.refreshCalls()).toBe(1);
    expect(getAccessToken()).toBe('access-2');
    expect(getRefreshToken()).toBe('refresh-2');
  });

  it('shares one refresh between concurrent 401s', async () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    const auth = mockAuthServer();

    const responses = await Promise.all([
      apiFetch('/users/me'),
      apiFetch('/users/me'),
      apiFetch('/users/me'),
    ]);

    // Without sharing, the 2nd and 3rd refreshes would present the already
    // rotated refresh-1, get a 401, and log the user out.
    expect(responses.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(auth.refreshCalls()).toBe(1);
  });

  it('clears tokens and returns the original 401 when the refresh fails', async () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'revoked' });
    const auth = mockAuthServer();

    const res = await apiFetch('/users/me');

    expect(res.status).toBe(401);
    expect(auth.refreshCalls()).toBe(1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('retries only once, returning the second 401 rather than looping', async () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    const auth = mockAuthServer();
    server.use(
      http.get(`${API_BASE_URL}/projects`, () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      ),
    );

    const res = await apiFetch('/projects');

    expect(res.status).toBe(401);
    expect(auth.refreshCalls()).toBe(1);
  });

  it('does not refresh when there is no refresh token', async () => {
    const auth = mockAuthServer();

    const res = await apiFetch('/users/me');

    expect(res.status).toBe(401);
    expect(auth.refreshCalls()).toBe(0);
  });

  it('does not refresh on a 401 from an /auth/ endpoint', async () => {
    // A wrong password on login is a 401 too; refreshing would be meaningless.
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    const auth = mockAuthServer();
    captureRequest('post', '/auth/login', 401);

    const res = await apiFetch('/auth/login', { method: 'POST' });

    expect(res.status).toBe(401);
    expect(auth.refreshCalls()).toBe(0);
  });

  it('does not refresh on other error statuses', async () => {
    setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    const auth = mockAuthServer();
    captureRequest('get', '/projects', 403);

    const res = await apiFetch('/projects');

    expect(res.status).toBe(403);
    expect(auth.refreshCalls()).toBe(0);
  });
});
