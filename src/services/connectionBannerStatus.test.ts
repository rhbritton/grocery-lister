import {
  deriveConnectionBannerStatus,
  isConnectionBannerVisible,
  isConnectionOffline,
  resolveBannerAfterSyncFinish,
  resolveConnectionBannerEffect,
  shouldMarkSawOfflineOrSyncing,
} from './connectionBannerStatus';
import { setServerReachability } from './connectionState.ts';

describe('connectionBannerStatus', () => {
  beforeEach(() => {
    setServerReachability(true);
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  describe('deriveConnectionBannerStatus', () => {
    it('prioritizes offline over syncing', () => {
      expect(
        deriveConnectionBannerStatus({
          hasUser: true,
          offline: true,
          pendingQueueLength: 3,
          syncInFlight: true,
          showOnlineFlash: true,
        })
      ).toBe('offline');
    });

    it('shows syncing for queue or flush', () => {
      expect(
        deriveConnectionBannerStatus({
          hasUser: true,
          offline: false,
          pendingQueueLength: 1,
          syncInFlight: false,
          showOnlineFlash: false,
        })
      ).toBe('syncing');
    });

    it('shows online flash only when online and idle', () => {
      expect(
        deriveConnectionBannerStatus({
          hasUser: true,
          offline: false,
          pendingQueueLength: 0,
          syncInFlight: false,
          showOnlineFlash: true,
        })
      ).toBe('online');
    });

    it('shows connected during normal online use', () => {
      expect(
        deriveConnectionBannerStatus({
          hasUser: true,
          offline: false,
          pendingQueueLength: 0,
          syncInFlight: false,
          showOnlineFlash: false,
        })
      ).toBe('connected');
    });
  });

  describe('isConnectionBannerVisible', () => {
    it('is false only for hidden', () => {
      expect(isConnectionBannerVisible('hidden')).toBe(false);
      expect(isConnectionBannerVisible('offline')).toBe(true);
      expect(isConnectionBannerVisible('syncing')).toBe(true);
      expect(isConnectionBannerVisible('online')).toBe(true);
      expect(isConnectionBannerVisible('connected')).toBe(true);
    });
  });

  describe('shouldMarkSawOfflineOrSyncing', () => {
    it('tracks offline and syncing only', () => {
      expect(shouldMarkSawOfflineOrSyncing('offline')).toBe(true);
      expect(shouldMarkSawOfflineOrSyncing('syncing')).toBe(true);
      expect(shouldMarkSawOfflineOrSyncing('online')).toBe(false);
      expect(shouldMarkSawOfflineOrSyncing('hidden')).toBe(false);
    });
  });

  describe('isConnectionOffline', () => {
    it('is offline when navigator is offline', () => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
      expect(isConnectionOffline(true)).toBe(true);
    });

    it('is offline when Firestore server is unreachable', () => {
      expect(isConnectionOffline(false)).toBe(true);
    });
  });

  describe('resolveBannerAfterSyncFinish', () => {
    it('returns offline when unreachable', () => {
      expect(
        resolveBannerAfterSyncFinish({
          serverReachable: false,
          pendingQueueLength: 0,
          sawOfflineOrSyncing: true,
        })
      ).toBe('offline');
    });

    it('returns syncing when pending queue has items', () => {
      expect(
        resolveBannerAfterSyncFinish({
          serverReachable: true,
          pendingQueueLength: 2,
          sawOfflineOrSyncing: false,
        })
      ).toBe('syncing');
    });

    it('returns hidden when stable online with no queue', () => {
      expect(
        resolveBannerAfterSyncFinish({
          serverReachable: true,
          pendingQueueLength: 0,
          sawOfflineOrSyncing: false,
        })
      ).toBe('hidden');
    });

    it('returns online flash after recovery', () => {
      expect(
        resolveBannerAfterSyncFinish({
          serverReachable: true,
          pendingQueueLength: 0,
          sawOfflineOrSyncing: true,
        })
      ).toBe('online');
    });
  });

  describe('resolveConnectionBannerEffect', () => {
    const onlineStable = {
      hasUser: true,
      serverReachable: true,
      pendingQueueLength: 0,
      syncInFlight: false,
      wasOffline: false,
      sawOfflineOrSyncing: false,
    };

    it('hides banner when logged out', () => {
      expect(
        resolveConnectionBannerEffect({ ...onlineStable, hasUser: false })
      ).toEqual({
        status: 'hidden',
        nextWasOffline: false,
        clearOnlineFlashTimeout: false,
        shouldRunFlush: false,
      });
    });

    it('shows offline and clears flash timer', () => {
      expect(
        resolveConnectionBannerEffect({
          ...onlineStable,
          serverReachable: false,
        })
      ).toEqual({
        status: 'offline',
        nextWasOffline: true,
        clearOnlineFlashTimeout: true,
        shouldRunFlush: false,
      });
    });

    it('shows syncing and runs flush after reconnect', () => {
      expect(
        resolveConnectionBannerEffect({
          ...onlineStable,
          wasOffline: true,
        })
      ).toEqual({
        status: 'syncing',
        nextWasOffline: false,
        clearOnlineFlashTimeout: false,
        shouldRunFlush: true,
      });
    });

    it('shows syncing for pending queue without starting duplicate flush', () => {
      expect(
        resolveConnectionBannerEffect({
          ...onlineStable,
          pendingQueueLength: 1,
          syncInFlight: true,
        })
      ).toEqual({
        status: 'syncing',
        nextWasOffline: false,
        clearOnlineFlashTimeout: false,
        shouldRunFlush: false,
      });
    });

    it('stays hidden during normal online use', () => {
      expect(resolveConnectionBannerEffect(onlineStable)).toEqual({
        status: 'hidden',
        nextWasOffline: false,
        clearOnlineFlashTimeout: false,
        shouldRunFlush: false,
      });
    });
  });
});
