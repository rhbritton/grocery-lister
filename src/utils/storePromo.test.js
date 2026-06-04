import {
  dismissStorePromo,
  getStorePromoTarget,
  isStorePromoDismissed,
  shouldShowStorePromoBanner,
} from './storePromo';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36';

function mockUserAgent(ua) {
  Object.defineProperty(window, 'navigator', {
    value: { userAgent: ua, standalone: false },
    configurable: true,
  });
}

describe('storePromo', () => {
  const originalEnv = process.env;
  const originalNavigator = window.navigator;

  beforeEach(() => {
    process.env = { ...originalEnv };
    localStorage.clear();
    mockUserAgent(IPHONE_UA);
  });

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
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

  it('returns Play Store target on Android without playStoreLive flag', () => {
    process.env.REACT_APP_PLAY_STORE_LIVE = 'false';
    process.env.REACT_APP_PLAY_STORE_URL =
      'https://play.google.com/store/apps/details?id=com.rhbritton.grocerylister';
    mockUserAgent(ANDROID_UA);

    expect(getStorePromoTarget()).toEqual(
      expect.objectContaining({
        platform: 'android',
        storeName: 'Google Play',
        cta: 'Install',
      })
    );
    expect(shouldShowStorePromoBanner(false)).toBe(true);
  });

  it('hides Android promo when REACT_APP_PLAY_STORE_PROMO is false', () => {
    process.env.REACT_APP_PLAY_STORE_PROMO = 'false';
    mockUserAgent(ANDROID_UA);

    expect(getStorePromoTarget()).toBeNull();
  });
});
