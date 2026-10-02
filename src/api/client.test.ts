import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearTokens, setTokens } from '@/auth/token-store';
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
