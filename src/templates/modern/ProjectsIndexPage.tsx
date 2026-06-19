import Link from 'next/link';
import type { ProjectsIndexPageProps } from '@/types/template';
import type { Project } from '@/types';

const statusLabel: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
};

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--tribe-surface)', boxShadow: '0 2px 12px var(--tribe-shadow)' }}>
      {project.cover_image_url && (
        <div className="relative h-52 overflow-hidden">
          <img
            src={project.cover_image_url}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {project.featured && (
            <span className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--tribe-brand)', color: 'var(--tribe-brand-text)' }}>
              Featured
            </span>
          )}
        </div>
      )}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold leading-snug" style={{ color: 'var(--tribe-heading)' }}>{project.title}</h2>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: 'var(--tribe-surface-alt)', color: 'var(--tribe-text-on-alt)' }}>
            {statusLabel[project.status] ?? project.status}
          </span>
        </div>
        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--tribe-text-muted)' }}>{project.summary}</p>
        {project.location && (
          <p className="text-xs" style={{ color: 'var(--tribe-text-muted)' }}>
            {project.location.city}{project.location.state ? `, ${project.location.state}` : ''}
          </p>
        )}
        {project.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.services.map((s) => (
              <span key={s.id} className="text-xs px-2 py-0.5 rounded-full" style={{ border: '1px solid var(--tribe-border)', color: 'var(--tribe-text-muted)' }}>
                {s.name}
              </span>
            ))}
          </div>
        )}
        {project.status === 'completed' && project.completed_at && (
          <p className="text-xs" style={{ color: 'var(--tribe-text-muted)' }}>
            Completed {new Date(project.completed_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>
    </Link>
  );
}

export function ProjectsIndexPage({ projects, businessInfo }: ProjectsIndexPageProps) {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);
  const ordered = [...featured, ...rest];

  return (
    <div style={{ backgroundColor: 'var(--tribe-bg)' }}>
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--tribe-surface-alt)' }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--tribe-text-on-alt)' }}>Our Projects</h1>
          <p className="text-lg" style={{ color: 'var(--tribe-text-on-alt)', opacity: 0.8 }}>
            Real work, real results. Browse completed projects by {businessInfo.business_name}.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {ordered.length === 0 ? (
            <p style={{ color: 'var(--tribe-text-muted)' }}>No projects yet — check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {ordered.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
