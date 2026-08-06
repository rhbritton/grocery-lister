/** AI recipe import (shared Gemini) is available to any signed-in user. */
export function canUseAiRecipeImport(user) {
  return Boolean(user?.uid);
}

/** Soft-launch allowlist for personal Gemini key (BYOK) in Account / import modal. */
export const PERSONAL_GEMINI_KEY_ALLOWED_EMAILS = [
  'ryanhbritton@gmail.com',
  'ryanhbritton2@gmail.com',
  'kmholian15@gmail.com',
];

/** Personal Gemini API key UI + client-side BYOK path — allowlisted emails only. */
export function canUsePersonalGeminiKey(user) {
  const email = String(user?.email || '')
    .trim()
    .toLowerCase();
  if (!user?.uid || !email) return false;
  return PERSONAL_GEMINI_KEY_ALLOWED_EMAILS.map((e) => e.toLowerCase()).includes(email);
}
