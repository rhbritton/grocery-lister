import { Capacitor } from '@capacitor/core';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from './firebaseConfig.js';

function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

async function signInWithGoogleNative() {
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
  const result = await FirebaseAuthentication.signInWithGoogle();
  const idToken = result.credential?.idToken;

  if (!idToken) {
    throw new Error('Google sign-in did not return an ID token.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

async function signInWithGoogleWeb() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signInWithGoogle() {
  if (isNativePlatform()) {
    return signInWithGoogleNative();
  }

  return signInWithGoogleWeb();
}

async function signInWithAppleNative() {
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
  const result = await FirebaseAuthentication.signInWithApple();
  const idToken = result.credential?.idToken;
  const rawNonce = result.credential?.nonce;

  if (!idToken) {
    throw new Error('Apple sign-in did not return an ID token.');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken,
    rawNonce,
  });

  return signInWithCredential(auth, credential);
}

/** Native Apple sign-in (Phase 2 UI). Web Apple sign-in can be added later. */
export async function signInWithApple() {
  if (!isNativePlatform()) {
    throw new Error('Apple sign-in is only available in the iOS or Android app.');
  }

  return signInWithAppleNative();
}

export function getSignInErrorMessage(error) {
  const code = error?.code;

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Sign-in was cancelled.';
  }

  if (code === 'auth/popup-blocked') {
    return 'Allow pop-ups for this site, then try again.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection and try again.';
  }

  return error?.message || 'Could not sign in. Try again.';
}
