import { normalizeUpdatedAt } from './groceryListMerge.ts';

export const SHARE_WINDOW_DAYS = 7;
export const SHARE_WINDOW_SECONDS = SHARE_WINDOW_DAYS * 24 * 60 * 60;

export function getShareExpiresAt(sharedAt: number): number {
  return sharedAt + SHARE_WINDOW_SECONDS;
}

export function normalizeShareTimestamp(value: unknown): number {
  return normalizeUpdatedAt(value);
}

export function isShareActive(list: { sharedAt?: unknown; shareExpiresAt?: unknown } | null | undefined): boolean {
  if (!list) return false;

  const expiresAt = normalizeShareTimestamp(list.shareExpiresAt);
  if (expiresAt > 0) {
    return Math.floor(Date.now() / 1000) < expiresAt;
  }

  const sharedAt = normalizeShareTimestamp(list.sharedAt);
  if (sharedAt <= 0) return false;

  return Math.floor(Date.now() / 1000) < getShareExpiresAt(sharedAt);
}

export function formatShareExpiryDate(expiresAtSeconds: number): string {
  return new Date(expiresAtSeconds * 1000).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getShareExpiresAtFromList(list: { sharedAt?: unknown; shareExpiresAt?: unknown } | null | undefined): number | null {
  if (!list) return null;

  const expiresAt = normalizeShareTimestamp(list.shareExpiresAt);
  if (expiresAt > 0) return expiresAt;

  const sharedAt = normalizeShareTimestamp(list.sharedAt);
  if (sharedAt <= 0) return null;

  return getShareExpiresAt(sharedAt);
}
