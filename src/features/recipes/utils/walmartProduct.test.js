import {
  parseWalmartProductInput,
  buildWalmartAddToCartUrls,
  buildWalmartProductPageUrl,
  buildWalmartSearchUrl,
  buildWalmartSingleItemAddToCartUrl,
  applyWalmartUrlToIngredient,
  WALMART_CART_URL_MAX_LENGTH,
} from './walmartProduct.js';

describe('walmartProduct', () => {
  it('parses walmart product urls and raw ids', () => {
    expect(
      parseWalmartProductInput(
        'https://www.walmart.com/ip/Great-Value-Large-White-Eggs-12-Count/100966386'
      )
    ).toEqual({
      usItemId: '100966386',
      walmartUrl: buildWalmartProductPageUrl('100966386'),
    });

    expect(parseWalmartProductInput('https://www.walmart.com/ip/5113175776')).toEqual({
      usItemId: '5113175776',
      walmartUrl: buildWalmartProductPageUrl('5113175776'),
    });

    expect(parseWalmartProductInput('100966386')).toEqual({
      usItemId: '100966386',
      walmartUrl: buildWalmartProductPageUrl('100966386'),
    });
  });

  it('builds walmart search urls sorted by price low', () => {
    expect(buildWalmartSearchUrl('large white eggs')).toBe(
      'https://www.walmart.com/search?q=large+white+eggs&sort=price_low&page=1&affinityOverride=default'
    );
    expect(buildWalmartSearchUrl('')).toBeNull();
  });

  it('builds add-to-cart urls', () => {
    expect(
      buildWalmartAddToCartUrls([
        { usItemId: '100966386', quantity: 1 },
        { usItemId: '10450114', quantity: 2 },
      ])
    ).toEqual([
      'https://www.walmart.com/sc/cart/addToCart?items=100966386|1,10450114|2',
    ]);
  });

  it('always builds a single-item add-to-cart url with quantity 1', () => {
    expect(buildWalmartSingleItemAddToCartUrl('100966386')).toBe(
      'https://www.walmart.com/sc/cart/addToCart?items=100966386|1'
    );
  });

  it('splits long cart urls into batches', () => {
    const manyItems = Array.from({ length: 400 }, (_, index) => ({
      usItemId: String(100000000 + index),
      quantity: 1,
    }));
    const urls = buildWalmartAddToCartUrls(manyItems);
    expect(urls.length).toBeGreaterThan(1);
    urls.forEach((url) => {
      expect(url.length).toBeLessThanOrEqual(WALMART_CART_URL_MAX_LENGTH);
    });
  });

  it('updates ingredient walmart fields from url input', () => {
    expect(
      applyWalmartUrlToIngredient(
        { amount: '1', name: 'Eggs', type: 'dairy' },
        'https://www.walmart.com/ip/100966386'
      )
    ).toMatchObject({
      walmartUrl: 'https://www.walmart.com/ip/100966386',
      walmartUsItemId: '100966386',
    });
  });
});
