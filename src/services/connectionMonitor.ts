import { useEffect, useState } from 'react';
import { onSnapshotsInSync } from 'firebase/firestore';
import { db } from '../auth/firebaseConfig';
import {
  getFirestoreSyncPending,
  isNavigatorOffline,
  markFirestoreSyncPending,
  markNetworkAvailable,
  markNetworkUnavailable,
  readInitialReachability,
  subscribeFirestoreSyncPending,
  subscribeServerReachability,
} from './connectionState.ts';

export { isEffectivelyOffline } from './connectionState.ts';

export interface ConnectionStatus {
  serverReachable: boolean;
  firestoreSyncPending: boolean;
}

/** Event-driven connection + sync status — no polling, no extra Firestore reads. */
export function useConnectionStatus(userId: string | undefined): ConnectionStatus {
  const [serverReachable, setServerReachable] = useState(readInitialReachability);
  const [firestoreSyncPending, setFirestoreSyncPending] = useState(getFirestoreSyncPending);

  useEffect(() => subscribeServerReachability(setServerReachable), []);
  useEffect(() => subscribeFirestoreSyncPending(setFirestoreSyncPending), []);

  useEffect(() => {
    const handleOffline = () => markNetworkUnavailable();
    const handleOnline = () => markNetworkAvailable();

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (isNavigatorOffline()) {
      markNetworkUnavailable();
    } else {
      markNetworkAvailable();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      if (!isNavigatorOffline()) {
        markNetworkAvailable();
      }
      markFirestoreSyncPending(false);
      return undefined;
    }

    return onSnapshotsInSync(db, () => {
      markNetworkAvailable();
      markFirestoreSyncPending(false);
    });
  }, [userId]);

  return { serverReachable, firestoreSyncPending };
}

/** @deprecated Use useConnectionStatus instead. */
export function useFirestoreConnectionStatus(userId: string | undefined): boolean {
  return useConnectionStatus(userId).serverReachable;
}
