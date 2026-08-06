const JINA_READER_BASE = 'https://r.jina.ai/';

/** Keep in sync with Gemini text import max so we don't overstuff the prompt. */
export const MAX_JINA_TEXT_LENGTH = 20_000;
const MIN_USEFUL_TEXT_LENGTH = 40;

/**
 * Normalize user input into an absolute http(s) URL, or null if invalid.
 * Accepts bare domains like "allrecipes.com/..." by prepending https://.
 */
export function normalizeHttpUrl(input) {
  let trimmed = String(input || '').trim();
  if (!trimmed) {
    return null;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

export function buildJinaReaderUrl(pageUrl) {
  const normalized = normalizeHttpUrl(pageUrl);
  if (!normalized) {
    return null;
  }
  return `${JINA_READER_BASE}${normalized}`;
}

/**
 * Fetch LLM-friendly page text via Jina Reader (client-side, no backend).
 * Does not validate the original recipe URL with a direct request (CORS often blocks that).
 */
export async function fetchPageTextWithJina(pageUrl, { signal } = {}) {
  const readerUrl = buildJinaReaderUrl(pageUrl);
  if (!readerUrl) {
    throw new Error('Enter a valid website link (https://…).');
  }

  let response;
  try {
    response = await fetch(readerUrl, {
      method: 'GET',
      headers: { Accept: 'text/plain' },
      signal,
    });
  } catch {
    throw new Error(
      'Could not reach the page reader. Check your connection, or try photo / text instead.'
    );
  }

  if (response.status === 429) {
    throw new Error(
      'Page reader rate limit hit. Wait a minute and try again, or use photo / text instead.'
    );
  }

  if (!response.ok) {
    throw new Error(
      'Could not read that page. Try another link, or paste the recipe text / add a photo.'
    );
  }

  const text = String(await response.text() || '').trim();
  if (text.length < MIN_USEFUL_TEXT_LENGTH) {
    throw new Error(
      'That page did not return enough content to import. Try pasting the recipe text or a photo.'
    );
  }

  return text.slice(0, MAX_JINA_TEXT_LENGTH);
}
