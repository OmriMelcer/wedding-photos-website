// PhotoCard tests — covers DWNL-02 (hover download overlay).
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PhotoCard from '@/components/PhotoCard';

const photo = {
  id: 'p1',
  filename: 'p1.jpg',
  r2_url: 'https://r2.example.com/photos/p1.jpg',
  thumb_url: 'https://r2.example.com/thumbs/p1.jpg',
  photographer: 'abir_sultan',
  timestamp: '2025-06-14T17:32:00',
  cluster: 'prep',
  cluster_confidence: 0.9,
  faces: [],
};

describe('PhotoCard', () => {
  it('PC1: renders an anchor with href === photo.r2_url', () => {
    render(<PhotoCard photo={photo} onClick={vi.fn()} />);
    const anchor = screen.getByRole('link', { name: 'הורד תמונה' });
    expect(anchor).toHaveAttribute('href', photo.r2_url);
  });

  it('PC2: download anchor has the HTML download attribute equal to photo.filename', () => {
    render(<PhotoCard photo={photo} onClick={vi.fn()} />);
    const anchor = screen.getByRole('link', { name: 'הורד תמונה' });
    expect(anchor).toHaveAttribute('download', photo.filename);
  });

  it('PC3: download anchor has aria-label="הורד תמונה"', () => {
    render(<PhotoCard photo={photo} onClick={vi.fn()} />);
    const anchor = screen.getByRole('link', { name: 'הורד תמונה' });
    expect(anchor).toHaveAttribute('aria-label', 'הורד תמונה');
  });

  it('PC4: clicking the download anchor does NOT invoke the onClick prop (stopPropagation works)', () => {
    const onClick = vi.fn();
    render(<PhotoCard photo={photo} onClick={onClick} />);
    const anchor = screen.getByRole('link', { name: 'הורד תמונה' });
    fireEvent.click(anchor);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('PC5: clicking the card (not the download anchor) DOES invoke the onClick prop', () => {
    const onClick = vi.fn();
    const { container } = render(<PhotoCard photo={photo} onClick={onClick} />);
    // The outer div carries the onClick — click the presentation img element directly
    // (alt="" makes it role=presentation, so query via container querySelector)
    const img = container.querySelector('img');
    fireEvent.click(img);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('PC6: download anchor className contains both end-0 and bottom-0 (logical positioning)', () => {
    render(<PhotoCard photo={photo} onClick={vi.fn()} />);
    const anchor = screen.getByRole('link', { name: 'הורד תמונה' });
    expect(anchor.className).toContain('end-0');
    expect(anchor.className).toContain('bottom-0');
  });

  it('PC7: download anchor className contains opacity-0 and group-hover:opacity-100 (hover-only visibility)', () => {
    render(<PhotoCard photo={photo} onClick={vi.fn()} />);
    const anchor = screen.getByRole('link', { name: 'הורד תמונה' });
    expect(anchor.className).toContain('opacity-0');
    expect(anchor.className).toContain('group-hover:opacity-100');
  });

  it('PC8: no left-/right-/ml-/mr-/pl-/pr- classes anywhere in PhotoCard rendered output (RTL contract)', () => {
    const { container } = render(<PhotoCard photo={photo} onClick={vi.fn()} />);
    // Collect all className values from all elements in the rendered tree
    const allClasses = Array.from(container.querySelectorAll('*'))
      .map(el => el.className || '')
      .join(' ');
    // RTL-prohibited physical direction classes
    expect(allClasses).not.toMatch(/\bleft-\S+/);
    expect(allClasses).not.toMatch(/\bright-\S+/);
    expect(allClasses).not.toMatch(/\bml-\S+/);
    expect(allClasses).not.toMatch(/\bmr-\S+/);
    expect(allClasses).not.toMatch(/\bpl-\S+/);
    expect(allClasses).not.toMatch(/\bpr-\S+/);
  });
});
