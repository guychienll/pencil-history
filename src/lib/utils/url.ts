// URL validation and formatting utilities

import { GitHubURLComponents } from "@/types/github";
import { ValidationError } from "./errors";

/**
 * Check if a string is a valid URL
 */
export function isValidURL(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Check if URL is a GitHub URL
 */
export function isGitHubURL(urlString: string): boolean {
  if (!isValidURL(urlString)) {
    return false;
  }

  try {
    const url = new URL(urlString);
    return url.hostname === "github.com" || url.hostname === "www.github.com";
  } catch {
    return false;
  }
}

/**
 * Check if file path ends with .pen extension
 */
export function isPenFile(path: string): boolean {
  return path.toLowerCase().endsWith(".pen");
}

/**
 * Parse GitHub file URL into components
 * Example: https://github.com/owner/repo/blob/main/path/to/file.pen
 */
export function parseGitHubURL(urlString: string): GitHubURLComponents {
  if (!isValidURL(urlString)) {
    throw new ValidationError("無效的 URL 格式");
  }

  if (!isGitHubURL(urlString)) {
    throw new ValidationError("僅支援 GitHub 平台 URL");
  }

  const url = new URL(urlString);
  const pathParts = url.pathname.split("/").filter((part) => part.length > 0);

  // Expected format: /owner/repo/blob/branch/path/to/file.pen
  // Minimum: /owner/repo/blob/branch/file.pen
  if (pathParts.length < 5) {
    throw new ValidationError("URL 格式不正確，無法解析儲存庫資訊");
  }

  const [owner, repo, blobOrTree, branch, ...filePath] = pathParts;

  if (blobOrTree !== "blob" && blobOrTree !== "tree") {
    throw new ValidationError("URL 必須包含 /blob/ 或 /tree/ 路徑");
  }

  const path = filePath.join("/");

  if (!isPenFile(path)) {
    throw new ValidationError("URL 必須指向 .pen 檔案");
  }

  return {
    owner,
    repo,
    branch,
    path,
  };
}

/**
 * Format URL components into GitHub raw content URL
 */
export function formatRawContentURL(components: GitHubURLComponents): string {
  const { owner, repo, branch, path } = components;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

/**
 * Format URL components into GitHub API URL for file content
 */
export function formatAPIContentURL(components: GitHubURLComponents): string {
  const { owner, repo, branch, path } = components;
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
}

/**
 * Format URL components into GitHub API URL for commits
 */
export function formatAPICommitsURL(
  owner: string,
  repo: string,
  path: string,
  page: number = 1,
  perPage: number = 100
): string {
  return `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(
    path
  )}&page=${page}&per_page=${perPage}`;
}

/**
 * Format URL for display (truncate if too long)
 */
export function formatDisplayURL(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) {
    return url;
  }

  const ellipsis = "...";
  const partLength = Math.floor((maxLength - ellipsis.length) / 2);
  return url.slice(0, partLength) + ellipsis + url.slice(-partLength);
}
