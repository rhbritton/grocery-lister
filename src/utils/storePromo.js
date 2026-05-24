const DISMISS_STORAGE_KEY = 'grocerylister-store-promo-dismissed';

const APP_STORE_URL =
  process.env.REACT_APP_APP_STORE_URL || 'https://apps.apple.com/app/id0000000000';
const PLAY_STORE_URL =
  process.env.REACT_APP_PLAY_STORE_URL ||
  'https://play.google.com/store/apps/details?id=com.rhbritton.grocerylister';

function envFlag(name) {
  const value = process.env[name];
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isStandaloneWebApp() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isStorePromoDismissed() {
  try {
    return localStorage.getItem(DISMISS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissStorePromo() {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
}

export function getStorePromoTarget() {
  const appStoreLive = envFlag('REACT_APP_APP_STORE_LIVE');
  const playStoreLive = envFlag('REACT_APP_PLAY_STORE_LIVE');

  const iosLive = appStoreLive ?? false;
  const androidLive = playStoreLive ?? false;

  if (isIosDevice() && iosLive) {
    return {
      platform: 'ios',
      href: APP_STORE_URL,
      storeName: 'App Store',
      cta: 'App Store',
    };
  }

  if (isAndroidDevice() && androidLive) {
    return {
      platform: 'android',
      href: PLAY_STORE_URL,
      storeName: 'Google Play',
      cta: 'Google Play',
    };
  }

  return null;
}

export function shouldShowStorePromoBanner(isNativeApp = false) {
  if (isNativeApp || isStandaloneWebApp() || isStorePromoDismissed()) {
    return false;
  }

  return getStorePromoTarget() !== null;
}
