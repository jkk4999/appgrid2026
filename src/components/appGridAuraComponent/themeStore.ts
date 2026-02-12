// src/stores/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // optional: survives page refresh

type ThemeState = {
  mode: 'light' | 'dark';
  toggleMode: () => void;
  setMode: (mode: 'light' | 'dark') => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    // ← removes this whole line if you don’t want persistence
    (set) => ({
      mode: 'light', // default
      toggleMode: () =>
        set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
      setMode: (mode) => set({ mode })
    }),
    { name: 'theme-storage' } // key in localStorage
  )
);
