/**
 * usePlayback Hook
 *
 * Provides auto-playback functionality for commit history.
 * Automatically advances through commits at a specified speed.
 *
 * Features:
 * - Play/Pause controls
 * - Configurable playback speed
 * - Auto-pause at end of history
 * - Toggle play/pause
 */

import { useEffect, useState, useRef, useCallback } from "react";
import type { Commit } from "@/types/app";

interface UsePlaybackOptions {
  commits: Commit[];
  currentIndex: number;
  onNavigate: (commit: Commit, index: number) => void;
  speed?: number; // milliseconds per commit (default: 2000ms = 2s)
  autoStop?: boolean; // auto-stop at last commit (default: true)
}

interface UsePlaybackReturn {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
}

/**
 * Custom hook for auto-playback through commits
 */
export function usePlayback({
  commits,
  currentIndex: externalIndex,
  onNavigate,
  speed: initialSpeed = 2000,
  autoStop = true,
}: UsePlaybackOptions): UsePlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(externalIndex);

  // Update ref when external index changes
  useEffect(() => {
    currentIndexRef.current = externalIndex;
  }, [externalIndex]);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Auto-advance logic
  const advance = useCallback(() => {
    const currentIndex = currentIndexRef.current;
    const nextIndex = currentIndex + 1;

    // Check if we've reached the end
    if (nextIndex >= commits.length) {
      if (autoStop) {
        setIsPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      return;
    }

    // Navigate to next commit
    currentIndexRef.current = nextIndex;
    onNavigate(commits[nextIndex], nextIndex);
  }, [commits, onNavigate, autoStop]);

  // Play/Pause/Toggle functions
  const play = useCallback(() => {
    // Don't start if already at the end
    if (currentIndexRef.current >= commits.length - 1) {
      return;
    }

    setIsPlaying(true);

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start new interval
    intervalRef.current = setInterval(advance, speed);
  }, [commits.length, speed, advance]);

  const pause = useCallback(() => {
    setIsPlaying(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Update interval when speed changes during playback
  useEffect(() => {
    if (isPlaying && intervalRef.current) {
      // Restart interval with new speed
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(advance, speed);
    }
  }, [speed, isPlaying, advance]);

  // Manage playback lifecycle
  useEffect(() => {
    if (isPlaying) {
      // Start interval
      if (!intervalRef.current) {
        intervalRef.current = setInterval(advance, speed);
      }
    } else {
      // Stop interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, advance, speed]);

  return {
    isPlaying,
    play,
    pause,
    toggle,
    speed,
    setSpeed,
  };
}
