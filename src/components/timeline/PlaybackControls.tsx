/**
 * PlaybackControls Component
 *
 * Controls for auto-playing through commit history.
 *
 * Features:
 * - Play/Pause button
 * - Speed selector (0.5x, 1x, 1.5x, 2x)
 * - Visual feedback for playback state
 * - Keyboard shortcuts info
 */

"use client";

import { useCallback } from "react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
  className?: string;
}

const SPEED_OPTIONS = [
  { value: 500, label: "2x" },
  { value: 1000, label: "1x" },
  { value: 2000, label: "0.5x" },
  { value: 3000, label: "0.33x" },
];

export function PlaybackControls({
  isPlaying,
  speed,
  onPlay,
  onPause,
  onSpeedChange,
  disabled = false,
  className = "",
}: PlaybackControlsProps) {
  const handleToggle = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSpeed = parseInt(e.target.value, 10);
      onSpeedChange(newSpeed);
    },
    [onSpeedChange]
  );

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Play/Pause Button */}
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full
          transition-all duration-200
          ${
            disabled
              ? "bg-border cursor-not-allowed"
              : isPlaying
                ? "bg-warning hover:bg-warning-hover active:scale-95"
                : "bg-primary hover:bg-primary-hover active:scale-95"
          }
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface
          ${isPlaying ? "focus:ring-warning" : "focus:ring-primary"}
          shadow-md hover:shadow-lg
        `}
        aria-label={isPlaying ? "Pause playback" : "Play playback"}
        title={isPlaying ? "Pause (K)" : "Play (K)"}
      >
        {isPlaying ? (
          // Pause icon
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          // Play icon
          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Speed Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="playback-speed" className="text-sm font-medium text-foreground-secondary">
          Speed:
        </label>
        <div className="relative">
          <select
            id="playback-speed"
            value={speed}
            onChange={handleSpeedChange}
            disabled={disabled}
            className={`
              appearance-none pl-3 pr-10 py-1.5 text-sm rounded-md border-2 border-border
              text-foreground font-medium
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
              transition-all duration-200
              ${disabled ? "bg-surface-hover cursor-not-allowed" : "bg-surface cursor-pointer hover:border-border-secondary"}
            `}
            aria-label="Playback speed"
          >
            {SPEED_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="h-4 w-4 text-foreground-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Playback status indicator */}
      {isPlaying && (
        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span>Playing</span>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div
        className="ml-auto text-xs text-foreground-secondary font-medium hidden md:block"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-4">
          <span>
            <kbd
              className="px-2 py-1 font-semibold text-foreground bg-background-tertiary border border-border rounded"
              aria-label="K key"
            >
              K
            </kbd>{" "}
            Play/Pause
          </span>
          <span>
            <kbd
              className="px-2 py-1 font-semibold text-foreground bg-background-tertiary border border-border rounded"
              aria-label="Left arrow key"
            >
              ←
            </kbd>{" "}
            <kbd
              className="px-2 py-1 font-semibold text-foreground bg-background-tertiary border border-border rounded"
              aria-label="Right arrow key"
            >
              →
            </kbd>{" "}
            Navigate
          </span>
        </div>
      </div>
    </div>
  );
}
