import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModalShell from './ModalShell';

describe('ModalShell', () => {
  it('renders dialog semantics and children', () => {
    render(
      <ModalShell onClose={jest.fn()} titleId="test-modal-title">
        <h2 id="test-modal-title">Test modal</h2>
        <button type="button">Inside</button>
      </ModalShell>
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'test-modal-title');
    expect(screen.getByRole('heading', { name: /test modal/i })).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <ModalShell onClose={onClose} titleId="test-modal-title">
        <h2 id="test-modal-title">Test modal</h2>
      </ModalShell>
    );

    await user.click(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when panel content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <ModalShell onClose={onClose} titleId="test-modal-title">
        <h2 id="test-modal-title">Test modal</h2>
      </ModalShell>
    );

    await user.click(screen.getByRole('heading', { name: /test modal/i }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
