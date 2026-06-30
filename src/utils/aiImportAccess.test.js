import { canUseAiRecipeImport } from './aiImportAccess';

describe('aiImportAccess', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('allows listed emails when env is set', () => {
    process.env = {
      ...originalEnv,
      REACT_APP_AI_IMPORT_EMAILS: 'you@gmail.com, Partner@Example.com ',
    };

    expect(canUseAiRecipeImport({ email: 'you@gmail.com' })).toBe(true);
    expect(canUseAiRecipeImport({ email: 'partner@example.com' })).toBe(true);
    expect(canUseAiRecipeImport({ email: 'other@gmail.com' })).toBe(false);
  });

  it('denies everyone when env is empty', () => {
    process.env = { ...originalEnv, REACT_APP_AI_IMPORT_EMAILS: '' };

    expect(canUseAiRecipeImport({ email: 'you@gmail.com' })).toBe(false);
  });

  it('denies when user has no email', () => {
    process.env = {
      ...originalEnv,
      REACT_APP_AI_IMPORT_EMAILS: 'you@gmail.com',
    };

    expect(canUseAiRecipeImport(null)).toBe(false);
    expect(canUseAiRecipeImport({})).toBe(false);
  });
});
