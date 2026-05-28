import { isEffectivelyOffline } from './connectionState.ts';

export type ConnectionBannerStatus =
  | 'hidden'
  | 'offline'
  | 'syncing'
  | 'online'
  | 'connected';

export const CONNECTION_BANNER_ONLINE_FLASH_MS = 2200;

export interface ConnectionBannerInput {
  hasUser: boolean;
  serverReachable: boolean;
  pendingQueueLength: number;
  syncInFlight: boolean;
  wasOffline: boolean;
  sawOfflineOrSyncing: boolean;
}

export function isConnectionOffline(serverReachable: boolean): boolean {
  return isEffectivelyOffline(serverReachable);
}

export function isConnectionBannerVisible(status: ConnectionBannerStatus): boolean {
  return status !== 'hidden';
}

/** Derive banner status from current inputs — any input change should re-render. */
export function deriveConnectionBannerStatus(input: {
  hasUser: boolean;
  offline: boolean;
  pendingQueueLength: number;
  syncInFlight: boolean;
  showOnlineFlash: boolean;
}): ConnectionBannerStatus {
  if (!input.hasUser) return 'hidden';
  if (input.offline) return 'offline';
  if (input.syncInFlight || input.pendingQueueLength > 0) return 'syncing';
  if (input.showOnlineFlash) return 'online';
  return 'connected';
}

/** After reconnect flush completes — queue + reachability only (not hasPendingWrites). */
export function resolveBannerAfterSyncFinish(
  input: Pick<
    ConnectionBannerInput,
    'serverReachable' | 'pendingQueueLength' | 'sawOfflineOrSyncing'
  >
): ConnectionBannerStatus {
  if (isConnectionOffline(input.serverReachable)) {
    return 'offline';
  }

  if (input.pendingQueueLength > 0) {
    return 'syncing';
  }

  if (!input.sawOfflineOrSyncing) {
    return 'hidden';
  }

  return 'online';
}

export interface ConnectionBannerEffectResult {
  status: ConnectionBannerStatus;
  nextWasOffline: boolean;
  clearOnlineFlashTimeout: boolean;
  shouldRunFlush: boolean;
}

/**
 * Main banner state machine tick — syncing is queue + flush only.
 * Side effects (flush dispatch, online flash timer) stay in the hook.
 */
export function resolveConnectionBannerEffect(
  input: ConnectionBannerInput
): ConnectionBannerEffectResult {
  if (!input.hasUser) {
    return {
      status: 'hidden',
      nextWasOffline: false,
      clearOnlineFlashTimeout: false,
      shouldRunFlush: false,
    };
  }

  if (isConnectionOffline(input.serverReachable)) {
    return {
      status: input.syncInFlight ? 'syncing' : 'offline',
      nextWasOffline: true,
      clearOnlineFlashTimeout: true,
      shouldRunFlush: false,
    };
  }

  const shouldFlush = input.wasOffline || input.pendingQueueLength > 0;

  if (shouldFlush) {
    return {
      status: 'syncing',
      nextWasOffline: false,
      clearOnlineFlashTimeout: false,
      shouldRunFlush: !input.syncInFlight,
    };
  }

  if (input.syncInFlight) {
    return {
      status: 'syncing',
      nextWasOffline: false,
      clearOnlineFlashTimeout: false,
      shouldRunFlush: false,
    };
  }

  return {
    status: resolveBannerAfterSyncFinish(input),
    nextWasOffline: false,
    clearOnlineFlashTimeout: false,
    shouldRunFlush: false,
  };
}

export function shouldMarkSawOfflineOrSyncing(
  status: ConnectionBannerStatus
): boolean {
  return status === 'offline' || status === 'syncing';
}
