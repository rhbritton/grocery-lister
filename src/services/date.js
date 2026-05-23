export function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

export function formatTime(date, options = { hour: 'numeric', minute: 'numeric', second: 'numeric'}) {
    return date.toLocaleTimeString(undefined, options);
}

/** Relative label for a remote sync timestamp, e.g. "Updated just now". */
export function formatRelativeUpdateTime(timestampMs) {
    if (!timestampMs) return '';

    const seconds = Math.floor((Date.now() - timestampMs) / 1000);
    if (seconds < 10) return 'Updated just now';
    if (seconds < 60) return `Updated ${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Updated ${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    return `Updated ${hours}h ago`;
}

/** Opacity 1 → 0 between fadeStartMs and fadeEndMs after timestamp. */
export function getRemoteUpdateFadeOpacity(timestampMs, fadeStartMs = 3 * 60 * 1000, fadeEndMs = 10 * 60 * 1000) {
    const ageMs = Date.now() - timestampMs;
    if (ageMs < fadeStartMs) return 1;
    if (ageMs >= fadeEndMs) return 0;
    return 1 - (ageMs - fadeStartMs) / (fadeEndMs - fadeStartMs);
}