import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 1-5
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ rating, size = 'md' }: StarRatingProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const currentSize = sizes[size];
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${currentSize} ${
            star <= rating
              ? 'fill-[var(--tribe-star)] text-[var(--tribe-star)]'
              : 'fill-[var(--tribe-border)] text-[var(--tribe-border)]'
          }`}
        />
      ))}
    </div>
  );
}
