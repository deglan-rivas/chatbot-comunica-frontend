import { cn } from '@core/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const indicatorSizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
};

export function Avatar({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  online,
  className,
}: AvatarProps) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn('relative', className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            'rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 object-cover',
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-primary font-semibold',
            sizeClasses[size],
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}
        >
          {initials ?? '?'}
        </div>
      )}
      {online !== undefined && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900',
            indicatorSizes[size],
            online ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      )}
    </div>
  );
}
