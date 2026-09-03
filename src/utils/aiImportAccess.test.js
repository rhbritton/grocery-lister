import { canUseAiRecipeImport, canUsePersonalGeminiKey } from './aiImportAccess';

describe('aiImportAccess', () => {
  it('allows AI import for any signed-in user', () => {
    expect(canUseAiRecipeImport({ uid: '1', email: 'anyone@gmail.com' })).toBe(true);
    expect(canUseAiRecipeImport({ uid: '2' })).toBe(true);
    expect(canUsePersonalGeminiKey({ uid: '1', email: 'anyone@gmail.com' })).toBe(true);
  });

  it('denies AI import for signed-out users', () => {
    expect(canUseAiRecipeImport(null)).toBe(false);
    expect(canUseAiRecipeImport(undefined)).toBe(false);
    expect(canUseAiRecipeImport({})).toBe(false);
    expect(canUsePersonalGeminiKey(null)).toBe(false);
  });
});
