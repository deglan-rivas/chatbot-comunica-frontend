import { create } from 'zustand';

export interface UIState {
  isOpen: boolean;
  isMinimized: boolean;
  hasUnread: boolean;
  inputFocused: boolean;
  activeModal: string | null;
}

export interface UIActions {
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setIsMinimized: (isMinimized: boolean) => void;
  setHasUnread: (hasUnread: boolean) => void;
  setInputFocused: (focused: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  reset: () => void;
}

export type UIStore = UIState & UIActions;

const initialState: UIState = {
  isOpen: false,
  isMinimized: false,
  hasUnread: false,
  inputFocused: false,
  activeModal: null,
};

export const useUIStore = create<UIStore>((set) => ({
  ...initialState,

  setIsOpen: (isOpen) => set({ isOpen, hasUnread: isOpen ? false : undefined }),

  toggleOpen: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      hasUnread: !state.isOpen ? false : state.hasUnread,
    })),

  setIsMinimized: (isMinimized) => set({ isMinimized }),

  setHasUnread: (hasUnread) => set({ hasUnread }),

  setInputFocused: (inputFocused) => set({ inputFocused }),

  setActiveModal: (activeModal) => set({ activeModal }),

  reset: () => set(initialState),
}));
