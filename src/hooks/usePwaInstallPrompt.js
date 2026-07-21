import { useCallback, useEffect, useRef, useState } from 'react';

/** Custom protocol in manifest.json — launches the installed PWA when install isn't offered. */
const OPEN_APP_PROTOCOL = 'web+grocerylister://open';

export function isStandalonePwa() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.navigator.standalone === true
  );
}

export function isIosDevice() {
  // Local preview: /?showInstall=ios (or iphone) pretends to be iOS.
  if (typeof window !== 'undefined') {
    try {
      const value = String(
        new URLSearchParams(window.location.search).get('showInstall') || ''
      ).toLowerCase();
      if (value === 'ios' || value === 'iphone') {
        return true;
      }
    } catch {
      // ignore
    }
  }

  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Browser tab: show Install.
 * Inside installed PWA: hide.
 * Click → Chrome install prompt if available, otherwise open the installed app.
 */
export function usePwaInstallPrompt() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => isStandalonePwa());
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    setIsStandalone(isStandalonePwa());
    if (isStandalonePwa()) {
      return undefined;
    }

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredPromptRef.current = event;
      setCanPrompt(true);
    };

    const onAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    const promptEvent = deferredPromptRef.current;
    if (promptEvent) {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      deferredPromptRef.current = null;
      setCanPrompt(false);
      return choice;
    }

    // Already installed (or prompt unavailable) — hand off to the installed app.
    window.location.href = OPEN_APP_PROTOCOL;
    return { outcome: 'open-app' };
  }, []);

  return {
    canPrompt,
    isStandalone,
    handleInstallClick,
  };
}
