// T041: fetchCommits implementation

import { Commit } from "@/types/app";
import { getGitHubClient } from "./client";

export interface FetchCommitsOptions {
  owner: string;
  repo: string;
  path: string;
  page?: number;
  perPage?: number;
  sha?: string; // branch or commit SHA
}

/**
 * Fetch commits for a specific file from GitHub
 * @param options - Commit fetch options
 * @param token - Optional GitHub token for authentication
 * @returns Array of commits
 */
export async function fetchCommits(
  options: FetchCommitsOptions,
  token?: string
): Promise<Commit[]> {
  const { owner, repo, path, page = 1, perPage = 5, sha } = options;

  const client = getGitHubClient(token);

  const response = await client.executeWithRateLimitCheck(async () => {
    return await client.getOctokit().repos.listCommits({
      owner,
      repo,
      path,
      page,
      per_page: perPage,
      sha,
    });
  });

  return response.data.map((commit) => convertToCommit(commit));
}

/**
 * Convert GitHub API commit response to our Commit type
 */
function convertToCommit(githubCommit: {
  sha: string;
  html_url: string;
  commit: {
    message?: string;
    author?: { name?: string; email?: string; date?: string } | null;
    committer?: { name?: string; email?: string; date?: string } | null;
  };
  parents?: Array<{ sha: string }>;
}): Commit {
  const author = githubCommit.commit.author || {};
  const committer = githubCommit.commit.committer || {};

  return {
    sha: githubCommit.sha,
    message: githubCommit.commit.message || "",
    author: {
      name: author.name || "Unknown",
      email: author.email || "",
      date: new Date(author.date || new Date()),
    },
    committer: {
      name: committer.name || "Unknown",
      email: committer.email || "",
      date: new Date(committer.date || new Date()),
    },
    date: new Date(author.date || new Date()),
    parents: (githubCommit.parents || []).map((parent) => parent.sha),
    url: githubCommit.html_url,
  };
}

/**
 * Fetch commits with pagination support
 * @param options - Commit fetch options
 * @param maxPages - Maximum number of pages to fetch (default: 10, max 50 commits)
 * @returns Array of all commits
 */
export async function fetchAllCommits(
  options: FetchCommitsOptions,
  maxPages: number = 10
): Promise<Commit[]> {
  const allCommits: Commit[] = [];
  let page = options.page || 1;
  const perPage = options.perPage || 5;

  for (let i = 0; i < maxPages; i++) {
    const commits = await fetchCommits({
      ...options,
      page,
      perPage,
    });

    if (commits.length === 0) {
      break; // No more commits
    }

    allCommits.push(...commits);

    if (commits.length < perPage) {
      break; // Last page
    }

    page++;
  }

  return allCommits;
}
