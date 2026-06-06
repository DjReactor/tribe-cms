import Image from 'next/image'
import Link from 'next/link'
import type { BlogPostPageProps } from '@/types/template'

export function BlogPostPage({
  businessInfo,
  resolvedCopy,
  post,
  media,
  config
}: BlogPostPageProps) {

  return (
    <div className="w-full bg-white">
      {/* Blog Post Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="flex items-center text-sm font-medium text-gray-500 mb-8 space-x-2">
          <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-[200px] sm:max-w-xs">{post.title}</span>
        </div>
        
        {post.category && (
          <div className="inline-block bg-[#B9FF24] text-gray-900 text-xs font-bold px-3 py-1 rounded-full mb-6">
            {post.category}
          </div>
        )}
        
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>
        
        <div className="flex items-center justify-between border-b border-gray-200 pb-8">
          <div className="flex items-center">
            {post.author_name && (
              <div className="flex items-center mr-6">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                   <Image 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name)}&background=random`} 
                      alt={post.author_name}
                      width={40}
                      height={40}
                    />
                </div>
                <span className="font-medium text-gray-900">{post.author_name}</span>
              </div>
            )}
            <div className="text-gray-500 flex items-center text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {new Date(post.published_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-16">
        <div className="relative w-full h-[400px] md:h-[600px] rounded-3xl overflow-hidden shadow-xl">
          <Image 
            src={post.featured_image_url || '/assets/eco-yard/8da3caff9e07af4fe3aad4bea44e0275.webp'}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* Post Content */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-24">
        <div 
          className="prose prose-lg prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-[#0C1810] prose-a:font-bold hover:prose-a:text-[#B9FF24] prose-img:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        {/* Share & Contact Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="bg-gray-50 rounded-2xl p-8 text-center sm:text-left sm:flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Need Help With Your Outdoor Space?</h3>
              <p className="text-gray-600 mb-6 sm:mb-0">Contact {businessInfo.name} for professional landscaping services.</p>
            </div>
            <Link href="/contact" className="inline-block bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8 py-3 font-medium transition-colors whitespace-nowrap">
              Get a Quote
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
