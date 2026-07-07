'use client';
import { useState } from 'react';
import { GalleryLightbox, type GalleryImage } from './GalleryLightbox';

interface DefaultGalleryGridProps {
  images: GalleryImage[];
  /** Thumbnail columns at the `md` breakpoint. Mobile is always 2. Default 3. */
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLS: Record<NonNullable<DefaultGalleryGridProps['columns']>, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

/**
 * FALLBACK ONLY — a batteries-included thumbnail grid + lightbox for templates
 * that don't want to design their own gallery layout (e.g. minimal single-page
 * packs). It bundles both the grid *and* the viewer, so every template that uses
 * it looks the same.
 *
 * For a designed template, DO NOT use this. Render your own thumbnail grid (the
 * "skin") and drive {@link GalleryLightbox} directly with a controlled `openIndex`.
 */
export function DefaultGalleryGrid({ images, columns = 3, className }: DefaultGalleryGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (images.length === 0) return null;

  return (
    <>
      <div className={`grid grid-cols-2 ${COLS[columns]} gap-4 ${className ?? ''}`}>
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={img.alt ? `View ${img.alt}` : `View image ${i + 1}`}
            className="group relative aspect-square overflow-hidden rounded-xl"
            style={{ boxShadow: '0 2px 8px var(--tribe-shadow)' }}
          >
            <img
              src={img.url}
              alt={img.alt || ''}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              draggable={false}
            />
          </button>
        ))}
      </div>
      <GalleryLightbox
        images={images}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </>
  );
}
