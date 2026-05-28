/** Google connectivity check — not a Firestore read. */
export const CONNECTIVITY_PROBE_URL =
  'https://www.gstatic.com/generate_204';

export const CONNECTIVITY_PROBE_TIMEOUT_MS = 5000;

export const CONNECTIVITY_PROBE_INTERVAL_MS = 6000;

/**
 * Real network probe. Browsers often keep navigator.onLine true after WiFi
 * drops; a short fetch detects actual connectivity.
 */
export async function probeNetworkReachable(
  timeoutMs = CONNECTIVITY_PROBE_TIMEOUT_MS
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  if (typeof fetch === 'undefined') {
    return true;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(CONNECTIVITY_PROBE_URL, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
