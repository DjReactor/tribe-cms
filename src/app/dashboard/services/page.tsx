import { getServices } from './actions';
import ServicesList from './ServicesList';
import type { Service } from '@/types/index';

export default async function ServicesPage() {
  const services = await getServices();
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Services</h1>
        <p className="text-muted-foreground mt-2">Manage the services you provide. Drag to reorder within a level; nest a service by setting its parent when you edit it.</p>
      </div>
      
      <ServicesList initialServices={services as unknown as Service[]} />
    </div>
  );
}