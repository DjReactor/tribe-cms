import { getProjects } from './actions';
import { ProjectsList } from './ProjectsList';

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Projects</h1>
        <p className="text-muted-foreground mt-2">Showcase completed work to build trust and rank locally.</p>
      </div>
      <ProjectsList initialProjects={projects} />
    </div>
  );
}
