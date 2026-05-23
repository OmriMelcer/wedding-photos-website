// TopBar component tests — covers LINK-01, LINK-02
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopBar from '@/components/TopBar';
import { ALBUM_LINKS } from '@/config';

describe('TopBar', () => {
  it('renders a <nav> element with aria-label="אלבומי המקור"', () => {
    render(<TopBar />);
    expect(
      screen.getByRole('navigation', { name: 'אלבומי המקור' })
    ).toBeInTheDocument();
  });

  it('renders exactly 4 anchor elements, one per ALBUM_LINKS entry', () => {
    render(<TopBar />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });

  it('every anchor has target="_blank" and rel containing both noopener and noreferrer', () => {
    render(<TopBar />);
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      const rel = link.getAttribute('rel') || '';
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    });
  });

  it('every anchor href equals the corresponding ALBUM_LINKS[i].url', () => {
    render(<TopBar />);
    const links = screen.getAllByRole('link');
    links.forEach((link, i) => {
      expect(link).toHaveAttribute('href', ALBUM_LINKS[i].url);
    });
  });

  it('every anchor visible text contains the corresponding ALBUM_LINKS[i].label', () => {
    render(<TopBar />);
    const links = screen.getAllByRole('link');
    links.forEach((link, i) => {
      expect(link).toHaveTextContent(ALBUM_LINKS[i].label);
    });
  });
});
