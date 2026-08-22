import { getProject } from '../actions';
import ProjectDetailForm from './ProjectDetailForm';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { notFound } from 'next/navigation';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pb = await getPocketBaseClient();
  const [project, servicesRaw, areasRaw, statesRaw] = await Promise.all([
    getProject(id),
    pb.collection('services').getFullList({ filter: 'is_active = true', sort: 'sort_order' }).catch(() => []),
    pb.collection('service_areas').getFullList({ filter: 'is_active = true', sort: 'sort_order' }).catch(() => []),
    pb.collection('states').getFullList({ filter: 'is_active = true', sort: 'sort_order' }).catch(() => []),
  ]);

  if (id !== 'new' && !project) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {id === 'new' ? 'New Project' : 'Edit Project'}
        </h1>
      </div>
      <ProjectDetailForm
        initialData={project}
        availableServices={JSON.parse(JSON.stringify(servicesRaw))}
        availableAreas={JSON.parse(JSON.stringify(areasRaw))}
        availableStates={JSON.parse(JSON.stringify(statesRaw))}
      />
    </div>
  );
}
