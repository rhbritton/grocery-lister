import {
  extractRecipeWithGemini,
  getGeminiImportErrorMessage,
  looksLikeUrl,
  looksLikeUrlContextAccessFailure,
  looksLikeUrlFetchFailure,
  resolveRecipeSourceInput,
} from './geminiRecipeImport';

describe('geminiRecipeImport helpers', () => {
  it('detects urls', () => {
    expect(looksLikeUrl('https://example.com/recipe')).toBe(true);
    expect(looksLikeUrl('2 cups flour')).toBe(false);
  });

  it('returns pasted text without fetching', () => {
    expect(resolveRecipeSourceInput('Grandma\'s chili recipe')).toEqual({
      type: 'text',
      text: 'Grandma\'s chili recipe',
    });
  });

  it('marks urls for Gemini URL context instead of browser fetch', () => {
    expect(resolveRecipeSourceInput('https://example.com/recipe')).toEqual({
      type: 'url',
      url: 'https://example.com/recipe',
    });
  });

  it('maps api key errors to restriction guidance', () => {
    expect(getGeminiImportErrorMessage(new Error('API key not valid'))).toMatch(
      /restriction issue|Application restrictions/i
    );
  });

  it('maps 403 permission errors without calling it invalid key', () => {
    const error = new Error('[403 Forbidden] PERMISSION_DENIED');
    error.status = 403;
    expect(getGeminiImportErrorMessage(error)).toMatch(/access denied/i);
    expect(getGeminiImportErrorMessage(error)).not.toMatch(/Invalid Gemini API key/i);
  });

  it('maps referrer restrictions', () => {
    expect(
      getGeminiImportErrorMessage(new Error('API_KEY_HTTP_REFERRER_BLOCKED'))
    ).toMatch(/restriction issue|Application restrictions/i);
  });

  it('maps free tier limit 0 to billing guidance', () => {
    expect(
      getGeminiImportErrorMessage(
        new Error('429 Quota exceeded, limit: 0, model: gemini-2.0-flash, free_tier')
      )
    ).toMatch(/free tier is not active|Set up billing/i);
  });

  it('maps 429 quota errors before generic billing text', () => {
    const error = new Error(
      'You exceeded your current quota, please check your plan and billing details.'
    );
    error.status = 429;
    expect(getGeminiImportErrorMessage(error)).toMatch(/rate limit hit \(429\)/i);
    expect(getGeminiImportErrorMessage(error)).not.toMatch(/free tier is not active/i);
  });

  it('does not retry other models after a 429 quota error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: {
          code: 429,
          message:
            'You exceeded your current quota, please check your plan and billing details.',
          status: 'RESOURCE_EXHAUSTED',
        },
      }),
    });

    await expect(
      extractRecipeWithGemini({
        apiKey: 'test-key',
        sourceInput: 'https://www.example.com/recipe',
      })
    ).rejects.toMatchObject({ status: 429 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('maps url context failures to helpful guidance', () => {
    expect(
      getGeminiImportErrorMessage(new Error('Gemini could not find a recipe at that URL.'))
    ).toMatch(/could not extract a recipe|paste the recipe text/i);
  });

  it('maps url context plus json mode conflict', () => {
    expect(
      getGeminiImportErrorMessage(
        new Error("Tool use with a response mime type: 'application/json' is unsupported")
      )
    ).toMatch(/could not import from that URL|paste the recipe text/i);
  });

  it('detects unusable url fetch text', () => {
    expect(looksLikeUrlFetchFailure('NO_RECIPE_FOUND')).toBe(true);
    expect(looksLikeUrlFetchFailure('too short')).toBe(true);
    expect(looksLikeUrlFetchFailure('I cannot access this page.')).toBe(true);
    expect(
      looksLikeUrlFetchFailure(
        'Recipe name:\nChicken Soup\n\nIngredients:\n- 1 cup broth\n\nInstructions:\nSimmer.'
      )
    ).toBe(false);
    expect(
      looksLikeUrlFetchFailure(
        'Recipe name:\nChicken Enchiladas\n\nI cannot read the nutrition panel, but here are the ingredients:\n- 2 cups chicken\n- 1 cup sauce\n\nInstructions:\nBake.'
      )
    ).toBe(false);
  });

  it('detects gemini url context access failures', () => {
    expect(
      looksLikeUrlContextAccessFailure(
        'The webpage content could not be accessed. This might be due to paywalls, login requirements, or other restrictions.'
      )
    ).toBe(true);
    expect(
      looksLikeUrlFetchFailure(
        'The webpage content could not be accessed. This might be due to paywalls, login requirements, or other restrictions.'
      )
    ).toBe(true);
  });

  it('stops url import when gemini api cannot fetch the page', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text:
                    'The webpage content could not be accessed. This might be due to paywalls, login requirements, or other restrictions.',
                },
              ],
            },
          },
        ],
      }),
    });

    await expect(
      extractRecipeWithGemini({
        apiKey: 'test-key',
        sourceInput: 'https://www.allrecipes.com/recipe/example/',
      })
    ).rejects.toThrow(/Gemini API could not fetch that URL/i);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('uses url-context-capable models only', () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, REACT_APP_GEMINI_MODEL: 'gemini-1.5-flash' };

    const { getGeminiUrlModelCandidates } = require('./geminiRecipeImport');
    expect(getGeminiUrlModelCandidates()).toEqual(['gemini-2.5-flash']);

    process.env = originalEnv;
  });

  it('always uses two-step url import flow when direct json parse fails', async () => {
    const recipeJson = JSON.stringify({
      name: 'Chicken Enchiladas',
      ingredients: [{ amount: '2 cup', name: 'chicken, shredded', type: 'meat' }],
      instructions: 'Bake until bubbly.',
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text:
                      'Recipe name:\nChicken Enchiladas\n\nIngredients:\n- 2 cup shredded chicken\n\nInstructions:\nBake until bubbly.',
                  },
                ],
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: recipeJson }] } }],
        }),
      });

    const recipe = await extractRecipeWithGemini({
      apiKey: 'test-key',
      sourceInput: 'https://www.example.com/recipe',
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(recipe.name).toBe('Chicken Enchiladas');
  });

  it('uses one-step url import when direct json parse succeeds', async () => {
    const recipeJson = JSON.stringify({
      name: 'Grilled Pineapple',
      ingredients: [{ amount: '1', name: 'pineapple, whole', type: 'produce' }],
      instructions: 'Grill until caramelized.',
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: recipeJson }] } }],
      }),
    });

    const recipe = await extractRecipeWithGemini({
      apiKey: 'test-key',
      sourceInput: 'https://www.example.com/recipe',
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(recipe.name).toBe('Grilled Pineapple');
  });
});
