import {
  MinimumDurationBannerQueue,
  CONNECTION_BANNER_MIN_DISPLAY_MS,
} from './connectionBannerDisplay';

describe('MinimumDurationBannerQueue', () => {
  const MIN = CONNECTION_BANNER_MIN_DISPLAY_MS;

  it('shows offline immediately from hidden and holds for min duration', () => {
    const queue = new MinimumDurationBannerQueue('hidden', MIN);
    let now = 1_000;

    const first = queue.push('offline', now);
    expect(first.display).toBe('offline');
    expect(first.nextDelayMs).toBe(MIN);

    now += 500;
    const mid = queue.push('syncing', now);
    expect(mid.display).toBe('offline');
    expect(mid.nextDelayMs).toBe(MIN - 500);

    now += 500;
    const afterHold = queue.tick(now);
    expect(afterHold.display).toBe('syncing');
    expect(afterHold.nextDelayMs).toBe(MIN);
  });

  it('steps through offline, syncing, and hidden without skipping', () => {
    const queue = new MinimumDurationBannerQueue('hidden', MIN);
    let now = 0;

    queue.push('offline', now);
    queue.push('syncing', now);
    queue.push('hidden', now);

    now += MIN;
    expect(queue.tick(now).display).toBe('syncing');

    now += MIN;
    expect(queue.tick(now).display).toBe('hidden');
    expect(queue.tick(now).nextDelayMs).toBe(0);
  });

  it('dedupes consecutive duplicate targets', () => {
    const queue = new MinimumDurationBannerQueue('hidden', MIN);

    queue.push('offline');
    queue.push('offline');
    queue.push('offline');

    expect(queue.display).toBe('offline');
  });

  it('stays idle when target matches display and queue is empty', () => {
    const queue = new MinimumDurationBannerQueue('hidden', MIN);
    const result = queue.push('hidden');

    expect(result.display).toBe('hidden');
    expect(result.nextDelayMs).toBe(0);
  });
});
