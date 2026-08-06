import {
  buildJinaReaderUrl,
  fetchPageTextWithJina,
  normalizeHttpUrl,
} from './jinaReader.js';

describe('jinaReader', () => {
  it('normalizes bare domains to https URLs', () => {
    expect(normalizeHttpUrl('example.com/recipe')).toBe('https://example.com/recipe');
    expect(normalizeHttpUrl('https://example.com/a')).toBe('https://example.com/a');
    expect(normalizeHttpUrl('')).toBeNull();
    expect(normalizeHttpUrl('not a url')).toBeNull();
  });

  it('builds the Jina reader URL', () => {
    expect(buildJinaReaderUrl('https://example.com/r')).toBe(
      'https://r.jina.ai/https://example.com/r'
    );
  });

  it('fetches page text from Jina', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'Title: Soup\n\nIngredients\n- 1 onion\n\nSteps\nCook.',
    });

    const text = await fetchPageTextWithJina('https://example.com/soup');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://r.jina.ai/https://example.com/soup',
      expect.objectContaining({ method: 'GET' })
    );
    expect(text).toContain('onion');
  });

  it('throws a clear error on rate limit', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => '',
    });

    await expect(fetchPageTextWithJina('https://example.com')).rejects.toThrow(/rate limit/i);
  });
});
