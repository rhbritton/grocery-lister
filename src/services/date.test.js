import React from 'react';
import { formatRelativeUpdateTime, getRemoteUpdateFadeOpacity } from './date';

const NOW = 1_700_000_000_000;

describe('formatRelativeUpdateTime', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty string when timestamp is missing', () => {
    expect(formatRelativeUpdateTime(null)).toBe('');
  });

  it('shows "just now" for very recent updates', () => {
    expect(formatRelativeUpdateTime(NOW - 5_000)).toBe('Updated just now');
  });

  it('shows seconds ago under one minute', () => {
    expect(formatRelativeUpdateTime(NOW - 50_000)).toBe('Updated 50s ago');
  });

  it('shows minutes ago under one hour', () => {
    expect(formatRelativeUpdateTime(NOW - 50 * 60_000)).toBe('Updated 50m ago');
  });

  it('shows hours ago after one hour', () => {
    expect(formatRelativeUpdateTime(NOW - 27 * 60 * 60_000)).toBe('Updated 27h ago');
  });
});

describe('getRemoteUpdateFadeOpacity', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns full opacity before fade starts', () => {
    expect(getRemoteUpdateFadeOpacity(950, 100, 200)).toBe(1);
  });

  it('returns zero after fade ends', () => {
    expect(getRemoteUpdateFadeOpacity(0, 100, 200)).toBe(0);
  });

  it('linearly fades between start and end', () => {
    const opacity = getRemoteUpdateFadeOpacity(850, 100, 200);
    expect(opacity).toBeCloseTo(0.5);
  });
});
