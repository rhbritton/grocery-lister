import {
  isBrowserOffline,
  shouldQueueOffline,
  isLocalNewer,
  omitUndefinedFields,
  stripIngredientForFirestore,
  stripGroceryListPayloadForFirestore,
  stripSentinelValues,
  handleFirestoreNetworkError,
} from './offlineSync';
import { setServerReachability, getServerReachability } from './connectionState.ts';

describe('isBrowserOffline', () => {
  beforeEach(() => {
    setServerReachability(true);
  });

  it('reflects navigator.onLine', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    expect(isBrowserOffline()).toBe(false);

    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    expect(isBrowserOffline()).toBe(true);
  });

  it('is offline when the Firestore server probe fails even if navigator.onLine is true', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    setServerReachability(false);
    expect(isBrowserOffline()).toBe(true);
  });
});

describe('shouldQueueOffline', () => {
  beforeEach(() => {
    setServerReachability(true);
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('returns true when browser is offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    expect(shouldQueueOffline(new Error('anything'))).toBe(true);
  });

  it('marks server unreachable for retryable Firestore error codes', () => {
    expect(shouldQueueOffline({ code: 'unavailable' })).toBe(true);
    expect(getServerReachability()).toBe(false);

    setServerReachability(true);
    expect(shouldQueueOffline({ code: 'deadline-exceeded' })).toBe(true);
    expect(getServerReachability()).toBe(false);
  });

  it('handleFirestoreNetworkError marks server unreachable for network errors only', () => {
    setServerReachability(true);
    handleFirestoreNetworkError({ code: 'unavailable' });
    expect(getServerReachability()).toBe(false);
    setServerReachability(true);
    handleFirestoreNetworkError({ code: 'permission-denied' });
    expect(getServerReachability()).toBe(true);
  });

  it('returns false for other errors while online', () => {
    expect(shouldQueueOffline({ code: 'permission-denied' })).toBe(false);
    expect(shouldQueueOffline(new Error('boom'))).toBe(false);
  });
});

describe('isLocalNewer', () => {
  it('compares updatedAt timestamps', () => {
    expect(isLocalNewer(200, 100)).toBe(true);
    expect(isLocalNewer(100, 200)).toBe(false);
    expect(isLocalNewer(undefined, 100)).toBe(false);
    expect(isLocalNewer(100, undefined)).toBe(true);
  });
});

describe('omitUndefinedFields', () => {
  it('removes undefined keys', () => {
    expect(omitUndefinedFields({ a: 1, b: undefined, c: 'ok' })).toEqual({
      a: 1,
      c: 'ok',
    });
  });
});

describe('stripIngredientForFirestore', () => {
  it('keeps persistable fields and drops UI-only fields', () => {
    expect(
      stripIngredientForFirestore({
        name: 'Tomatoes',
        amount: '2',
        type: 'produce',
        crossed: true,
        autoFocus: true,
      })
    ).toEqual({
      name: 'Tomatoes',
      amount: '2',
      type: 'produce',
      crossed: true,
    });
  });
});

describe('stripSentinelValues', () => {
  it('removes serverTimestamp sentinels from nested objects', () => {
    const cleaned = stripSentinelValues({
      name: 'List',
      updatedAt: { _methodName: 'serverTimestamp' },
      ingredients: [{ name: 'Salt', amount: '1' }],
    });

    expect(cleaned).toEqual({
      name: 'List',
      ingredients: [{ name: 'Salt', amount: '1' }],
    });
  });
});

describe('stripGroceryListPayloadForFirestore', () => {
  it('strips UI fields from nested recipe ingredients', () => {
    const cleaned = stripGroceryListPayloadForFirestore({
      name: 'Weekly shop',
      updatedAt: 123,
      ingredients: [{ name: 'Butter', amount: '1', autoFocus: true }],
      recipes: [
        {
          id: 'e1',
          recipe: {
            name: 'Pancakes',
            ingredients: [{ name: 'Flour', amount: '2 cups', autoFocus: true }],
          },
        },
      ],
    });

    expect(cleaned.updatedAt).toBeUndefined();
    expect(cleaned.ingredients[0]).toEqual({ name: 'Butter', amount: '1' });
    expect(cleaned.recipes[0].recipe.ingredients[0]).toEqual({
      name: 'Flour',
      amount: '2 cups',
    });
  });
});
