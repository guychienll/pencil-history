// GitHub API response types
// Based on Octokit types and GitHub REST API v3

export interface GitHubCommitAuthor {
  name?: string | null;
  email?: string | null;
  date?: string; // ISO 8601 format
}

export interface GitHubCommitData {
  author: GitHubCommitAuthor | null;
  committer: GitHubCommitAuthor | null;
  message: string;
  tree: {
    sha: string;
    url: string;
  };
  url: string;
  comment_count: number;
}

export interface GitHubCommitParent {
  sha: string;
  url: string;
  html_url?: string;
}

export interface GitHubCommitResponse {
  sha: string;
  node_id: string;
  commit: GitHubCommitData;
  url: string;
  html_url: string;
  comments_url: string;
  parents: GitHubCommitParent[];
}

export interface GitHubFileContent {
  type: "file" | "dir" | "symlink" | "submodule";
  encoding: "base64" | "utf-8";
  size: number;
  name: string;
  path: string;
  content: string; // base64 encoded for files
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url: string;
}

export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  default_branch: string;
}

export interface GitHubAPIError {
  message: string;
  documentation_url: string;
  status?: number;
}

export interface GitHubRateLimitResponse {
  resources: {
    core: {
      limit: number;
      remaining: number;
      reset: number; // Unix timestamp
      used: number;
    };
  };
  rate: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
}

export interface GitHubURLComponents {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}
