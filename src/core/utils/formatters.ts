export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(d, today)) {
    return 'Hoy';
  }

  if (isSameDay(d, yesterday)) {
    return 'Ayer';
  }

  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Convierte Markdown básico a HTML para mensajes del chat:
 * - **negrita**, __negrita__
 * - Listas con * o - al inicio de línea
 * - Enlaces [texto](url)
 * - Saltos de línea
 */
export function formatMarkdownContent(content: string): string {
  const applyBold = (s: string) =>
    s
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>');
  const applyLinks = (s: string) =>
    s.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" class="text-primary underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>'
    );

  const lines = content.split('\n');
  const parts: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      parts.push(
        '<ul class="list-disc list-inside space-y-1 my-2 pl-2 text-sm text-gray-800 dark:text-gray-100">' +
          listItems.map((html) => `<li>${html}</li>`).join('') +
          '</ul>'
      );
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trimStart();
    const listMatch = trimmed.match(/^[\*\-]\s+(.*)/s);
    const numberedMatch = trimmed.match(/^\d+\.\s+(.*)/s);

    if (listMatch) {
      const lineContent = (listMatch[1] ?? '').trim();
      listItems.push(applyLinks(applyBold(lineContent)));
      continue;
    }
    if (numberedMatch) {
      const lineContent = (numberedMatch[1] ?? '').trim();
      listItems.push(applyLinks(applyBold(lineContent)));
      continue;
    }

    flushList();
    if (trimmed.length > 0) {
      parts.push(applyLinks(applyBold(trimmed)));
    }
  }
  flushList();

  return parts.join('<br/>');
}
