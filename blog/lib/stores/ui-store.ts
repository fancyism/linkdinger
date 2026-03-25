"use client";

import { create } from "zustand";

type UiState = {
  isCommandPaletteOpen: boolean;
  isMobileNavOpen: boolean;
};

type UiActions = {
  setCommandPaletteOpen: (open: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setMobileNavOpen: (open: boolean) => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  reset: () => void;
};

const initialUiState: UiState = {
  isCommandPaletteOpen: false,
  isMobileNavOpen: false,
};

export const useUiStore = create<UiState & UiActions>((set) => ({
  ...initialUiState,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  toggleMobileNav: () =>
    set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  reset: () => set(initialUiState),
}));

export function resetUiStore() {
  useUiStore.getState().reset();
}
