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
  it('PC1: renders a download button with aria-label הורד תמונה', () => {
    render(<PhotoCard photo={photo} onClick={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'הורד תמונה' });
    expect(btn).toBeDefined();
  });

  it('PC2: download button has aria-label="הורד תמונה"', () => {
    render(<PhotoCard photo={photo} onClick={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'הורד תמונה' });
    expect(btn).toHaveAttribute('aria-label', 'הורד תמונה');
  });

  it('PC3: clicking the download button does NOT invoke the onClick prop (stopPropagation works)', () => {
    const onClick = vi.fn();
    render(<PhotoCard photo={photo} onClick={onClick} />);
    const btn = screen.getByRole('button', { name: 'הורד תמונה' });
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('PC4: clicking the card (not the download button) DOES invoke the onClick prop', () => {
    const onClick = vi.fn();
    const { container } = render(<PhotoCard photo={photo} onClick={onClick} />);
    const img = container.querySelector('img');
    fireEvent.click(img);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('PC5: download button className contains both end-0 and bottom-0 (logical positioning)', () => {
    render(<PhotoCard photo={photo} onClick={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'הורד תמונה' });
    expect(btn.className).toContain('end-0');
    expect(btn.className).toContain('bottom-0');
  });

  it('PC6: download button className contains opacity-0 and group-hover:opacity-100 (hover-only visibility)', () => {
    render(<PhotoCard photo={photo} onClick={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'הורד תמונה' });
    expect(btn.className).toContain('opacity-0');
    expect(btn.className).toContain('group-hover:opacity-100');
  });

  it('PC7: no left-/right-/ml-/mr-/pl-/pr- classes anywhere in PhotoCard rendered output (RTL contract)', () => {
    const { container } = render(<PhotoCard photo={photo} onClick={vi.fn()} />);
    const allClasses = Array.from(container.querySelectorAll('*'))
      .map(el => el.className || '')
      .join(' ');
    expect(allClasses).not.toMatch(/\bleft-\S+/);
    expect(allClasses).not.toMatch(/\bright-\S+/);
    expect(allClasses).not.toMatch(/\bml-\S+/);
    expect(allClasses).not.toMatch(/\bmr-\S+/);
    expect(allClasses).not.toMatch(/\bpl-\S+/);
    expect(allClasses).not.toMatch(/\bpr-\S+/);
  });
});
