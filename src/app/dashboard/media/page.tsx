import { getMedia } from './actions';
import { MediaGrid } from './MediaGrid';
import { MediaUploader } from './MediaUploader';

export default async function MediaPage() {
  const media = await getMedia();
  // Using the PB_URL environment variable to pass to the client components.
  // Fallback to localhost for local dev if not set.
  const pbUrl = process.env['PB_URL'] || 'http://127.0.0.1:8090';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Media Library</h1>
        <p className="text-slate-500 mt-2">Manage all the images used across your website.</p>
      </div>
      
      <MediaUploader />
      <MediaGrid items={media} pbUrl={pbUrl} />
    </div>
  );
}
