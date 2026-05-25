import {
  shouldFullRefreshUserData,
  shouldResetUserSession,
} from './sessionLifecycle';

describe('sessionLifecycle', () => {
  it('resets when logging out', () => {
    expect(shouldResetUserSession('user-a', null)).toBe(true);
  });

  it('does not reset on initial logged-out load', () => {
    expect(shouldResetUserSession(undefined, null)).toBe(false);
  });

  it('resets when switching accounts', () => {
    expect(shouldResetUserSession('user-a', 'user-b')).toBe(true);
    expect(shouldFullRefreshUserData('user-a', 'user-b')).toBe(true);
  });

  it('does not full refresh on first login after logout', () => {
    expect(shouldFullRefreshUserData(null, 'user-b')).toBe(false);
  });

  it('does not reset on first authenticated load', () => {
    expect(shouldResetUserSession(undefined, 'user-a')).toBe(false);
    expect(shouldFullRefreshUserData(undefined, 'user-a')).toBe(false);
  });
});
