/**
 * KeyboardShortcuts Component
 *
 * Displays keyboard shortcuts information for accessibility.
 * Can be toggled to show/hide detailed shortcut info.
 */

"use client";

import { useState } from "react";

export function KeyboardShortcuts() {
  const [isExpanded, setIsExpanded] = useState(false);

  const shortcuts = [
    { key: "←", description: "Previous commit" },
    { key: "→", description: "Next commit" },
    { key: "K", description: "Play/Pause playback" },
    { key: "Home", description: "Jump to first commit" },
    { key: "End", description: "Jump to last commit" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Show keyboard shortcuts"
        aria-expanded={isExpanded}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        Shortcuts
      </button>

      {isExpanded && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Keyboard Shortcuts</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close shortcuts"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 font-medium">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-900 bg-gray-100 border border-gray-300 rounded">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
