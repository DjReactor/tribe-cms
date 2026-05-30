import Link from 'next/link'
import Image from 'next/image'
import type { BlogIndexProps } from '@/types/template'

export function BlogIndexPage({ posts, businessInfo, currentPage, totalPages, config }: BlogIndexProps) {
  const formatDate = (isoDate: string) => {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-50 py-16 px-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Insights &amp; Updates
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The latest news and helpful advice from the team at {businessInfo.business_name}.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20">
        {!posts || posts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Posts Yet</h2>
            <p className="text-gray-600">Check back soon for our first blog post.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {posts.map((post) => (
                <Link 
                  key={post.id} 
                  href={`/blog/${post.slug}`} 
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                    {post.cover_image_url ? (
                      <Image 
                        src={post.cover_image_url} 
                        alt={post.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14"></path></svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-8 flex flex-col flex-1">
                    {post.published_at && (
                      <div className="text-sm font-semibold text-[var(--color-accent)] mb-4">
                        {formatDate(post.published_at)}
                      </div>
                    )}
                    <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4 group-hover:text-[var(--color-accent)] transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-gray-600 mb-6 flex-1 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-auto flex items-center gap-2 font-medium text-gray-900 group-hover:text-[var(--color-accent)] transition-colors">
                      Read Article
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-20 pt-10 border-t border-gray-200 flex items-center justify-center gap-4">
                {currentPage > 1 && (
                  <a href={`/blog?page=${currentPage - 1}`} className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    &larr; Newer Posts
                  </a>
                )}
                <span className="text-gray-500 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <a href={`/blog?page=${currentPage + 1}`} className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    Older Posts &rarr;
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}