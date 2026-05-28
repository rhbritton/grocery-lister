import { useEffect, useState } from 'react';
import {
  probeNetworkReachable,
  CONNECTIVITY_PROBE_INTERVAL_MS,
} from './connectionProbe.ts';
import {
  getFirestoreSyncPending,
  getServerReachability,
  isNavigatorOffline,
  markFirestoreSyncPending,
  markNetworkAvailable,
  markNetworkUnavailable,
  subscribeFirestoreSyncPending,
  subscribeServerReachability,
} from './connectionState.ts';

export { isEffectivelyOffline } from './connectionState.ts';

export interface ConnectionStatus {
  serverReachable: boolean;
  firestoreSyncPending: boolean;
}

async function applyProbeResult(): Promise<void> {
  if (isNavigatorOffline()) {
    markNetworkUnavailable();
    return;
  }

  const reachable = await probeNetworkReachable();
  if (reachable) {
    markNetworkAvailable();
  } else {
    markNetworkUnavailable();
  }
}

/** Event-driven connection + sync status; periodic HTTP probe for WiFi drops. */
export function useConnectionStatus(userId: string | undefined): ConnectionStatus {
  const [serverReachable, setServerReachable] = useState(getServerReachability);
  const [firestoreSyncPending, setFirestoreSyncPending] = useState(getFirestoreSyncPending);

  useEffect(() => subscribeServerReachability(setServerReachable), []);
  useEffect(() => subscribeFirestoreSyncPending(setFirestoreSyncPending), []);

  useEffect(() => {
    const handleOffline = () => markNetworkUnavailable();

    const handleOnline = () => {
      void applyProbeResult();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (isNavigatorOffline()) {
      markNetworkUnavailable();
    } else {
      void applyProbeResult();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      if (!isNavigatorOffline()) {
        void applyProbeResult();
      }
      markFirestoreSyncPending(false);
      return undefined;
    }

    let cancelled = false;

    const runProbe = () => {
      if (cancelled || document.visibilityState === 'hidden') return;
      void applyProbeResult();
    };

    runProbe();
    const intervalId = window.setInterval(runProbe, CONNECTIVITY_PROBE_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runProbe();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [userId]);

  return { serverReachable, firestoreSyncPending };
}

/** @deprecated Use useConnectionStatus instead. */
export function useFirestoreConnectionStatus(userId: string | undefined): boolean {
  return useConnectionStatus(userId).serverReachable;
}
