// Filters component tests — covers FILT-04 (face filter absence/presence) + chip rendering + clear-all.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Filters from '@/components/Filters';
import { PHASE_LABELS, PHASE_ORDER, PHOTOGRAPHER_NAMES } from '@/config';

// Minimal no-op props for tests that don't need specific callbacks
const noopProps = {
  selectedPhotographers: new Set(),
  selectedPhases: new Set(),
  onTogglePhotographer: vi.fn(),
  onTogglePhase: vi.fn(),
  onClearAll: vi.fn(),
};

describe('Filters', () => {
  it('F1 (FILT-04 absence): face filter element is NOT in the DOM when people is empty', () => {
    const { queryByTestId } = render(<Filters {...noopProps} people={[]} />);
    // Must be null — absent from DOM, not just hidden (FILT-04)
    expect(queryByTestId('face-filter')).toBeNull();
  });

  it('F2 (FILT-04 presence): face filter element IS in the DOM when people has entries', () => {
    const { getByTestId } = render(
      <Filters {...noopProps} people={[{ id: 'p1', name: 'Test Person' }]} />
    );
    expect(getByTestId('face-filter')).toBeInTheDocument();
  });

  it('F3 (chip render): all 3 photographer chips and all 5 phase chips render with correct labels', () => {
    render(<Filters {...noopProps} people={[]} />);

    // All photographer display names should appear
    Object.values(PHOTOGRAPHER_NAMES).forEach(name => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });

    // All phase Hebrew labels should appear
    PHASE_ORDER.forEach(phase => {
      expect(screen.getByText(PHASE_LABELS[phase])).toBeInTheDocument();
    });
  });

  it('F4 (clear-all visibility): "הצג הכל" absent when no filters active; present when a filter is active; clicking calls onClearAll', () => {
    const onClearAll = vi.fn();

    // No active filters → clear-all not in DOM
    const { rerender, queryByText, getByText } = render(
      <Filters
        {...noopProps}
        people={[]}
        selectedPhotographers={new Set()}
        selectedPhases={new Set()}
        onClearAll={onClearAll}
      />
    );
    expect(queryByText('הצג הכל')).toBeNull();

    // Active photographer filter → clear-all IS in DOM
    rerender(
      <Filters
        {...noopProps}
        people={[]}
        selectedPhotographers={new Set(['abir_sultan'])}
        selectedPhases={new Set()}
        onClearAll={onClearAll}
      />
    );
    const clearBtn = getByText('הצג הכל');
    expect(clearBtn).toBeInTheDocument();

    // Clicking it calls onClearAll
    fireEvent.click(clearBtn);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});
