import { generateSearchIndex, generateWordIndexFromRecipe } from './search';

describe('generateSearchIndex', () => {
  it('returns empty array for blank input', () => {
    expect(generateSearchIndex('')).toEqual([]);
    expect(generateSearchIndex(null)).toEqual([]);
  });

  it('builds prefix tokens for each word', () => {
    const keys = generateSearchIndex('ab');
    expect(keys).toContain('a');
    expect(keys).toContain('ab');
  });

  it('sanitizes punctuation and lowercases text', () => {
    const keys = generateSearchIndex('Tomato Soup!');
    expect(keys).toContain('tomato');
    expect(keys).toContain('soup');
    expect(keys.some((k) => k.includes('!'))).toBe(false);
  });
});

describe('generateWordIndexFromRecipe', () => {
  it('indexes ingredient names and hyphenated parts', () => {
    const keys = generateWordIndexFromRecipe({
      ingredients: [
        { name: 'Green-Onion' },
        { name: 'Salt' },
      ],
    });

    expect(keys).toContain('green-onion');
    expect(keys).toContain('green');
    expect(keys).toContain('onion');
    expect(keys).toContain('salt');
  });

  it('returns empty array when recipe is missing', () => {
    expect(generateWordIndexFromRecipe(null)).toEqual([]);
  });
});
