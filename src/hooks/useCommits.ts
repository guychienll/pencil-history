// T053: useCommits hook implementation

import { useState, useEffect, useCallback } from "react";
import { Commit } from "@/types/app";
import { useHistoryStore } from "@/store/history-store";
import { measureAsync } from "@/lib/utils/performance";

export interface UseCommitsOptions {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
  autoFetch?: boolean;
}

export interface UseCommitsResult {
  commits: Commit[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching GitHub commits
 * @param options - Commit fetch options
 * @returns Commits with loading and error states
 */
export function useCommits(options: UseCommitsOptions): UseCommitsResult {
  const { owner, repo, path, branch = "main", autoFetch = true } = options;

  const [page, setPage] = useState(1);
  const {
    commits,
    hasMoreCommits,
    loadingCommits,
    commitError,
    setCommits,
    appendCommits,
    setLoadingCommits,
    setCommitError,
  } = useHistoryStore();

  const fetchCommitsData = useCallback(
    async (pageNum: number, append: boolean = false) => {
      setLoadingCommits(true);
      setCommitError(null);

      try {
        const { result: fetchedCommits, duration } = await measureAsync(
          "fetchCommits",
          async () => {
            // Call server-side API instead of directly calling GitHub
            const params = new URLSearchParams({
              owner,
              repo,
              path,
              branch,
              page: String(pageNum),
              perPage: "100",
            });

            const response = await fetch(`/api/github/commits?${params}`);

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to fetch commits");
            }

            const data = await response.json();

            // Convert date strings back to Date objects
            return data.commits.map((commit: Commit) => ({
              ...commit,
              date: new Date(commit.date),
              author: {
                ...commit.author,
                date: new Date(commit.author.date),
              },
              committer: {
                ...commit.committer,
                date: new Date(commit.committer.date),
              },
            }));
          }
        );

        console.log(`Fetched ${fetchedCommits.length} commits in ${duration}ms`);

        const hasMore = fetchedCommits.length === 100;

        if (append) {
          appendCommits(fetchedCommits, hasMore);
        } else {
          setCommits(fetchedCommits, hasMore);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "無法載入 commit 歷史";
        setCommitError(errorMessage);
      } finally {
        setLoadingCommits(false);
      }
    },
    [owner, repo, path, branch, setCommits, appendCommits, setLoadingCommits, setCommitError]
  );

  const loadMore = useCallback(async () => {
    if (!hasMoreCommits || loadingCommits) {
      return;
    }

    const nextPage = page + 1;
    setPage(nextPage);
    await fetchCommitsData(nextPage, true);
  }, [page, hasMoreCommits, loadingCommits, fetchCommitsData]);

  const refetch = useCallback(async () => {
    setPage(1);
    await fetchCommitsData(1, false);
  }, [fetchCommitsData]);

  useEffect(() => {
    if (autoFetch && owner && repo && path) {
      fetchCommitsData(1, false);
    }
  }, [autoFetch, owner, repo, path, fetchCommitsData]);

  return {
    commits,
    loading: loadingCommits,
    error: commitError,
    hasMore: hasMoreCommits,
    loadMore,
    refetch,
  };
}
