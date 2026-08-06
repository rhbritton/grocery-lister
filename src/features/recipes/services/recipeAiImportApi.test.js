import { getCallableErrorMessage } from './recipeAiImportErrors';

describe('getCallableErrorMessage', () => {
  it('maps auth and capacity errors cleanly', () => {
    expect(getCallableErrorMessage({ code: 'functions/unauthenticated' })).toBe(
      'Sign in to import recipes.'
    );
    expect(getCallableErrorMessage({ code: 'functions/resource-exhausted' })).toMatch(
      /free AI imports|Upgrade/i
    );
  });

  it('hides raw OAuth / credential noise', () => {
    expect(
      getCallableErrorMessage({
        code: 'functions/internal',
        message:
          'Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential.',
      })
    ).toMatch(/temporarily unavailable|personal Gemini key/i);
  });

  it('keeps short clean internal messages', () => {
    expect(
      getCallableErrorMessage({
        code: 'functions/internal',
        message: 'Firebase: Could not extract the recipe. Try again. (functions/internal)',
      })
    ).toMatch(/Could not extract the recipe/i);
  });
});
