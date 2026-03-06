import { create } from 'zustand';

type ToastType = 'success' | 'info' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  timestamp: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    const toast: Toast = {
      id,
      message,
      type,
      timestamp: Date.now(),
    };
    set((state) => ({ toasts: [...state.toasts, toast] }));

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
