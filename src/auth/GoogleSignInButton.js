// src/auth/GoogleSignInButton.js
import React from 'react';
import { useDispatch } from 'react-redux';
import { googleSignIn } from '../redux/actions/authActions'; // We'll create this action

const GoogleSignInButton = () => {
  const dispatch = useDispatch();

  const handleGoogleSignIn = async () => {
    try {
      await dispatch(googleSignIn());
      // Optionally handle redirection after successful sign-in
    } catch (error) {
      // Handle Google Sign-In errors (e.g., display error message)
      console.error("Google Sign-In failed:", error.message);
    }
  };

  return (
    <button onClick={handleGoogleSignIn}>
      Sign in with Google
    </button>
  );
};

export default GoogleSignInButton;