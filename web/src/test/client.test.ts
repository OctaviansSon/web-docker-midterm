import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request, setUnauthorizedHandler, tokenStore } from '../api/client';
import { api } from '../api/api';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('api client', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => {
    vi.unstubAllGlobals();
    setUnauthorizedHandler(null);
  });

  it('sends the Bearer token and JSON body', async () => {
    tokenStore.set('abc');
    const fetchMock = vi.mocked(fetch).mockResolvedValue(json({ id: 1 }, 201));
    await request('/api/teams', { method: 'POST', body: { name: 'x' } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/teams');
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer abc');
    expect(init!.body).toBe(JSON.stringify({ name: 'x' }));
  });

  it('turns a 204 into undefined', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    await expect(request('/api/tasks/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('extracts string and validation errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ detail: 'Email is already registered' }, 409));
    await expect(request('/x')).rejects.toMatchObject({ status: 409, message: 'Email is already registered' });
    vi.mocked(fetch).mockResolvedValueOnce(json({ detail: [{ loc: ['body', 'email'], msg: 'bad format' }] }, 422));
    await expect(request('/x')).rejects.toThrow('email: bad format');
  });

  it('calls the unauthorized handler on 401 (but not for login)', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.mocked(fetch).mockResolvedValue(json({ detail: 'Invalid or expired token' }, 401));
    await expect(request('/api/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
    await expect(api.login('a@b.co', 'wrong')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('builds task filter query strings and skips empty values', async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(json([]));
    await api.listTasks(5, { q: ' etcd ', category: 'kubernetes', priority: '', assignee_id: '' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/teams/5/tasks?q=etcd&category=kubernetes');
  });

  it('reports a network failure as status 0', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(request('/x')).rejects.toMatchObject({ status: 0 });
  });
});
