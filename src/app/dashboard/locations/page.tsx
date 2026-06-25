import { getLocations } from './actions';
import LocationsList from './LocationsList';

export default async function LocationsPage() {
  const items = await getLocations();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Locations</h1>
        <p className="text-slate-500 mt-2">Manage your business locations. Drag to reorder how they appear on your site.</p>
      </div>

      <LocationsList initialLocations={items} />
    </div>
  );
}
