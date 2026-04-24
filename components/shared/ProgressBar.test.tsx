import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct aria attributes', () => {
    render(<ProgressBar value={60} label="Progress" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps value above 100 to 100', () => {
    render(<ProgressBar value={150} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps value below 0 to 0', () => {
    render(<ProgressBar value={-20} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('shows label text when provided', () => {
    render(<ProgressBar value={40} label="Tier progress" />);
    expect(screen.getByText('Tier progress')).toBeInTheDocument();
  });

  it('renders fill div with correct width style', () => {
    const { container } = render(<ProgressBar value={75} />);
    const fill = container.querySelector('[style]') as HTMLElement;
    expect(fill.style.width).toBe('75%');
  });
});
