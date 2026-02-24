// T060: History viewer page
// T078-T080: Integrated keyboard navigation, playback controls, and timeline slider

"use client";

import { use, useEffect, useCallback } from "react";
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

  // Initialize repository context
  const { setRepository, currentCommitIndex, setCurrentCommitIndex, getCurrentCommit } =
    useHistoryStore();

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

  // Handle commit selection from timeline
  const handleCommitSelect = (index: number) => {
    setCurrentCommitIndex(index);
  };

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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Playback controls bar - Fixed height */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <PlaybackControls
            isPlaying={isPlaying}
            speed={speed}
            onPlay={play}
            onPause={pause}
            onSpeedChange={setSpeed}
            disabled={commits.length === 0}
          />
          <KeyboardShortcuts />
        </div>
      </div>

      {/* Main content area - Fills remaining space */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row min-h-0">
        {/* Timeline sidebar */}
        <div className="flex-shrink-0 w-full h-full border-r border-gray-200 bg-white md:w-80 lg:w-96 overflow-hidden">
          <Timeline
            commits={commits}
            currentIndex={currentCommitIndex}
            onCommitSelect={handleCommitSelect}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loading={loadingCommits}
          />
        </div>

        {/* Viewer main area - Fills remaining space */}
        <div className="flex flex-1 flex-col overflow-hidden bg-gray-50 min-w-0">
          {!currentCommit ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">請從時間軸選擇一個 commit</p>
            </div>
          ) : (
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
              <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
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
