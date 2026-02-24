// Client-side helper to fetch file content via server API route

import { FileVersion } from "@/types/app";

export interface FetchFileViaServerOptions {
  owner: string;
  repo: string;
  path: string;
  sha: string;
}

/**
 * Fetch file content via server-side API route
 * This avoids exposing GitHub token and centralizes rate limiting
 */
export async function fetchFileViaServer(options: FetchFileViaServerOptions): Promise<FileVersion> {
  const { owner, repo, path, sha } = options;

  const params = new URLSearchParams({
    owner,
    repo,
    path,
    sha,
  });

  const response = await fetch(`/api/github/file?${params}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch file from server");
  }

  return response.json();
}
