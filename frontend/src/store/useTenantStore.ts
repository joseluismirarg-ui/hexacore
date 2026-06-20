import { create } from 'zustand';

interface TenantState {
  isReadOnly: boolean;
  isSuspended: boolean;
  setReadOnly: (value: boolean) => void;
  setSuspended: (value: boolean) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  isReadOnly: false,
  isSuspended: false,
  setReadOnly: (value) => set({ isReadOnly: value }),
  setSuspended: (value) => set({ isSuspended: value }),
}));
