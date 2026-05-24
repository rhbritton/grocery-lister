import {
  dismissStorePromo,
  getStorePromoTarget,
  isStorePromoDismissed,
  shouldShowStorePromoBanner,
} from './storePromo';

describe('storePromo', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    localStorage.clear();
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns App Store target on iOS when live', () => {
    process.env.REACT_APP_APP_STORE_LIVE = 'true';
    process.env.REACT_APP_APP_STORE_URL = 'https://apps.apple.com/app/id123';

    expect(getStorePromoTarget()).toEqual(
      expect.objectContaining({ platform: 'ios', storeName: 'App Store' })
    );
  });

  it('hides when dismissed', () => {
    process.env.REACT_APP_APP_STORE_LIVE = 'true';
    process.env.REACT_APP_APP_STORE_URL = 'https://apps.apple.com/app/id123';

    dismissStorePromo();
    expect(isStorePromoDismissed()).toBe(true);
    expect(shouldShowStorePromoBanner(false)).toBe(false);
  });

  it('hides on iOS when App Store is not live', () => {
    process.env.REACT_APP_APP_STORE_LIVE = 'false';

    expect(getStorePromoTarget()).toBeNull();
  });
});
