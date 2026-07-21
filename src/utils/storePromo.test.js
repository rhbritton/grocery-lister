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
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    get: () => ua,
  });
  Object.defineProperty(window.navigator, 'standalone', {
    configurable: true,
    get: () => false,
  });
}

describe('storePromo', () => {
  beforeEach(() => {
    delete process.env.REACT_APP_APP_STORE_LIVE;
    delete process.env.REACT_APP_APP_STORE_URL;
    delete process.env.REACT_APP_PLAY_STORE_PROMO;
    delete process.env.REACT_APP_PLAY_STORE_URL;
    localStorage.clear();
    mockUserAgent(IPHONE_UA);
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    delete process.env.REACT_APP_APP_STORE_LIVE;
    delete process.env.REACT_APP_APP_STORE_URL;
    delete process.env.REACT_APP_PLAY_STORE_PROMO;
    delete process.env.REACT_APP_PLAY_STORE_URL;
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

  it('returns Play Store target on Android when promo is enabled', () => {
    process.env.REACT_APP_PLAY_STORE_PROMO = 'true';
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

  it('hides Android promo by default', () => {
    mockUserAgent(ANDROID_UA);
    expect(getStorePromoTarget()).toBeNull();
  });

  it('hides Android promo when REACT_APP_PLAY_STORE_PROMO is false', () => {
    process.env.REACT_APP_PLAY_STORE_PROMO = 'false';
    mockUserAgent(ANDROID_UA);

    expect(getStorePromoTarget()).toBeNull();
  });
});
