import { useState } from 'react';
import { cn } from '@core/utils';

interface RatingInputProps {
  min?: number;
  max?: number;
  selected?: number;
  onSelect?: (rating: number) => void;
  disabled?: boolean;
}

export function RatingInput({
  min = 1,
  max = 5,
  selected,
  onSelect,
  disabled = false,
}: RatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const ratings = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="flex justify-between gap-1 mt-3">
      {ratings.map((rating) => (
        <button
          key={rating}
          onClick={() => !disabled && onSelect?.(rating)}
          onMouseEnter={() => setHovered(rating)}
          onMouseLeave={() => setHovered(null)}
          disabled={disabled || selected !== undefined}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-full',
            'text-sm font-bold transition-colors',
            'disabled:cursor-default',
            selected === rating
              ? 'bg-primary text-white'
              : hovered !== null && rating <= hovered
                ? 'bg-primary/50 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
            !disabled &&
              selected === undefined &&
              'hover:bg-primary hover:text-white'
          )}
          aria-label={`Calificacion ${rating}`}
        >
          {rating}
        </button>
      ))}
    </div>
  );
}
