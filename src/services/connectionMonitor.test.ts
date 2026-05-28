import {
  isNetworkUnavailableError,
  isEffectivelyOffline,
  getServerReachability,
  markNetworkAvailable,
  markNetworkUnavailable,
  setServerReachability,
} from './connectionState.ts';

describe('isNetworkUnavailableError', () => {
  it('returns true for Firestore network error codes', () => {
    expect(isNetworkUnavailableError({ code: 'unavailable' })).toBe(true);
    expect(isNetworkUnavailableError({ code: 'network-request-failed' })).toBe(true);
  });

  it('returns false for permission errors', () => {
    expect(isNetworkUnavailableError({ code: 'permission-denied' })).toBe(false);
  });
});

describe('isEffectivelyOffline', () => {
  beforeEach(() => {
    setServerReachability(true);
  });

  it('is offline when the server probe fails even if navigator.onLine is true', () => {
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });

    expect(isEffectivelyOffline(false)).toBe(true);

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: originalOnLine });
  });

  it('is online when the server is reachable and navigator.onLine is true', () => {
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });

    expect(isEffectivelyOffline(true)).toBe(false);

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: originalOnLine });
  });

  it('restores reachability only when explicitly confirmed after an outage', () => {
    markNetworkUnavailable();
    expect(getServerReachability()).toBe(false);

    markNetworkAvailable();
    expect(getServerReachability()).toBe(true);
  });
});
