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
      return "border-border bg-surface-hover opacity-50 cursor-not-allowed";
    }
    if (isSelectedForDiff && diffSelectionOrder === 1) {
      return "border-2 border-error bg-error-light shadow-md";
    }
    if (isSelectedForDiff && diffSelectionOrder === 2) {
      return "border-2 border-success bg-success-light shadow-md";
    }
    if (isActive && !isComparisonMode) {
      return "border-2 border-primary bg-primary-light shadow-md";
    }
    if (isComparisonMode) {
      return "border-2 border-border bg-surface hover:border-primary hover:shadow cursor-pointer";
    }
    return "border border-border bg-surface hover:border-primary/50 hover:shadow-sm cursor-pointer";
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
            rounded-md px-2 py-1 text-xs font-mono font-semibold transition-colors duration-200
            ${isActive ? "bg-primary/20 text-primary" : "bg-background-tertiary text-foreground-secondary"}
          `}
        >
          {shortSha}
        </span>
        <span className="text-xs text-foreground-tertiary font-medium">{formattedDate}</span>
      </div>

      {/* Commit message */}
      <p
        className={`
          mb-2 text-sm font-semibold
          ${isActive ? "text-foreground" : "text-foreground"}
        `}
      >
        {displayMessage}
      </p>

      {/* Author info */}
      <div className="flex items-center text-xs text-foreground-secondary font-medium">
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
        <div className="absolute -left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-primary shadow-sm"></div>
      )}

      {/* Comparison mode selection badges (T093) */}
      {isSelectedForDiff && diffSelectionOrder && (
        <div className="absolute -top-2 -right-2 flex items-center justify-center">
          {diffSelectionOrder === 1 ? (
            <div className="flex items-center gap-1 rounded-full bg-error px-2 py-1 text-xs font-bold text-white shadow-lg">
              <span>Before</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-error">
                1
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-success px-2 py-1 text-xs font-bold text-white shadow-lg">
              <span>After</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-success">
                2
              </span>
            </div>
          )}
        </div>
      )}

      {/* Comparison mode hint */}
      {isComparisonMode && !isSelectedForDiff && !disabled && (
        <div className="absolute -top-2 -right-2">
          <div className="h-3 w-3 rounded-full bg-primary ring-2 ring-surface animate-pulse shadow-sm"></div>
        </div>
      )}

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 rounded-lg backdrop-blur-[1px]">
          <div className="text-xs text-foreground-muted font-semibold px-2 py-1 bg-surface rounded-md border border-border shadow-sm">
            🔒 較早的 commit
          </div>
        </div>
      )}
    </div>
  );
}
