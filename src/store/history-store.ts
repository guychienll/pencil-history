// T051: History store using Zustand

import { create } from "zustand";
import { Commit, FileVersion } from "@/types/app";

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

  // Selectors
  getCurrentCommit: () => Commit | null;
  getCurrentFileVersion: () => FileVersion | null;
  getFileVersion: (sha: string) => FileVersion | null;
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
}));
