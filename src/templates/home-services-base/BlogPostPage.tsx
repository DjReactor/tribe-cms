import Link from 'next/link'
import Image from 'next/image'
import type { BlogPostProps } from '@/types/template'
import { BlockNoteRenderer } from '@/components/shared/BlockNoteRenderer'

export function BlogPostPage({ post, businessInfo, relatedPosts, config }: BlogPostProps) {
  const formatDate = (isoDate: string) => {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const authorName = post.author_type === 'manual' ? `By ${businessInfo.business_name}` : `Published by ${businessInfo.business_name}`

  return (
    <div className="bg-white">
      {/* Article Header */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] hover:text-gray-900 mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Blog
        </Link>
        
        {post.published_at && (
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            {formatDate(post.published_at)}
          </div>
        )}
        
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
          {post.title}
        </h1>
        
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-sm">
            {businessInfo.business_name.charAt(0)}
          </div>
          <span className="font-medium text-gray-700">{authorName}</span>
        </div>
      </div>

      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="max-w-5xl mx-auto px-6 mb-16">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-2xl">
            <Image 
              src={post.cover_image_url} 
              alt={post.title} 
              fill 
              className="object-cover" 
              priority 
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-6 pb-20">
        {post.content ? (
          <div className="prose prose-lg md:prose-xl prose-[var(--color-accent)] prose-img:rounded-2xl max-w-none">
            <BlockNoteRenderer content={post.content} />
          </div>
        ) : (
          <p className="text-gray-500 italic text-center">Article content is empty.</p>
        )}

        {/* Article Footer & Share (Static placeholder) */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-medium text-gray-900">
            Thanks for reading!
          </div>
          <div className="flex gap-4">
            <Link href="/contact" className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts?.length > 0 && (
        <div className="bg-gray-50 py-24 border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-12 text-center">Keep Reading</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts?.map((related) => (
                <Link 
                  key={related.id} 
                  href={`/blog/${related.slug}`} 
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                    {related.cover_image_url && (
                      <Image 
                        src={related.cover_image_url} 
                        alt={related.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    )}
                  </div>
                  <div className="p-8">
                    {related.published_at && (
                      <div className="text-xs font-bold text-[var(--color-accent)] mb-3 uppercase tracking-wider">
                        {formatDate(related.published_at)}
                      </div>
                    )}
                    <h3 className="font-heading font-bold text-xl text-gray-900 group-hover:text-[var(--color-accent)] transition-colors">
                      {related.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Banner */}
      <section className="bg-[var(--color-accent)] py-20 px-6 text-center text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">Need expert assistance?</h2>
          <p className="text-lg text-white/90 mb-10">Our team at {businessInfo.business_name} is here to help with all your needs.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="px-8 py-4 bg-white text-[var(--color-accent)] font-bold rounded-lg hover:bg-gray-50 transition-colors">
              Get in Touch
            </Link>
            {businessInfo.phone && (
              <a href={`tel:${businessInfo.phone}`} className="px-8 py-4 border-2 border-white/30 font-bold rounded-lg hover:bg-white/10 transition-colors">
                Call {businessInfo.phone}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}