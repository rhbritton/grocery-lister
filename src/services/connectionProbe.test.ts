import {
  probeNetworkReachable,
  CONNECTIVITY_PROBE_URL,
} from './connectionProbe';

describe('probeNetworkReachable', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  it('returns false when navigator is offline', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    await expect(probeNetworkReachable()).resolves.toBe(false);
  });

  it('returns true when fetch succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await expect(probeNetworkReachable()).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      CONNECTIVITY_PROBE_URL,
      expect.objectContaining({ mode: 'no-cors', cache: 'no-store' })
    );
  });

  it('returns false when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));
    await expect(probeNetworkReachable()).resolves.toBe(false);
  });

  it('returns false when fetch is aborted', async () => {
    global.fetch = jest.fn((_url, init) => {
      const signal = init?.signal as AbortSignal | undefined;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    await expect(probeNetworkReachable(50)).resolves.toBe(false);
  });
});
