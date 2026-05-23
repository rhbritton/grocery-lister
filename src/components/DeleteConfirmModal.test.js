import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DeleteConfirmModal from './DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
  it('renders dialog content and handles confirm/cancel', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    render(
      <DeleteConfirmModal
        title="Delete recipe?"
        message="This cannot be undone."
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete recipe?')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();

    render(
      <DeleteConfirmModal
        title="Delete list?"
        message="Are you sure?"
        onCancel={onCancel}
        onConfirm={jest.fn()}
      />
    );

    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
