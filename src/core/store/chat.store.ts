import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, MessageStatus } from '@core/types/message.types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  connectionStatus: ConnectionStatus;
  sessionToken: string | null;
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

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  connectionStatus: 'disconnected',
  sessionToken: null,
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
      partialize: (state) => ({
        messages: state.messages.slice(-50),
        sessionToken: state.sessionToken,
      }),
    }
  )
);
