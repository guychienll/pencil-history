// T056: Timeline component
// T093: Extended with comparison mode support

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

  // Comparison mode props (T093)
  isComparisonMode?: boolean;
  selectedCommitsForDiff?: [string, string] | null;
}

export function Timeline({
  commits,
  currentIndex,
  onCommitSelect,
  onLoadMore,
  hasMore = false,
  loading = false,
  className = "",
  isComparisonMode = false,
  selectedCommitsForDiff = null,
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
      if (activeRect.top < timelineRect.top || activeRect.bottom > timelineRect.bottom) {
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
        {isComparisonMode ? (
          <div className="mt-2 rounded-md bg-purple-50 border border-purple-200 px-3 py-2">
            <p className="text-sm font-semibold text-purple-900 flex items-center gap-2">
              🔍 比較模式
              {selectedCommitsForDiff && selectedCommitsForDiff[0] && selectedCommitsForDiff[1] && (
                <span className="text-xs font-normal text-green-700">✓ 已選擇完成</span>
              )}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              {!selectedCommitsForDiff || !selectedCommitsForDiff[0]
                ? "步驟 1/2：選擇第一個 commit（Before）"
                : !selectedCommitsForDiff[1]
                  ? "步驟 2/2：選擇第二個 commit（After）- 較早的 commits 已被鎖定"
                  : "✓ 已選擇完成！點擊上方「View Diff」查看差異"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-700 font-medium">{commits.length} 個 commits</p>
        )}
      </div>

      {/* Timeline scroll area */}
      <div ref={timelineRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {commits.map((commit, index) => {
          // Check if this commit is selected for diff
          const isSelectedForDiff = selectedCommitsForDiff
            ? selectedCommitsForDiff[0] === commit.sha || selectedCommitsForDiff[1] === commit.sha
            : false;

          // Determine selection order
          let diffSelectionOrder: 1 | 2 | undefined = undefined;
          if (isSelectedForDiff && selectedCommitsForDiff) {
            diffSelectionOrder = selectedCommitsForDiff[0] === commit.sha ? 1 : 2;
          }

          // Calculate disabled state
          // In comparison mode, after selecting the first commit (Before),
          // disable all commits that are earlier (higher index) than the selected one
          let isDisabled = false;
          if (
            isComparisonMode &&
            selectedCommitsForDiff &&
            selectedCommitsForDiff[0] &&
            !selectedCommitsForDiff[1]
          ) {
            // First commit selected, second not yet
            const firstSelectedIndex = commits.findIndex(
              (c) => c.sha === selectedCommitsForDiff[0]
            );
            if (firstSelectedIndex !== -1 && index > firstSelectedIndex) {
              // This commit is earlier than the selected Before commit
              isDisabled = true;
            }
          }

          return (
            <div key={commit.sha} ref={index === currentIndex ? activeNodeRef : null}>
              <CommitNode
                commit={commit}
                isActive={index === currentIndex}
                onClick={() => onCommitSelect(index)}
                isComparisonMode={isComparisonMode}
                isSelectedForDiff={isSelectedForDiff}
                diffSelectionOrder={diffSelectionOrder}
                disabled={isDisabled}
              />
            </div>
          );
        })}

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
