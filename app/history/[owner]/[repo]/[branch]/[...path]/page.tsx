// T060: History viewer page
// T078-T080: Integrated keyboard navigation, playback controls, and timeline slider
// T092-T095: Integrated diff comparison mode

"use client";

import { use, useEffect, useCallback, useState } from "react";
import { useCommits } from "@/hooks/useCommits";
import { usePenFile } from "@/hooks/usePenFile";
import { useHistoryStore } from "@/store/history-store";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { usePlayback } from "@/hooks/usePlayback";
import { Timeline } from "@/components/timeline/Timeline";
import { TimelineSlider } from "@/components/timeline/TimelineSlider";
import { PlaybackControls } from "@/components/timeline/PlaybackControls";
import { KeyboardShortcuts } from "@/components/ui/KeyboardShortcuts";
import { PenViewer } from "@/components/viewer/PenViewer";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { ErrorMessage } from "@/components/layout/ErrorMessage";
import { DiffView } from "@/components/diff/DiffView";
import { compareNodes } from "@/lib/diff/node-diff";
import { Button } from "@/components/ui/Button";
import { fetchFileViaServer } from "@/lib/api/github-file";
import { documentToRootNode } from "@/lib/pen/parser";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
    branch: string;
    path: string[];
  }>;
}

export default function HistoryPage({ params }: PageProps) {
  const { owner, repo, branch, path: pathArray } = use(params);
  const path = pathArray.join("/");

  // Initialize repository context and comparison mode (T092-T095)
  const {
    setRepository,
    currentCommitIndex,
    setCurrentCommitIndex,
    getCurrentCommit,
    comparisonMode,
    selectedCommitsForDiff,
    diffResult,
    loadingDiff,
    diffError,
    enterComparisonMode,
    exitComparisonMode,
    selectCommitForDiff,
    setDiffResult,
    setLoadingDiff,
    setDiffError,
    canCompare,
    getSelectedCommitsForDiff,
    getFileVersion,
    setFileVersion,
  } = useHistoryStore();

  // Local state for viewing diff
  const [viewingDiff, setViewingDiff] = useState(false);

  // Local state for preloading file versions
  const [preloadingCommits, setPreloadingCommits] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRepository(owner, repo, path, branch);
  }, [owner, repo, path, branch, setRepository]);

  // Fetch commits
  const {
    commits,
    loading: loadingCommits,
    error: commitError,
    hasMore,
    loadMore,
    refetch: refetchCommits,
  } = useCommits({
    owner,
    repo,
    path,
    branch,
    autoFetch: true,
  });

  // Get current commit
  const currentCommit = getCurrentCommit();

  // Fetch current pen file
  const {
    fileVersion,
    loading: loadingFile,
    error: fileError,
    refetch: refetchFile,
  } = usePenFile({
    owner,
    repo,
    path,
    sha: currentCommit?.sha || "",
    enabled: !!currentCommit,
  });

  // Handle commit navigation (used by keyboard, playback, and slider)
  const handleCommitNavigate = useCallback(
    (commit: typeof currentCommit, index: number) => {
      setCurrentCommitIndex(index);
    },
    [setCurrentCommitIndex]
  );

  // Handle commit selection from timeline (T093)
  const handleCommitSelect = (index: number) => {
    if (comparisonMode) {
      // In comparison mode, select commits for diff
      const commit = commits[index];
      if (commit) {
        selectCommitForDiff(commit.sha);
      }
    } else {
      // Normal mode: navigate to commit
      setCurrentCommitIndex(index);
    }
  };

  // Preload file versions when commits are selected for diff (T094: Fix)
  useEffect(() => {
    if (!comparisonMode || !selectedCommitsForDiff) {
      setPreloadingCommits(new Set());
      return;
    }

    const preloadFileVersion = async (sha: string) => {
      // Skip if already loaded
      if (getFileVersion(sha)) {
        console.log(`File version for ${sha.substring(0, 7)} already loaded, skipping preload`);
        return;
      }

      // Mark as preloading
      setPreloadingCommits((prev) => {
        // Skip if already preloading
        if (prev.has(sha)) return prev;
        return new Set(prev).add(sha);
      });

      try {
        console.log(`Preloading file version for commit ${sha.substring(0, 7)}...`);
        const fileVersion = await fetchFileViaServer({
          owner,
          repo,
          path,
          sha,
        });

        // Store the file version
        setFileVersion(sha, fileVersion);
        console.log(`✓ Preloaded file version for commit ${sha.substring(0, 7)}`);
      } catch (error) {
        console.error(`✗ Failed to preload file version for ${sha.substring(0, 7)}:`, error);
      } finally {
        // Remove from preloading set
        setPreloadingCommits((prev) => {
          const next = new Set(prev);
          next.delete(sha);
          return next;
        });
      }
    };

    // Preload first selected commit
    if (selectedCommitsForDiff[0]) {
      preloadFileVersion(selectedCommitsForDiff[0]);
    }

    // Preload second selected commit
    if (selectedCommitsForDiff[1]) {
      preloadFileVersion(selectedCommitsForDiff[1]);
    }
  }, [comparisonMode, selectedCommitsForDiff, getFileVersion, owner, repo, path, setFileVersion]);

  // Handle "View Diff" button click (T094)
  const handleViewDiff = useCallback(async () => {
    if (!canCompare()) return;

    const [fromCommit, toCommit] = getSelectedCommitsForDiff();
    if (!fromCommit || !toCommit) return;

    setLoadingDiff(true);
    setDiffError(null);

    try {
      // Check if file versions are already loaded, if not fetch them
      let fromVersion = getFileVersion(fromCommit.sha);
      let toVersion = getFileVersion(toCommit.sha);

      // Fetch from GitHub if not in store (fallback - should be preloaded already)
      if (!fromVersion) {
        console.warn(
          `⚠️ File version for ${fromCommit.sha.substring(0, 7)} not preloaded, fetching now...`
        );
        fromVersion = await fetchFileViaServer({
          owner,
          repo,
          path,
          sha: fromCommit.sha,
        });
        setFileVersion(fromCommit.sha, fromVersion);
      } else {
        console.log(`✓ File version for ${fromCommit.sha.substring(0, 7)} already loaded`);
      }

      if (!toVersion) {
        console.warn(
          `⚠️ File version for ${toCommit.sha.substring(0, 7)} not preloaded, fetching now...`
        );
        toVersion = await fetchFileViaServer({
          owner,
          repo,
          path,
          sha: toCommit.sha,
        });
        setFileVersion(toCommit.sha, toVersion);
      } else {
        console.log(`✓ File version for ${toCommit.sha.substring(0, 7)} already loaded`);
      }

      // Validate file structure before computing diff
      if (!fromVersion?.content) {
        throw new Error(
          `無效的 .pen 檔案結構（Before commit ${fromCommit.sha.substring(0, 7)}）- 缺少 content`
        );
      }

      if (!toVersion?.content) {
        throw new Error(
          `無效的 .pen 檔案結構（After commit ${toCommit.sha.substring(0, 7)}）- 缺少 content`
        );
      }

      // Convert PenDocument to root nodes for comparison
      const fromRootNode = documentToRootNode(fromVersion.content);
      const toRootNode = documentToRootNode(toVersion.content);

      // Log file structure for debugging
      console.log("From version structure:", {
        sha: fromVersion.sha,
        hasContent: !!fromVersion.content,
        version: fromVersion.content.version,
        childrenCount: fromVersion.content.children?.length || 0,
        rootNodeId: fromRootNode.id,
      });

      console.log("To version structure:", {
        sha: toVersion.sha,
        hasContent: !!toVersion.content,
        version: toVersion.content.version,
        childrenCount: toVersion.content.children?.length || 0,
        rootNodeId: toRootNode.id,
      });

      // Compute diff
      const diff = compareNodes(fromRootNode, toRootNode, fromCommit.sha, toCommit.sha);

      setDiffResult(diff);
      setViewingDiff(true);
    } catch (error) {
      console.error("Diff computation failed:", error);
      setDiffError(
        error instanceof Error
          ? error.message
          : "計算差異時發生錯誤。請確認檔案為有效的 .pen 格式。"
      );
    } finally {
      setLoadingDiff(false);
    }
  }, [
    canCompare,
    getSelectedCommitsForDiff,
    getFileVersion,
    setFileVersion,
    setDiffResult,
    setLoadingDiff,
    setDiffError,
    owner,
    repo,
    path,
  ]);

  // Handle back from diff view (stay in comparison mode)
  const handleBackFromDiff = useCallback(() => {
    setViewingDiff(false);
  }, []);

  // Handle exit comparison mode completely (T092)
  const handleExitComparison = useCallback(() => {
    exitComparisonMode();
    setViewingDiff(false);
  }, [exitComparisonMode]);

  // Setup playback controls (only if we have commits and a valid index)
  const { isPlaying, play, pause, toggle, speed, setSpeed } = usePlayback({
    commits: commits,
    currentIndex: currentCommitIndex ?? 0,
    onNavigate: handleCommitNavigate,
    speed: 2000, // 2 seconds per commit
    autoStop: true,
  });

  // Setup keyboard navigation (only if we have commits and a valid index)
  useKeyboardNav({
    commits: commits,
    currentIndex: currentCommitIndex ?? 0,
    onNavigate: handleCommitNavigate,
    onTogglePlayback: toggle,
    enabled: commits.length > 0 && currentCommitIndex !== null,
  });

  // Initial loading state
  if (loadingCommits && commits.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">正在載入 commit 歷史...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (commitError && commits.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <ErrorMessage message={commitError} title="無法載入 commit 歷史" onRetry={refetchCommits} />
      </div>
    );
  }

  // Show diff view if viewing diff (T094)
  if (viewingDiff && diffResult) {
    const [fromCommit, toCommit] = getSelectedCommitsForDiff();
    if (fromCommit && toCommit) {
      const fromVersion = getFileVersion(fromCommit.sha);
      const toVersion = getFileVersion(toCommit.sha);

      if (fromVersion && toVersion) {
        return (
          <DiffView
            diff={diffResult}
            fromCommit={fromCommit}
            toCommit={toCommit}
            fromVersion={fromVersion}
            toVersion={toVersion}
            owner={owner}
            repo={repo}
            onBack={handleBackFromDiff}
            onExitComparison={handleExitComparison}
          />
        );
      }
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Playback controls bar - Fixed height (T092: Extended with comparison mode toggle) */}
      <div className="shrink-0 border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center justify-between">
          {!comparisonMode ? (
            <>
              <PlaybackControls
                isPlaying={isPlaying}
                speed={speed}
                onPlay={play}
                onPause={pause}
                onSpeedChange={setSpeed}
                disabled={commits.length === 0}
              />
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={enterComparisonMode}
                  disabled={commits.length < 2}
                >
                  <span className="mr-2">🔍</span>
                  Compare Mode
                </Button>
                <KeyboardShortcuts />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleExitComparison}>
                  ← Back to Timeline
                </Button>
                {!viewingDiff && (
                  <Button
                    onClick={handleViewDiff}
                    disabled={!canCompare() || loadingDiff || preloadingCommits.size > 0}
                  >
                    {loadingDiff ? (
                      <>
                        <span className="mr-2">⏳</span>
                        Computing...
                      </>
                    ) : preloadingCommits.size > 0 ? (
                      <>
                        <span className="mr-2">⏳</span>
                        Loading files...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🔍</span>
                        View Diff
                        {!canCompare() && selectedCommitsForDiff && selectedCommitsForDiff[0] && (
                          <span className="ml-2 text-xs opacity-70">(選擇第二個 commit)</span>
                        )}
                      </>
                    )}
                  </Button>
                )}
              </div>
              {diffError && (
                <div className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  <p className="text-sm text-red-600">{diffError}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main content area - Fills remaining space */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row min-h-0">
        {/* Timeline sidebar (T093: Extended with comparison mode props) */}
        <div className="shrink-0 w-full h-full border-r border-border bg-surface md:w-80 lg:w-96 overflow-hidden">
          <Timeline
            commits={commits}
            currentIndex={currentCommitIndex}
            onCommitSelect={handleCommitSelect}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loading={loadingCommits}
            isComparisonMode={comparisonMode}
            selectedCommitsForDiff={selectedCommitsForDiff}
          />
        </div>

        {/* Viewer main area - Fills remaining space */}
        <div className="flex flex-1 flex-col overflow-hidden bg-background-secondary min-w-0">
          {comparisonMode ? (
            /* Comparison mode: Show instructions */
            <div className="flex h-full flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">比較模式</h3>
                  <p className="text-foreground-secondary mb-4">
                    {!selectedCommitsForDiff || !selectedCommitsForDiff[0]
                      ? "從時間軸選擇第一個 commit (Before)"
                      : !selectedCommitsForDiff[1]
                        ? "選擇第二個 commit (After) 來比較差異"
                        : "準備就緒！點擊上方「View Diff」查看詳細差異"}
                  </p>
                  {selectedCommitsForDiff &&
                    selectedCommitsForDiff[0] &&
                    selectedCommitsForDiff[1] && (
                      <div className="mt-6 p-4 bg-surface rounded-lg border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-error">🔴 Before</span>
                          <span className="text-xs text-foreground-tertiary">→</span>
                          <span className="text-xs font-semibold text-success">🟢 After</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono text-foreground-secondary mb-2">
                          <span>{selectedCommitsForDiff[0].substring(0, 7)}</span>
                          <span>{selectedCommitsForDiff[1].substring(0, 7)}</span>
                        </div>
                        {preloadingCommits.size > 0 && (
                          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-foreground-tertiary">
                            <div className="animate-spin h-3 w-3 border-2 border-border border-t-primary rounded-full"></div>
                            <span>載入檔案中...</span>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
              {/* Timeline slider - Always show in comparison mode */}
              {commits.length > 0 && (
                <div className="shrink-0 border-t border-border bg-surface px-6 py-4">
                  <TimelineSlider
                    commits={commits}
                    currentIndex={currentCommitIndex ?? 0}
                    onNavigate={handleCommitNavigate}
                  />
                </div>
              )}
            </div>
          ) : !currentCommit ? (
            /* Normal mode: No commit selected */
            <div className="flex h-full items-center justify-center">
              <p className="text-foreground-tertiary">請從時間軸選擇一個 commit</p>
            </div>
          ) : (
            /* Normal mode: Commit selected */
            <>
              {/* Pen viewer - Scrollable content area */}
              <div className="flex-1 overflow-auto min-h-0">
                <PenViewer
                  fileVersion={fileVersion}
                  commit={currentCommit}
                  loading={loadingFile}
                  error={fileError}
                  onRetry={refetchFile}
                  owner={owner}
                  repo={repo}
                  branch={branch}
                />
              </div>

              {/* Timeline slider - Fixed height */}
              <div className="shrink-0 border-t border-border bg-surface px-6 py-4">
                <TimelineSlider
                  commits={commits}
                  currentIndex={currentCommitIndex ?? 0}
                  onNavigate={handleCommitNavigate}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
