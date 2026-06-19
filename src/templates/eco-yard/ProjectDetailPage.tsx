import Link from 'next/link';
import type { ProjectDetailPageProps } from '@/types/template';
import { StarRating } from '@/components/shared/StarRating';

export function ProjectDetailPage({ project, businessInfo, relatedProjects }: ProjectDetailPageProps) {
  const contentSections = [
    { key: 'problem', label: 'The Challenge', value: project.content?.problem },
    { key: 'solution', label: 'Our Solution', value: project.content?.solution },
    { key: 'process', label: 'The Process', value: project.content?.process },
    { key: 'outcome', label: 'The Result', value: project.content?.outcome },
  ].filter((s) => s.value);

  return (
    <div style={{ backgroundColor: 'var(--tribe-bg)' }}>
      {/* Hero */}
      <section className="relative h-80 overflow-hidden" style={{ backgroundColor: 'var(--tribe-surface-alt)' }}>
        {project.cover_image_url && (
          <img src={project.cover_image_url} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0" style={{ backgroundColor: 'var(--tribe-overlay)' }} />
        <div className="relative h-full flex flex-col justify-end max-w-7xl mx-auto px-4 pb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--tribe-text-on-alt)' }}>{project.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            {project.location && (
              <span className="text-sm" style={{ color: 'var(--tribe-text-on-alt)', opacity: 0.85 }}>
                {project.location.city}{project.location.state ? `, ${project.location.state}` : ''}
              </span>
            )}
            {project.services.map((s) => (
              <span key={s.id} className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--tribe-brand)', color: 'var(--tribe-brand-text)' }}>
                {s.name}
              </span>
            ))}
            {project.status === 'completed' && project.completed_at && (
              <span className="text-sm" style={{ color: 'var(--tribe-text-on-alt)', opacity: 0.75 }}>
                Completed {new Date(project.completed_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        {/* Summary */}
        <p className="text-xl leading-relaxed max-w-3xl" style={{ color: 'var(--tribe-text)' }}>{project.summary}</p>

        {/* Gallery */}
        {(project.gallery_image_urls ?? []).length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--tribe-heading)' }}>Project Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {project.gallery_image_urls!.map((url, i) => (
                <img key={i} src={url} alt={`${project.title} gallery image ${i + 1}`} className="rounded-xl object-cover aspect-square w-full" />
              ))}
            </div>
          </section>
        )}

        {/* Story sections */}
        {contentSections.length > 0 && (
          <section className="space-y-10">
            {contentSections.map((section) => (
              <div key={section.key}>
                <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--tribe-heading)' }}>{section.label}</h2>
                <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--tribe-text)' }}>{section.value}</p>
              </div>
            ))}
          </section>
        )}

        {/* Testimonial */}
        {project.testimonial && (
          <section className="rounded-2xl p-8" style={{ backgroundColor: 'var(--tribe-surface)', boxShadow: '0 2px 12px var(--tribe-shadow)' }}>
            {project.testimonial.rating && (
              <div className="mb-3">
                <StarRating rating={project.testimonial.rating} size="md" />
              </div>
            )}
            <blockquote className="text-lg italic mb-4" style={{ color: 'var(--tribe-text)' }}>
              "{project.testimonial.quote}"
            </blockquote>
            <div className="flex items-center gap-3">
              {project.testimonial.client_image_url && (
                <img src={project.testimonial.client_image_url} alt={project.testimonial.client} className="h-10 w-10 rounded-full object-cover" />
              )}
              <div>
                <p className="font-semibold" style={{ color: 'var(--tribe-heading)' }}>{project.testimonial.client}</p>
                {project.testimonial.client_info && (
                  <p className="text-sm" style={{ color: 'var(--tribe-text-muted)' }}>{project.testimonial.client_info}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Related projects */}
        {relatedProjects.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--tribe-heading)' }}>More Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.slug}`} className="group block rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--tribe-surface)', boxShadow: '0 2px 8px var(--tribe-shadow)' }}>
                  {p.cover_image_url && (
                    <img src={p.cover_image_url} alt={p.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                  <div className="p-4">
                    <p className="font-semibold" style={{ color: 'var(--tribe-heading)' }}>{p.title}</p>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--tribe-text-muted)' }}>{p.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
