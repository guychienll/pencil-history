// T055: CommitNode component

import React from "react";
import { Commit } from "@/types/app";

export interface CommitNodeProps {
  commit: Commit;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export function CommitNode({ commit, isActive, onClick, className = "" }: CommitNodeProps) {
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

  return (
    <div
      onClick={onClick}
      className={`
        group relative cursor-pointer rounded-lg border p-3 transition-all
        ${
          isActive
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
        }
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
      {isActive && (
        <div className="absolute -left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-blue-500"></div>
      )}
    </div>
  );
}
