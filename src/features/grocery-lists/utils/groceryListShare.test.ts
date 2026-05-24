import {
  SHARE_WINDOW_SECONDS,
  getShareExpiresAt,
  isShareActive,
  getShareExpiresAtFromList,
} from './groceryListShare';

describe('groceryListShare', () => {
  const now = 1_700_000_000;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now * 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('computes expiry from sharedAt', () => {
    expect(getShareExpiresAt(now)).toBe(now + SHARE_WINDOW_SECONDS);
  });

  it('returns true while share window is active', () => {
    expect(isShareActive({ sharedAt: now - 100, shareExpiresAt: now + 1000 })).toBe(true);
  });

  it('returns false after share window expires', () => {
    expect(isShareActive({ sharedAt: now - SHARE_WINDOW_SECONDS - 1, shareExpiresAt: now - 1 })).toBe(false);
  });

  it('returns false when never shared', () => {
    expect(isShareActive({})).toBe(false);
  });

  it('derives expiry from sharedAt when shareExpiresAt missing', () => {
    expect(getShareExpiresAtFromList({ sharedAt: now })).toBe(now + SHARE_WINDOW_SECONDS);
  });
});
