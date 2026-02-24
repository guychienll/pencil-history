// T060: History viewer page

"use client";

import { use, useEffect } from "react";
import { useCommits } from "@/hooks/useCommits";
import { usePenFile } from "@/hooks/usePenFile";
import { useHistoryStore } from "@/store/history-store";
import { Timeline } from "@/components/timeline/Timeline";
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

  // Handle commit selection
  const handleCommitSelect = (index: number) => {
    setCurrentCommitIndex(index);
  };

  // Initial loading state
  if (loadingCommits && commits.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
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
      <div className="flex h-[calc(100vh-64px)] items-center justify-center p-6">
        <ErrorMessage
          message={commitError}
          title="無法載入 commit 歷史"
          onRetry={refetchCommits}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden md:flex-row">
      {/* Timeline sidebar */}
      <div className="w-full border-r border-gray-200 bg-white md:w-80 lg:w-96">
        <Timeline
          commits={commits}
          currentIndex={currentCommitIndex}
          onCommitSelect={handleCommitSelect}
          onLoadMore={loadMore}
          hasMore={hasMore}
          loading={loadingCommits}
        />
      </div>

      {/* Viewer main area */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        {!currentCommit ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">請從時間軸選擇一個 commit</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
