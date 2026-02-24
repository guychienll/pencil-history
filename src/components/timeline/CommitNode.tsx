// T055: CommitNode component
// T093: Extended with comparison mode support

import React from "react";
import { Commit } from "@/types/app";

export interface CommitNodeProps {
  commit: Commit;
  isActive: boolean;
  onClick: () => void;
  className?: string;

  // Comparison mode props (T093)
  isComparisonMode?: boolean;
  isSelectedForDiff?: boolean;
  diffSelectionOrder?: 1 | 2; // 1 = first selected, 2 = second selected
  disabled?: boolean; // Cannot be selected in comparison mode
}

export function CommitNode({
  commit,
  isActive,
  onClick,
  className = "",
  isComparisonMode = false,
  isSelectedForDiff = false,
  diffSelectionOrder,
  disabled = false,
}: CommitNodeProps) {
  const shortSha = commit.sha.slice(0, 7);
  const commitDate = new Date(commit.date);
  const formattedDate = commitDate.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Truncate commit message to first line
  const firstLine = commit.message.split("\n")[0];
  const displayMessage = firstLine.length > 50 ? firstLine.slice(0, 50) + "..." : firstLine;

  // Determine styling based on mode
  const getBorderStyle = () => {
    if (disabled) {
      return "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed";
    }
    if (isSelectedForDiff && diffSelectionOrder === 1) {
      return "border-2 border-red-500 bg-red-50 shadow-md";
    }
    if (isSelectedForDiff && diffSelectionOrder === 2) {
      return "border-2 border-green-500 bg-green-50 shadow-md";
    }
    if (isActive && !isComparisonMode) {
      return "border-blue-500 bg-blue-50 shadow-md";
    }
    if (isComparisonMode) {
      return "border-gray-300 bg-white hover:border-purple-400 hover:shadow-sm ring-2 ring-purple-200 ring-offset-2";
    }
    return "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm";
  };

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative rounded-lg border p-3 transition-all
        ${getBorderStyle()}
        ${className}
      `}
    >
      {/* Commit SHA badge */}
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`
            rounded px-2 py-0.5 text-xs font-mono font-semibold
            ${isActive ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-900"}
          `}
        >
          {shortSha}
        </span>
        <span className="text-xs text-gray-700 font-medium">{formattedDate}</span>
      </div>

      {/* Commit message */}
      <p
        className={`
          mb-2 text-sm font-semibold
          ${isActive ? "text-gray-900" : "text-gray-900"}
        `}
      >
        {displayMessage}
      </p>

      {/* Author info */}
      <div className="flex items-center text-xs text-gray-700 font-medium">
        <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span>{commit.author.name}</span>
      </div>

      {/* Active indicator */}
      {isActive && !isComparisonMode && (
        <div className="absolute -left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-blue-500"></div>
      )}

      {/* Comparison mode selection badges (T093) */}
      {isSelectedForDiff && diffSelectionOrder && (
        <div className="absolute -top-2 -right-2 flex items-center justify-center">
          {diffSelectionOrder === 1 ? (
            <div className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-md">
              <span>Before</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-red-500">
                1
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs font-bold text-white shadow-md">
              <span>After</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-green-500">
                2
              </span>
            </div>
          )}
        </div>
      )}

      {/* Comparison mode hint */}
      {isComparisonMode && !isSelectedForDiff && !disabled && (
        <div className="absolute -top-2 -right-2">
          <div className="h-3 w-3 rounded-full bg-purple-400 ring-2 ring-white animate-pulse"></div>
        </div>
      )}

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-5 rounded-lg">
          <div className="text-xs text-gray-500 font-semibold px-2 py-1 bg-white rounded border border-gray-300 shadow-sm">
            🔒 較早的 commit
          </div>
        </div>
      )}
    </div>
  );
}
