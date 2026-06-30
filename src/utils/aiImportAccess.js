/** Comma-separated allowlist, e.g. REACT_APP_AI_IMPORT_EMAILS=you@gmail.com,partner@gmail.com */
function getAllowedEmails() {
  const raw = process.env.REACT_APP_AI_IMPORT_EMAILS || '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function canUseAiRecipeImport(user) {
  const email = user?.email?.trim().toLowerCase();
  if (!email) return false;

  const allowed = getAllowedEmails();
  if (allowed.length === 0) return false;

  return allowed.includes(email);
}
