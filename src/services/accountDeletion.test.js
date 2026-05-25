import {
  collectOwnedDocumentIds,
  getDeleteAccountErrorMessage,
} from './accountDeletion';

describe('accountDeletion', () => {
  it('maps popup closed to a friendly message', () => {
    expect(getDeleteAccountErrorMessage({ code: 'auth/popup-closed-by-user' })).toMatch(/cancelled/i);
  });

  it('falls back to error message', () => {
    expect(getDeleteAccountErrorMessage(new Error('Server unavailable'))).toBe('Server unavailable');
  });

  it('uses generic fallback when message missing', () => {
    expect(getDeleteAccountErrorMessage({})).toMatch(/Could not delete/i);
  });

  it('collects owned document ids and skips pending placeholders', () => {
    const ids = collectOwnedDocumentIds(
      [
        { fbid: 'recipe-1', userId: 'user-a' },
        { fbid: 'pending-local', userId: 'user-a' },
        { fbid: 'recipe-2', userId: 'user-b' },
        { fbid: 'legacy-recipe' },
      ],
      'user-a'
    );

    expect(ids).toEqual(['recipe-1', 'legacy-recipe']);
  });
});
