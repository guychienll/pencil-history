// T051: History store using Zustand
// T092-T095: Extended with diff comparison mode support

import { create } from "zustand";
import { Commit, FileVersion } from "@/types/app";
import type { DiffResult } from "@/lib/diff/types";

export interface HistoryState {
  // Current repository context
  owner: string | null;
  repo: string | null;
  path: string | null;
  branch: string | null;

  // Commits data
  commits: Commit[];
  currentCommitIndex: number | null;
  totalCommits: number;
  hasMoreCommits: boolean;

  // File versions (lazy loaded)
  fileVersions: Map<string, FileVersion>; // Key: commit SHA

  // Diff comparison mode (T092-T095)
  comparisonMode: boolean;
  selectedCommitsForDiff: [string, string] | null; // [fromSha, toSha]
  diffResult: DiffResult | null;
  loadingDiff: boolean;
  diffError: string | null;

  // Loading states
  loading: boolean;
  loadingCommits: boolean;
  loadingFileVersion: boolean;

  // Error states
  error: string | null;
  commitError: string | null;
  fileError: string | null;

  // Actions
  setRepository: (owner: string, repo: string, path: string, branch: string) => void;
  setCommits: (commits: Commit[], hasMore: boolean) => void;
  appendCommits: (commits: Commit[], hasMore: boolean) => void;
  setCurrentCommitIndex: (index: number) => void;
  setFileVersion: (sha: string, fileVersion: FileVersion) => void;
  setLoading: (loading: boolean) => void;
  setLoadingCommits: (loading: boolean) => void;
  setLoadingFileVersion: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCommitError: (error: string | null) => void;
  setFileError: (error: string | null) => void;
  reset: () => void;

  // Diff comparison actions (T092-T095)
  enterComparisonMode: () => void;
  exitComparisonMode: () => void;
  selectCommitForDiff: (sha: string) => void;
  clearDiffSelection: () => void;
  setDiffResult: (diff: DiffResult) => void;
  setLoadingDiff: (loading: boolean) => void;
  setDiffError: (error: string | null) => void;

  // Selectors
  getCurrentCommit: () => Commit | null;
  getCurrentFileVersion: () => FileVersion | null;
  getFileVersion: (sha: string) => FileVersion | null;
  getSelectedCommitsForDiff: () => [Commit | null, Commit | null];
  canCompare: () => boolean;
}

const initialState = {
  owner: null,
  repo: null,
  path: null,
  branch: null,
  commits: [],
  currentCommitIndex: null,
  totalCommits: 0,
  hasMoreCommits: true,
  fileVersions: new Map<string, FileVersion>(),
  comparisonMode: false,
  selectedCommitsForDiff: null,
  diffResult: null,
  loadingDiff: false,
  diffError: null,
  loading: false,
  loadingCommits: false,
  loadingFileVersion: false,
  error: null,
  commitError: null,
  fileError: null,
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  ...initialState,

  setRepository: (owner, repo, path, branch) => {
    set({
      owner,
      repo,
      path,
      branch,
      commits: [],
      currentCommitIndex: null,
      fileVersions: new Map(),
    });
  },

  setCommits: (commits, hasMore) => {
    set({
      commits,
      totalCommits: commits.length,
      hasMoreCommits: hasMore,
      currentCommitIndex: commits.length > 0 ? 0 : null,
    });
  },

  appendCommits: (commits, hasMore) => {
    const currentCommits = get().commits;
    set({
      commits: [...currentCommits, ...commits],
      totalCommits: currentCommits.length + commits.length,
      hasMoreCommits: hasMore,
    });
  },

  setCurrentCommitIndex: (index) => {
    set({ currentCommitIndex: index });
  },

  setFileVersion: (sha, fileVersion) => {
    const fileVersions = new Map(get().fileVersions);
    fileVersions.set(sha, fileVersion);
    set({ fileVersions });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setLoadingCommits: (loading) => {
    set({ loadingCommits: loading });
  },

  setLoadingFileVersion: (loading) => {
    set({ loadingFileVersion: loading });
  },

  setError: (error) => {
    set({ error });
  },

  setCommitError: (error) => {
    set({ commitError: error });
  },

  setFileError: (error) => {
    set({ fileError: error });
  },

  reset: () => {
    set(initialState);
  },

  // Diff comparison actions (T092-T095)
  enterComparisonMode: () => {
    set({ comparisonMode: true, selectedCommitsForDiff: null, diffResult: null, diffError: null });
  },

  exitComparisonMode: () => {
    set({ comparisonMode: false, selectedCommitsForDiff: null, diffResult: null, diffError: null });
  },

  selectCommitForDiff: (sha: string) => {
    const current = get().selectedCommitsForDiff;
    const commits = get().commits;

    if (!current) {
      // First commit selected
      set({ selectedCommitsForDiff: [sha, ""] as [string, string], diffError: null });
    } else if (!current[1]) {
      // Second commit selected (or deselecting first)
      if (current[0] === sha) {
        // Same commit clicked again - deselect (cancel selection)
        set({ selectedCommitsForDiff: null, diffError: null });
        return;
      }

      // Find commit indices to ensure chronological order
      const firstIndex = commits.findIndex((c) => c.sha === current[0]);
      const secondIndex = commits.findIndex((c) => c.sha === sha);

      if (firstIndex === -1 || secondIndex === -1) {
        set({ diffError: "無法找到選擇的 commits" });
        return;
      }

      // Ensure before (first) is always the earlier commit (higher index in array)
      // Timeline is sorted newest first, so higher index = older commit
      let fromSha: string;
      let toSha: string;

      if (firstIndex > secondIndex) {
        // First selected is older, second is newer - correct order
        fromSha = current[0];
        toSha = sha;
      } else {
        // First selected is newer, second is older - swap them
        fromSha = sha;
        toSha = current[0];
      }

      set({
        selectedCommitsForDiff: [fromSha, toSha] as [string, string],
        diffError: null,
      });
    } else {
      // Already have two commits, start over
      set({
        selectedCommitsForDiff: [sha, ""] as [string, string],
        diffResult: null,
        diffError: null,
      });
    }
  },

  clearDiffSelection: () => {
    set({ selectedCommitsForDiff: null, diffResult: null, diffError: null });
  },

  setDiffResult: (diff: DiffResult) => {
    set({ diffResult: diff, loadingDiff: false, diffError: null });
  },

  setLoadingDiff: (loading: boolean) => {
    set({ loadingDiff: loading });
  },

  setDiffError: (error: string | null) => {
    set({ diffError: error, loadingDiff: false });
  },

  // Selectors
  getCurrentCommit: () => {
    const { commits, currentCommitIndex } = get();
    if (currentCommitIndex === null || currentCommitIndex < 0) {
      return null;
    }
    return commits[currentCommitIndex] || null;
  },

  getCurrentFileVersion: () => {
    const currentCommit = get().getCurrentCommit();
    if (!currentCommit) {
      return null;
    }
    return get().fileVersions.get(currentCommit.sha) || null;
  },

  getFileVersion: (sha: string) => {
    return get().fileVersions.get(sha) || null;
  },

  getSelectedCommitsForDiff: () => {
    const { commits, selectedCommitsForDiff } = get();
    if (!selectedCommitsForDiff) {
      return [null, null];
    }

    const fromCommit = commits.find((c) => c.sha === selectedCommitsForDiff[0]) || null;
    const toCommit = selectedCommitsForDiff[1]
      ? commits.find((c) => c.sha === selectedCommitsForDiff[1]) || null
      : null;

    return [fromCommit, toCommit];
  },

  canCompare: () => {
    const { selectedCommitsForDiff } = get();
    return !!(selectedCommitsForDiff && selectedCommitsForDiff[0] && selectedCommitsForDiff[1]);
  },
}));
