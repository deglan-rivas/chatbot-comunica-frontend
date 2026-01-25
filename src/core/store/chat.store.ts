import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, MessageStatus } from '@core/types/message.types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  connectionStatus: ConnectionStatus;
  sessionToken: string | null;
  userId: string;
}

export interface ChatActions {
  addMessage: (message: Message) => void;
  updateMessageStatus: (id: string, status: MessageStatus) => void;
  updateMessageOptions: (id: string, selectedValue: unknown) => void;
  setTyping: (isTyping: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setSessionToken: (token: string) => void;
  clearMessages: () => void;
  reset: () => void;
}

export type ChatStore = ChatState & ChatActions;

function getOrCreateUserId(): string {
  const storageKey = 'chatbot-user-id';
  let userId = sessionStorage.getItem(storageKey);
  if (!userId) {
    userId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, userId);
  }
  return userId;
}

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  connectionStatus: 'disconnected',
  sessionToken: null,
  userId: getOrCreateUserId(),
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      ...initialState,

      addMessage: (message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      },

      updateMessageStatus: (id, status) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, status } : msg
          ),
        }));
      },

      updateMessageOptions: (id, selectedValue) => {
        set((state) => ({
          messages: state.messages.map((msg) => {
            if (msg.id !== id || !msg.options) return msg;
            return {
              ...msg,
              options: {
                ...msg.options,
                buttons: msg.options.buttons.map((btn) => ({
                  ...btn,
                  disabled: true,
                  variant: btn.value === selectedValue ? 'primary' : btn.variant,
                })),
              },
            };
          }),
        }));
      },

      setTyping: (isTyping) => set({ isTyping }),

      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

      setSessionToken: (sessionToken) => set({ sessionToken }),

      clearMessages: () => set({ messages: [] }),

      reset: () => set(initialState),
    }),
    {
      name: 'chatbot-storage',
      storage: {
        getItem: (name) => {
          const item = sessionStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        messages: state.messages.slice(-50),
        sessionToken: state.sessionToken,
        userId: state.userId,
      }),
    }
  )
);
