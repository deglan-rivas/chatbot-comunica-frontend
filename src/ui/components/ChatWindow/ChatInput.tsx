import { useState, useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { cn } from '@core/utils';

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Escribe un mensaje',
}: ChatInputProps) {
  const [text, setText] = useState('');
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

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 px-4 pt-3 pb-4',
        'flex items-center gap-2',
        'border-t border-gray-200 dark:border-gray-800'
      )}
    >
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
            '!bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full',
            'text-gray-800 dark:text-gray-100 p-0 outline-none',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            '[&]:bg-transparent'
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
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4"
          aria-hidden
          fill="currentColor"
        >
          <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
        </svg>
      </button>
    </div>
  );
}
