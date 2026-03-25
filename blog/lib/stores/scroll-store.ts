"use client";

import { create } from "zustand";

type ScrollState = {
  scrollY: number;
  scrollPercent: number;
  isScrollToTopVisible: boolean;
};

type ScrollActions = {
  syncFromDom: () => void;
  setScrollMetrics: (metrics: Partial<ScrollState>) => void;
  reset: () => void;
};

const initialScrollState: ScrollState = {
  scrollY: 0,
  scrollPercent: 0,
  isScrollToTopVisible: false,
};

function getDomScrollMetrics(): ScrollState {
  if (typeof window === "undefined") {
    return initialScrollState;
  }

  const scrollY = window.scrollY;
  const docHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent =
    docHeight > 0
      ? Math.min(100, Math.round((scrollY / docHeight) * 100))
      : 0;

  return {
    scrollY,
    scrollPercent,
    isScrollToTopVisible: scrollY > 400,
  };
}

export const useScrollStore = create<ScrollState & ScrollActions>((set) => ({
  ...initialScrollState,
  syncFromDom: () => set(getDomScrollMetrics()),
  setScrollMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),
  reset: () => set(initialScrollState),
}));

export function resetScrollStore() {
  useScrollStore.getState().reset();
}
