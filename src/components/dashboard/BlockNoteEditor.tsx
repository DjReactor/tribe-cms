'use client';
import dynamic from 'next/dynamic';
import type { BlockNoteEditorProps } from './BlockNoteEditorClient';

/**
 * The rich-text editor, loaded in the browser only.
 *
 * BlockNote's `useCreateBlockNote` touches `window` while constructing the
 * editor, and a `'use client'` component is still SERVER-rendered for the
 * initial HTML — so a static import made every dashboard page containing an
 * editor throw `ReferenceError: window is not defined` and return a 500. That
 * was every content-editing screen in the product: services, service areas,
 * landing pages, blog posts and the catalog sections. Only Projects, which
 * uses plain textareas, was unaffected.
 *
 * `ssr: false` is the right answer HERE and the wrong answer for the public
 * site, which is worth being explicit about because the two look identical:
 *
 *   - This is an editor. Nobody indexes it, it cannot work without a browser,
 *     and there is nothing to gain from server HTML that will be replaced on
 *     hydration anyway.
 *   - `components/shared/BlockNoteRenderer` is the read-only public half, and
 *     it renders on the SERVER precisely because the body of a landing page or
 *     a blog post IS the page. Content that only exists after hydration is
 *     content Google has no reason to rank, so that one was fixed by emitting
 *     real markup instead — never by hiding it behind `ssr: false`.
 *
 * Import sites are unchanged: this file keeps the `BlockNoteEditor` name.
 */
export const BlockNoteEditor = dynamic<BlockNoteEditorProps>(
  () => import('./BlockNoteEditorClient').then((m) => m.BlockNoteEditorClient),
  {
    ssr: false,
    // Same box as the editor so the form does not jump when it loads.
    loading: () => (
      <div className="min-h-[300px] rounded-xl border border-border/80 bg-card shadow-xs flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading editor…</span>
      </div>
    ),
  },
);
