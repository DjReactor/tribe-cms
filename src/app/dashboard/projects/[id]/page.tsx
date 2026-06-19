import { getProject } from '../actions';
import ProjectDetailForm from './ProjectDetailForm';
import { getPocketBaseClient } from '@/lib/pocketbase';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, servicesRaw] = await Promise.all([
    getProject(params.id),
    getPocketBaseClient().then(pb =>
      pb.collection('services').getFullList({ filter: 'is_active = true', sort: 'sort_order' }).catch(() => [])
    ),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {params.id === 'new' ? 'New Project' : 'Edit Project'}
        </h1>
      </div>
      <ProjectDetailForm initialData={project} availableServices={JSON.parse(JSON.stringify(servicesRaw))} />
    </div>
  );
}
