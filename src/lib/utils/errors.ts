// Custom error classes for better error handling

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "GitHubAPIError";
    Object.setPrototypeOf(this, GitHubAPIError.prototype);
  }
}

export class PenFileError extends Error {
  constructor(
    message: string,
    public filePath?: string
  ) {
    super(message);
    this.name = "PenFileError";
    Object.setPrototypeOf(this, PenFileError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class RateLimitError extends GitHubAPIError {
  constructor(
    message: string,
    public resetTime: Date
  ) {
    super(message, 403);
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

// Error message helpers
export const ErrorMessages = {
  INVALID_URL: "無效的 GitHub URL",
  INVALID_PEN_FILE: "不是有效的 .pen 檔案",
  FILE_NOT_FOUND: "找不到指定的檔案",
  FILE_TOO_LARGE: "檔案大小超過 10MB 限制",
  PRIVATE_REPO: "僅支援公開儲存庫",
  NON_GITHUB_URL: "僅支援 GitHub 平台",
  RATE_LIMIT_EXCEEDED: "API 呼叫次數已達上限",
  PARSE_ERROR: ".pen 檔案解析失敗",
  NETWORK_ERROR: "網路連線錯誤",
  SCREENSHOT_ERROR: "截圖生成失敗",
};
