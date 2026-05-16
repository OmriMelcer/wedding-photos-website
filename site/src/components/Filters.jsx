// Sticky filter bar — photographer chips, phase chips, conditional face filter (FILT-04), clear-all.
// Face filter is absent from the DOM (not display:none) when people.length === 0 per FILT-04.
// All directional padding uses logical utilities (ps-, pe-) per RTL contract (UI-SPEC §7).
import { PHASE_LABELS, PHASE_ORDER, PHOTOGRAPHER_NAMES } from '@/config';
import { Button } from '@/components/ui/button';

export default function Filters({
  people,
  selectedPhotographers,
  selectedPhases,
  onTogglePhotographer,
  onTogglePhase,
  onClearAll,
}) {
  const hasActiveFilters =
    selectedPhotographers.size > 0 || selectedPhases.size > 0;

  return (
    <div className="sticky top-0 z-10 bg-stone-100 border-b border-stone-200 px-4 sm:px-8 lg:px-12 py-3">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Photographer filter chips */}
        {Object.entries(PHOTOGRAPHER_NAMES).map(([label, name]) => (
          <button
            key={label}
            onClick={() => onTogglePhotographer(label)}
            aria-pressed={selectedPhotographers.has(label)}
            className={`px-3 py-2 rounded-full text-sm min-h-[44px] transition-colors duration-150 ${
              selectedPhotographers.has(label)
                ? 'bg-stone-800 text-white'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
            }`}
          >
            {name}
          </button>
        ))}

        {/* Phase filter chips */}
        {PHASE_ORDER.map(phase => (
          <button
            key={phase}
            onClick={() => onTogglePhase(phase)}
            aria-pressed={selectedPhases.has(phase)}
            className={`px-3 py-2 rounded-full text-sm min-h-[44px] transition-colors duration-150 ${
              selectedPhases.has(phase)
                ? 'bg-stone-800 text-white'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
            }`}
          >
            {PHASE_LABELS[phase]}
          </button>
        ))}

        {/* Face filter — conditional render (NOT CSS hide) per FILT-04 */}
        {people.length > 0 && (
          <div data-testid="face-filter">{/* Phase 2 — face filter UI */}</div>
        )}

        {/* Clear all — only visible when at least one filter is active */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearAll} className="min-h-[44px]">
            הצג הכל
          </Button>
        )}
      </div>
    </div>
  );
}
