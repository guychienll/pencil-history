// Performance tracking utilities using Performance API

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiCallTime: number;
  timestamp: number;
}

class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  private metrics: PerformanceMetrics[] = [];

  // Mark the start of an operation
  mark(name: string): void {
    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    if (typeof performance.mark === "function") {
      performance.mark(name);
    }
  }

  // Measure the time since a mark
  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (typeof performance.measure === "function") {
      try {
        performance.measure(name, startMark);
      } catch {
        // Mark might not exist in performance timeline
      }
    }

    return duration;
  }

  // Measure load time (URL input to timeline display)
  measureLoadTime(startMark: string): number {
    return this.measure("loadTime", startMark);
  }

  // Measure render time (data ready to visual display)
  measureRenderTime(startMark: string): number {
    return this.measure("renderTime", startMark);
  }

  // Measure API call time
  measureAPICall(startMark: string): number {
    return this.measure("apiCall", startMark);
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Clear all marks and metrics
  clear(): void {
    this.marks.clear();
    this.metrics = [];
    if (typeof performance.clearMarks === "function") {
      performance.clearMarks();
    }
    if (typeof performance.clearMeasures === "function") {
      performance.clearMeasures();
    }
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();

// Helper functions
export function measureLoadTime(operation: string): () => number {
  const startMark = `${operation}-start`;
  performanceTracker.mark(startMark);

  return () => {
    return performanceTracker.measureLoadTime(startMark);
  };
}

export function measureRenderTime(operation: string): () => number {
  const startMark = `${operation}-render-start`;
  performanceTracker.mark(startMark);

  return () => {
    return performanceTracker.measureRenderTime(startMark);
  };
}

// Async function timing wrapper
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startMark = `${name}-start`;
  performanceTracker.mark(startMark);

  try {
    const result = await fn();
    const duration = performanceTracker.measure(name, startMark);
    return { result, duration };
  } catch (error) {
    const duration = performanceTracker.measure(`${name}-error`, startMark);
    console.error(`Operation "${name}" failed after ${duration}ms:`, error);
    throw error;
  }
}
