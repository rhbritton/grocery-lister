const STORAGE_PREFIX = 'grocerylister-gemini-key';

function storageKey(userId) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function stripKeyQuotes(value) {
  const trimmed = String(value || '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getGeminiApiKey(userId) {
  if (!userId) return null;

  try {
    const value = localStorage.getItem(storageKey(userId));
    return stripKeyQuotes(value) || null;
  } catch {
    return null;
  }
}

export function setGeminiApiKey(userId, apiKey) {
  if (!userId) {
    throw new Error('Cannot save API key without a user id.');
  }

  const trimmed = stripKeyQuotes(apiKey);
  if (!trimmed) {
    throw new Error('API key cannot be empty.');
  }

  try {
    localStorage.setItem(storageKey(userId), trimmed);
  } catch {
    throw new Error('Could not save API key on this device.');
  }
}

export function clearGeminiApiKey(userId) {
  if (!userId) return;

  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore quota / private mode
  }
}

export function hasGeminiApiKey(userId) {
  return Boolean(getGeminiApiKey(userId));
}
