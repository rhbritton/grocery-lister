import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faBook } from '@fortawesome/free-solid-svg-icons';

import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders title, description, and link action', () => {
    render(
      <EmptyState
        icon={faBook}
        title="No recipes match your search"
        description="Add your recipes to build your grocery lists."
        actionLabel="Add a recipe"
        actionTo="/recipes/add"
      />
    );

    expect(screen.getByRole('heading', { name: /no recipes match your search/i })).toBeInTheDocument();
    expect(screen.getByText(/add your recipes to build your grocery lists/i)).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /add a recipe/i });
    expect(link).toHaveAttribute('href', '/recipes/add');
  });

  it('calls onAction for button actions', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();

    render(
      <EmptyState
        title="Nothing here"
        actionLabel="Retry"
        onAction={onAction}
      />
    );

    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
