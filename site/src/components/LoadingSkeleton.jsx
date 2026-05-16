// Skeleton loading state shown while metadata.json is being fetched (UI-SPEC §5.6).
// 12 stone-200 cards with animate-pulse in varied aspect ratios approximate masonry layout.
export default function LoadingSkeleton() {
  // Varied aspect ratios to approximate masonry: portrait, landscape, square in rotation
  const aspectRatios = ['3/4', '4/3', '4/3', '3/4', '1/1', '4/3', '3/4', '4/3', '1/1', '3/4', '4/3', '3/4'];

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-8" role="status" aria-label="טוען תמונות...">
      {/* Skeleton filter bar */}
      <div className="h-16 bg-stone-100 rounded mb-8 animate-pulse" />
      {/* Skeleton photo grid — approximates 2/3/4 column masonry */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {aspectRatios.map((ratio, i) => (
          <div
            key={i}
            className="bg-stone-200 rounded animate-pulse"
            style={{ aspectRatio: ratio }}
          />
        ))}
      </div>
    </div>
  );
}
