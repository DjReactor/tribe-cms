'use client';
/**
 * The real BlockNote editor. Never imported directly by a form — go through
 * `./BlockNoteEditor`, which loads this with `ssr: false`.
 *
 * `useCreateBlockNote` touches `window` while the editor is constructed, and a
 * `'use client'` component is still SERVER-rendered for the initial HTML, so a
 * static import of this file makes every page containing it throw
 * `ReferenceError: window is not defined` and return a 500.
 */
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useMemo } from "react";
import type { PartialBlock } from "@blocknote/core";

export interface BlockNoteEditorProps {
  initialContent?: PartialBlock[] | string;
  onChange: (json: PartialBlock[]) => void;
  editable?: boolean;
}

export function BlockNoteEditorClient({ initialContent, onChange, editable = true }: BlockNoteEditorProps) {
  const initialBlocks = useMemo(() => {
    if (typeof initialContent === 'string' && initialContent) {
      try {
        return JSON.parse(initialContent);
      } catch (e) {
        return undefined;
      }
    }
    if (Array.isArray(initialContent) && initialContent.length > 0) {
        return initialContent;
    }
    return undefined;
  }, [initialContent]);

  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
  });

  return (
    <div className="min-h-[300px] border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all pb-8 pt-4">
      <BlockNoteView 
        editor={editor} 
        editable={editable}
        onChange={() => {
          onChange(editor.document);
        }}
        theme="light"
      />
    </div>
  );
}
