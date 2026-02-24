// T042: fetchFileContent implementation

import { FileVersion } from "@/types/app";
import { getGitHubClient } from "./client";
import { PenFileError, ErrorMessages } from "@/lib/utils/errors";

export interface FetchFileContentOptions {
  owner: string;
  repo: string;
  path: string;
  sha: string; // branch or commit SHA
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Fetch file content from GitHub for a specific commit
 * @param options - File fetch options
 * @returns File content as string
 */
export async function fetchFileContent(
  options: FetchFileContentOptions
): Promise<{ content: string; size: number; sha: string; encoding: string }> {
  const { owner, repo, path, sha } = options;

  const client = getGitHubClient();

  const response = await client.executeWithRateLimitCheck(async () => {
    return await client.getOctokit().repos.getContent({
      owner,
      repo,
      path,
      ref: sha,
    });
  });

  const fileData = response.data;

  // GitHub API can return array for directories, but we expect a file
  if (Array.isArray(fileData)) {
    throw new PenFileError(ErrorMessages.FILE_NOT_FOUND, path);
  }

  if (fileData.type !== "file") {
    throw new PenFileError("指定的路徑不是檔案", path);
  }

  // Check file size
  if (fileData.size > MAX_FILE_SIZE) {
    throw new PenFileError(ErrorMessages.FILE_TOO_LARGE, path);
  }

  // Decode base64 content
  const content = decodeBase64Content(fileData.content);

  return {
    content,
    size: fileData.size,
    sha: fileData.sha,
    encoding: fileData.encoding,
  };
}

/**
 * Decode base64 content from GitHub API
 */
function decodeBase64Content(base64Content: string): string {
  // Remove newlines that GitHub adds to base64 encoding
  const cleanBase64 = base64Content.replace(/\n/g, "");

  // Decode base64
  if (typeof window !== "undefined") {
    // Browser environment
    return decodeURIComponent(escape(atob(cleanBase64)));
  } else {
    // Node.js environment
    return Buffer.from(cleanBase64, "base64").toString("utf-8");
  }
}

/**
 * Fetch and parse .pen file content
 * @param options - File fetch options
 * @returns FileVersion object with parsed content
 */
export async function fetchPenFileVersion(
  options: FetchFileContentOptions
): Promise<FileVersion> {
  const { content, size, encoding } = await fetchFileContent(options);

  try {
    const penContent = JSON.parse(content);

    return {
      sha: options.sha,
      content: penContent,
      size,
      encoding,
      rawContent: content,
    };
  } catch {
    throw new PenFileError(ErrorMessages.PARSE_ERROR, options.path);
  }
}
