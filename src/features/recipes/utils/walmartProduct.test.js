import {
  parseWalmartProductInput,
  buildWalmartAddToCartUrls,
  buildWalmartProductPageUrl,
  buildWalmartSearchUrl,
  buildWalmartSingleItemAddToCartUrl,
  collectWalmartCartItems,
  parseIngredientQuantity,
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

  it('parses ingredient quantities', () => {
    expect(parseIngredientQuantity('2 cups')).toBe(2);
    expect(parseIngredientQuantity('1')).toBe(1);
    expect(parseIngredientQuantity('')).toBe(1);
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

  it('builds a single-item add-to-cart url', () => {
    expect(buildWalmartSingleItemAddToCartUrl('100966386', 2)).toBe(
      'https://www.walmart.com/sc/cart/addToCart?items=100966386|2'
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

  it('collects uncrossed walmart-linked grocery rows', () => {
    const result = collectWalmartCartItems([
      {
        crossed: false,
        ingredient: { name: 'Eggs', amount: '2', walmartUsItemId: '100966386' },
        recipe: { name: 'Breakfast' },
      },
      {
        crossed: true,
        ingredient: { name: 'Milk', amount: '1', walmartUsItemId: '999' },
      },
      {
        crossed: false,
        ingredient: { name: 'Salt', amount: '1 tsp' },
      },
    ]);

    expect(result.eligible).toHaveLength(1);
    expect(result.lineItems).toEqual([{ usItemId: '100966386', quantity: 2 }]);
    expect(result.cartUrls[0]).toContain('100966386|2');
  });

  it('merges duplicate walmart ids across rows', () => {
    const result = collectWalmartCartItems([
      {
        crossed: false,
        ingredient: { name: 'Eggs A', amount: '1', walmartUsItemId: '100966386' },
      },
      {
        crossed: false,
        ingredient: { name: 'Eggs B', amount: '2', walmartUsItemId: '100966386' },
      },
    ]);

    expect(result.lineItems).toEqual([{ usItemId: '100966386', quantity: 3 }]);
    expect(result.eligible).toHaveLength(2);
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
