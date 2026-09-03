/** AI recipe import is available to any signed-in user (requires a personal Gemini key). */
export function canUseAiRecipeImport(user) {
  return Boolean(user?.uid);
}

/** Personal Gemini API key UI + client-side BYOK path — any signed-in user. */
export function canUsePersonalGeminiKey(user) {
  return Boolean(user?.uid);
}
