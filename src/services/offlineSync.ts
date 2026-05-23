import { waitForPendingWrites } from 'firebase/firestore';
import { db } from '../auth/firebaseConfig';

export function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

export function shouldQueueOffline(error: unknown): boolean {
  if (isBrowserOffline()) return true;

  const code = (error as { code?: string })?.code;
  return (
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    code === 'deadline-exceeded' ||
    code === 'network-request-failed' ||
    code === 'cancelled'
  );
}

/** Remove undefined values so Firestore accepts nested payloads. */
export function isServerTimestampSentinel(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { _methodName?: string })._methodName === 'serverTimestamp'
  );
}

/** Remove serialized serverTimestamp sentinels from nested data. */
export function stripSentinelValues<T>(value: T): T {
  if (isServerTimestampSentinel(value)) {
    return undefined as T;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => stripSentinelValues(item))
      .filter((item) => item !== undefined) as T;
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (isServerTimestampSentinel(val)) continue;
      const cleaned = stripSentinelValues(val);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return result as T;
  }
  return value;
}

export function sanitizeForFirestore<T>(value: T): T {
  return stripSentinelValues(JSON.parse(JSON.stringify(value))) as T;
}

/** Firestore rejects undefined field values on write. */
export function omitUndefinedFields(
  data: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

const INGREDIENT_PERSIST_KEYS = ['amount', 'name', 'type', 'crossed', 'duplicate'] as const;

/** Drop UI-only fields (e.g. autoFocus) before persisting ingredients. */
export function stripIngredientForFirestore(
  ingredient: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of INGREDIENT_PERSIST_KEYS) {
    if (ingredient[key] !== undefined) {
      result[key] = ingredient[key];
    }
  }
  return result;
}

export function stripIngredientsForFirestore(
  ingredients: unknown[] | undefined | null
): Record<string, unknown>[] {
  if (!ingredients?.length) return [];
  return ingredients.map((ing) =>
    stripIngredientForFirestore(ing as Record<string, unknown>)
  );
}

/** Strip UI fields from grocery list payloads and remove undefined for Firestore. */
export function stripGroceryListPayloadForFirestore<T extends Record<string, unknown>>(
  data: T
): T {
  const { updatedAt: _updatedAt, ...rest } = data;
  const recipes = Array.isArray(rest.recipes)
    ? rest.recipes.map((entry: Record<string, unknown>) => {
        const recipe = entry?.recipe as Record<string, unknown> | undefined;
        if (!recipe) return entry;
        return {
          ...entry,
          recipe: {
            ...recipe,
            ingredients: stripIngredientsForFirestore(recipe.ingredients as unknown[]),
          },
        };
      })
    : rest.recipes;

  return sanitizeForFirestore({
    ...rest,
    ingredients: stripIngredientsForFirestore(rest.ingredients as unknown[]),
    recipes,
  }) as T;
}

/** Strip UI fields from recipe payloads and remove undefined for Firestore. */
export function stripRecipePayloadForFirestore<T extends Record<string, unknown>>(
  data: T
): T {
  const { updatedAt: _updatedAt, ...rest } = data;
  return sanitizeForFirestore({
    ...rest,
    ingredients: stripIngredientsForFirestore(rest.ingredients as unknown[]),
  }) as T;
}

/** Build explicit recipe fields for Firestore writes (never spread full objects). */
export function toRecipeFirestoreFields(
  payload: Record<string, unknown>,
  extras: Record<string, unknown> = {}
): Record<string, unknown> {
  const name = payload.name;
  const name_lowercase = name ? String(name).trim().toLowerCase() : '';

  return omitUndefinedFields({
    userId: payload.userId,
    id: payload.id,
    name: payload.name,
    ingredients: payload.ingredients,
    instructions: payload.instructions,
    isDeleted: payload.isDeleted ?? false,
    name_lowercase,
    ...extras,
  });
}

export function isLocalNewer(
  localUpdatedAt: number | undefined,
  incomingUpdatedAt: number | undefined
): boolean {
  return (localUpdatedAt || 0) > (incomingUpdatedAt || 0);
}

export async function waitForFirestoreSync(): Promise<void> {
  try {
    await waitForPendingWrites(db);
  } catch (error) {
    console.warn('waitForPendingWrites failed:', error);
  }
}
