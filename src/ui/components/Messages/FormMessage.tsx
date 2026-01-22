import { useState } from 'react';
import { cn } from '@core/utils';
import type { BackendFormInput } from '@core/types/backend.types';

interface FormMessageProps {
  input: BackendFormInput;
  onSubmit?: (value: string) => void;
}

export function FormMessage({ input, onSubmit }: FormMessageProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validate = (val: string): boolean => {
    if (input.required && !val.trim()) {
      setError('Este campo es requerido');
      return false;
    }

    if (input.validation) {
      if (input.validation.minLength && val.length < input.validation.minLength) {
        setError(`Minimo ${input.validation.minLength} caracteres`);
        return false;
      }
      if (input.validation.maxLength && val.length > input.validation.maxLength) {
        setError(`Maximo ${input.validation.maxLength} caracteres`);
        return false;
      }
      if (input.validation.pattern) {
        const regex = new RegExp(input.validation.pattern);
        if (!regex.test(val)) {
          setError('Formato invalido');
          return false;
        }
      }
    }

    setError(null);
    return true;
  };

  const handleSubmit = () => {
    if (validate(value)) {
      onSubmit?.(value);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      {input.label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          {input.label}
          {input.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <input
          type={input.type || 'text'}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) validate(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={input.placeholder}
          className={cn(
            'flex-1 px-3 py-2 text-sm rounded-lg border',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            error
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-800',
            'text-gray-800 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500'
          )}
        />
        <button
          onClick={handleSubmit}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg',
            'bg-primary text-white hover:bg-primary/90',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'transition-colors'
          )}
        >
          Enviar
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
