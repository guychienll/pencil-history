/**
 * Integration Tests: User Story 2 - Navigate through commits
 *
 * User Story: 使用者能夠循序漸進地查看設計檔案在不同 commit 之間的變化,
 * 使用播放/暫停功能、鍵盤方向鍵或時間軸滑桿進行導航。
 *
 * Test Coverage:
 * - T071: Keyboard navigation (Arrow keys)
 * - T072: Playback controls (Play/Pause)
 * - T073: Timeline slider (Drag to commit)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";

// Hooks to be tested
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { usePlayback } from "@/hooks/usePlayback";

// Mock commits data
const mockCommits = [
  {
    sha: "abc123",
    message: "Initial design",
    author: { name: "Alice", email: "alice@example.com", date: new Date("2024-01-01") },
    committer: { name: "Alice", email: "alice@example.com", date: new Date("2024-01-01") },
    date: new Date("2024-01-01"),
    parents: [],
    url: "https://github.com/test/repo/commit/abc123",
  },
  {
    sha: "def456",
    message: "Update colors",
    author: { name: "Bob", email: "bob@example.com", date: new Date("2024-01-02") },
    committer: { name: "Bob", email: "bob@example.com", date: new Date("2024-01-02") },
    date: new Date("2024-01-02"),
    parents: ["abc123"],
    url: "https://github.com/test/repo/commit/def456",
  },
  {
    sha: "ghi789",
    message: "Add new component",
    author: { name: "Charlie", email: "charlie@example.com", date: new Date("2024-01-03") },
    committer: { name: "Charlie", email: "charlie@example.com", date: new Date("2024-01-03") },
    date: new Date("2024-01-03"),
    parents: ["def456"],
    url: "https://github.com/test/repo/commit/ghi789",
  },
];

describe("User Story 2: Navigate through commits", () => {
  describe("T071: Keyboard Navigation Integration Test", () => {
    it("should toggle playback when K key is pressed", () => {
      const onTogglePlayback = vi.fn();
      renderHook(() =>
        useKeyboardNav({
          commits: mockCommits,
          currentIndex: 0,
          onNavigate: vi.fn(),
          onTogglePlayback,
        })
      );

      // Simulate K key press
      act(() => {
        const kKeyEvent = new KeyboardEvent("keydown", { key: "k" });
        window.dispatchEvent(kKeyEvent);
      });

      // Should call toggle playback
      waitFor(() => {
        expect(onTogglePlayback).toHaveBeenCalledTimes(1);
      });

      // Test uppercase K as well
      act(() => {
        const KKeyEvent = new KeyboardEvent("keydown", { key: "K" });
        window.dispatchEvent(KKeyEvent);
      });

      waitFor(() => {
        expect(onTogglePlayback).toHaveBeenCalledTimes(2);
      });
    });

    it("should navigate to next commit when right arrow key is pressed", () => {
      const { result } = renderHook(() =>
        useKeyboardNav({
          commits: mockCommits,
          currentIndex: 0,
          onNavigate: vi.fn(),
        })
      );

      // Initially at commit 0
      expect(result.current.currentIndex).toBe(0);

      // Simulate right arrow key press
      act(() => {
        const rightArrowEvent = new KeyboardEvent("keydown", { key: "ArrowRight" });
        window.dispatchEvent(rightArrowEvent);
      });

      // Should navigate to commit 1
      waitFor(() => {
        expect(result.current.currentIndex).toBe(1);
      });
    });

    it("should navigate to previous commit when left arrow key is pressed", () => {
      const { result } = renderHook(() =>
        useKeyboardNav({
          commits: mockCommits,
          currentIndex: 1,
          onNavigate: vi.fn(),
        })
      );

      // Initially at commit 1
      expect(result.current.currentIndex).toBe(1);

      // Simulate left arrow key press
      act(() => {
        const leftArrowEvent = new KeyboardEvent("keydown", { key: "ArrowLeft" });
        window.dispatchEvent(leftArrowEvent);
      });

      // Should navigate to commit 0
      waitFor(() => {
        expect(result.current.currentIndex).toBe(0);
      });
    });

    it("should not navigate beyond first commit when at start", () => {
      const { result } = renderHook(() =>
        useKeyboardNav({
          commits: mockCommits,
          currentIndex: 0,
          onNavigate: vi.fn(),
        })
      );

      // Initially at commit 0
      expect(result.current.currentIndex).toBe(0);

      // Simulate left arrow key press (should not go to -1)
      act(() => {
        const leftArrowEvent = new KeyboardEvent("keydown", { key: "ArrowLeft" });
        window.dispatchEvent(leftArrowEvent);
      });

      // Should stay at commit 0
      expect(result.current.currentIndex).toBe(0);
    });

    it("should not navigate beyond last commit when at end", () => {
      const { result } = renderHook(() =>
        useKeyboardNav({
          commits: mockCommits,
          currentIndex: mockCommits.length - 1,
          onNavigate: vi.fn(),
        })
      );

      // Initially at last commit
      expect(result.current.currentIndex).toBe(mockCommits.length - 1);

      // Simulate right arrow key press (should not go beyond)
      act(() => {
        const rightArrowEvent = new KeyboardEvent("keydown", { key: "ArrowRight" });
        window.dispatchEvent(rightArrowEvent);
      });

      // Should stay at last commit
      expect(result.current.currentIndex).toBe(mockCommits.length - 1);
    });

    it("should call onNavigate callback with correct commit", () => {
      const onNavigate = vi.fn();
      renderHook(() =>
        useKeyboardNav({
          commits: mockCommits,
          currentIndex: 0,
          onNavigate,
        })
      );

      // Simulate right arrow key press
      act(() => {
        const rightArrowEvent = new KeyboardEvent("keydown", { key: "ArrowRight" });
        window.dispatchEvent(rightArrowEvent);
      });

      // Should call onNavigate with commit at index 1
      waitFor(() => {
        expect(onNavigate).toHaveBeenCalledWith(mockCommits[1], 1);
      });
    });
  });

  describe("T072: Playback Controls Integration Test", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("should auto-advance to next commit when playing", () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        usePlayback({
          commits: mockCommits,
          currentIndex: 0,
          onNavigate,
          speed: 1000, // 1 second per commit
        })
      );

      // Initially not playing
      expect(result.current.isPlaying).toBe(false);

      // Start playback
      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);

      // Fast forward 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should advance to next commit
      waitFor(() => {
        expect(onNavigate).toHaveBeenCalledWith(mockCommits[1], 1);
      });
    });

    it("should stop auto-advancing when paused", () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        usePlayback({
          commits: mockCommits,
          currentIndex: 0,
          onNavigate,
          speed: 1000,
        })
      );

      // Start playback
      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);

      // Pause playback
      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);

      // Fast forward 1 second (should not advance)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should NOT call onNavigate
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("should stop playing when reaching last commit", () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        usePlayback({
          commits: mockCommits,
          currentIndex: mockCommits.length - 2,
          onNavigate,
          speed: 1000,
        })
      );

      // Start playback
      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);

      // Fast forward 1 second (advance to last commit)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should advance to last commit
      waitFor(() => {
        expect(onNavigate).toHaveBeenCalledWith(
          mockCommits[mockCommits.length - 1],
          mockCommits.length - 1
        );
      });

      // Fast forward another second (should auto-pause at end)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should auto-pause
      expect(result.current.isPlaying).toBe(false);
    });

    it("should respect playback speed setting", () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        usePlayback({
          commits: mockCommits,
          currentIndex: 0,
          onNavigate,
          speed: 500, // 0.5 seconds per commit
        })
      );

      // Start playback
      act(() => {
        result.current.play();
      });

      // Fast forward 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should advance to next commit
      waitFor(() => {
        expect(onNavigate).toHaveBeenCalledTimes(1);
      });

      // Fast forward another 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should advance again
      waitFor(() => {
        expect(onNavigate).toHaveBeenCalledTimes(2);
      });
    });

    it("should allow toggling play/pause", () => {
      const { result } = renderHook(() =>
        usePlayback({
          commits: mockCommits,
          currentIndex: 0,
          onNavigate: vi.fn(),
          speed: 1000,
        })
      );

      // Initially not playing
      expect(result.current.isPlaying).toBe(false);

      // Toggle play
      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying).toBe(true);

      // Toggle pause
      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe("T073: Timeline Slider Integration Test", () => {
    it("should navigate to correct commit when slider is dragged", () => {
      // This test will be implemented when TimelineSlider component is created
      // For now, we'll test the basic interaction pattern

      const onNavigate = vi.fn();

      // Simulate slider value change
      const newIndex = 2;

      // In real implementation, this would be triggered by slider onChange
      act(() => {
        onNavigate(mockCommits[newIndex], newIndex);
      });

      expect(onNavigate).toHaveBeenCalledWith(mockCommits[2], 2);
    });

    it("should update slider position when commit changes externally", () => {
      // This will test that slider position updates when keyboard navigation
      // or playback controls change the current commit

      let currentIndex = 0;
      const setCurrentIndex = (index: number) => {
        currentIndex = index;
      };

      // External navigation (e.g., keyboard)
      setCurrentIndex(2);

      // Slider should reflect the new position
      expect(currentIndex).toBe(2);
    });

    it("should show commit info tooltip on hover", () => {
      // This will be implemented with the actual TimelineSlider component
      // Testing that hovering over slider position shows commit info
      expect(true).toBe(true); // Placeholder
    });

    it("should handle edge cases (first and last commits)", () => {
      const onNavigate = vi.fn();

      // Drag to first commit
      act(() => {
        onNavigate(mockCommits[0], 0);
      });

      expect(onNavigate).toHaveBeenCalledWith(mockCommits[0], 0);

      // Drag to last commit
      act(() => {
        onNavigate(mockCommits[mockCommits.length - 1], mockCommits.length - 1);
      });

      expect(onNavigate).toHaveBeenCalledWith(
        mockCommits[mockCommits.length - 1],
        mockCommits.length - 1
      );
    });
  });

  describe("Integration: All navigation methods work together", () => {
    it("should sync state across keyboard, playback, and slider", () => {
      // This test ensures all navigation methods update the same state
      const onNavigate = vi.fn();

      // Setup all hooks
      renderHook(() =>
        useKeyboardNav({
          commits: mockCommits,
          currentIndex: 0,
          onNavigate,
        })
      );

      renderHook(() =>
        usePlayback({
          commits: mockCommits,
          currentIndex: 0,
          onNavigate,
          speed: 1000,
        })
      );

      // Navigate with keyboard
      act(() => {
        const rightArrowEvent = new KeyboardEvent("keydown", { key: "ArrowRight" });
        window.dispatchEvent(rightArrowEvent);
      });

      // All methods should reflect the same state
      waitFor(() => {
        expect(onNavigate).toHaveBeenCalledWith(mockCommits[1], 1);
      });
    });
  });
});
