import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEvent, setAuthToken } from './api';
import { setLoadingHandlers } from './loading';

describe('api helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
    setAuthToken(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds Authorization header when token is set', async () => {
    const start = vi.fn();
    const stop = vi.fn();
    setLoadingHandlers(start, stop);

    const mockRes = { ok: true, json: () => Promise.resolve({ ok: true }) };
    global.fetch.mockResolvedValue(mockRes);

    setAuthToken('token123');
    await createEvent({ name: 'Test' });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token123',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test' }),
    });
    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('adminToken')).toBe('token123');
  });

  it('clears token from storage when unset', () => {
    setAuthToken('abc');
    expect(localStorage.getItem('adminToken')).toBe('abc');
    setAuthToken(null);
    expect(localStorage.getItem('adminToken')).toBeNull();
  });
});
