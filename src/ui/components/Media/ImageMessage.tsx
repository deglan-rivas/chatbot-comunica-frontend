import { useState } from 'react';
import { cn } from '@core/utils';
import type { Attachment } from '@core/types/message.types';

interface ImageMessageProps {
  attachment: Attachment;
  onClick?: () => void;
}

export function ImageMessage({ attachment, onClick }: ImageMessageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-sm">Error al cargar imagen</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative w-full max-w-[250px] rounded-lg overflow-hidden cursor-pointer',
        'bg-gray-100 dark:bg-gray-800'
      )}
      onClick={onClick}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      <img
        src={attachment.url}
        alt={attachment.name ?? 'Imagen'}
        className={cn(
          'w-full h-auto object-cover transition-opacity',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
