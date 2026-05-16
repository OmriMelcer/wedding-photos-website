import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

describe('App smoke test', () => {
  it('renders without throwing — shows LoadingSkeleton while metadata.json fetch is in flight', () => {
    // App.jsx now fetches metadata.json on mount; during the test environment it shows
    // LoadingSkeleton (loading=true) because fetch is not resolved yet.
    render(<App />);
    // LoadingSkeleton renders with aria-label="טוען תמונות..."
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
