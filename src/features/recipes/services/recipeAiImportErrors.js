const FALLBACK_IMPORT_ERROR =
  'Could not import recipe. Try again, or use a different link, photo, or text.';

function stripFirebasePrefix(message) {
  return String(message || '')
    .replace(/^Firebase:\s*/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();
}

/** Drop leading "functions/code: " style prefixes if present. */
function stripCallableCodePrefix(message) {
  return stripFirebasePrefix(message).replace(/^[a-z/]+:\s*/i, '').trim();
}

/** Map callable / network failures to short user-facing copy. */
export function getCallableErrorMessage(error, { fallback } = {}) {
  const defaultFallback = fallback || FALLBACK_IMPORT_ERROR;
  const code = String(error?.code || '');
  const rawMessage = String(error?.message || '');
  const details = String(error?.details || '');
  const combined = `${rawMessage} ${details}`;

  if (code === 'functions/unauthenticated') {
    return 'Sign in to import recipes.';
  }
  if (code === 'functions/permission-denied') {
    return 'AI import is not enabled for this account.';
  }
  if (code === 'functions/unavailable' || code === 'functions/deadline-exceeded') {
    return 'AI import is temporarily unreachable. Check your connection and try again.';
  }
  if (code === 'functions/resource-exhausted') {
    return (
      stripCallableCodePrefix(rawMessage) ||
      "You've used all free shared AI imports. Add your own Gemini key in Account for unlimited imports."
    );
  }
  if (code === 'functions/failed-precondition') {
    return (
      stripCallableCodePrefix(rawMessage) ||
      'Shared AI import is temporarily unavailable. Try again later, or add a personal Gemini key in Account.'
    );
  }
  if (code === 'functions/invalid-argument') {
    return (
      stripCallableCodePrefix(rawMessage) ||
      'Could not read that recipe. Try a different source.'
    );
  }

  if (
    /OAuth|invalid authentication credentials|API[_ ]?KEY|UNAUTHENTICATED|login cookie/i.test(
      combined
    )
  ) {
    return 'Shared AI import is temporarily unavailable. Try again later, or add a personal Gemini key in Account.';
  }

  if (/quota|resource_exhausted|429|credits? (are )?depleted|prepayment/i.test(combined)) {
    return 'AI import is temporarily out of capacity. Try again in a few minutes.';
  }

  if (code === 'functions/internal' || /internal/i.test(code)) {
    const cleaned = stripCallableCodePrefix(rawMessage);
    if (
      cleaned &&
      cleaned.length < 180 &&
      !/^internal$/i.test(cleaned) &&
      !/OAuth|credential|API[_ ]?KEY|stack|Exception/i.test(cleaned)
    ) {
      return cleaned;
    }
    return defaultFallback;
  }

  const cleaned = stripCallableCodePrefix(rawMessage);
  return cleaned || defaultFallback;
}
