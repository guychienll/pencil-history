// T050: useScreenshot React hook

import { useState, useEffect, useCallback } from "react";
import { requestScreenshot } from "@/lib/pen/screenshot-service";
import { PenScreenshotRequest } from "@/types/pen";

export interface UseScreenshotOptions {
  penContent: string;
  nodeId?: string;
  width?: number;
  height?: number;
  enabled?: boolean; // Only fetch when enabled
  repoContext?: {
    owner: string;
    repo: string;
    ref: string;
  };
}

export interface UseScreenshotResult {
  imageData: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching screenshots
 * @param options - Screenshot options
 * @returns Screenshot result with loading and error states
 */
export function useScreenshot(options: UseScreenshotOptions): UseScreenshotResult {
  const { penContent, nodeId, width, height, enabled = true, repoContext } = options;

  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScreenshot = useCallback(async () => {
    if (!enabled || !penContent) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: PenScreenshotRequest = {
        penContent,
        nodeId,
        width,
        height,
        repoContext,
      };

      const result = await requestScreenshot(request);
      setImageData(result.imageData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "截圖載入失敗";
      setError(errorMessage);
      setImageData(null);
    } finally {
      setLoading(false);
    }
  }, [penContent, nodeId, width, height, enabled, repoContext]);

  useEffect(() => {
    fetchScreenshot();
  }, [fetchScreenshot]);

  return {
    imageData,
    loading,
    error,
    refetch: fetchScreenshot,
  };
}
