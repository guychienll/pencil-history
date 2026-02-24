// T040: Octokit wrapper client implementation

import { Octokit } from "@octokit/rest";
import { GitHubAPIError, RateLimitError } from "@/lib/utils/errors";

/**
 * GitHub API client wrapper
 * Handles rate limiting, errors, and provides a clean interface
 */
export class GitHubClient {
  private octokit: Octokit;
  private rateLimitRemaining: number = 60;
  private rateLimitReset: Date = new Date();

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Get the underlying Octokit instance
   */
  getOctokit(): Octokit {
    return this.octokit;
  }

  /**
   * Check rate limit status
   */
  async checkRateLimit(): Promise<{
    remaining: number;
    limit: number;
    reset: Date;
  }> {
    try {
      const response = await this.octokit.rateLimit.get();
      const core = response.data.resources.core;

      this.rateLimitRemaining = core.remaining;
      this.rateLimitReset = new Date(core.reset * 1000);

      return {
        remaining: core.remaining,
        limit: core.limit,
        reset: this.rateLimitReset,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get rate limit information from response headers
   */
  private updateRateLimitFromHeaders(headers: Record<string, string>): void {
    if (headers["x-ratelimit-remaining"]) {
      this.rateLimitRemaining = parseInt(headers["x-ratelimit-remaining"], 10);
    }
    if (headers["x-ratelimit-reset"]) {
      this.rateLimitReset = new Date(parseInt(headers["x-ratelimit-reset"], 10) * 1000);
    }
  }

  /**
   * Check if we're approaching rate limit
   */
  isApproachingRateLimit(): boolean {
    return this.rateLimitRemaining < 10;
  }

  /**
   * Check if rate limit is exceeded
   */
  isRateLimitExceeded(): boolean {
    return this.rateLimitRemaining === 0;
  }

  /**
   * Get time until rate limit reset
   */
  getTimeUntilReset(): number {
    return Math.max(0, this.rateLimitReset.getTime() - Date.now());
  }

  /**
   * Handle GitHub API errors
   */
  handleError(error: unknown): Error {
    // Type guard for error with response
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object"
    ) {
      const response = error.response as {
        status?: number;
        data?: { message?: string };
        headers?: Record<string, string>;
      };

      const status = response.status || 500;
      const errorMessage = (error as { message?: string }).message || "";
      const message = response.data?.message || errorMessage;

      if (response.headers) {
        this.updateRateLimitFromHeaders(response.headers);
      }

      if (status === 403 && this.isRateLimitExceeded()) {
        return new RateLimitError(
          "GitHub API 呼叫次數已達上限，請稍後再試",
          this.rateLimitReset
        );
      }

      if (status === 404) {
        return new GitHubAPIError("找不到指定的資源", status);
      }

      return new GitHubAPIError(message, status, response.data);
    }

    // Handle generic error
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "GitHub API 請求失敗";

    return new GitHubAPIError(message);
  }

  /**
   * Execute API request with rate limit handling
   */
  async executeWithRateLimitCheck<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    if (this.isRateLimitExceeded()) {
      throw new RateLimitError(
        "GitHub API 呼叫次數已達上限，請稍後再試",
        this.rateLimitReset
      );
    }

    try {
      const result = await fn();
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Singleton instance for anonymous access
let defaultClient: GitHubClient | null = null;

export function getGitHubClient(token?: string): GitHubClient {
  if (!token && defaultClient) {
    return defaultClient;
  }

  const client = new GitHubClient(token);

  if (!token) {
    defaultClient = client;
  }

  return client;
}
