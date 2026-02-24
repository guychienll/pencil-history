// T056: Timeline component

import React, { useRef, useEffect } from "react";
import { Commit } from "@/types/app";
import { CommitNode } from "./CommitNode";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";

export interface TimelineProps {
  commits: Commit[];
  currentIndex: number | null;
  onCommitSelect: (index: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
}

export function Timeline({
  commits,
  currentIndex,
  onCommitSelect,
  onLoadMore,
  hasMore = false,
  loading = false,
  className = "",
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const activeNodeRef = useRef<HTMLDivElement>(null);

  // Scroll to active commit when it changes
  useEffect(() => {
    if (activeNodeRef.current && timelineRef.current) {
      const timeline = timelineRef.current;
      const activeNode = activeNodeRef.current;

      const timelineRect = timeline.getBoundingClientRect();
      const activeRect = activeNode.getBoundingClientRect();

      // Check if active node is outside visible area
      if (
        activeRect.top < timelineRect.top ||
        activeRect.bottom > timelineRect.bottom
      ) {
        activeNode.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [currentIndex]);

  if (commits.length === 0 && !loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <p className="text-gray-500">尚無 commit 歷史</p>
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Timeline header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">Commit 時間軸</h2>
        <p className="text-sm text-gray-500">{commits.length} 個 commits</p>
      </div>

      {/* Timeline scroll area */}
      <div
        ref={timelineRef}
        className="flex-1 space-y-2 overflow-y-auto p-4"
      >
        {commits.map((commit, index) => (
          <div
            key={commit.sha}
            ref={index === currentIndex ? activeNodeRef : null}
          >
            <CommitNode
              commit={commit}
              isActive={index === currentIndex}
              onClick={() => onCommitSelect(index)}
            />
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="md" />
          </div>
        )}

        {/* Load more button */}
        {!loading && hasMore && onLoadMore && (
          <div className="flex justify-center py-4">
            <Button variant="outline" onClick={onLoadMore}>
              載入更多 commits
            </Button>
          </div>
        )}

        {/* End of timeline */}
        {!loading && !hasMore && commits.length > 0 && (
          <div className="flex justify-center py-4">
            <p className="text-sm text-gray-500">已載入所有 commits</p>
          </div>
        )}
      </div>
    </div>
  );
}
