/**
 * TimelineSlider Component
 *
 * A draggable slider for navigating through commit history.
 *
 * Features:
 * - Draggable thumb to jump to any commit
 * - Visual position indicator
 * - Hover tooltip showing commit info
 * - Keyboard accessible
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Commit } from "@/types/app";

interface TimelineSliderProps {
  commits: Commit[];
  currentIndex: number;
  onNavigate: (commit: Commit, index: number) => void;
  className?: string;
}

export function TimelineSlider({
  commits,
  currentIndex,
  onNavigate,
  className = "",
}: TimelineSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const totalCommits = commits.length;
  const progressPercent = totalCommits > 1 ? (currentIndex / (totalCommits - 1)) * 100 : 0;

  // Calculate index from mouse position
  const getIndexFromPosition = useCallback(
    (clientX: number): number => {
      if (!sliderRef.current) return currentIndex;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const index = Math.round(percent * (totalCommits - 1));

      return Math.max(0, Math.min(totalCommits - 1, index));
    },
    [currentIndex, totalCommits]
  );

  // Handle mouse down (start dragging)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      const index = getIndexFromPosition(e.clientX);
      if (index !== currentIndex) {
        onNavigate(commits[index], index);
      }
    },
    [getIndexFromPosition, currentIndex, commits, onNavigate]
  );

  // Handle mouse move (dragging)
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) {
        // Show hover tooltip
        const index = getIndexFromPosition(e.clientX);
        setHoverIndex(index);
        return;
      }

      const index = getIndexFromPosition(e.clientX);
      if (index !== currentIndex) {
        onNavigate(commits[index], index);
      }
    },
    [isDragging, getIndexFromPosition, currentIndex, commits, onNavigate]
  );

  // Handle mouse up (stop dragging)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle mouse leave (clear hover)
  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  // Attach global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newIndex = currentIndex;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          newIndex = Math.min(totalCommits - 1, currentIndex + 1);
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = totalCommits - 1;
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex) {
        onNavigate(commits[newIndex], newIndex);
      }
    },
    [currentIndex, totalCommits, commits, onNavigate]
  );

  const currentCommit = commits[currentIndex];
  const hoverCommit = hoverIndex !== null ? commits[hoverIndex] : null;

  return (
    <div className={`relative ${className}`}>
      {/* Tooltip */}
      {hoverCommit && hoverIndex !== null && !isDragging && (
        <div
          className="absolute bottom-full mb-2 left-0 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none"
          style={{
            left: `${(hoverIndex / (totalCommits - 1)) * 100}%`,
          }}
        >
          <div className="font-semibold">{hoverCommit.message}</div>
          <div className="text-gray-400">
            {hoverCommit.author.name} • {new Date(hoverCommit.date).toLocaleDateString()}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}

      {/* Slider track */}
      <div
        ref={sliderRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer group"
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => handleMouseMove(e.nativeEvent)}
        onMouseLeave={handleMouseLeave}
        role="slider"
        aria-label="Timeline slider"
        aria-valuemin={0}
        aria-valuemax={totalCommits - 1}
        aria-valuenow={currentIndex}
        aria-valuetext={`Commit ${currentIndex + 1} of ${totalCommits}: ${currentCommit.message}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Progress bar */}
        <div
          className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Commit markers */}
        {commits.map((commit, index) => (
          <div
            key={commit.sha}
            className="absolute w-1.5 h-1.5 bg-gray-400 rounded-full pointer-events-none"
            style={{
              left: `${(index / (totalCommits - 1)) * 100}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
            title={commit.message}
          />
        ))}

        {/* Thumb */}
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-grab transition-all duration-200 ${
            isDragging ? "scale-125 cursor-grabbing" : "hover:scale-110"
          }`}
          style={{
            left: `${progressPercent}%`,
          }}
        />
      </div>

      {/* Current commit info */}
      <div className="mt-4 text-sm text-gray-700 font-medium">
        <div className="flex items-center justify-between">
          <span>
            Commit {currentIndex + 1} of {totalCommits}
          </span>
          <span className="text-gray-600">{new Date(currentCommit.date).toLocaleDateString()}</span>
        </div>
        <div className="mt-1 font-semibold text-gray-900">{currentCommit.message}</div>
        <div className="text-gray-700 font-medium">{currentCommit.author.name}</div>
      </div>
    </div>
  );
}
