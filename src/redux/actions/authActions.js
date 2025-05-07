// src/redux/actions/authActions.js
import { signInWithGoogle as firebaseSignInWithGoogle, signOutUser, onAuthChange } from '../../firebase';
import { SET_AUTH_STATUS, SET_USER } from '../reducers/authReducer';

export const googleSignIn = () => async (dispatch) => {
  try {
    const result = await firebaseSignInWithGoogle();
    // The user's information is available in result.user
    dispatch({ type: SET_AUTH_STATUS, payload: true });
    dispatch({ type: SET_USER, payload: result.user });
    // Potentially fetch user data from Firestore here after sign-in
  } catch (error) {
    // Dispatch an error action if needed
    console.error("Google Sign-In error:", error);
    throw error; // Re-throw to be caught by the component
  }
};

export const logout = () => async (dispatch) => {
  try {
    await signOutUser();
    dispatch({ type: SET_AUTH_STATUS, payload: false });
    dispatch({ type: SET_USER, payload: null });
  } catch (error) {
    console.error("Logout error:", error);
    // Handle error
  }
};

// Action to set the initial auth state when the app loads
export const setAuthState = (isAuthenticated, user) => ({
  type: SET_AUTH_STATUS,
  payload: isAuthenticated,
  user,
});

// Listener for authentication changes (remains the same)
export const listenForAuthChanges = () => (dispatch) => {
  return onAuthChange((user) => {
    if (user) {
      // User is signed in
      dispatch({ type: SET_AUTH_STATUS, payload: true });
      dispatch({ type: SET_USER, payload: user });
      // Potentially fetch user-specific data from Firestore here
    } else {
      // User is signed out
      dispatch({ type: SET_AUTH_STATUS, payload: false });
      dispatch({ type: SET_USER, payload: null });
    }
  });
};