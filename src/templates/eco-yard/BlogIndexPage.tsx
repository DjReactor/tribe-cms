import Image from 'next/image'
import Link from 'next/link'
import type { BlogIndexProps } from '@/types/template'
import { getMediaFileUrl } from '@/lib/images'

export function BlogIndexPage({
  businessInfo,
  resolvedCopy,
  posts = [],
  media,
  config
}: BlogIndexProps) {

  const heroMedia = media.find(m => m.category === 'hero')
  const heroImage = getMediaFileUrl(heroMedia) || '/assets/eco-yard/8f8fad3186d80ad51fcac9d62bdb5a61.webp'

  return (
    <div className="w-full">
      {/* Inner Hero */}
      <section className="relative w-full h-[40vh] min-h-[350px] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage}
            alt="Our Blog"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gray-900/80"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-[var(--sf-text)] leading-tight mb-4">
              Lawn & Garden Insights
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Practical tips, seasonal guides, and project spotlights to help you maintain a beautiful outdoor space.
            </p>
            <div className="flex items-center justify-center text-sm font-medium text-gray-400">
              <Link href="/" className="hover:text-[var(--sf-brand)] transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--sf-brand)]">Blog</span>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <article key={post.id} className="bg-[var(--sf-surface)] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-gray-100 flex flex-col h-full group">
                  <div className="relative h-64 overflow-hidden">
                    <Image 
                      src={post.featured_image_url || '/assets/eco-yard/784b169a2d14e99d7c105a9433dc6a0e.webp'}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {post.category && (
                      <div className="absolute top-4 left-4 bg-[var(--sf-brand)] text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                        {post.category}
                      </div>
                    )}
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <div className="text-sm text-gray-400 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(post.published_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-gray-600 transition-colors">
                      <Link href={`/blog/${post.slug}`} className="focus:outline-none">
                        {/* Span block extending to the full card makes the whole card clickable */}
                        <span className="absolute inset-0" aria-hidden="true" />
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-1">
                      {post.excerpt || 'Read more about this topic in our detailed guide to keeping your outdoor spaces healthy and well-maintained year-round.'}
                    </p>
                    <div className="mt-auto flex items-center text-gray-900 font-bold text-sm">
                      Read Article
                      <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              // Empty State
              <div className="col-span-full py-20 text-center bg-[var(--sf-surface)] rounded-3xl border border-gray-200 border-dashed">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3m0 0l3-3m-3 3V8" /></svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Articles Yet</h3>
                <p className="text-gray-500">Check back soon for new tips and guides.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
