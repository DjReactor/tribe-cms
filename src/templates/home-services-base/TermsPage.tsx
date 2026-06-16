import type { StaticPageProps } from '@/types/template'

export function TermsPage({ pageContent }: StaticPageProps) {
  return (
    <div className="bg-[var(--tribe-surface)] min-h-screen">
      <div className="bg-gray-50 py-16 px-6 border-b border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900">
            Terms of Service
          </h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div 
          className="prose prose-lg prose-[var(--tribe-brand)] max-w-none"
          dangerouslySetInnerHTML={{ __html: pageContent || '' }} 
        />
      </div>
    </div>
  )
}