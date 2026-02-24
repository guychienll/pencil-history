// T052: UI preferences store using Zustand

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface UIState {
  // Playback settings
  playbackSpeed: number; // 0.5x, 1x, 2x, etc.
  isPlaying: boolean;

  // View settings
  showCommitDetails: boolean;
  showTimeline: boolean;
  timelinePosition: "top" | "bottom" | "left" | "right";

  // Diff view settings
  diffMode: boolean;
  diffCommitA: string | null;
  diffCommitB: string | null;

  // Theme
  theme: "light" | "dark" | "system";

  // Actions
  setPlaybackSpeed: (speed: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setShowCommitDetails: (show: boolean) => void;
  toggleCommitDetails: () => void;
  setShowTimeline: (show: boolean) => void;
  toggleTimeline: () => void;
  setTimelinePosition: (position: "top" | "bottom" | "left" | "right") => void;
  setDiffMode: (enabled: boolean) => void;
  setDiffCommits: (commitA: string | null, commitB: string | null) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  reset: () => void;
}

const initialState = {
  playbackSpeed: 1,
  isPlaying: false,
  showCommitDetails: true,
  showTimeline: true,
  timelinePosition: "bottom" as const,
  diffMode: false,
  diffCommitA: null,
  diffCommitB: null,
  theme: "system" as const,
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPlaybackSpeed: (speed) => {
        // Clamp speed between 0.25x and 4x
        const clampedSpeed = Math.max(0.25, Math.min(4, speed));
        set({ playbackSpeed: clampedSpeed });
      },

      setIsPlaying: (playing) => {
        set({ isPlaying: playing });
      },

      togglePlaying: () => {
        set({ isPlaying: !get().isPlaying });
      },

      setShowCommitDetails: (show) => {
        set({ showCommitDetails: show });
      },

      toggleCommitDetails: () => {
        set({ showCommitDetails: !get().showCommitDetails });
      },

      setShowTimeline: (show) => {
        set({ showTimeline: show });
      },

      toggleTimeline: () => {
        set({ showTimeline: !get().showTimeline });
      },

      setTimelinePosition: (position) => {
        set({ timelinePosition: position });
      },

      setDiffMode: (enabled) => {
        set({ diffMode: enabled });
      },

      setDiffCommits: (commitA, commitB) => {
        set({
          diffCommitA: commitA,
          diffCommitB: commitB,
          diffMode: commitA !== null && commitB !== null,
        });
      },

      setTheme: (theme) => {
        set({ theme });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "pencilhistory-ui-preferences",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
