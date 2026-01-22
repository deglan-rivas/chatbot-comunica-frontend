import { useState, useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { cn } from '@core/utils';

interface ChatInputProps {
  onSend: (text: string) => void;
  onAttachment?: (file: File) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  features?: {
    attachments?: boolean;
    emoji?: boolean;
  };
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onAttachment,
  onTyping,
  disabled = false,
  features = { attachments: true },
  placeholder = 'Escribe un mensaje',
}: ChatInputProps) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      onTyping?.(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (e.target.value) {
      onTyping?.(true);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping?.(false);
      }, 2000);
    } else {
      onTyping?.(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAttachment?.(file);
      e.target.value = '';
    }
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 px-4 pt-3 pb-4',
        'flex items-center gap-2',
        'border-t border-gray-200 dark:border-gray-800'
      )}
    >
      {features.attachments && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              'text-primary p-1 rounded-full',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'transition-colors disabled:opacity-50'
            )}
            aria-label="Adjuntar archivo"
          >
            <span className="material-icons-round">attach_file</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,video/*,.pdf,.doc,.docx"
            className="hidden"
          />
        </>
      )}

      <div
        className={cn(
          'flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2',
          'flex items-center',
          'border border-gray-200 dark:border-gray-700'
        )}
      >
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'bg-transparent border-none focus:ring-0 text-sm w-full',
            'text-gray-800 dark:text-gray-100 p-0 outline-none',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500'
          )}
        />
      </div>

      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className={cn(
          'bg-primary text-white w-10 h-10 rounded-full',
          'flex items-center justify-center shadow-md',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          text.trim() && 'active:scale-95'
        )}
        aria-label="Enviar mensaje"
      >
        <span className="material-icons-round">send</span>
      </button>
    </div>
  );
}
