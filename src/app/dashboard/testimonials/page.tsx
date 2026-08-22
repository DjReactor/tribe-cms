import { getTestimonials } from './actions';
import TestimonialsList from './TestimonialsList';

export default async function TestimonialsPage() {
  const items = await getTestimonials();
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Testimonials</h1>
        <p className="text-muted-foreground mt-2">Manage customer reviews. Drag to reorder them on your site.</p>
      </div>
      
      <TestimonialsList initialTestimonials={items} />
    </div>
  );
}
