// Thumbnail card — lazy-loaded image + hover-only photographer credit badge.
// Badge position: bottom-0 start-0 (logical) = visual bottom-right in RTL per D-13.
// In RTL document (dir="rtl"), `start` resolves to right and `end` resolves to left.
import { PHOTOGRAPHER_NAMES } from '@/config';

export default function PhotoCard({ photo, onClick }) {
  return (
    <div
      className="relative group cursor-pointer overflow-hidden rounded-sm mb-0"
      onClick={onClick}
    >
      {/* loading="lazy" is mandatory per UI-SPEC §10 performance constraint */}
      <img
        src={photo.thumb_url}
        alt=""
        loading="lazy"
        className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
      />
      {/* Photographer credit badge — hover only, visual bottom-right corner in RTL (D-13).
          In RTL: start resolves to right (visual right = bottom-right corner). */}
      <div className="absolute bottom-0 start-0 m-1.5 px-2 py-1 rounded bg-black/50 text-white text-[13px] leading-snug opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {PHOTOGRAPHER_NAMES[photo.photographer] ?? photo.photographer}
      </div>
    </div>
  );
}
