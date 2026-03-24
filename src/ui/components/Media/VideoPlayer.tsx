import { useState } from 'react';
import { cn } from '@core/utils';
import type { Attachment } from '@core/types/message.types';

interface VideoPlayerProps {
  attachment: Attachment;
}

export function VideoPlayer({ attachment }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isPlaying) {
    return (
      <div
        className={cn(
          'relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden',
          'flex flex-col items-center justify-center cursor-pointer',
          'border border-gray-200 dark:border-gray-700'
        )}
        onClick={() => setIsPlaying(true)}
      >
        {attachment.thumbnailUrl && (
          <img
            src={attachment.thumbnailUrl}
            alt="Video thumbnail"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        <svg
          viewBox="0 0 24 24"
          className="w-10 h-10 text-primary mb-1 relative z-10"
          aria-hidden
          fill="currentColor"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 relative z-10">
          {attachment.name ?? 'Infografia / Tutorial (Video)'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
      <video
        src={attachment.url}
        controls
        autoPlay
        className="w-full h-full object-contain"
      >
        Tu navegador no soporta videos.
      </video>
    </div>
  );
}
