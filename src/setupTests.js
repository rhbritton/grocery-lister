// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

jest.mock('./auth/firebaseConfig', () => ({
  auth: {},
  db: {},
  appId: 'test-app-id',
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn((_auth, callback) => {
    callback(null);
    return jest.fn();
  }),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

window.matchMedia =
  window.matchMedia ||
  function matchMedia() {
    return {
      matches: false,
      media: '',
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    };
  };
