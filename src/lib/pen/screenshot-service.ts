// T049: Frontend screenshot service implementation

import { PenScreenshotRequest, PenScreenshotResponse } from "@/types/pen";
import { screenshotCache } from "./cache";

/**
 * Request screenshot from API endpoint
 * @param request - Screenshot request
 * @returns Screenshot response with image data
 */
export async function requestScreenshot(
  request: PenScreenshotRequest
): Promise<PenScreenshotResponse> {
  // Check cache first
  const cacheKey = generateCacheKey(request);
  const cached = screenshotCache.get(cacheKey);

  if (cached) {
    return {
      imageData: cached,
      width: request.width || 800,
      height: request.height || 600,
      generatedAt: new Date().toISOString(),
    };
  }

  // Make API request
  console.log("Screenshot request:", {
    hasRepoContext: !!request.repoContext,
    repoContext: request.repoContext,
    penContentLength: request.penContent.length,
  });

  const response = await fetch("/api/screenshot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "截圖生成失敗");
  }

  const result: PenScreenshotResponse = await response.json();

  // Cache the result
  screenshotCache.set(cacheKey, result.imageData);

  return result;
}

/**
 * Generate cache key from request
 */
function generateCacheKey(request: PenScreenshotRequest): string {
  // Use a simple hash function for the pen content
  const contentHash = simpleHash(request.penContent);

  const parts = [
    contentHash,
    request.nodeId || "root",
    request.width || 800,
    request.height || 600,
    request.repoContext
      ? `${request.repoContext.owner}/${request.repoContext.repo}/${request.repoContext.ref}`
      : "no-repo",
  ];

  return parts.join(":");
}

/**
 * Simple string hash function
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Prefetch screenshot for a commit
 */
export async function prefetchScreenshot(penContent: string, nodeId?: string): Promise<void> {
  try {
    await requestScreenshot({
      penContent,
      nodeId,
    });
  } catch (error) {
    // Silently fail for prefetch
    console.warn("Screenshot prefetch failed:", error);
  }
}

/**
 * Clear screenshot cache
 */
export function clearScreenshotCache(): void {
  screenshotCache.clear();
}
