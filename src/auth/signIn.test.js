jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
}));

jest.mock('@capacitor-firebase/authentication', () => ({
  FirebaseAuthentication: {
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
  },
}));

jest.mock('./firebaseConfig.js', () => ({
  auth: {},
}));

import { Capacitor } from '@capacitor/core';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { signInWithGoogle, getSignInErrorMessage } from './signIn.js';

describe('signIn', () => {
  beforeEach(() => {
    Capacitor.isNativePlatform.mockReturnValue(false);
    signInWithPopup.mockResolvedValue({ user: { uid: 'user-1' } });
  });

  it('uses web popup sign-in on web', async () => {
    await signInWithGoogle();

    expect(signInWithPopup).toHaveBeenCalled();
    expect(GoogleAuthProvider).toHaveBeenCalled();
  });

  it('maps popup closed to a friendly message', () => {
    expect(getSignInErrorMessage({ code: 'auth/popup-closed-by-user' })).toMatch(/cancelled/i);
  });
});
