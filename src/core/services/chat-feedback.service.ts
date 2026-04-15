type Channel = 'ws' | 'rest';

export interface ChatFeedbackPayload {
  session_id: string;
  is_helpful: boolean;
  reason?: string | null;
  channel?: Channel | null;
  message_id?: string | null;
}

export interface ChatResolutionPayload {
  session_id: string;
  resolved: boolean;
  reason?: string | null;
  channel?: Channel | null;
}

export type SessionEndReason =
  | 'USER_GOODBYE'
  | 'INACTIVITY_TIMEOUT'
  | 'MAX_SESSION_AGE';

export interface EndChatSessionPayload {
  session_id: string;
  reason: SessionEndReason;
  resolved?: boolean | null;
  resolution_reason?: string | null;
  channel?: Channel | null;
}

interface QueuedEvent {
  type: 'feedback' | 'resolution' | 'session_end';
  endpoint: '/chat/feedback' | '/chat/resolution' | '/session/end';
  payload: ChatFeedbackPayload | ChatResolutionPayload | EndChatSessionPayload;
  dedupeKey: string;
  attempt: number;
  nextTryAt: number;
}

const QUEUE_STORAGE_KEY = 'chatbot-analytics-queue';
const FEEDBACK_SENT_PREFIX = 'chatbot-feedback-sent:';
const RESOLUTION_SENT_PREFIX = 'chatbot-resolution-sent:';
const SESSION_END_SENT_PREFIX = 'chatbot-session-end-sent:';
const REQUEST_TIMEOUT_MS = 4000;
const RETRY_DELAYS_MS = [2000, 5000] as const;

let isQueueFlushing = false;
let onlineListenerAttached = false;

function withTimeout(signalTimeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), signalTimeoutMs);
  return controller.signal;
}

function getSentKey(prefix: string, key: string): string {
  return `${prefix}${key}`;
}

function markSent(prefix: string, key: string): void {
  localStorage.setItem(getSentKey(prefix, key), '1');
}

function wasSent(prefix: string, key: string): boolean {
  return localStorage.getItem(getSentKey(prefix, key)) === '1';
}

function readQueue(): QueuedEvent[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedEvent[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage failures; UX should not break.
  }
}

function getApiBase(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/+$/, '');
}

function shouldQueueRetry(statusCode: number | null): boolean {
  return statusCode === null || statusCode === 503;
}

async function postJson(
  apiBaseUrl: string,
  endpoint: '/chat/feedback' | '/chat/resolution' | '/session/end',
  payload: ChatFeedbackPayload | ChatResolutionPayload | EndChatSessionPayload
): Promise<{ ok: boolean; statusCode: number | null }> {
  try {
    const response = await fetch(`${getApiBase(apiBaseUrl)}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: withTimeout(REQUEST_TIMEOUT_MS),
    });
    return { ok: response.ok, statusCode: response.status };
  } catch {
    return { ok: false, statusCode: null };
  }
}

function enqueue(event: QueuedEvent): void {
  const queue = readQueue();
  if (queue.some((item) => item.dedupeKey === event.dedupeKey && item.type === event.type)) {
    return;
  }
  queue.push(event);
  writeQueue(queue);
}

function attachOnlineListener(apiBaseUrl: string): void {
  if (onlineListenerAttached) return;
  onlineListenerAttached = true;
  window.addEventListener('online', () => {
    void flushQueue(apiBaseUrl);
  });
}

async function flushQueue(apiBaseUrl: string): Promise<void> {
  if (isQueueFlushing) return;
  isQueueFlushing = true;

  try {
    const now = Date.now();
    const queue = readQueue();
    const remaining: QueuedEvent[] = [];

    for (const item of queue) {
      if (item.nextTryAt > now) {
        remaining.push(item);
        continue;
      }

      const sentPrefix =
        item.type === 'feedback'
          ? FEEDBACK_SENT_PREFIX
          : item.type === 'resolution'
            ? RESOLUTION_SENT_PREFIX
            : SESSION_END_SENT_PREFIX;
      if (wasSent(sentPrefix, item.dedupeKey)) {
        continue;
      }

      const result = await postJson(apiBaseUrl, item.endpoint, item.payload);
      if (result.ok) {
        markSent(sentPrefix, item.dedupeKey);
        continue;
      }

      if (item.attempt >= RETRY_DELAYS_MS.length || !shouldQueueRetry(result.statusCode)) {
        continue;
      }

      const nextDelay = RETRY_DELAYS_MS[item.attempt];
      if (nextDelay == null) {
        continue;
      }
      remaining.push({
        ...item,
        attempt: item.attempt + 1,
        nextTryAt: Date.now() + nextDelay,
      });
    }

    writeQueue(remaining);
  } finally {
    isQueueFlushing = false;
  }
}

export async function sendChatFeedback(
  apiBaseUrl: string,
  payload: ChatFeedbackPayload
): Promise<boolean> {
  attachOnlineListener(apiBaseUrl);

  const dedupeKey = `${payload.session_id}:${payload.message_id ?? 'unknown'}:feedback`;
  if (wasSent(FEEDBACK_SENT_PREFIX, dedupeKey)) return true;

  const result = await postJson(apiBaseUrl, '/chat/feedback', payload);
  if (result.ok) {
    markSent(FEEDBACK_SENT_PREFIX, dedupeKey);
    return true;
  }

  if (shouldQueueRetry(result.statusCode)) {
    enqueue({
      type: 'feedback',
      endpoint: '/chat/feedback',
      payload,
      dedupeKey,
      attempt: 0,
      nextTryAt: Date.now() + (RETRY_DELAYS_MS[0] ?? 2000),
    });
    setTimeout(() => void flushQueue(apiBaseUrl), RETRY_DELAYS_MS[0] ?? 2000);
    return true;
  }

  return false;
}

export async function sendChatResolution(
  apiBaseUrl: string,
  payload: ChatResolutionPayload
): Promise<boolean> {
  attachOnlineListener(apiBaseUrl);

  const dedupeKey = `${payload.session_id}:resolution`;
  if (wasSent(RESOLUTION_SENT_PREFIX, dedupeKey)) return true;

  const result = await postJson(apiBaseUrl, '/chat/resolution', payload);
  if (result.ok) {
    markSent(RESOLUTION_SENT_PREFIX, dedupeKey);
    return true;
  }

  if (shouldQueueRetry(result.statusCode)) {
    enqueue({
      type: 'resolution',
      endpoint: '/chat/resolution',
      payload,
      dedupeKey,
      attempt: 0,
      nextTryAt: Date.now() + (RETRY_DELAYS_MS[0] ?? 2000),
    });
    setTimeout(() => void flushQueue(apiBaseUrl), RETRY_DELAYS_MS[0] ?? 2000);
    return true;
  }

  return false;
}

export async function endChatSession(
  apiBaseUrl: string,
  payload: EndChatSessionPayload
): Promise<boolean> {
  attachOnlineListener(apiBaseUrl);

  const dedupeKey = `${payload.session_id}:session_end`;
  if (wasSent(SESSION_END_SENT_PREFIX, dedupeKey)) return true;

  const result = await postJson(apiBaseUrl, '/session/end', payload);
  if (result.ok) {
    markSent(SESSION_END_SENT_PREFIX, dedupeKey);
    return true;
  }

  if (shouldQueueRetry(result.statusCode)) {
    enqueue({
      type: 'session_end',
      endpoint: '/session/end',
      payload,
      dedupeKey,
      attempt: 0,
      nextTryAt: Date.now() + (RETRY_DELAYS_MS[0] ?? 2000),
    });
    setTimeout(() => void flushQueue(apiBaseUrl), RETRY_DELAYS_MS[0] ?? 2000);
    return true;
  }

  return false;
}
