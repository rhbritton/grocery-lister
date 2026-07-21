export const WALMART_CART_ADD_BASE = 'https://www.walmart.com/sc/cart/addToCart?items=';
export const WALMART_PRODUCT_BASE = 'https://www.walmart.com/ip/';

/** Stay under browser / Walmart URL limits when batching many items. */
export const WALMART_CART_URL_MAX_LENGTH = 3800;

function isWalmartHostname(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'walmart.com' || host.endsWith('.walmart.com');
}

/**
 * Parse a Walmart product URL or raw usItemId.
 * @returns {{ usItemId: string, walmartUrl: string } | null}
 */
export function parseWalmartProductInput(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{3,}$/.test(trimmed)) {
    return {
      usItemId: trimmed,
      walmartUrl: buildWalmartProductPageUrl(trimmed),
    };
  }

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!isWalmartHostname(url.hostname)) {
    return null;
  }

  const queryId = url.searchParams.get('usItemId') || url.searchParams.get('itemId');
  if (queryId && /^\d{3,}$/.test(queryId)) {
    return {
      usItemId: queryId,
      walmartUrl: buildWalmartProductPageUrl(queryId),
    };
  }

  const pathMatch = url.pathname.match(/\/ip\/(?:[^/]+\/)?(\d{3,})(?:\/|$)/i);
  if (pathMatch?.[1]) {
    return {
      usItemId: pathMatch[1],
      walmartUrl: buildWalmartProductPageUrl(pathMatch[1]),
    };
  }

  return null;
}

export function buildWalmartProductPageUrl(usItemId) {
  return `${WALMART_PRODUCT_BASE}${encodeURIComponent(String(usItemId || '').trim())}`;
}

/**
 * Build a Walmart search URL sorted by price (low to high by default).
 * @returns {string | null}
 */
export function buildWalmartSearchUrl(query, sort = 'price_low') {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return null;
  }

  const params = new URLSearchParams({
    q: trimmed,
    sort,
    page: '1',
    affinityOverride: 'default',
  });

  return `https://www.walmart.com/search?${params.toString()}`;
}

export function buildWalmartCartItemsParam(lineItems) {
  return lineItems
    .filter((item) => item?.usItemId && item.quantity > 0)
    .map(({ usItemId, quantity }) => `${usItemId}|${Math.max(1, Math.round(quantity))}`)
    .join(',');
}

/**
 * Build one or more add-to-cart URLs, splitting when the query would exceed length limits.
 * @param {{ usItemId: string, quantity: number }[]} lineItems
 * @returns {string[]}
 */
export function buildWalmartAddToCartUrls(lineItems) {
  const normalized = lineItems
    .filter((item) => item?.usItemId)
    .map(({ usItemId, quantity }) => ({
      usItemId: String(usItemId).trim(),
      quantity: Math.max(1, Math.round(Number(quantity) || 1)),
    }));

  if (!normalized.length) {
    return [];
  }

  const urls = [];
  let batch = [];

  const flushBatch = () => {
    if (!batch.length) return;
    const itemsParam = buildWalmartCartItemsParam(batch);
    urls.push(`${WALMART_CART_ADD_BASE}${itemsParam}`);
    batch = [];
  };

  for (const item of normalized) {
    const candidate = [...batch, item];
    const candidateUrl = `${WALMART_CART_ADD_BASE}${buildWalmartCartItemsParam(candidate)}`;
    if (candidateUrl.length > WALMART_CART_URL_MAX_LENGTH && batch.length) {
      flushBatch();
    }
    batch.push(item);
    const nextUrl = `${WALMART_CART_ADD_BASE}${buildWalmartCartItemsParam(batch)}`;
    if (nextUrl.length > WALMART_CART_URL_MAX_LENGTH && batch.length === 1) {
      flushBatch();
    }
  }

  flushBatch();
  return urls;
}

/** Always adds exactly one of the given Walmart item. */
export function buildWalmartSingleItemAddToCartUrl(usItemId) {
  const urls = buildWalmartAddToCartUrls([
    {
      usItemId: String(usItemId || '').trim(),
      quantity: 1,
    },
  ]);
  return urls[0] || null;
}

export function applyWalmartUrlToIngredient(ingredient, walmartUrlInput) {
  const parsed = parseWalmartProductInput(walmartUrlInput);
  const nextUrl = String(walmartUrlInput || '').trim();

  return {
    ...ingredient,
    walmartUrl: nextUrl,
    walmartUsItemId: parsed?.usItemId || '',
  };
}
