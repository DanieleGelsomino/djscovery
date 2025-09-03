import { describe, it, expect, vi } from 'vitest';
import { setLoadingHandlers, withLoading } from './loading';

describe('withLoading utility', () => {
  it('runs start and stop around async work', async () => {
    const start = vi.fn();
    const stop = vi.fn();
    setLoadingHandlers(start, stop);

    await expect(withLoading(async () => 'ok')).resolves.toBe('ok');
    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);

    start.mockClear();
    stop.mockClear();
    await expect(withLoading(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
