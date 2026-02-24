// T039: GitHub URL parser implementation

import { GitHubURLComponents } from "@/types/github";
import { ValidationError, ErrorMessages } from "@/lib/utils/errors";
import { isGitHubURL, isPenFile, isValidURL } from "@/lib/utils/url";

export { isValidURL, isGitHubURL, isPenFile };

/**
 * Parse GitHub file URL into components
 * @param urlString - GitHub file URL (e.g., https://github.com/owner/repo/blob/main/path/to/file.pen)
 * @returns Parsed URL components
 * @throws ValidationError if URL is invalid
 */
export function parseGitHubURL(urlString: string): GitHubURLComponents {
  if (!isValidURL(urlString)) {
    throw new ValidationError(ErrorMessages.INVALID_URL);
  }

  if (!isGitHubURL(urlString)) {
    throw new ValidationError(ErrorMessages.NON_GITHUB_URL);
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
    throw new ValidationError(ErrorMessages.INVALID_PEN_FILE);
  }

  return {
    owner,
    repo,
    branch,
    path,
  };
}

/**
 * Validate GitHub URL
 * @param urlString - URL to validate
 * @returns True if valid GitHub .pen file URL
 */
export function validateURL(urlString: string): boolean {
  try {
    parseGitHubURL(urlString);
    return true;
  } catch {
    return false;
  }
}
