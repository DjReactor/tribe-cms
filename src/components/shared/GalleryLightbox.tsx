'use client';
import { useEffect, useRef, useCallback, TouchEvent as ReactTouchEvent } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface GalleryImage {
  url: string;
  alt?: string;
}

interface GalleryLightboxProps {
  /** Ordered images. The lightbox opens/navigates by index into this array. */
  images: GalleryImage[];
  /** Index currently shown, or `null` when the lightbox is closed. Controlled by the parent. */
  openIndex: number | null;
  /** Called when the user dismisses the lightbox (ESC, backdrop click, or the close button). */
  onClose: () => void;
  /** Called with the next index to show. The parent typically just stores it as `openIndex`. */
  onNavigate: (nextIndex: number) => void;
}

/**
 * A controlled, palette-driven lightbox for image galleries — behavior only.
 *
 * The template owns the on-page thumbnail grid (the "skin") and calls this to
 * present the full-size viewer. Encapsulates the fiddly, accessibility-sensitive
 * parts once so every template inherits them: keyboard nav (←/→/Esc), touch swipe,
 * focus trap + restore, body scroll-lock, backdrop dismiss, and an image counter.
 *
 * Styled exclusively with `var(--tribe-*)` variables, so it adapts to the active
 * palette without any template-side theming.
 */
export function GalleryLightbox({ images, openIndex, onClose, onNavigate }: GalleryLightboxProps) {
  const isOpen = openIndex !== null && openIndex >= 0 && openIndex < images.length;
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (openIndex === null || images.length === 0) return;
      onNavigate((openIndex + dir + images.length) % images.length);
    },
    [openIndex, images.length, onNavigate]
  );

  // Keyboard: Esc closes, arrows navigate, Tab is trapped within the dialog.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, go, onClose]);

  // Lock body scroll and manage focus while open; restore both on close.
  useEffect(() => {
    if (!isOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen || openIndex === null) return null;

  const current = images[openIndex];
  const hasMultiple = images.length > 1;

  const onTouchStart = (e: ReactTouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: ReactTouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 outline-none"
      style={{ backgroundColor: 'var(--tribe-overlay)' }}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close gallery"
        className="absolute top-4 right-4 rounded-full p-2 transition-colors"
        style={{ backgroundColor: 'var(--tribe-surface)', color: 'var(--tribe-heading)', boxShadow: '0 2px 8px var(--tribe-shadow)' }}
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      {hasMultiple && (
        <div
          className="absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: 'var(--tribe-surface)', color: 'var(--tribe-text-muted)', boxShadow: '0 2px 8px var(--tribe-shadow)' }}
        >
          {openIndex + 1} / {images.length}
        </div>
      )}

      {/* Prev */}
      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          aria-label="Previous image"
          className="absolute left-4 rounded-full p-2 transition-colors"
          style={{ backgroundColor: 'var(--tribe-surface)', color: 'var(--tribe-heading)', boxShadow: '0 2px 8px var(--tribe-shadow)' }}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image — clicking it should not dismiss */}
      <img
        src={current.url}
        alt={current.alt || ''}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        style={{ boxShadow: '0 8px 40px var(--tribe-shadow)' }}
        draggable={false}
      />

      {/* Next */}
      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); go(1); }}
          aria-label="Next image"
          className="absolute right-4 rounded-full p-2 transition-colors"
          style={{ backgroundColor: 'var(--tribe-surface)', color: 'var(--tribe-heading)', boxShadow: '0 2px 8px var(--tribe-shadow)' }}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
