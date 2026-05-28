import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConnectionBannerStatus,
  isConnectionBannerVisible,
} from './connectionBannerStatus.ts';

export const CONNECTION_BANNER_MIN_DISPLAY_MS = 1000;

export type BannerTickResult = {
  display: ConnectionBannerStatus;
  /** Milliseconds until tick() should run again, or 0 when idle. */
  nextDelayMs: number;
};

/**
 * Steps through banner statuses so each one stays visible for at least minDisplayMs
 * before advancing to the next queued status.
 */
export class MinimumDurationBannerQueue {
  display: ConnectionBannerStatus = 'hidden';
  private readonly pending: ConnectionBannerStatus[] = [];
  private holdUntilMs = 0;

  constructor(
    initial: ConnectionBannerStatus = 'hidden',
    private readonly minDisplayMs = CONNECTION_BANNER_MIN_DISPLAY_MS
  ) {
    this.display = initial;
  }

  enqueue(status: ConnectionBannerStatus): void {
    if (this.pending[this.pending.length - 1] !== status) {
      this.pending.push(status);
    }
  }

  push(target: ConnectionBannerStatus, now = Date.now()): BannerTickResult {
    this.enqueue(target);
    return this.sync(now);
  }

  tick(now = Date.now()): BannerTickResult {
    return this.sync(now);
  }

  private sync(now: number): BannerTickResult {
    if (
      this.pending.length === 0 &&
      this.display === this.peekLatestTarget()
    ) {
      this.holdUntilMs = 0;
      return { display: this.display, nextDelayMs: 0 };
    }

    const displayVisible = isConnectionBannerVisible(this.display);
    const canAdvance = now >= this.holdUntilMs || !displayVisible;

    if (canAdvance && this.pending.length > 0) {
      this.advanceOne();
      if (isConnectionBannerVisible(this.display)) {
        this.holdUntilMs = now + this.minDisplayMs;
        return { display: this.display, nextDelayMs: this.minDisplayMs };
      }
      this.holdUntilMs = 0;
      return this.sync(now);
    }

    if (this.holdUntilMs > now) {
      return { display: this.display, nextDelayMs: this.holdUntilMs - now };
    }

    return { display: this.display, nextDelayMs: 0 };
  }

  private advanceOne(): void {
    while (this.pending.length > 0 && this.pending[0] === this.display) {
      this.pending.shift();
    }
    if (this.pending.length === 0) return;
    this.display = this.pending.shift()!;
  }

  private peekLatestTarget(): ConnectionBannerStatus {
    return this.pending[this.pending.length - 1] ?? this.display;
  }
}

export function useMinimumDurationBannerStatus(
  targetStatus: ConnectionBannerStatus,
  minDisplayMs = CONNECTION_BANNER_MIN_DISPLAY_MS
): ConnectionBannerStatus {
  const queueRef = useRef<MinimumDurationBannerQueue | null>(null);
  if (!queueRef.current) {
    queueRef.current = new MinimumDurationBannerQueue(targetStatus, minDisplayMs);
  }

  const [displayStatus, setDisplayStatus] = useState(
    () => queueRef.current!.display
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleTick = useCallback(
    (delayMs: number) => {
      clearTimer();
      if (delayMs <= 0) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const result = queueRef.current!.tick();
        setDisplayStatus(result.display);
        scheduleTick(result.nextDelayMs);
      }, delayMs);
    },
    [clearTimer]
  );

  useEffect(() => {
    const result = queueRef.current!.push(targetStatus);
    setDisplayStatus(result.display);
    scheduleTick(result.nextDelayMs);
  }, [targetStatus, scheduleTick]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return displayStatus;
}
