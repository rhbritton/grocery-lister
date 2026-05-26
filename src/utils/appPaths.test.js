jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
}));

import { Capacitor } from '@capacitor/core';
import {
  DEFAULT_PUBLIC_WEB_APP_URL,
  getRouterBasename,
  getShareLinkBaseUrl,
  buildRecipeShareUrl,
  buildGroceryListShareUrl,
} from './appPaths';

describe('appPaths', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.REACT_APP_WEB_APP_URL;
    Capacitor.isNativePlatform.mockReturnValue(false);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses empty router basename on web and native', () => {
    expect(getRouterBasename()).toBe('');
    Capacitor.isNativePlatform.mockReturnValue(true);
    expect(getRouterBasename()).toBe('');
  });

  it('builds web share URLs from the current origin', () => {
    expect(buildRecipeShareUrl('abc123')).toBe(
      `${window.location.origin}?recipe=abc123`
    );
    expect(buildGroceryListShareUrl('list-1')).toBe(
      `${window.location.origin}?grocerylist=list-1`
    );
  });

  it('uses default public web URL on native', () => {
    Capacitor.isNativePlatform.mockReturnValue(true);

    expect(getShareLinkBaseUrl()).toBe(DEFAULT_PUBLIC_WEB_APP_URL);
    expect(buildRecipeShareUrl('abc123')).toBe(
      `${DEFAULT_PUBLIC_WEB_APP_URL}?recipe=abc123`
    );
  });

  it('uses configured public web URL when set', () => {
    Capacitor.isNativePlatform.mockReturnValue(true);
    process.env.REACT_APP_WEB_APP_URL = 'https://staging.web.grocerylisterapp.com';

    expect(getShareLinkBaseUrl()).toBe('https://staging.web.grocerylisterapp.com');
    expect(buildRecipeShareUrl('abc123')).toBe(
      'https://staging.web.grocerylisterapp.com?recipe=abc123'
    );
  });
});
