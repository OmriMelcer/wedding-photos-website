// TopBar — renders source album link buttons above the Filters bar.
// CONF-01: all album URLs live in config.js; no inline URLs here.
// Not sticky — Filters owns the sticky position.
import { ALBUM_LINKS } from '@/config';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function TopBar() {
  return (
    <nav aria-label="אלבומי המקור">
      <div className="bg-stone-100 border-b border-stone-200 px-4 sm:px-8 lg:px-12 py-3 flex flex-wrap gap-2 items-center">
        {ALBUM_LINKS.map(({ label, url }) => (
          <Button key={label} asChild variant="outline" size="sm" className="min-h-[44px]">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink data-icon="inline-start" aria-hidden="true" />
              {label}
            </a>
          </Button>
        ))}
      </div>
    </nav>
  );
}
