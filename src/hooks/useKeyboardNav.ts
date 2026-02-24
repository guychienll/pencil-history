/**
 * useKeyboardNav Hook
 *
 * Provides keyboard navigation functionality for commit history.
 * Supports arrow keys to navigate between commits.
 *
 * Features:
 * - Left arrow: Previous commit
 * - Right arrow: Next commit
 * - Boundary checking (don't go beyond first/last commit)
 * - Callback on navigation
 */

import { useEffect, useState, useCallback } from "react";
import type { Commit } from "@/types/app";

interface UseKeyboardNavOptions {
  commits: Commit[];
  currentIndex: number;
  onNavigate: (commit: Commit, index: number) => void;
  onTogglePlayback?: () => void;
  enabled?: boolean;
}

interface UseKeyboardNavReturn {
  currentIndex: number;
  goToNext: () => void;
  goToPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

/**
 * Custom hook for keyboard navigation through commits
 */
export function useKeyboardNav({
  commits,
  currentIndex: externalIndex,
  onNavigate,
  onTogglePlayback,
  enabled = true,
}: UseKeyboardNavOptions): UseKeyboardNavReturn {
  const [currentIndex, setCurrentIndex] = useState(externalIndex);

  // Sync internal state with external prop
  useEffect(() => {
    setCurrentIndex(externalIndex);
  }, [externalIndex]);

  // Boundary checks
  const canGoNext = currentIndex < commits.length - 1;
  const canGoPrevious = currentIndex > 0;

  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentIndex < commits.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      onNavigate(commits[nextIndex], nextIndex);
    }
  }, [currentIndex, commits, onNavigate]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      onNavigate(commits[prevIndex], prevIndex);
    }
  }, [currentIndex, commits, onNavigate]);

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          goToNext();
          break;
        case "ArrowLeft":
          event.preventDefault();
          goToPrevious();
          break;
        case "k":
        case "K":
          event.preventDefault();
          if (onTogglePlayback) {
            onTogglePlayback();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, goToNext, goToPrevious, onTogglePlayback]);

  return {
    currentIndex,
    goToNext,
    goToPrevious,
    canGoNext,
    canGoPrevious,
  };
}
