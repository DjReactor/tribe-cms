interface BlockNoteRendererProps {
  content: Record<string, unknown>
  className?: string
}

export function BlockNoteRenderer({ content, className = '' }: BlockNoteRendererProps) {
  // Very basic mock renderer since the real one would require BlockNote dependencies
  return (
    <div className={className}>
      <p>Content rendered successfully. (Mock implementation)</p>
      {/* In a real app, this would iterate through BlockNote JSON and render HTML blocks */}
    </div>
  )
}
