import { Capacitor } from '@capacitor/core';

export const DEFAULT_PUBLIC_WEB_APP_URL = 'https://web.grocerylisterapp.com';

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

/** React Router basename — app lives at domain root on web and native. */
export function getRouterBasename() {
  return '';
}

/**
 * Public web entry URL for share links (always the hosted web app, not capacitor://).
 * Override with REACT_APP_WEB_APP_URL when needed (e.g. staging).
 */
export function getShareLinkBaseUrl() {
  const configured = process.env.REACT_APP_WEB_APP_URL?.replace(/\/$/, '');
  if (configured) {
    return configured;
  }

  if (isNativeApp()) {
    return DEFAULT_PUBLIC_WEB_APP_URL;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return DEFAULT_PUBLIC_WEB_APP_URL;
}

export function buildRecipeShareUrl(recipeId) {
  return `${getShareLinkBaseUrl()}?recipe=${encodeURIComponent(recipeId)}`;
}

export function buildGroceryListShareUrl(groceryListId) {
  return `${getShareLinkBaseUrl()}?grocerylist=${encodeURIComponent(groceryListId)}`;
}

/** Prefix for static assets (logo, etc.) in CRA builds. */
export function getPublicAssetUrl(relativePath) {
  const base = process.env.PUBLIC_URL || '';
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
}
