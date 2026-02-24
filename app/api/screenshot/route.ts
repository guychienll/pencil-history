// T048: POST /api/screenshot endpoint implementation

import { NextRequest, NextResponse } from "next/server";
import { generateScreenshot, validateScreenshotRequest } from "./generate";
import { PenScreenshotRequest } from "@/types/pen";

const TIMEOUT_MS = 10000; // 10 seconds (Vercel limit)

/**
 * POST /api/screenshot
 * Generate screenshot from .pen file content
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: PenScreenshotRequest = await request.json();

    // Validate request
    const validation = validateScreenshotRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate screenshot with timeout
    const screenshotPromise = generateScreenshot(body);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("請求超時")), TIMEOUT_MS);
    });

    const result = await Promise.race([screenshotPromise, timeoutPromise]);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Screenshot API error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "截圖生成失敗" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/screenshot
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "screenshot",
    version: "1.0.0",
  });
}
