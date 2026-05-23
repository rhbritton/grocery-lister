import React from 'react';
import { render, screen, act } from '@testing-library/react';

import Toast from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders message when visible', () => {
    render(
      <Toast message="Link copied" visible onDismiss={jest.fn()} />
    );

    expect(screen.getByRole('status')).toHaveTextContent('Link copied');
  });

  it('does not render when hidden', () => {
    render(
      <Toast message="Link copied" visible={false} onDismiss={jest.fn()} />
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('auto-dismisses after three seconds', () => {
    const onDismiss = jest.fn();

    render(
      <Toast message="Saved" visible onDismiss={onDismiss} />
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
