// T058: PenViewer component (container)

import React from "react";
import { FileVersion, Commit } from "@/types/app";
import { PenRenderer } from "./PenRenderer";
import { ErrorMessage } from "@/components/layout/ErrorMessage";
import { useScreenshot } from "@/hooks/useScreenshot";

export interface PenViewerProps {
  fileVersion: FileVersion | null;
  commit: Commit | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  // GitHub repo context for resolving image paths
  owner?: string;
  repo?: string;
  branch?: string;
}

export function PenViewer({
  fileVersion,
  commit,
  loading = false,
  error = null,
  onRetry,
  className = "",
  owner,
  repo,
}: PenViewerProps) {
  // Request screenshot for the current file version
  const {
    imageData,
    loading: screenshotLoading,
    error: screenshotError,
  } = useScreenshot({
    penContent: fileVersion ? JSON.stringify(fileVersion.content) : "",
    enabled: !!fileVersion,
    repoContext:
      owner && repo && commit
        ? {
            owner,
            repo,
            ref: commit.sha, // Use commit SHA for exact version
          }
        : undefined,
  });

  // Debug logging
  console.log("PenViewer repoContext:", {
    hasRepoContext: !!(owner && repo && commit),
    owner,
    repo,
    commitSha: commit?.sha?.slice(0, 7),
    hasFileVersion: !!fileVersion,
  });

  const isLoading = loading || screenshotLoading;
  const displayError = error || screenshotError;

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Viewer header */}
      <div className="border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">設計檢視器</h2>
            {commit && (
              <div className="mt-1 flex items-center space-x-4 text-sm text-foreground-secondary font-medium">
                <span className="font-mono font-semibold">{commit.sha.slice(0, 7)}</span>
                <span>{commit.message.split("\n")[0]}</span>
              </div>
            )}
          </div>
          {fileVersion && (
            <div className="text-sm text-foreground-secondary font-medium">
              版本: {fileVersion.content.version}
            </div>
          )}
        </div>
      </div>

      {/* Viewer content */}
      <div className="flex-1 overflow-hidden">
        {displayError ? (
          <div className="flex h-full items-center justify-center p-6">
            <ErrorMessage message={displayError} title="載入失敗" onRetry={onRetry} />
          </div>
        ) : (
          <PenRenderer imageData={imageData} loading={isLoading} className="h-full w-full" />
        )}
      </div>

      {/* Viewer footer / stats */}
      {fileVersion && !displayError && (
        <div className="border-t border-border bg-surface px-6 py-3">
          <div className="flex items-center justify-between text-xs text-foreground-secondary font-medium">
            <span>檔案大小: {(fileVersion.size / 1024).toFixed(2)} KB</span>
            {fileVersion.content.metadata && (
              <span>
                修改時間:{" "}
                {fileVersion.content.metadata.modifiedAt
                  ? new Date(fileVersion.content.metadata.modifiedAt).toLocaleDateString("zh-TW")
                  : "未知"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
