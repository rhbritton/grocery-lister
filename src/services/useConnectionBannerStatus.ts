import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../app/store.ts';
import { flushPendingSync } from '../features/sync/flushPendingSync.ts';
import { selectPendingSyncQueue } from '../features/sync/pendingSyncSlice.ts';
import { useConnectionStatus } from './connectionMonitor.ts';
import {
  CONNECTION_BANNER_ONLINE_FLASH_MS,
  ConnectionBannerStatus,
  deriveConnectionBannerStatus,
  isConnectionBannerVisible,
} from './connectionBannerStatus.ts';
import { useMinimumDurationBannerStatus } from './connectionBannerDisplay.ts';

function readNavigatorOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export interface UseConnectionBannerStatusResult {
  connectionStatus: ConnectionBannerStatus;
  connectionBannerVisible: boolean;
}

/**
 * Banner status is derived from reactive inputs (navigator, serverReachable,
 * pending queue, syncInFlight). Browser online/offline is tracked here directly
 * so DevTools offline always triggers a re-render.
 */
export function useConnectionBannerStatus(
  userId: string | undefined
): UseConnectionBannerStatusResult {
  const dispatch = useDispatch<AppDispatch>();
  const { serverReachable } = useConnectionStatus(userId);
  const pendingQueue = useSelector(selectPendingSyncQueue);

  const [navigatorOnline, setNavigatorOnline] = useState(readNavigatorOnline);
  const [syncInFlight, setSyncInFlight] = useState(false);
  const [showOnlineFlash, setShowOnlineFlash] = useState(false);
  const [flushNonce, setFlushNonce] = useState(0);

  const offline = !navigatorOnline || !serverReachable;
  const prevOfflineRef = useRef(offline);
  const prevQueueLengthRef = useRef(pendingQueue.length);
  const pendingQueueLengthRef = useRef(pendingQueue.length);
  const syncInFlightRef = useRef(false);
  const onlineFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  pendingQueueLengthRef.current = pendingQueue.length;

  useEffect(() => {
    const handleOnline = () => setNavigatorOnline(true);
    const handleOffline = () => setNavigatorOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setNavigatorOnline(readNavigatorOnline());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (offline) {
      setShowOnlineFlash(false);
      if (onlineFlashTimeoutRef.current) {
        clearTimeout(onlineFlashTimeoutRef.current);
        onlineFlashTimeoutRef.current = null;
      }
    }
  }, [offline]);

  // Trigger flush when new items are queued while online (not on every dequeue).
  useEffect(() => {
    const prevLength = prevQueueLengthRef.current;
    prevQueueLengthRef.current = pendingQueue.length;

    if (!userId || offline) {
      return;
    }

    if (pendingQueue.length > prevLength) {
      setFlushNonce((nonce) => nonce + 1);
    }
  }, [pendingQueue.length, userId, offline]);

  useEffect(() => {
    const wasOffline = prevOfflineRef.current;
    prevOfflineRef.current = offline;

    if (!userId || offline || syncInFlightRef.current) {
      return undefined;
    }

    const needsFlush =
      wasOffline || pendingQueueLengthRef.current > 0;
    if (!needsFlush) {
      return undefined;
    }

    let cancelled = false;
    syncInFlightRef.current = true;
    setSyncInFlight(true);

    (async () => {
      try {
        await dispatch(flushPendingSync());
      } catch (error) {
        console.warn('Reconnect sync failed:', error);
      } finally {
        syncInFlightRef.current = false;
        setSyncInFlight(false);
        if (cancelled) return;
        if (wasOffline) {
          setShowOnlineFlash(true);
          if (onlineFlashTimeoutRef.current) {
            clearTimeout(onlineFlashTimeoutRef.current);
          }
          onlineFlashTimeoutRef.current = setTimeout(() => {
            setShowOnlineFlash(false);
            onlineFlashTimeoutRef.current = null;
          }, CONNECTION_BANNER_ONLINE_FLASH_MS);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [offline, userId, flushNonce, dispatch]);

  const connectionStatus = useMemo(
    () =>
      deriveConnectionBannerStatus({
        hasUser: !!userId,
        offline,
        pendingQueueLength: pendingQueue.length,
        syncInFlight,
        showOnlineFlash,
      }),
    [userId, offline, pendingQueue.length, syncInFlight, showOnlineFlash]
  );

  const displayStatus = useMinimumDurationBannerStatus(connectionStatus);

  useEffect(
    () => () => {
      if (onlineFlashTimeoutRef.current) {
        clearTimeout(onlineFlashTimeoutRef.current);
      }
    },
    []
  );

  return {
    connectionStatus: displayStatus,
    connectionBannerVisible: isConnectionBannerVisible(displayStatus),
  };
}
