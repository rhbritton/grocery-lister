export function isNetworkUnavailableError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'network-request-failed' ||
    code === 'cancelled'
  );
}

type ReachabilityListener = (reachable: boolean) => void;
type SyncPendingListener = (pending: boolean) => void;

const reachabilityListeners = new Set<ReachabilityListener>();
const syncPendingListeners = new Set<SyncPendingListener>();

function readNavigatorOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

/** Initial reachability for React state (matches navigator when available). */
export function readInitialReachability(): boolean {
  return readNavigatorOnline();
}

let serverReachability = readNavigatorOnline();
let firestoreSyncPending = false;

function notifyReachabilityListeners(reachable: boolean): void {
  reachabilityListeners.forEach((listener) => listener(reachable));
}

function notifySyncPendingListeners(pending: boolean): void {
  syncPendingListeners.forEach((listener) => listener(pending));
}

export function getServerReachability(): boolean {
  return serverReachability;
}

export function getFirestoreSyncPending(): boolean {
  return firestoreSyncPending;
}

export function setServerReachability(reachable: boolean): void {
  if (serverReachability === reachable) return;
  serverReachability = reachable;
  notifyReachabilityListeners(reachable);
}

/** Subscribe to reachability changes (for React hooks). */
export function subscribeServerReachability(
  listener: ReachabilityListener
): () => void {
  reachabilityListeners.add(listener);
  listener(serverReachability);
  return () => {
    reachabilityListeners.delete(listener);
  };
}

/** True when Firestore still has local writes waiting for server confirmation. */
export function markFirestoreSyncPending(pending: boolean): void {
  if (firestoreSyncPending === pending) return;
  firestoreSyncPending = pending;
  notifySyncPendingListeners(pending);
}

export function subscribeFirestoreSyncPending(
  listener: SyncPendingListener
): () => void {
  syncPendingListeners.add(listener);
  listener(firestoreSyncPending);
  return () => {
    syncPendingListeners.delete(listener);
  };
}

/** Firestore listener or write reported a network failure. */
export function handleFirestoreNetworkError(error: unknown): void {
  if (isNetworkUnavailableError(error)) {
    markNetworkUnavailable();
  }
}

/** Firestore or listener reported a network failure. */
export function markNetworkUnavailable(): void {
  setServerReachability(false);
}

/** Client synced with server, or browser came back online. */
export function markNetworkAvailable(): void {
  if (!readNavigatorOnline()) {
    setServerReachability(false);
    return;
  }
  setServerReachability(true);
}

export function isNavigatorOffline(): boolean {
  return !readNavigatorOnline();
}

/** True when the browser or Firestore server cannot be reached. */
export function isEffectivelyOffline(serverReachable = getServerReachability()): boolean {
  return isNavigatorOffline() || !serverReachable;
}

/** True when the browser reports offline or Firestore server cannot be reached. */
export function isBrowserOffline(): boolean {
  return isEffectivelyOffline();
}

export function resetConnectionState(): void {
  serverReachability = readNavigatorOnline();
  firestoreSyncPending = false;
  notifyReachabilityListeners(serverReachability);
  notifySyncPendingListeners(false);
}
