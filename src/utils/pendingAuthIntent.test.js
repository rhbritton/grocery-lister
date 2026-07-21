import {
  setPendingAuthIntent,
  peekPendingAuthIntent,
  consumePendingAuthIntent,
  clearPendingAuthIntent,
} from './pendingAuthIntent';

describe('pendingAuthIntent', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stores and peeks an intent', () => {
    setPendingAuthIntent({ type: 'favoriteRecipe', recipeId: 'r1' });
    expect(peekPendingAuthIntent()).toEqual({
      type: 'favoriteRecipe',
      recipeId: 'r1',
    });
  });

  it('consumes a matching intent once', () => {
    setPendingAuthIntent({ type: 'favoriteRecipe', recipeId: 'r1' });
    expect(consumePendingAuthIntent('favoriteRecipe', 'r1')).toEqual({
      type: 'favoriteRecipe',
      recipeId: 'r1',
    });
    expect(peekPendingAuthIntent()).toBeNull();
  });

  it('does not consume a mismatched recipe', () => {
    setPendingAuthIntent({ type: 'favoriteRecipe', recipeId: 'r1' });
    expect(consumePendingAuthIntent('favoriteRecipe', 'r2')).toBeNull();
    expect(peekPendingAuthIntent()).toEqual({
      type: 'favoriteRecipe',
      recipeId: 'r1',
    });
  });

  it('clears intent', () => {
    setPendingAuthIntent({ type: 'favoriteRecipe', recipeId: 'r1' });
    clearPendingAuthIntent();
    expect(peekPendingAuthIntent()).toBeNull();
  });
});
