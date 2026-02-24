// T054: usePenFile hook implementation

import { useState, useEffect, useCallback } from "react";
import { fetchPenFileVersion } from "@/lib/github/files";
import { FileVersion } from "@/types/app";
import { useHistoryStore } from "@/store/history-store";
import { getFileVersionFromCache, saveFileVersionToCache } from "@/lib/pen/cache";
import { validatePenFile } from "@/lib/pen/validator";
import { measureAsync } from "@/lib/utils/performance";

export interface UsePenFileOptions {
  owner: string;
  repo: string;
  path: string;
  sha: string;
  enabled?: boolean; // Only fetch when enabled
}

export interface UsePenFileResult {
  fileVersion: FileVersion | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook for lazy loading .pen file versions
 * @param options - File fetch options
 * @returns FileVersion with loading and error states
 */
export function usePenFile(options: UsePenFileOptions): UsePenFileResult {
  const { owner, repo, path, sha, enabled = true } = options;

  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { fileVersions, setFileVersion, setLoadingFileVersion, setFileError } = useHistoryStore();

  const fileVersion = fileVersions.get(sha) || null;

  const fetchFile = useCallback(async () => {
    if (!enabled || !owner || !repo || !path || !sha) {
      return;
    }

    // Check if already loaded
    if (fileVersions.has(sha)) {
      return;
    }

    setLocalLoading(true);
    setLoadingFileVersion(true);
    setLocalError(null);
    setFileError(null);

    try {
      // Try cache first
      const cached = await getFileVersionFromCache(owner, repo, path, sha);
      if (cached) {
        console.log(`Cache hit for ${sha}`);
        setFileVersion(sha, cached);
        return;
      }

      // Fetch from GitHub
      const { result: fetchedFileVersion, duration } = await measureAsync(
        "fetchPenFile",
        async () => {
          return await fetchPenFileVersion({ owner, repo, path, sha });
        }
      );

      console.log(`Fetched .pen file in ${duration}ms`);

      // Validate .pen file
      const validation = validatePenFile(fetchedFileVersion.content, fetchedFileVersion.size);

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Save to cache
      await saveFileVersionToCache(owner, repo, path, sha, fetchedFileVersion);

      // Update store
      setFileVersion(sha, fetchedFileVersion);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "無法載入 .pen 檔案";
      setLocalError(errorMessage);
      setFileError(errorMessage);
    } finally {
      setLocalLoading(false);
      setLoadingFileVersion(false);
    }
  }, [
    enabled,
    owner,
    repo,
    path,
    sha,
    fileVersions,
    setFileVersion,
    setLoadingFileVersion,
    setFileError,
  ]);

  useEffect(() => {
    fetchFile();
  }, [fetchFile]);

  return {
    fileVersion,
    loading: localLoading,
    error: localError,
    refetch: fetchFile,
  };
}
