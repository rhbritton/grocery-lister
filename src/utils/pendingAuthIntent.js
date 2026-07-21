const STORAGE_KEY = 'grocerylister-pending-auth-intent';

/**
 * Remember an action to run after the user signs in (e.g. favorite a recipe).
 * Stored in sessionStorage so it survives the Google popup but not a new tab forever.
 */
export function setPendingAuthIntent(intent) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch {
    // ignore quota / private mode
  }
}

export function peekPendingAuthIntent() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function consumePendingAuthIntent(expectedType, expectedRecipeId) {
  const intent = peekPendingAuthIntent();
  if (!intent || intent.type !== expectedType) {
    return null;
  }
  if (expectedRecipeId && intent.recipeId !== expectedRecipeId) {
    return null;
  }

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }

  return intent;
}

export function clearPendingAuthIntent() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
