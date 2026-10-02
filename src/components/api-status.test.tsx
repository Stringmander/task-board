import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderWithQuery } from '@/test/render';
import { ApiStatus } from './api-status';

describe('ApiStatus', () => {
  it('shows the status from GET /health and has no axe violations', async () => {
    const { container } = renderWithQuery(<ApiStatus />);

    // The status element renders while loading, so wait on its text, not its presence.
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('API: ok'));
    expect(await axe(container)).toHaveNoViolations();
  });
});
