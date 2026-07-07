'use client';
import { useState } from 'react';
import { GalleryLightbox, type GalleryImage } from '@/components/shared/GalleryLightbox';

/**
 * Reference implementation of the recommended gallery pattern: the template owns
 * the thumbnail grid (the "skin", styled however it likes) and drives the shared
 * {@link GalleryLightbox} with a controlled `openIndex`. Copy this shape into a
 * new template and restyle the grid — the lightbox behavior comes for free.
 */
export function ProjectGallery({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (images.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--tribe-heading)' }}>Project Gallery</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`View ${img.alt || `image ${i + 1}`}`}
            className="group block overflow-hidden rounded-xl"
          >
            <img
              src={img.url}
              alt={img.alt || ''}
              className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
    </section>
  );
}
