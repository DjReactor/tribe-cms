import Link from 'next/link';
import { getLandingPagesData } from '../actions';
import { PairCreator } from './PairCreator';

export default async function NewLandingPagePage() {
  const { pairs, services, areas, source } = await getLandingPagesData();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard/landing-pages" className="text-sm text-muted-foreground hover:text-foreground">
          ← Landing Pages
        </Link>
        <h1 className="text-3xl font-bold text-foreground tracking-tight mt-2">New Landing Page</h1>
        <p className="text-muted-foreground mt-2">
          Choose the service and the area. You get a draft; it goes live once it has a body.
        </p>
      </div>

      <PairCreator services={services} areas={areas} pairs={pairs} source={source} />
    </div>
  );
}
