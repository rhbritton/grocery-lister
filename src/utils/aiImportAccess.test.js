import {
  canUseAiRecipeImport,
  canUsePersonalGeminiKey,
  PERSONAL_GEMINI_KEY_ALLOWED_EMAILS,
} from './aiImportAccess';

describe('aiImportAccess', () => {
  it('allows AI import for any signed-in user', () => {
    expect(canUseAiRecipeImport({ uid: '1', email: 'anyone@gmail.com' })).toBe(true);
    expect(canUseAiRecipeImport({ uid: '2' })).toBe(true);
  });

  it('denies AI import for signed-out users', () => {
    expect(canUseAiRecipeImport(null)).toBe(false);
    expect(canUseAiRecipeImport(undefined)).toBe(false);
    expect(canUseAiRecipeImport({})).toBe(false);
  });

  it('allows personal Gemini key only for allowlisted emails', () => {
    expect(
      canUsePersonalGeminiKey({ uid: '1', email: 'ryanhbritton@gmail.com' })
    ).toBe(true);
    expect(canUsePersonalGeminiKey({ uid: '2', email: 'KMHolian15@gmail.com' })).toBe(true);
    expect(PERSONAL_GEMINI_KEY_ALLOWED_EMAILS.length).toBe(3);
  });

  it('denies personal Gemini key for other signed-in users', () => {
    expect(canUsePersonalGeminiKey({ uid: '1', email: 'stranger@gmail.com' })).toBe(false);
    expect(canUsePersonalGeminiKey({ uid: '1' })).toBe(false);
    expect(canUsePersonalGeminiKey(null)).toBe(false);
  });
});
